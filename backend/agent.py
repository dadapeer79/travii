import json
import os
import re

from dotenv import load_dotenv

from memory import get_memory, update_memory
from tools import build_itinerary, calculate_budget, get_place, normalize_destination, search_hotels, search_places, search_transport, validate_plan

load_dotenv()
MAX_REPLANS = 3
SYSTEM_PROMPT = """You are TRAVII, a travel planning AI agent. Return only valid JSON with
origin, destination, days, travelers, budget, interests, travel_style, and plan_summary.
Understand the user's goal clearly. Travel data is simulated, never claim it is live,
and never claim a real booking was made. Human approval is required for booking simulation."""


def _local_understanding(message, fields):
    text = message or ""
    match_days = re.search(r"(\d+)\s*day", text, re.IGNORECASE)
    match_budget = re.search(r"(?:₹|rs\.?|inr\s*)\s*([\d,]+)|under\s*([\d,]+)", text, re.IGNORECASE)
    budget_value = next((value for value in (match_budget.groups() if match_budget else ()) if value), None)
    interests = fields.get("interests", ["beach", "food"])
    if isinstance(interests, str):
        interests = [item.strip().lower() for item in interests.split(",") if item.strip()]
    destination = fields.get("destination")
    if not destination:
        destination = "Shivamogga" if any(alias in text.lower() for alias in ("shivamogga", "shimoga", "shimogga")) else "Goa"
    for interest in ("nature", "waterfall", "wildlife", "adventure"):
        if interest in text.lower() and interest not in interests:
            interests.append(interest)
    return {
        "origin": fields.get("origin") or ("Bengaluru" if "bengaluru" in text.lower() else "Bengaluru"),
        "destination": normalize_destination(destination),
        "days": int(fields.get("days") or (match_days.group(1) if match_days else 3)),
        "travelers": int(fields.get("travelers") or 1),
        "budget": int(str(fields.get("budget") or budget_value or 10000).replace(",", "")),
        "interests": interests,
        "travel_style": fields.get("travel_style") or get_memory().get("travel_style", "budget"),
        "plan_summary": text or "A practical simulated trip plan",
    }


def _ai_understanding(message, fields):
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _local_understanding(message, fields), "simulation", None
    try:
        from openai import OpenAI

        response = OpenAI(api_key=api_key).responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            instructions=SYSTEM_PROMPT,
            input=message,
        )
        parsed = json.loads(response.output_text)
        return _local_understanding(message, {**fields, **parsed}), "ai", None
    except Exception as error:
        print(f"OpenAI understanding failed: {error}")
        return _local_understanding(message, fields), "simulation", "AI service is temporarily unavailable. Using simulation mode."


def _event(events, event_type, message, **extra):
    events.append({"type": event_type, "message": message, **extra})


def _execute_plan(plan, events, style="budget"):
    _event(events, "tool", "Searching simulated transport", tool="search_transport")
    transport = search_transport(plan["origin"], plan["destination"], style)
    _event(events, "tool_success", f"{transport['mode']} found at ₹{transport['price']:,}", tool="search_transport", result=transport)
    _event(events, "tool", "Searching simulated hotels", tool="search_hotels")
    hotel = search_hotels(plan["destination"], plan["days"], plan["budget"], style)
    _event(events, "tool_success", f"{hotel['name']} selected", tool="search_hotels", result=hotel)
    _event(events, "tool", "Finding places for your interests", tool="search_places")
    places = search_places(plan["destination"], plan["interests"])
    _event(events, "tool_success", f"{len(places)} places found", tool="search_places", result=places)
    budget = calculate_budget(transport, hotel, plan["days"], plan["travelers"], plan["budget"], style)
    validation = validate_plan(plan, transport, hotel, places, budget)
    return transport, hotel, places, budget, validation


def run_agent(request_data, demo_replan=False):
    events = []
    message = request_data.get("message") or request_data.get("text", "")
    fields = {key: request_data.get(key) for key in ("origin", "destination", "days", "travelers", "budget", "interests", "travel_style") if request_data.get(key) is not None}
    if demo_replan:
        fields.update({"origin": "Bengaluru", "destination": "Goa", "days": 3, "travelers": 2, "budget": 5000, "interests": ["beach", "food"]})
    _event(events, "understanding", "Understanding your travel request")
    plan, mode, warning = _ai_understanding(message, fields)
    if warning:
        _event(events, "warning", warning)
    _event(events, "memory", "Loaded TRAVII memory", memory=get_memory())
    _event(events, "planning", "Creating a practical travel plan")
    transport, hotel, places, budget, validation = _execute_plan(plan, events, "comfort" if demo_replan else "budget")
    _event(events, "validation", "Checking availability and budget", validation=validation, budget=budget)
    initial_budget = budget.copy()
    replans = 0
    while not validation["valid"] and replans < MAX_REPLANS:
        replans += 1
        _event(events, "replanning", "Budget exceeded. Creating a cheaper plan", attempt=replans)
        transport, hotel, places, budget, validation = _execute_plan(plan, events, "super_budget")
        _event(events, "validation", "Replanned budget checked", validation=validation, budget=budget)
        if validation["valid"]:
            break
    itinerary = build_itinerary(plan, transport, hotel, places)
    update_memory("favorite_interests", plan["interests"])
    update_memory("travel_style", plan["travel_style"])
    _event(events, "completed", "Final itinerary created")
    return {
        "status": "success" if validation["valid"] else "needs_review",
        "mode": mode,
        "events": events,
        "plan": plan,
        "parsed_request": plan,
        "transport": transport,
        "hotel": hotel,
        "places": places,
        "budget": budget,
        "initial_budget": initial_budget,
        "replanned": replans > 0,
        "replans": replans,
        "validation": validation,
        "itinerary": itinerary,
        "memory": get_memory(),
        "approval": {"required": True, "status": "pending"},
    }


def update_with_chat(message, current_plan):
    plan = current_plan.get("plan", current_plan.get("parsed_request", {})).copy()
    lowered = message.lower()
    if any(phrase in lowered for phrase in ("show me", "places in", "which places", "3d views")):
        places = search_places(plan.get("destination", ""), plan.get("interests", []), message)
        selected = get_place("Jog Falls") if "jog falls" in lowered else None
        result = {**current_plan, "places": places, "events": current_plan.get("events", []) + [{"type": "place_search", "message": f"Found {len(places)} places for your request."}]}
        result["selected_place"] = selected
        result["chat_reply"] = "I found the places and opened the explorer." if selected else "I found the places for your destination."
        return result
    if "cheaper" in lowered:
        plan["travel_style"] = "budget"
    if "relaxed" in lowered:
        plan["travel_style"] = "relaxed"
    if "beach" in lowered and "beach" not in plan.get("interests", []):
        plan.setdefault("interests", []).append("beach")
    result = run_agent({"message": message, **plan})
    if "add jog falls" in lowered:
        place = get_place("Jog Falls")
        if place and result.get("itinerary"):
            result["itinerary"][1 if len(result["itinerary"]) > 1 else 0]["morning"] = place["name"]
            result["events"].append({"type": "place_added_to_trip", "message": "Jog Falls added to your itinerary."})
    result["chat_reply"] = "I updated the simulated plan using the new preference."
    return result
