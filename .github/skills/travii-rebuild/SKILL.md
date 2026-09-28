---
name: travii-rebuild
description: Rebuild TRAVII into a simple, demonstrable AI travel-planning agent using Flask, React/Vite, the OpenAI Responses API, local mock tools, memory, replanning, live agent events, and human approval. Use when rebuilding or substantially repairing this project.
---

# TRAVII Rebuild Skill

Rebuild TRAVII as a small, understandable college project. Treat the existing implementation as evidence to inspect, not as an architecture to preserve. Make the smallest coherent set of replacements needed for a clean working system; do not stack patches onto broken agent logic.

## Non-negotiable constraints

- Frontend: React, JSX, JavaScript, CSS, and Vite only. Never add TypeScript, `.ts`, or `.tsx`.
- Backend: Python and Flask with simple JSON/local storage.
- AI: official OpenAI Python SDK and the Responses API. Keep the model configurable through `OPENAI_MODEL`.
- Never expose `OPENAI_API_KEY` to the browser or hard-code it.
- Do not introduce databases, LangChain, LangGraph, authentication, payment APIs, or real booking APIs.
- Clearly label local travel data as demo/simulated availability.
- The agent may recommend and simulate booking only. Human approval is required before that simulated action.
- Keep the implementation easy for a college student to read and explain.

## Start with inspection

Before editing, inspect:

- `backend/app.py`, `agent.py`, `tools.py`, `memory.py`, `data.json`, and `requirements.txt`
- all frontend entry points, components, styles, and API calls
- environment files and ignore rules
- README and architecture/lifecycle documentation

Identify the actual controlling code path, duplicate or dead logic, dependency problems, and the cheapest executable check. Then choose whether each core file should be rewritten. Do not preserve broken abstractions merely for compatibility.

## Target architecture

Use a direct flow:

`request -> understand -> load memory -> plan -> execute tools -> observe -> validate -> replan (bounded) -> itinerary -> approval`

Keep Python responsible for tool execution, validation, budgets, memory, retries, replanning, safety, and approval. Use the model for natural-language understanding, structured extraction, planning help, interpretation, and explanations. Never let model output execute arbitrary Python.

Suggested backend modules:

- `app.py`: Flask routes, CORS, safe error responses, and request validation.
- `agent.py`: system prompt and bounded orchestration loop.
- `tools.py`: deterministic local transport, hotel, places, budget, itinerary, and validation tools.
- `memory.py`: small JSON-backed preferences store.
- `openai_service.py`: optional focused OpenAI client wrapper if it keeps `agent.py` clear.
- `data.json`: mock travel data.

## Structured planning contract

Parse every request into validated data with this shape:

```json
{
  "origin": "",
  "destination": "",
  "days": 0,
  "travelers": 1,
  "budget": 0,
  "interests": [],
  "travel_style": "",
  "plan_summary": ""
}
```

Reject or safely default missing and invalid values. The Flask server must not crash on malformed model output, missing fields, invalid API keys, rate limits, timeouts, unavailable models, or network failures. Log technical details on the backend, but return a friendly message to the frontend.

The OpenAI system prompt should establish that TRAVII understands goals, uses registered tools, checks constraints, replans when needed, never calls simulated data live, never claims a real booking, and requires human approval for consequential actions. Prefer structured output or strict JSON parsing for fields consumed by Python. If AI mode is unavailable, use deterministic simulation mode.

## Tools and replanning

Implement these simple, testable functions:

- `search_transport(origin, destination)`
- `search_hotels(destination, days, budget)`
- `search_places(destination, interests)`
- `calculate_budget(transport, hotel, days, travelers, activities, budget)`
- `build_itinerary(plan, transport, hotel, places)`
- `validate_plan(plan, transport, hotel, places, budget_result)`

Budget calculations must be performed in Python. Return transport, hotel, food, activities, total, budget, remaining, and `WITHIN_BUDGET` or `OVER_BUDGET`. Validation must check budget, availability, days, missing information, and invalid values.

Use `MAX_REPLANS = 3`; never create an unbounded loop. A failed initial plan must cause a real second tool execution with cheaper or otherwise changed options, followed by recalculation and validation. Do not merely animate a replan event. Preserve enough initial and final values for the UI to show what changed.

Every meaningful agent event must be emitted by the backend when the corresponding work occurs. Include event type, human-readable message, and useful tool/status metadata where applicable. Typical events include understanding, memory loaded, planning, tool start, tool success, validation, budget failure, replanning, completion, and error.

## Flask API contract

Provide these routes with JSON responses and safe validation:

- `GET /health`: `{backend, openai, mode}` where mode is `ai` or `simulation`.
- `POST /api/plan`: accepts `{message}` and returns events, plan, budget, itinerary, memory, approval state, and mode.
- `POST /api/chat`: accepts `{message, current_plan}` and returns an updated plan/itinerary plus events. Support requests such as making the trip cheaper, adding beaches, removing shopping, adding food places, and making the trip relaxed.
- `POST /api/demo/success`: deterministic successful demonstration.
- `POST /api/demo/replan`: deterministic budget failure followed by genuine replanning.
- `POST /api/approve`: records approve/reject for the simulated booking action.

Use only the Flask backend as the frontend's path to OpenAI. Keep API errors user-safe and never return stack traces or secrets.

## Memory

Use a small JSON file, such as `memory.json`, with preferences like travel style, favorite interests, and preferred transport. Load it before planning and update it only from appropriate user preferences or completed interactions. Make missing/corrupt memory recoverable with defaults.

## Frontend experience

Build a responsive dashboard rather than a bare form/result page. Keep the visual language intentional and readable, with a clear header, connection status, travel request form, agent status/timeline, tool result cards, memory card, budget breakdown, replanning panel, final itinerary, chat follow-up, demo success/replan buttons, reset, loading states, and approval modal.

The UI must:

- show `AI Connected` or `Simulation Mode` based on `/health`;
- display backend events as they arrive in the returned event sequence, with active/completed/error states tied to actual backend events;
- disable conflicting actions while planning;
- show simulated/demo data labels;
- clearly present initial versus revised budget when replanning occurs;
- update the itinerary after chat requests;
- show safe rejection and approval messages;
- work on desktop and mobile without overlapping content;
- use JSX/CSS only and match existing project conventions unless rebuilding them is necessary.

Do not claim streaming unless a real streaming endpoint is implemented. A returned event timeline may be rendered progressively by the client, but it must contain only events actually produced by backend execution.

## Environment and dependencies

Provide `backend/.env.example` containing at least:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
```

Use `python-dotenv`, `openai`, `Flask`, and `flask-cors` only when needed. Ensure `.env` is ignored by Git. Never commit real credentials. Do not assume an example model name is valid; document that `OPENAI_MODEL` must be set to a model available to the user's account.

## Verification before completion

Run focused checks after each substantive edit, then verify end to end:

1. Python syntax/import checks and backend startup.
2. `GET /health` with and without an API key.
3. Successful plan flow.
4. Replan flow proving changed options and a new budget calculation.
5. Invalid request and simulated OpenAI failure handling.
6. Chat update, approval, rejection, and reset behavior.
7. Frontend install/build and browser rendering.
8. Confirm no TypeScript files, exposed API key, unbounded loop, fake tool event, real booking claim, or unlabelled live-availability claim.

Update README setup instructions, simulation/AI behavior, API routes, demo controls, and troubleshooting notes. Report any unavailable external API or environment limitation explicitly rather than pretending the check passed.
