from rapidfuzz import fuzz

def find_recurring(df, threshold=85, min_occ=2) -> list:
    descs = df['Description'].tolist()
    used, groups = set(), []
    for i, d1 in enumerate(descs):
        if i in used:
            continue
        grp = [i]
        for j, d2 in enumerate(descs):
            if j <= i or j in used:
                continue
            if fuzz.token_sort_ratio(d1.lower(), d2.lower()) >= threshold:
                grp.append(j)
        if len(grp) >= min_occ:
            used.update(grp)
            rows = df.iloc[grp]
            groups.append({
                'merchant':    d1,
                'occurrences': len(grp),
                'total':       round(float(rows['Amount'].sum()), 2),
            })
    return sorted(groups, key=lambda x: x['occurrences'], reverse=True)