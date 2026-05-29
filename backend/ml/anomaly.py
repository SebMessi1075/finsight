# Uses MAD-based modified Z-score instead of classical Z-score for robustness
# against outliers. Mean and std are pulled toward extreme values, masking the
# very anomalies they're meant to detect. Median and MAD are not affected by
# extremes. The 0.6745 constant scales MAD to be comparable to standard
# deviation under a normal distribution.

import numpy as np
import pandas as pd

def adaptive_threshold(amounts: pd.Series, base=2.0) -> float:
    if len(amounts) < 10:
        return base
    kurt = float(amounts.kurtosis())
    return round(base + np.clip(kurt / 20.0, 0, 0.5), 2)

def compute_category_stats(debits: pd.DataFrame) -> dict:
    stats = {}
    for cat, grp in debits.groupby('Category'):
        if len(grp) < 5:
            continue
        median = float(grp['Amount'].median())
        mad    = float((grp['Amount'] - median).abs().median())
        stats[cat] = {
            'median': median,
            'mad':    mad,
            'count':  int(len(grp)),
        }
    return stats

def zscore_flag(debits: pd.DataFrame, category_stats: dict) -> pd.DataFrame:
    debits = debits.copy()
    debits['Z_Score']   = 0.0
    debits['Z_Flagged'] = 0
    for cat, grp in debits.groupby('Category'):
        if cat not in category_stats or category_stats[cat]['mad'] == 0:
            continue
        median = category_stats[cat]['median']
        mad    = category_stats[cat]['mad']
        z      = 0.6745 * (grp['Amount'] - median) / mad
        threshold = adaptive_threshold(grp['Amount'])
        debits.loc[grp.index, 'Z_Score']   = z.round(2)
        debits.loc[grp.index, 'Z_Flagged'] = (z.abs() > threshold).astype(int)
    return debits
