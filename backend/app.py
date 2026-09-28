import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from agent import run_agent, update_with_chat
from tools import check_3d_availability, get_place, search_places

app = Flask(__name__)
CORS(app)


@app.get("/health")
@app.get("/api/health")
def health():
    configured = bool(os.getenv("OPENAI_API_KEY", "").strip())
    return jsonify({"backend": True, "openai": configured, "mode": "ai" if configured else "simulation"})


@app.post("/api/plan")
@app.post("/plan")
def plan():
    data = request.get_json(silent=True) or {}
    if not data.get("message") and not data.get("text") and not data.get("destination"):
        return jsonify({"error": "A travel request is required."}), 400
    return jsonify(run_agent(data))


@app.post("/api/demo/success")
@app.post("/demo-success")
def demo_success():
    return jsonify(run_agent({"message": "Plan a comfortable 3-day Goa trip from Bengaluru under ₹15000", "budget": 15000}))


@app.post("/api/demo/replan")
@app.post("/demo-failure")
def demo_replan():
    return jsonify(run_agent({}, demo_replan=True))


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True) or {}
    if not data.get("message") or not isinstance(data.get("current_plan"), dict):
        return jsonify({"error": "Message and current plan are required."}), 400
    return jsonify(update_with_chat(data["message"], data["current_plan"]))


@app.post("/api/places/search")
def places_search():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"error": "A place search query is required."}), 400
    destination = "Shivamogga" if any(alias in query.lower() for alias in ("shivamogga", "shimoga", "shimogga")) else query
    places = search_places(destination, data.get("interests"), query)
    source = "REAL PLACE DATA" if any(place.get("data_source") == "REAL PLACE DATA" for place in places) else "DEMO DATA"
    return jsonify({"places": places, "data_source": source})


@app.get("/api/place/<path:place_id>")
def place_details(place_id):
    place = get_place(place_id)
    if not place:
        return jsonify({"error": "Place not found."}), 404
    return jsonify(place)


@app.get("/api/3d/availability")
def three_d_availability():
    try:
        latitude = float(request.args["lat"])
        longitude = float(request.args["lng"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Latitude and longitude are required."}), 400
    return jsonify(check_3d_availability(latitude, longitude))


@app.post("/api/trip/add-place")
def add_place():
    data = request.get_json(silent=True) or {}
    place = get_place(data.get("place_id", ""))
    if not place:
        return jsonify({"error": "Place not found."}), 404
    current_plan = data.get("current_plan") or {}
    itinerary = current_plan.get("itinerary") or []
    day = max(1, min(int(data.get("day", 2)), len(itinerary) or 2))
    if itinerary:
        itinerary = [dict(item) for item in itinerary]
        itinerary[day - 1]["morning"] = place["name"]
    return jsonify({"status": "success", "place": place, "day": day, "itinerary": itinerary, "message": f"{place['name']} added to Day {day}.", "event": {"type": "place_added_to_trip", "message": f"{place['name']} added to Day {day}."}})


@app.post("/api/approve")
@app.post("/approve")
def approve():
    data = request.get_json(silent=True) or {}
    if data.get("action", "").upper() == "APPROVE":
        return jsonify({"status": "approved", "message": "Booking simulation approved."})
    return jsonify({"status": "rejected", "message": "TRAVII stopped the action safely."})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
