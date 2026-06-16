# VitalSense AI - Patient EMR Data Simulator

This simulator generates real-time, dynamic patient vitals and streams them to the VitalSense AI backend to demonstrate sepsis risk prediction and alerting.

## Setup & Run Instructions

### 1. Install Dependencies
Make sure you have installed the required dependencies for the simulator:
```bash
pip install -r requirements.txt
```

### 2. Run the Simulator
Run the simulator using Python:
```bash
python simulator.py
```

## How It Works
- **5 Patients simulated**:
  - `P001` & `P003` - High-risk sepsis patients (vitals in deteriorating ranges)
  - `P002`, `P004`, & `P005` - Normal patients (vitals in safe ranges)
- **Time interval**: New vitals are generated and sent every 15 seconds.
- **Dynamic drift**: Added small random variations each cycle to mimic live patient monitoring.
- **API integration**: Streams vitals via `POST http://localhost:8000/predict`.
- **Colored logs**: Utilizes `colorama` for a color-coded CLI dashboard.