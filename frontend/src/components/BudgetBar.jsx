import { fmtPct } from '../utils/fmt'

// budget: { needs_pct, wants_pct, savings_pct }
export default function BudgetBar({ budget }) {
  const needs   = budget.needs_pct   ?? 0
  const wants   = budget.wants_pct   ?? 0
  const savings = budget.savings_pct ?? 0

  // "other" is spending not in needs/wants — derived from the identity:
  //   needs + wants + other + savings = 100%  (all as % of income)
  // Works for negative savings too: other absorbs the overspend correctly.
  const other = Math.max(0, 100 - needs - wants - savings)
  const isOverspent = savings < 0

  // ── Bar widths (visual only) ──────────────────────────────────
  // Positive spending segments (needs + wants + other) can exceed 100%
  // when overspending. Scale them proportionally so the bar never overflows.
  // Savings gets 0 width when negative — shown in legend instead.
  const spendTotal = needs + wants + other
  const scale = spendTotal > 100 ? 100 / spendTotal : 1

  const BAR = [
    { key: 'needs',   label: 'Needs',   color: '#3B3B6D', barW: needs * scale,   legendV: needs   },
    { key: 'wants',   label: 'Wants',   color: '#8484B8', barW: wants * scale,   legendV: wants   },
    { key: 'savings', label: 'Savings', color: '#C4C4DC', barW: isOverspent ? 0 : savings, legendV: savings },
    ...(other > 0.5
      ? [{ key: 'other', label: 'Other', color: '#E0DFD8', barW: other * scale, legendV: other }]
      : []),
  ]

  return (
    <div className="card">
      <div className="card-section-title"><span>Budget Split</span></div>

      <div className="budget-track">
        {BAR.map(s => (
          <div
            key={s.key}
            className="budget-segment"
            style={{ width: `${s.barW}%`, background: s.color }}
          />
        ))}
      </div>

      {isOverspent && (
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-danger)',
          marginTop: 'var(--sp-2)',
          marginBottom: 'var(--sp-3)',
        }}>
          Spending exceeded income this period — bar is scaled to fit.
        </p>
      )}

      <div className="budget-legend">
        {BAR.map(s => (
          <div key={s.key} className="budget-legend-row">
            <div className="budget-legend-left">
              <div className="budget-dot" style={{ background: s.color }} />
              <span>{s.label}</span>
            </div>
            <span
              className="budget-pct"
              style={s.key === 'savings' && isOverspent
                ? { color: 'var(--color-danger)' }
                : {}}
            >
              {fmtPct(s.legendV)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
