#!/usr/bin/env python3
"""
Build a small DuckDB database and AI-oriented semantic demo views.

This script is intentionally vendor-neutral and demo-safe:
- it uses only the synthetic/sample clinical trial data already present
- it does not connect any model or backend
- it derives deterministic helper data for enrollment and efficacy summaries
  so the results remain stable across rebuilds
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import duckdb
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
LEGACY_DATA_DIR = ROOT / "_file" / "data"
SOURCE_DATA_DIR = ROOT / "src" / "data" / "demo"
DB_DIR = ROOT / "db"
DB_PATH = DB_DIR / "clinical_demo.duckdb"


def stable_int(key: str, modulus: int) -> int:
    """Return a deterministic integer in [0, modulus)."""
    digest = hashlib.md5(key.encode("utf-8")).hexdigest()
    return int(digest[:12], 16) % modulus


def load_json(path: Path):
    with path.open() as fh:
        return json.load(fh)


def load_demo_json(source_name: str, legacy_name: str):
    source_path = SOURCE_DATA_DIR / source_name
    if source_path.exists():
        return load_json(source_path)

    legacy_path = LEGACY_DATA_DIR / legacy_name
    if legacy_path.exists():
        return load_json(legacy_path)

    raise FileNotFoundError(
        f"Could not find demo data file in either {source_path} or {legacy_path}"
    )


def derive_enrollment_status(adsl: list[dict], current_month: int = 9) -> pd.DataFrame:
    rows = []
    for record in adsl:
        subject_id = record["USUBJID"]
        consent_month = 1 + stable_int(f"{subject_id}|consent", 9)
        screening_month = min(12, consent_month + stable_int(f"{subject_id}|screening", 3))
        procedure_month = min(12, screening_month + 1 + stable_int(f"{subject_id}|procedure", 5))
        approval_score = stable_int(f"{subject_id}|approval", 100)
        failure_score = stable_int(f"{subject_id}|failure", 100)
        randomization_score = stable_int(f"{subject_id}|randomization", 100)

        approval_status = "Approved" if approval_score < 85 else "Screen in Process"
        if approval_status == "Screen in Process":
            current_status = "Screen in Process"
            randomization_status = "Not Assigned"
        elif failure_score < 12:
            current_status = "Screen Failure"
            randomization_status = "Not Assigned"
        elif procedure_month > current_month:
            current_status = "Pending Procedure"
            randomization_status = "Not Assigned"
        elif randomization_score < 55:
            current_status = "Randomized"
            randomization_status = "Randomized"
        elif randomization_score < 75:
            current_status = "Roll-in"
            randomization_status = "Roll-in"
        else:
            current_status = "Enrolled"
            randomization_status = "Not Assigned"

        rows.append(
            {
                "subject_id": subject_id,
                "site_id": record["SITE"],
                "treatment_arm_code": record["TRTEMFL"],
                "sex": record["SEX"],
                "race": record["RACE"],
                "consent_month": consent_month,
                "screening_month": screening_month,
                "procedure_month": procedure_month,
                "current_month": current_month,
                "approval_status": approval_status,
                "current_status": current_status,
                "randomization_status": randomization_status,
                "is_approved": approval_status == "Approved",
                "is_enrolled": current_status in {"Enrolled", "Randomized", "Roll-in"},
            }
        )
    return pd.DataFrame(rows)


def derive_efficacy_response(adsl: list[dict], bmi_cutoff: float) -> pd.DataFrame:
    rows = []
    for record in adsl:
        subject_id = record["USUBJID"]
        flg2_flag = "Yes" if float(record["BMI"]) >= bmi_cutoff else "No"
        score = stable_int(f"{subject_id}|response", 100)
        score -= 8 if record["TRTEMFL"] == "A" else 0
        score -= 4 if record["FLG1"] == "Yes" else 0
        score -= 3 if flg2_flag == "Yes" else 0
        score = max(score, 0)

        if score < 12:
            best_response = "CR"
        elif score < 37:
            best_response = "PR"
        elif score < 67:
            best_response = "SD"
        elif score < 87:
            best_response = "PD"
        else:
            best_response = "NE"

        rows.append(
            {
                "subject_id": subject_id,
                "parameter_code": "BESTRESP",
                "best_response": best_response,
                "responder_flag": 1 if best_response in {"CR", "PR"} else 0,
                "response_group": "Responder" if best_response in {"CR", "PR"} else "Non-responder",
                "flg2_flag": flg2_flag,
            }
        )
    return pd.DataFrame(rows)


def derive_time_to_event(adsl: list[dict], bmi_cutoff: float) -> pd.DataFrame:
    rows = []
    for record in adsl:
        subject_id = record["USUBJID"]
        bmi_signal = float(record["BMI"]) >= bmi_cutoff
        base_months = 6 + stable_int(f"{subject_id}|tte", 13)
        months = base_months
        months += 2 if record["TRTEMFL"] == "A" else 0
        months += 1 if record["FLG1"] == "Yes" else 0
        months += 1 if bmi_signal else 0
        months -= 1 if int(record["AGE"]) > 70 else 0
        months = max(1, min(24, months))

        censor_flag = 1 if stable_int(f"{subject_id}|censor", 100) < 20 else 0

        rows.append(
            {
                "subject_id": subject_id,
                "endpoint_code": "PFS",
                "time_to_event_months": months,
                "censor_flag": censor_flag,
                "event_observed_flag": 0 if censor_flag else 1,
            }
        )
    return pd.DataFrame(rows)


def build_database() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)

    adsl = load_demo_json("ADSL.json", "ADSL.339674d3.json")
    adlb = load_demo_json("ADLB.json", "ADLB.d83b6985.json")
    master = load_demo_json("masterData.json", "masterData.fdf475d9.json")
    adsl_inputs = load_demo_json("adslInputs.json", "adslInputs.4fc7dd21.json")
    adlb_inputs = load_demo_json("adlbInputs.json", "adlbInputs.cbd037a7.json")

    bmi_cutoff = (float(adsl_inputs["bmi1"]) + float(adsl_inputs["bmi2"])) / 2.0

    adsl_df = pd.DataFrame(adsl)
    adlb_df = pd.DataFrame(adlb)
    master_df = pd.DataFrame(master)
    adsl_inputs_df = pd.DataFrame([adsl_inputs])
    adlb_inputs_df = pd.DataFrame([adlb_inputs])
    enrollment_df = derive_enrollment_status(adsl, current_month=9)
    response_df = derive_efficacy_response(adsl, bmi_cutoff=bmi_cutoff)
    tte_df = derive_time_to_event(adsl, bmi_cutoff=bmi_cutoff)

    con = duckdb.connect(str(DB_PATH))
    try:
        con.execute("PRAGMA enable_object_cache = true;")

        for table_name, frame in {
            "raw_adsl": adsl_df,
            "raw_adlb": adlb_df,
            "raw_master": master_df,
            "raw_adsl_inputs": adsl_inputs_df,
            "raw_adlb_inputs": adlb_inputs_df,
            "raw_enrollment_status": enrollment_df,
            "raw_efficacy_response": response_df,
            "raw_time_to_event": tte_df,
        }.items():
            con.register(f"{table_name}_df", frame)
            con.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM {table_name}_df")
            con.unregister(f"{table_name}_df")

        con.execute(
            """
            CREATE OR REPLACE VIEW subject_summary_view AS
            SELECT
              a.USUBJID AS subject_id,
              a.SITE AS site_id,
              CASE WHEN a.TRTEMFL = 'A' THEN 'Arm A' ELSE 'Arm B' END AS treatment_arm,
              a.SEX AS sex,
              a.AGE AS age,
              CASE
                WHEN a.AGE < 60 THEN '<60'
                WHEN a.AGE BETWEEN 60 AND 75 THEN '60-75'
                ELSE '>75'
              END AS age_group,
              a.RACE AS race,
              a.HEIGHT AS height_cm,
              a.WEIGHT AS weight_kg,
              a.BMI AS bmi,
              a.FLG1 AS flg1_flag,
              CASE WHEN a.BMI >= (SELECT (bmi1 + bmi2) / 2.0 FROM raw_adsl_inputs LIMIT 1) THEN 'Yes' ELSE 'No' END AS flg2_flag,
              m.Endpoint1_Visit0 AS endpoint1_baseline,
              m.Endpoint2_Visit0 AS endpoint2_baseline,
              m.Endpoint1_Visit1_CHG AS endpoint1_visit1_change,
              m.Endpoint1_Visit2_CHG AS endpoint1_visit2_change,
              m.Endpoint2_Visit1_CHG AS endpoint2_visit1_change,
              m.Endpoint2_Visit2_CHG AS endpoint2_visit2_change
            FROM raw_adsl a
            LEFT JOIN raw_master m ON a.USUBJID = m.USUBJID
            ORDER BY subject_id
            """
        )

        con.execute(
            """
            CREATE OR REPLACE VIEW enrollment_status_view AS
            SELECT
              e.subject_id,
              e.site_id,
              CASE WHEN e.treatment_arm_code = 'A' THEN 'Arm A' ELSE 'Arm B' END AS treatment_arm,
              e.sex,
              e.race,
              e.consent_month,
              e.screening_month,
              e.procedure_month,
              e.current_month,
              e.approval_status,
              e.current_status AS enrollment_status,
              e.randomization_status,
              e.is_approved,
              e.is_enrolled
            FROM raw_enrollment_status e
            ORDER BY e.subject_id
            """
        )

        con.execute(
            """
            CREATE OR REPLACE VIEW lab_long_view AS
            WITH baseline AS (
              SELECT
                USUBJID,
                PARAMCD,
                AVAL AS baseline_aval
              FROM raw_adlb
              WHERE VISIT = 'Visit0'
            )
            SELECT
              l.USUBJID AS subject_id,
              a.SITE AS site_id,
              CASE WHEN a.TRTEMFL = 'A' THEN 'Arm A' ELSE 'Arm B' END AS treatment_arm,
              a.SEX AS sex,
              a.RACE AS race,
              l.VISIT AS visit,
              CAST(regexp_extract(l.VISIT, '([0-9]+)$', 1) AS INTEGER) AS visit_number,
              l.PARAMCD AS parameter_code,
              l.AVAL AS analysis_value,
              b.baseline_aval,
              l.AVAL - b.baseline_aval AS change_from_baseline
            FROM raw_adlb l
            LEFT JOIN baseline b
              ON l.USUBJID = b.USUBJID
             AND l.PARAMCD = b.PARAMCD
            LEFT JOIN raw_adsl a
              ON l.USUBJID = a.USUBJID
            ORDER BY subject_id, parameter_code, visit_number
            """
        )

        con.execute(
            """
            CREATE OR REPLACE VIEW efficacy_summary_view AS
            SELECT
              r.subject_id,
              CASE WHEN a.TRTEMFL = 'A' THEN 'Arm A' ELSE 'Arm B' END AS treatment_arm,
              a.SITE AS site_id,
              a.SEX AS sex,
              a.RACE AS race,
              a.FLG1 AS flg1_flag,
              r.flg2_flag,
              r.parameter_code,
              r.best_response,
              r.response_group,
              r.responder_flag
            FROM raw_efficacy_response r
            LEFT JOIN raw_adsl a
              ON r.subject_id = a.USUBJID
            ORDER BY r.subject_id
            """
        )

        con.execute(
            """
            CREATE OR REPLACE VIEW time_to_event_view AS
            SELECT
              t.subject_id,
              CASE WHEN a.TRTEMFL = 'A' THEN 'Arm A' ELSE 'Arm B' END AS treatment_arm,
              a.SITE AS site_id,
              a.FLG1 AS flg1_flag,
              CASE WHEN a.BMI >= (SELECT (bmi1 + bmi2) / 2.0 FROM raw_adsl_inputs LIMIT 1) THEN 'Yes' ELSE 'No' END AS flg2_flag,
              t.endpoint_code,
              t.time_to_event_months,
              t.censor_flag,
              t.event_observed_flag
            FROM raw_time_to_event t
            LEFT JOIN raw_adsl a
              ON t.subject_id = a.USUBJID
            ORDER BY t.subject_id
            """
        )

    finally:
        con.close()


if __name__ == "__main__":
    build_database()
    print(f"Built DuckDB demo database at {DB_PATH}")
