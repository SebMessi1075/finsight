import { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import { fmtINR, fmtDate } from '../utils/fmt'
import '../styles/pages.css'

export default function Anomalies() {
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  useEffect(() => {
    api.getTransactions()
      .then(data => { setTransactions(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [])

  // Category averages computed from all debits — used for "why flagged" context
  const catAvg = useMemo(() => {
    const acc = {}
    transactions.forEach(tx => {
      if (tx.type !== 'Debit' || !tx.category) return
      if (!acc[tx.category]) acc[tx.category] = { sum: 0, n: 0 }
      acc[tx.category].sum += tx.amount
      acc[tx.category].n   += 1
    })
    const result = {}
    Object.entries(acc).forEach(([k, v]) => { result[k] = v.sum / v.n })
    return result
  }, [transactions])

  const anomalies = useMemo(
    () => transactions.filter(t => t.z_flagged),
    [transactions]
  )

  if (loading) {
    return (
      <Layout title="Anomalies">
        <p style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>Loading…</p>
      </Layout>
    )
  }

  return (
    <Layout title="Anomalies">
      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
          {error}
        </p>
      )}

      {anomalies.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No anomalies detected</p>
          <p className="empty-state-body">
            No flagged transactions in your most recent 500 rows.
            Upload a statement to run anomaly detection.
          </p>
        </div>
      ) : (
        <>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-3)',
            marginBottom: 'var(--sp-4)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {anomalies.length} flagged transaction{anomalies.length !== 1 ? 's' : ''}
          </p>

          <div className="anomaly-list">
            {anomalies.map(tx => {
              const avg = catAvg[tx.category]
              const multiple = avg && avg > 0 ? tx.amount / avg : null

              return (
                <div key={tx.id} className="anomaly-card">
                  <p className="anomaly-merchant" title={tx.description}>
                    {tx.description}
                  </p>
                  <div className="anomaly-right">
                    <span className="anomaly-badge">Anomaly</span>
                    <p className="anomaly-amount">{fmtINR(tx.amount)}</p>
                  </div>
                  <p className="anomaly-meta">
                    {fmtDate(tx.date)}
                    {tx.category && ` · ${tx.category}`}
                  </p>
                  <p className="anomaly-why">
                    {multiple != null
                      ? `Unusually high for category · Category avg: ${fmtINR(Math.round(avg))} · This transaction is ${multiple.toFixed(1)}× above average`
                      : 'Flagged as unusually high relative to similar transactions'
                    }
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Layout>
  )
}
