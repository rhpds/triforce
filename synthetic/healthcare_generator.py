"""Synthetic healthcare data generator.

Produces realistic (but fully synthetic) patient records for scale testing.
All data is generated — no real PHI is used or referenced.
"""

import json
import random
import uuid
from datetime import datetime, timezone


RECORD_TYPES = [
    "discharge_summary",
    "progress_note",
    "lab_report",
    "radiology_report",
    "surgical_note",
]

DEPARTMENTS = ["cardiology", "oncology", "neurology", "orthopedics", "emergency", "internal_medicine"]

CONDITIONS = [
    ("E11.9", "Type 2 diabetes mellitus"),
    ("I10", "Essential hypertension"),
    ("J44.1", "COPD with acute exacerbation"),
    ("I25.10", "Coronary artery disease"),
    ("N18.3", "Chronic kidney disease, stage 3"),
    ("I48.0", "Paroxysmal atrial fibrillation"),
    ("G20", "Parkinson's disease"),
    ("M17.11", "Primary osteoarthritis, right knee"),
    ("F32.1", "Major depressive disorder, moderate"),
    ("C34.90", "Malignant neoplasm of lung"),
]

MEDICATIONS = [
    ("Metformin", "500mg", "twice daily"),
    ("Lisinopril", "10mg", "once daily"),
    ("Atorvastatin", "40mg", "at bedtime"),
    ("Aspirin", "81mg", "once daily"),
    ("Omeprazole", "20mg", "before breakfast"),
    ("Amlodipine", "5mg", "once daily"),
    ("Levothyroxine", "75mcg", "on empty stomach"),
    ("Gabapentin", "300mg", "three times daily"),
    ("Furosemide", "40mg", "once daily"),
    ("Warfarin", "5mg", "once daily"),
]

DISCHARGE_TEMPLATES = [
    """DISCHARGE SUMMARY

Patient: {name}, {age}-year-old {gender}
MRN: {mrn}
Admission Date: {admit_date}
Discharge Date: {discharge_date}
Attending: Dr. {attending}
Department: {department}

CHIEF COMPLAINT: {complaint}

HISTORY OF PRESENT ILLNESS:
{name} is a {age}-year-old {gender} who presented to the {department} department with {complaint}. {history}

PAST MEDICAL HISTORY:
{pmh}

MEDICATIONS ON ADMISSION:
{medications}

HOSPITAL COURSE:
{course}

DISCHARGE MEDICATIONS:
{discharge_meds}

DISCHARGE INSTRUCTIONS:
- Follow up with {department} in {followup_days} days
- Continue medications as prescribed
- Return to ED if symptoms worsen

DISCHARGE CONDITION: {condition}
""",
]

PROGRESS_TEMPLATES = [
    """PROGRESS NOTE — {date}

Patient: {name}, {age} y/o {gender}
Department: {department}
Day {hospital_day} of admission

SUBJECTIVE:
Patient reports {subjective}. {pain_scale}

OBJECTIVE:
Vitals: T {temp}°F, HR {hr}, BP {bp}, RR {rr}, SpO2 {spo2}%
General: {general_exam}
{system_exam}

ASSESSMENT/PLAN:
{assessment}

{plan}
""",
]

LAB_TEMPLATES = [
    """LABORATORY RESULTS — {date}

Patient: {name}, {age} y/o {gender}
Ordering Provider: Dr. {provider}

COMPLETE METABOLIC PANEL:
  Glucose: {glucose} mg/dL ({glucose_flag})
  BUN: {bun} mg/dL
  Creatinine: {creatinine} mg/dL ({creatinine_flag})
  Sodium: {sodium} mEq/L
  Potassium: {potassium} mEq/L
  Chloride: {chloride} mEq/L
  CO2: {co2} mEq/L
  Calcium: {calcium} mg/dL

COMPLETE BLOOD COUNT:
  WBC: {wbc} K/uL ({wbc_flag})
  Hemoglobin: {hgb} g/dL ({hgb_flag})
  Hematocrit: {hct}%
  Platelets: {plt} K/uL

INTERPRETATION:
{interpretation}
""",
]

FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
               "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
              "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson"]
DOCTOR_NAMES = ["Thompson", "Patel", "Chen", "Nguyen", "Kim", "Singh", "O'Brien", "Nakamura"]


