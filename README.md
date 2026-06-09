# VitalSense AI

VitalSense AI is a scaffold for a real-time ICU sepsis prediction platform. The repo is split so the frontend, backend, ML work, simulator, and docs can be developed in parallel by different teammates.

## Layout

- `frontend/` - Next.js app for the dashboard and patient views
- `backend/` - FastAPI API layer, schema models, database hook, and WebSocket manager
- `ml/` - preprocessing, feature engineering, model training, and explainability notebooks
- `data-simulator/` - fake EMR stream for demos
- `docs/` - architecture, API reference, and demo setup notes

## Working Split

For collaboration, keep feature work isolated by area and branch name. A practical pattern is:

- `feature/frontend-*` for UI work
- `feature/backend-*` for API and database work
- `feature/ml-*` for model and notebook work
- `feature/simulator-*` for streaming and demo data

## Getting Started

1. Copy `.env.example` to `.env`.
2. Install dependencies inside the folder you are working in.
3. Run the frontend, backend, or ML notebooks independently while the scaffold is being filled in.

## Current State

This checkout now contains the full project skeleton and starter files, not the finished product. The next step is to implement the actual UI, API logic, simulator flow, and model pipeline.
