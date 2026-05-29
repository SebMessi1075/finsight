import { fmtINR } from '../utils/fmt'

// recurring: [{ merchant, occurrences, total }]
export default function RecurringTable({ recurring }) {
  if (!recurring?.length) {
    return (
      <div className="card">
        <div className="card-section-title"><span>Recurring Charges</span></div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }}>
          No recurring charges detected.
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-section-title"><span>Recurring Charges</span></div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Merchant</th>
            <th className="r">Times</th>
            <th className="r">Total</th>
          </tr>
        </thead>
        <tbody>
          {recurring.map((r, i) => (
            <tr key={i}>
              <td style={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {r.merchant}
              </td>
              <td className="r muted">{r.occurrences}×</td>
              <td className="r">{fmtINR(r.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