def generate_patient_record(record_type: str = None) -> dict:
    if record_type is None:
        record_type = random.choice(RECORD_TYPES)

    patient_id = str(uuid.uuid4())
    name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    age = random.randint(18, 95)
    gender = random.choice(["M", "F"])
    gender_word = "male" if gender == "M" else "female"
    department = random.choice(DEPARTMENTS)

    num_conditions = random.randint(1, 4)
    patient_conditions = random.sample(CONDITIONS, min(num_conditions, len(CONDITIONS)))

    num_meds = random.randint(1, 5)
    patient_meds = random.sample(MEDICATIONS, min(num_meds, len(MEDICATIONS)))

    if record_type == "discharge_summary":
        text = _generate_discharge(name, age, gender_word, department, patient_conditions, patient_meds)
    elif record_type == "progress_note":
        text = _generate_progress_note(name, age, gender_word, department, patient_conditions, patient_meds)
    elif record_type == "lab_report":
        text = _generate_lab_report(name, age, gender_word, patient_conditions)
    else:
        text = _generate_discharge(name, age, gender_word, department, patient_conditions, patient_meds)

    return {
        "patient_id": patient_id,
        "record_type": record_type,
        "text": text,
        "metadata": {
            "age": str(age),
            "gender": gender,
            "department": department,
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _generate_discharge(name, age, gender, department, conditions, meds):
    pmh = "\n".join(f"- {c[1]} ({c[0]})" for c in conditions)
    medications = "\n".join(f"- {m[0]} {m[1]} {m[2]}" for m in meds)
    complaints = ["chest pain", "shortness of breath", "abdominal pain", "syncope", "altered mental status"]

    return DISCHARGE_TEMPLATES[0].format(
        name=name, age=age, gender=gender, department=department,
        mrn=f"MRN-{random.randint(100000, 999999)}",
        admit_date="2026-06-01", discharge_date="2026-06-05",
        attending=random.choice(DOCTOR_NAMES),
        complaint=random.choice(complaints),
        history=f"Symptoms began {random.randint(1,7)} days prior to admission.",
        pmh=pmh, medications=medications,
        course="Hospital course was uncomplicated. Patient responded well to treatment.",
        discharge_meds=medications,
        followup_days=random.choice([7, 14, 30]),
        condition=random.choice(["stable", "improved", "good"]),
    )


def _generate_progress_note(name, age, gender, department, conditions, meds):
    return PROGRESS_TEMPLATES[0].format(
        date="2026-06-03", name=name, age=age, gender=gender,
        department=department, hospital_day=random.randint(1, 10),
        subjective=random.choice(["improvement in symptoms", "persistent discomfort", "feeling better today"]),
        pain_scale=f"Pain: {random.randint(0,8)}/10.",
        temp=round(97.5 + random.random() * 3, 1),
        hr=random.randint(60, 110), bp=f"{random.randint(100,160)}/{random.randint(60,90)}",
        rr=random.randint(12, 24), spo2=random.randint(92, 100),
        general_exam="Alert and oriented. No acute distress.",
        system_exam=f"CV: {random.choice(['Regular rate and rhythm', 'Irregular rhythm'])}. Lungs: {random.choice(['Clear to auscultation', 'Diminished breath sounds bilaterally'])}.",
        assessment="\n".join(f"- {c[1]}: {random.choice(['stable', 'improving', 'worsening'])}" for c in conditions),
        plan="Continue current management. Reassess in AM.",
    )


def _generate_lab_report(name, age, gender, conditions):
    glucose = random.randint(70, 250)
    creatinine = round(random.uniform(0.6, 3.5), 1)
    wbc = round(random.uniform(3.0, 18.0), 1)
    hgb = round(random.uniform(8.0, 17.0), 1)

    return LAB_TEMPLATES[0].format(
        date="2026-06-03", name=name, age=age, gender=gender,
        provider=random.choice(DOCTOR_NAMES),
        glucose=glucose, glucose_flag="H" if glucose > 100 else "N",
        bun=random.randint(7, 35),
        creatinine=creatinine, creatinine_flag="H" if creatinine > 1.2 else "N",
        sodium=random.randint(135, 148),
        potassium=round(random.uniform(3.3, 5.5), 1),
        chloride=random.randint(96, 110),
        co2=random.randint(20, 30),
        calcium=round(random.uniform(8.5, 10.5), 1),
        wbc=wbc, wbc_flag="H" if wbc > 11 else "N",
        hgb=hgb, hgb_flag="L" if hgb < 12 else "N",
        hct=round(hgb * 3, 1),
        plt=random.randint(150, 400),
        interpretation="Results reviewed. " + (
            "Elevated glucose consistent with diabetes management." if glucose > 100 else "All values within normal limits."
        ),
    )


def generate_batch(count: int, record_type: str = None) -> list[dict]:
    return [generate_patient_record(record_type) for _ in range(count)]


if __name__ == "__main__":
    records = generate_batch(5)
    for r in records:
        print(f"[{r['record_type']}] Patient {r['patient_id'][:8]}... ({len(r['text'])} chars)")
    print(json.dumps(records[0], indent=2))
