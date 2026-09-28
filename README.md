# TRAVII - Mini Autonomous Travel Agent

A college project demonstrating how an AI Agent works using a simple frontend and backend architecture.

## Overview
TRAVII is a small autonomous travel-planning demonstration. It understands a natural-language request, loads local memory, runs deterministic simulated travel tools, checks the budget, genuinely replans when needed, and requests human approval before a simulated booking action.

OpenAI is optional. When `OPENAI_API_KEY` is configured, the backend uses the Responses API to extract the travel request. Without it, TRAVII runs in clearly labelled simulation mode so the college demonstration remains reliable.

## Technologies Used
- **Frontend**: React (Vite), JavaScript (No TypeScript), CSS (Vanilla), HTML
- **Backend**: Python, Flask
- **Data**: Local mock JSON data
- **Agent Architecture**: Simple sequential flow with validation and fallback loops.

## Project Structure
- `backend/`: Flask APIs, agent logic, mock tools, memory, and data.
- `frontend/`: React components for UI orchestration and state tracking.
- `architecture.md`: Agent flow and architecture diagram.
- `lifecycle.md`: Detailed breakdown of the agent's lifecycle.

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt

# (Optional) Copy .env.example to .env and add an OpenAI API key
copy .env.example .env

# Run the Flask server (runs on port 5000)
python app.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run the React app (runs on port 5173 by default)
npm run dev
```

## API

- `GET /api/health`: backend and OpenAI connection status.
- `POST /api/plan`: plan a request from `{ "message": "..." }` or structured fields.
- `POST /api/chat`: update a plan from `{ "message": "Make it cheaper", "current_plan": {} }`.
- `POST /api/demo/success`: deterministic successful demonstration.
- `POST /api/demo/replan`: demonstrates budget failure followed by cheaper tool execution.
- `POST /api/approve`: approve or reject the simulated booking action.

## How to Test

1. Open the React frontend in your browser.
2. Use **Success demo** for the normal agent flow.
3. Use **Replan demo** to show the initial expensive plan, budget failure, cheaper tool run, and validated result.
4. Submit a natural-language brief or use the chat box to reshape the current plan.
5. Approve or reject the simulated action. TRAVII never makes a real booking or payment.
# travii
