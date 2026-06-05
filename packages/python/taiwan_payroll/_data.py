"""Year-data loading. Reads the same data/{year}.json as the TS core.

Resolution order: packaged taiwan_payroll/data/ (present in a built wheel),
then a repo-root data/ fallback for monorepo dev/tests.
"""
from __future__ import annotations

import json
from pathlib import Path

_data_dir_cache: Path | None = None
_year_cache: dict[int, dict] = {}


def _has_year_json(d: Path) -> bool:
    return d.is_dir() and any(d.glob("[0-9][0-9][0-9][0-9].json"))


def _find_data_dir() -> Path:
    packaged = Path(__file__).resolve().parent / "data"
    if _has_year_json(packaged):
        return packaged
    for parent in Path(__file__).resolve().parents:
        if _has_year_json(parent / "data"):
            return parent / "data"
    raise FileNotFoundError("taiwan-payroll: could not locate the data directory")


def _data_dir() -> Path:
    global _data_dir_cache
    if _data_dir_cache is None:
        _data_dir_cache = _find_data_dir()
    return _data_dir_cache


def get_available_years() -> list[int]:
    years = [int(f.stem) for f in _data_dir().glob("*.json") if f.stem.isdigit() and len(f.stem) == 4]
    return sorted(years)


def get_year_data(year: int) -> dict:
    if year not in _year_cache:
        path = _data_dir() / f"{year}.json"
        if not path.is_file():
            raise ValueError(f"No data for year {year}. Available: {', '.join(map(str, get_available_years()))}")
        _year_cache[year] = json.loads(path.read_text(encoding="utf-8"))
    return _year_cache[year]
