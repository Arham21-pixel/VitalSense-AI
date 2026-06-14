from alert_engine import create_alert_json, create_alert


def demo():
    # Example HIGH score
    j = create_alert_json("patient_123", 0.9788, ["High Heart Rate", "High Shock Index", "Advanced Age"])
    print(j)

    # Example MEDIUM score
    print(create_alert("patient_456", 0.45, ["Low Urine Output", "Recent Surgery"]))

    # Example LOW score
    print(create_alert("patient_789", 0.12))


if __name__ == "__main__":
    demo()
