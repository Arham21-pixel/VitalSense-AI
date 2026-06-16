import sys
import time
import random
import httpx
import colorama
from colorama import Fore, Style

# Reconfigure stdout to use UTF-8 to prevent UnicodeEncodeError on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Initialize colorama
colorama.init(autoreset=True)

API_URL = "http://localhost:8000/predict"

patients = {
    "P001": True,   # HIGH RISK
    "P002": False,  # NORMAL
    "P003": True,   # HIGH RISK
    "P004": False,  # NORMAL
    "P005": False   # NORMAL
}

# In-memory state to track last generated vitals for smooth variations
state = {}


def get_next_vitals(patient_id: str, is_high_risk: bool):
    if is_high_risk:
        ranges = {
            "heart_rate": (105.0, 130.0, 3.0, "int"),
            "temperature": (38.5, 40.0, 0.2, "float1"),
            "respiratory_rate": (22.0, 30.0, 1.0, "int"),
            "spo2": (88.0, 93.0, 1.0, "int"),
            "systolic_bp": (70.0, 90.0, 3.0, "int"),
            "wbc": (14.0, 20.0, 0.5, "float1"),
            "lactate": (2.5, 5.0, 0.3, "float1"),
            "creatinine": (1.5, 3.0, 0.1, "float2")
        }
    else:
        ranges = {
            "heart_rate": (65.0, 90.0, 2.0, "int"),
            "temperature": (36.5, 37.5, 0.1, "float1"),
            "respiratory_rate": (14.0, 18.0, 1.0, "int"),
            "spo2": (96.0, 99.0, 0.5, "int"),
            "systolic_bp": (110.0, 130.0, 3.0, "int"),
            "wbc": (5.0, 10.0, 0.3, "float1"),
            "lactate": (0.5, 1.5, 0.1, "float1"),
            "creatinine": (0.6, 1.0, 0.05, "float2")
        }

    if patient_id not in state:
        patient_vitals = {}
        for vital, (vmin, vmax, _, vtype) in ranges.items():
            val = random.uniform(vmin, vmax)
            if vtype == "int":
                patient_vitals[vital] = int(round(val))
            elif vtype == "float1":
                patient_vitals[vital] = round(val, 1)
            else:
                patient_vitals[vital] = round(val, 2)
        state[patient_id] = patient_vitals
    else:
        patient_vitals = state[patient_id]
        for vital, (vmin, vmax, max_delta, vtype) in ranges.items():
            delta = random.uniform(-max_delta, max_delta)
            new_val = patient_vitals[vital] + delta
            new_val = max(vmin, min(vmax, new_val))
            if vtype == "int":
                patient_vitals[vital] = int(round(new_val))
            elif vtype == "float1":
                patient_vitals[vital] = round(new_val, 1)
            else:
                patient_vitals[vital] = round(new_val, 2)

    return patient_vitals


def push_fake_data():
    print(f"\n🚀 Starting VitalSense AI Patient EMR Simulator...")
    print(f"📡 Sending data to: {API_URL} every 15 seconds...\n")
    
    while True:
        for patient_id, is_high in patients.items():
            vitals = get_next_vitals(patient_id, is_high)
            payload = {
                "patient_id": patient_id,
                **vitals
            }
            
            try:
                response = httpx.post(API_URL, json=payload, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    risk_score = data.get("risk_score", 0.0)
                    risk_level = data.get("risk_level", "LOW")
                    priority = data.get("priority", "NORMAL")
                    
                    hr = vitals["heart_rate"]
                    temp = vitals["temperature"]
                    lact = vitals["lactate"]
                    
                    if risk_level in ["HIGH", "CRITICAL"]:
                        emoji = "🔴"
                        color = Fore.RED
                    elif risk_level == "MEDIUM":
                        emoji = "🟡"
                        color = Fore.YELLOW
                    else:
                        emoji = "🟢"
                        color = Fore.GREEN
                        
                    print(f"  {emoji} {color}{patient_id} | Risk: {risk_score:.2f} | {priority:<8} | HR:{hr:<3} Temp:{temp:<4} Lactate:{lact:<3}{Style.RESET_ALL}")
                else:
                    print(f"  ⚠️  Error POSTing for {patient_id}: Status {response.status_code}")
            except Exception as e:
                print(f"  ⚠️  Connection to VitalSense API failed for {patient_id}: {e}")
                
        print("-" * 70)
        time.sleep(15)


if __name__ == "__main__":
    push_fake_data()

