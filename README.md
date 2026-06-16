# VitalSense AI 🏥
> "We don't wait for sepsis. We predict it."

## 🚀 Quick Start

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Data Simulator
```bash
cd data-simulator
pip install -r requirements.txt
python simulator.py
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## 🏗️ Architecture
EMR Stream → FastAPI Backend → LSTM + XGBoost ML → SHAP Explainer → React Dashboard

## 👥 Team GIT SUMMER
| Member | Role |
|---|---|
| Saif Ur Rahman | AI/ML Architecture & Clinical Intelligence |
| Arham Boonlia | Frontend Engineering & Data Infrastructure |

## 🔗 Live Demo
Coming soon

## 📸 Screenshots
Coming soon

