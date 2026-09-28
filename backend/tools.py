import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from pathlib import Path

DATA_FILE = Path(__file__).with_name("data.json")

DEMO_PLACES = [
    {"place_id": "demo-jog-falls", "city": "Shivamogga", "name": "Jog Falls", "type": "Waterfall", "address": "Shivamogga district, Karnataka", "description": "A dramatic waterfall destination surrounded by the Western Ghats.", "rating": None, "latitude": 14.2289, "longitude": 74.7973},
    {"place_id": "demo-kodachadri", "city": "Shivamogga", "name": "Kodachadri", "type": "Nature", "address": "Shivamogga district, Karnataka", "description": "A forested mountain viewpoint known for trekking and wide valley views.", "rating": None, "latitude": 13.8678, "longitude": 74.9060},
    {"place_id": "demo-mandagadde", "city": "Shivamogga", "name": "Mandagadde Bird Sanctuary", "type": "Wildlife", "address": "Shivamogga district, Karnataka", "description": "A quiet river island and birdwatching stop on the Tunga river.", "rating": None, "latitude": 13.9110, "longitude": 75.2220},
]


def normalize_destination(value):
    text = re.sub(r"\s+", " ", (value or "").strip())
    aliases = {"bangalore": "Bengaluru", "shimoga": "Shivamogga", "shimogga": "Shivamogga"}
    return aliases.get(text.lower(), text or "Goa")


def load_data():
    with DATA_FILE.open(encoding="utf-8") as data_file:
        return json.load(data_file)


def search_transport(origin, destination, style="budget"):
    routes = [route for route in load_data().get("transport", []) if route["from"].lower() == origin.lower() and route["to"].lower() == destination.lower()]
    if not routes:
        return {"mode": "Bus", "provider": "TRAVII Travels", "price": 1500, "duration": "12 hours", "available": True}
    route = max(routes, key=lambda item: item["price"]) if style == "comfort" else min(routes, key=lambda item: item["price"])
    return {**route, "provider": "TRAVII Travels", "duration": route.get("duration", "10 hours"), "available": True}


def search_hotels(destination, days, budget, style="budget"):
    hotels = [hotel for hotel in load_data().get("hotels", []) if hotel["city"].lower() == destination.lower()]
    if not hotels:
        hotels = [{"name": "Standard Stay", "price": 1500}]
    hotel = max(hotels, key=lambda item: item["price"]) if style == "comfort" else min(hotels, key=lambda item: item["price"])
    if style == "super_budget":
        hotel = {"name": "TRAVII Saver Hostel", "price": 500}
    return {"name": hotel["name"], "price_per_night": hotel["price"], "total": hotel["price"] * days, "rating": hotel.get("rating", 4.2), "available": True}


def _google_places(query):
    api_key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
    if not api_key:
        return []
    request = Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=json.dumps({"textQuery": query, "languageCode": "en"}).encode("utf-8"),
        headers={"Content-Type": "application/json", "X-Goog-Api-Key": api_key, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.types"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return []
    places = []
    for place in payload.get("places", [])[:6]:
        location = place.get("location", {})
        places.append({"place_id": place.get("id", "").removeprefix("places/"), "name": place.get("displayName", {}).get("text", "Information unavailable"), "type": (place.get("types") or ["Sightseeing"])[0].replace("_", " ").title(), "address": place.get("formattedAddress", "Information unavailable"), "description": "Real place data from Google Places.", "rating": place.get("rating"), "latitude": location.get("latitude"), "longitude": location.get("longitude"), "data_source": "REAL PLACE DATA", "photos": []})
    return places


def search_places(destination, interests=None, query=None):
    destination = normalize_destination(destination)
    places = _google_places(query or f"tourist attractions in {destination}")
    if not places:
        places = [place for place in DEMO_PLACES if place["city"].lower() == destination.lower()]
        if not places:
            places = [place for place in load_data().get("places", []) if place["city"].lower() == destination.lower()]
        places = [{**place, "data_source": "DEMO DATA", "photos": place.get("photos", [])} for place in places]
    interests = {interest.lower() for interest in (interests or [])}
    interest_types = {"nature": {"nature", "waterfall", "wildlife", "viewpoint"}, "adventure": {"nature", "waterfall", "viewpoint"}}
    matching = [place for place in places if not interests or place["type"].lower() in interests or any(place["type"].lower() in interest_types.get(interest, {interest}) or interest in place["name"].lower() for interest in interests)]
    return matching or places or [{"place_id": "demo-city-center", "name": "City Center", "type": "Sightseeing", "data_source": "DEMO DATA", "photos": []}]


def get_place(place_id):
    for place in DEMO_PLACES + load_data().get("places", []):
        if place.get("place_id") == place_id or place.get("name", "").lower() == place_id.lower():
            return {**place, "data_source": place.get("data_source", "DEMO DATA"), "photos": place.get("photos", [])}
    places = _google_places(place_id)
    return places[0] if places else None


def check_3d_availability(latitude, longitude):
    has_maps_key = bool(os.getenv("GOOGLE_MAPS_API_KEY", "").strip())
    return {"available": has_maps_key, "type": "terrain" if has_maps_key else "unavailable", "message": "3D terrain view available." if has_maps_key else "3D preview unavailable for this location.", "authoritative": False}


def calculate_budget(transport, hotel, days, travelers, budget, style="budget"):
    transport_cost = transport["price"] * travelers
    hotel_cost = hotel["total"]
    food_cost = (200 if style == "super_budget" else 600) * days * travelers
    activities_cost = (200 if style == "super_budget" else 500) * travelers
    total = transport_cost + hotel_cost + food_cost + activities_cost
    return {"transport": transport_cost, "hotel": hotel_cost, "food": food_cost, "activities": activities_cost, "total": total, "budget": budget, "remaining": budget - total, "within_budget": total <= budget, "status": "WITHIN_BUDGET" if total <= budget else "OVER_BUDGET"}


def build_itinerary(plan, transport, hotel, places):
    names = [place["name"] for place in places] or ["Explore the city"]
    return [{"day": day, "morning": f"{transport['mode']} to {plan['destination']}" if day == 1 else names[(day - 1) % len(names)], "afternoon": f"Check in at {hotel['name']}" if day == 1 else names[day % len(names)], "evening": "Local food and a relaxed evening"} for day in range(1, plan["days"] + 1)]


def validate_plan(plan, transport, hotel, places, budget_result):
    issues = []
    warnings = []
    if not plan.get("origin") or not plan.get("destination"):
        issues.append("Origin and destination are required")
    if plan.get("days", 0) < 1 or plan.get("days", 0) > 30:
        issues.append("Days must be between 1 and 30")
    if plan.get("budget", 0) <= 0:
        issues.append("Budget must be positive")
    if not transport.get("available") or not hotel.get("available"):
        issues.append("A selected option is unavailable")
    if not places:
        warnings.append("No matching places were found")
    if not budget_result["within_budget"]:
        issues.append("Plan exceeds the requested budget")
    return {"valid": not issues, "issues": issues, "warnings": warnings}
