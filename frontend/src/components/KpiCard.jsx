// variant: 'default' | 'danger'
// icon: any Lucide icon component (optional)
export default function KpiCard({ label, value, sub, variant = 'default', icon: Icon }) {
  return (
    <div className="card">
      <div className="kpi-header">
        <p className="card-label">{label}</p>
        {Icon && <Icon size={14} className="kpi-icon" />}
      </div>
      <p className={`kpi-value num${variant === 'danger' ? ' kpi-value--danger' : ''}`}>
        {value}
      </p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}
