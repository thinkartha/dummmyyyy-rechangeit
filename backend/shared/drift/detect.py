"""Drift detection — salvaged from drift_detector.py (statistical) + drift_detection.py (config).

The old modules were the most statistically substantive in the repo but pulled scipy/MLflow.
Here the core tests are reimplemented dependency-free:
  - two-sample Kolmogorov-Smirnov for numerical data drift,
  - Chi-square for categorical drift,
  - hash/diff for configuration drift.
Pure functions, exercisable over baseline-vs-current samples.
"""

from __future__ import annotations

import hashlib
import json
import math
from pydantic import BaseModel

# Chi-square critical values at alpha=0.05 by degrees of freedom.
_CHI2_CRIT = {1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070,
              6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307}


class NumericDrift(BaseModel):
    feature: str
    ks_statistic: float
    critical: float
    drift: bool


class CategoricalDrift(BaseModel):
    feature: str
    chi_square: float
    critical: float
    drift: bool


class ConfigDrift(BaseModel):
    added: list[str]
    removed: list[str]
    changed: list[str]
    baseline_hash: str
    current_hash: str


class DriftReport(BaseModel):
    numeric: list[NumericDrift]
    categorical: list[CategoricalDrift]
    config: ConfigDrift
    any_drift: bool


def ks_two_sample(baseline: list[float], current: list[float], alpha: float = 0.05) -> tuple[float, float, bool]:
    """Two-sample KS: D = max|F_baseline(x) - F_current(x)|; drift if D > critical."""
    n1, n2 = len(baseline), len(current)
    if n1 == 0 or n2 == 0:
        return 0.0, 0.0, False
    xs = sorted(set(baseline) | set(current))

    def cdf(sample: list[float], x: float) -> float:
        return sum(1 for v in sample if v <= x) / len(sample)

    d = max(abs(cdf(baseline, x) - cdf(current, x)) for x in xs)
    c_alpha = 1.36 if alpha == 0.05 else math.sqrt(-0.5 * math.log(alpha / 2))
    critical = c_alpha * math.sqrt((n1 + n2) / (n1 * n2))
    return round(d, 4), round(critical, 4), d > critical


def chi_square_drift(baseline_counts: dict[str, int], current_counts: dict[str, int]) -> tuple[float, float, bool]:
    cats = sorted(set(baseline_counts) | set(current_counts))
    total_b = sum(baseline_counts.values()) or 1
    total_c = sum(current_counts.values()) or 1
    chi2 = 0.0
    for c in cats:
        exp = total_c * (baseline_counts.get(c, 0) / total_b)
        if exp > 0:
            chi2 += (current_counts.get(c, 0) - exp) ** 2 / exp
    dof = max(1, len(cats) - 1)
    critical = _CHI2_CRIT.get(dof, 18.307)
    return round(chi2, 3), critical, chi2 > critical


def _hash(obj: dict) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True).encode()).hexdigest()[:12]


def config_drift(baseline: dict, current: dict) -> ConfigDrift:
    bk, ck = set(baseline), set(current)
    changed = sorted(k for k in (bk & ck) if baseline[k] != current[k])
    return ConfigDrift(
        added=sorted(ck - bk),
        removed=sorted(bk - ck),
        changed=changed,
        baseline_hash=_hash(baseline),
        current_hash=_hash(current),
    )
