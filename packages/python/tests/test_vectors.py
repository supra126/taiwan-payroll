"""Run the SAME language-agnostic golden vectors as the TS suite, via a camelCase<->snake_case adapter."""
from __future__ import annotations

import json
import re
from dataclasses import asdict
from pathlib import Path

import pytest

from taiwan_payroll import create_payroll_engine, CalculateInput, SupplementaryInput, ProratedInput, EmployerSupplementaryInput, WithholdingInput


def _find_testdata() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "testdata" / "schema.json").is_file():
            return parent / "testdata"
    raise FileNotFoundError("testdata not found")


def _camel_to_snake(s: str) -> str:
    return re.sub(r"(?<!^)(?=[A-Z])", "_", s).lower()


def _convert_keys(obj):
    if isinstance(obj, dict):
        return {_camel_to_snake(k): _convert_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_keys(x) for x in obj]
    return obj


def _assert_subset(actual, expected, path=""):
    for k, v in expected.items():
        a = actual.get(k) if isinstance(actual, dict) else None
        p = f"{path}.{k}" if path else k
        if isinstance(v, dict):
            _assert_subset(a, v, p)
        else:
            assert a == v, f"vector field {p}: expected {v!r}, got {a!r}"


_TESTDATA = _find_testdata()
_VECTORS = []
for _f in sorted(_TESTDATA.rglob("*.json")):
    if _f.name == "schema.json":
        continue
    _VECTORS.append((_f.stem, json.loads(_f.read_text(encoding="utf-8"))))


def test_found_enough_vectors():
    assert len(_VECTORS) >= 22


@pytest.mark.parametrize("name,vector", _VECTORS, ids=[n for n, _ in _VECTORS])
def test_vector(name, vector):
    kind = vector.get("kind", "calculate")
    engine = create_payroll_engine(vector["year"])
    args = _convert_keys(vector["input"])
    if kind == "withholding":
        result = engine.calculate_withholding(WithholdingInput(**args))
    elif kind == "employer-supplementary":
        result = engine.calculate_employer_supplementary(EmployerSupplementaryInput(**args))
    elif kind == "supplementary":
        result = engine.calculate_supplementary(SupplementaryInput(**args))
    elif kind == "prorated":
        result = engine.calculate_prorated(ProratedInput(**args))
    else:
        result = engine.calculate(CalculateInput(**args))
    _assert_subset(asdict(result), _convert_keys(vector["expected"]))
