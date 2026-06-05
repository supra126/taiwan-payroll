"""Build hook: vendor the shared repo-root data/ into the package at build time.

The TS core and this package read the SAME data/*.json (single source of truth).
A naive `force-include = {"../../data": ...}` works for an in-tree build but breaks
the standard isolated flow (`python -m build`, which `pip install` from sdist uses):
the wheel is built from an unpacked sdist where `../../data` no longer exists.

So instead we copy the data into `taiwan_payroll/data/` during the build:
  - sdist build runs in the source checkout — `../../data` exists, copy it; the copied
    tree is force-included into the sdist.
  - isolated wheel build runs from the unpacked sdist — `../../data` is gone, but the
    data is already vendored inside, so we just re-register it.

Net result: both sdist and wheel are self-contained, on isolated and in-tree builds.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from hatchling.builders.hooks.plugin.interface import BuildHookInterface


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version: str, build_data: dict) -> None:
        root = Path(self.root)
        dest = root / "taiwan_payroll" / "data"
        src = root.parent.parent / "data"

        if src.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(src, dest)

        if not dest.is_dir():
            raise RuntimeError(
                "taiwan-payroll build: data directory not found "
                f"(looked for shared {src} and vendored {dest})"
            )

        # The vendored copy lives inside the package and is gitignored; the
        # `artifacts` patterns in pyproject.toml are what pull it into the
        # sdist/wheel. No force_include here — that would double-add the files
        # when the normal (no-VCS) walk of an unpacked sdist also picks them up.
