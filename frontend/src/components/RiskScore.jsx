// risk: { score: 0-100, level: "Low Risk"|"Medium Risk"|"High Risk"|"Critical Risk" }
export default function RiskScore({ risk }) {
  const { score, level } = risk
  const slug = level.toLowerCase().replace(' ', '-')

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <p className="card-label">Risk Score</p>
      <p className="risk-score-num">{score}</p>
      <span className={`risk-badge risk-badge--${slug}`}>{level}</span>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-4)' }}>
        <div className="risk-track">
          <div
            className={`risk-fill risk-fill--${slug}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--sp-1)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-3)',
        }}>
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  )
}
