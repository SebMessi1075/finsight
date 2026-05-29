import { useState, useEffect, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import { fmtINR, fmtDate } from '../utils/fmt'
import '../styles/pages.css'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [sortCol,      setSortCol]      = useState('date')
  const [sortDir,      setSortDir]      = useState('desc')
  const [catFilter,    setCatFilter]    = useState('')
  const [anomalyOnly,  setAnomalyOnly]  = useState(false)

  useEffect(() => {
    api.getTransactions()
      .then(data => { setTransactions(data); setLoading(false) })
      .catch(err  => { setError(err.message); setLoading(false) })
  }, [])

  const categories = useMemo(() => {
    const s = new Set(transactions.map(t => t.category).filter(Boolean))
    return [...s].sort()
  }, [transactions])

  const filtered = useMemo(() => {
    let r = transactions
    if (catFilter)   r = r.filter(t => t.category === catFilter)
    if (anomalyOnly) r = r.filter(t => t.z_flagged)
    return r
  }, [transactions, catFilter, anomalyOnly])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortCol === 'date') {
        const d = new Date(a.date) - new Date(b.date)
        return sortDir === 'asc' ? d : -d
      }
      if (sortCol === 'amount') {
        return sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount
      }
      return 0
    })
  }, [filtered, sortCol, sortDir])

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ChevronsUpDown size={12} className="tx-sort-icon" />
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="tx-sort-icon tx-sort-icon--active" />
      : <ChevronDown size={12} className="tx-sort-icon tx-sort-icon--active" />
  }

  const countNote = transactions.length === 500
    ? `Showing ${sorted.length} of 500 — most recent 500`
    : `Showing ${sorted.length} of ${transactions.length}`

  return (
    <Layout title="Transactions">
      <div className="page-toolbar">
        <div className="page-toolbar-left">
          <select
            className="page-select"
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <label
            className={`page-toggle${anomalyOnly ? ' page-toggle--active' : ''}`}
            onClick={() => setAnomalyOnly(v => !v)}
          >
            <input type="checkbox" readOnly checked={anomalyOnly} />
            Anomalies only
          </label>
        </div>
        <span className="page-count">{loading ? 'Loading…' : countNote}</span>
      </div>

      {error && (
        <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)' }}>
          {error}
        </p>
      )}

      <div className="tx-wrap">
        <table className="tx-table">
          <thead>
            <tr>
              <th
                className="tx-th-sortable"
                onClick={() => toggleSort('date')}
              >
                Date <SortIcon col="date" />
              </th>
              <th>Description</th>
              <th>Category</th>
              <th
                className="tx-th-sortable tx-th-right"
                onClick={() => toggleSort('amount')}
              >
                Amount <SortIcon col="amount" />
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 'var(--sp-10)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>
                  No transactions match the current filters.
                </td>
              </tr>
            )}
            {sorted.map(tx => (
              <tr key={tx.id} className={tx.z_flagged ? 'tx-row--anomaly' : ''}>
                <td className="tx-cell-date">{fmtDate(tx.date)}</td>
                <td
                  className="tx-cell-desc"
                  title={tx.description}
                >
                  {tx.description}
                </td>
                <td>
                  {tx.category
                    ? <span className="tx-chip">{tx.category}</span>
                    : <span style={{ color: 'var(--color-text-3)' }}>—</span>
                  }
                </td>
                <td className={`tx-cell-amount${tx.type === 'Credit' ? ' tx-amount--credit' : ''}`}>
                  {fmtINR(tx.amount)}
                </td>
                <td className="tx-cell-status">
                  {tx.z_flagged && (
                    <span className="tx-anomaly-label">
                      <span className="tx-anomaly-dot" />
                      Anomaly
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
