import pandas as pd
import numpy as np
import re
from ml.classifier import classify_transactions
from ml.anomaly import compute_category_stats, zscore_flag
from ml.recurring import find_recurring

def clean_description(desc):
    desc = str(desc).strip()
    # Strip UPI payment-rail prefixes before any other check so
    # "Upi:239401923:Zerodha" and "Zerodha" both reduce to "Zerodha".
    upi_match = re.match(r'upi:(?:\d+:)?(.*)', desc, re.IGNORECASE)
    if upi_match:
        desc = upi_match.group(1).strip()
    if desc.startswith('NETTXN:'):
        return desc.replace('NETTXN:', '').replace('TICKETBOOKING', '').title()
    if desc.startswith('PCA:'):
        return desc.split(':')[-1].title()
    if desc.startswith('CRYPTOEXCHANGE'):
        return 'Crypto ' + desc.replace('CRYPTOEXCHANGE', '').title()
    if desc.startswith('IMPS'):
        name = re.search(r'IMPS/([^/]+)/', desc)
        return ('IMPS Transfer ' + name.group(1).title()) if name else 'IMPS Transfer'
    if desc.startswith('REFUNDOF:'):
        return 'Refund ' + desc.replace('REFUNDOF:', '').title()
    if desc.startswith('REVOFNETTXN'):
        return 'Transaction Reversal'
    if desc.startswith('FundsTransfer'):
        return 'Funds Transfer'
    if desc.startswith('EMI'):
        return 'EMI Payment'
    return desc.title()

def _find_col(df, candidates):
    lower_map = {c.lower().strip(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lower_map:
            return lower_map[cand.lower()]
    return None

def normalize_columns(df):
    date_col = _find_col(df, ['date','transaction date','txn date','value date','posting date'])
    desc_col = _find_col(df, ['description','narration','particulars','details','remarks','memo'])
    debit_col  = _find_col(df, ['debit','withdrawal','dr'])
    credit_col = _find_col(df, ['credit','deposit','cr'])
    amount_col = _find_col(df, ['amount','transaction amount','txn amount'])
    has_split  = debit_col is not None and credit_col is not None
    has_single = amount_col is not None
    errors = []
    if date_col is None:   errors.append('date column')
    if desc_col is None:   errors.append('description column')
    if not has_split and not has_single: errors.append('amount column(s)')
    if errors:
        return None, f"Could not detect: {', '.join(errors)}. Your columns: {', '.join(df.columns)}"
    return {'date': date_col, 'desc': desc_col, 'debit': debit_col,
            'credit': credit_col, 'amount': amount_col, 'has_split': has_split}, None

def preprocess_df(df):
    col_map, error = normalize_columns(df)
    if error:
        raise ValueError(error)
    raw_dates = df[col_map['date']]
    df['Date'] = pd.to_datetime(raw_dates, dayfirst=True, errors='coerce')
    mask = df['Date'].isna()
    if mask.any():
        df.loc[mask, 'Date'] = pd.to_datetime(raw_dates[mask], format='mixed', errors='coerce')
    df['Description'] = df[col_map['desc']].apply(clean_description)
    if col_map['has_split']:
        df['debit']  = pd.to_numeric(df[col_map['debit']],  errors='coerce').fillna(0).abs()
        df['credit'] = pd.to_numeric(df[col_map['credit']], errors='coerce').fillna(0).abs()
        df['Type']   = df.apply(lambda r: 'Credit' if r['credit'] > 0 else 'Debit', axis=1)
        df['Amount'] = df.apply(lambda r: r['credit'] if r['credit'] > 0 else r['debit'], axis=1)
    else:
        raw_amt = pd.to_numeric(df[col_map['amount']], errors='coerce').fillna(0)
        df['Type']   = raw_amt.apply(lambda x: 'Credit' if x > 0 else 'Debit')
        df['Amount'] = raw_amt.abs()
    return df.dropna(subset=['Date']).reset_index(drop=True)

def analyze(df: pd.DataFrame) -> dict:
    """Core analysis — takes a preprocessed DataFrame, returns the full result dict."""
    df['Month']    = df['Date'].dt.to_period('M')
    df['Category'] = classify_transactions(df['Description'].tolist())
    debits  = df[df['Type'] == 'Debit'].copy()
    credits = df[df['Type'] == 'Credit']
    cat_stats = compute_category_stats(debits)
    debits    = zscore_flag(debits, cat_stats)

    income    = float(credits['Amount'].sum())
    exp_summary = debits.groupby('Category')['Amount'].sum().sort_values(ascending=False)
    total_exp = float(exp_summary.sum())
    savings   = income - total_exp
    savings_pct = savings / income * 100 if income > 0 else 0

    anom_count = int(debits['Z_Flagged'].sum())
    anom_pct   = round(debits['Z_Flagged'].mean() * 100, 1) if len(debits) else 0.0

    needs = float(exp_summary[exp_summary.index.isin(['Bills & Utilities','Groceries','Finance & Loans','Transfers & IMPS'])].sum())
    wants = float(exp_summary[exp_summary.index.isin(['Food & Dining','Shopping','Travel','Crypto'])].sum())

    exp_ratio = total_exp / income if income > 0 else 1
    sav_ratio = savings / income if income > 0 else 0
    risk_num  = min(100, int(
        max(0, (0.2 - sav_ratio) / 0.2 * 35) + min(exp_ratio * 35, 35) + (anom_pct / 100) * 30
    ))
    risk_level = ('Low Risk' if risk_num < 25 else 'Medium Risk' if risk_num < 50
                  else 'High Risk' if risk_num < 75 else 'Critical Risk')

    m_exp    = debits.groupby('Month')['Amount'].sum()
    recurring = find_recurring(debits)
    date_range = f"{df['Date'].min().strftime('%d %b %Y')} – {df['Date'].max().strftime('%d %b %Y')}" if len(df) else ''

    return {
        'kpis': {
            'income': round(income, 2), 'expenses': round(total_exp, 2),
            'savings': round(savings, 2), 'savings_pct': round(savings_pct, 1),
            'num_credits': int(len(credits)), 'num_debits': int(len(debits)),
            'anomaly_count': anom_count, 'anomaly_pct': anom_pct,
        },
        'risk': {'score': risk_num, 'level': risk_level},
        'expense_by_category': {
            'labels': exp_summary.index.tolist(),
            'values': [round(float(v), 2) for v in exp_summary.values],
        },
        'monthly_trend': {
            'labels': [m.strftime('%b %Y') for m in m_exp.index.to_timestamp()],
            'values': [round(float(v), 2) for v in m_exp.values],
        },
        'budget': {
            'needs_pct':   round(needs / income * 100, 1) if income > 0 else 0,
            'wants_pct':   round(wants / income * 100, 1) if income > 0 else 0,
            'savings_pct': round(savings_pct, 1),
        },
        'recurring':  recurring,
        'date_range': date_range,
        'df':         df,      # returned so routes can persist to DB
        'debits':     debits,  # with Z_Score / Z_Flagged populated
    }