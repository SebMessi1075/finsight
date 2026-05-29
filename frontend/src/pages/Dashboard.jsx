import { useState, useEffect, useRef } from 'react'
import { Upload, TrendingUp, TrendingDown, Wallet, ShieldAlert } from 'lucide-react'
import demoCSV from '../assets/demo.csv?raw'
import Layout from '../components/Layout'
import KpiCard from '../components/KpiCard'
import RiskScore from '../components/RiskScore'
import MonthlyTrend from '../components/MonthlyTrend'
import ExpenseChart from '../components/ExpenseChart'
import BudgetBar from '../components/BudgetBar'
import RecurringTable from '../components/RecurringTable'
import UploadHistory from '../components/UploadHistory'
import UploadModal from '../components/UploadModal'
import { api } from '../api/client'
import { fmtINR, fmtPct } from '../utils/fmt'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [analysis,    setAnalysis]    = useState(null)
  const [uploads,     setUploads]     = useState([])
  const [showUpload,  setShowUpload]  = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    api.getUploads().then(setUploads).catch(() => {})
  }, [])

  function openUpload(file = null) {
    setPendingFile(file)
    setShowUpload(true)
  }

  function handleSuccess(result) {
    setAnalysis(result)
    setShowUpload(false)
    setPendingFile(null)
    api.getUploads().then(setUploads).catch(() => {})
  }

  function handleModalClose() {
    setShowUpload(false)
    setPendingFile(null)
  }

  async function handleDemo() {
    setDemoLoading(true)
    try {
      const blob = new Blob([demoCSV], { type: 'text/csv' })
      const file = new File([blob], 'demo-statement.csv', { type: 'text/csv' })
      const result = await api.analyze(file)
      handleSuccess(result)
    } catch {
      setDemoLoading(false)
    }
  }

  return (
    <>
      <Layout
        title="Overview"
        meta={analysis?.date_range}
        onUpload={() => openUpload()}
      >
        {analysis
          ? <FilledDashboard analysis={analysis} onUpload={() => openUpload()} />
          : <EmptyDashboard  uploads={uploads}   onUpload={openUpload}
                             onDemo={handleDemo} demoLoading={demoLoading} />
        }
      </Layout>

      {showUpload && (
        <UploadModal
          onSuccess={handleSuccess}
          onClose={handleModalClose}
          initialFile={pendingFile}
        />
      )}
    </>
  )
}

// ── Hero empty state ──────────────────────────────────────────
function EmptyDashboard({ uploads, onUpload, onDemo, demoLoading }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function onDragOver(e) { e.preventDefault(); setDragging(true) }
  function onDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }
  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) onUpload(f)
  }

  return (
    <div className="dash-grid">

      {/* Positioning headline */}
      <div className="hero-headline">
        <h2 className="hero-headline-title">See where your money actually goes.</h2>
        <p className="hero-headline-sub">
          Upload a bank statement and get a full breakdown in seconds.
        </p>
      </div>

      <div className="hero-grid">

        {/* Left — drag-and-drop upload zone */}
        <div
          className={`hero-drop${dragging ? ' hero-drop--over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !demoLoading && inputRef.current?.click()}
        >
          <Upload size={32} className="hero-drop-icon" />
          <p className="hero-drop-title">Upload your bank statement</p>
          <p className="hero-drop-sub">
            Drag a CSV here, or click to browse.<br />
            Works with most Indian bank exports.
          </p>

          {demoLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: 'var(--sp-3)', color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />
              Analyzing demo data…
            </div>
          ) : (
            <div className="hero-drop-buttons">
              <button
                className="btn-upload"
                onClick={e => { e.stopPropagation(); onUpload() }}
              >
                Upload CSV
              </button>
              <button
                className="btn-ghost"
                onClick={e => { e.stopPropagation(); onDemo() }}
              >
                Try with demo data
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
          />
        </div>

        {/* Right — how it works (unchanged) */}
        <div className="hero-how">
          <p className="hero-how-title">How it works</p>
          <ol className="hero-steps">
            <li className="hero-step">
              <span className="hero-step-num">1</span>
              <div>
                <p className="hero-step-label">Upload your statement</p>
                <p className="hero-step-desc">CSV export from any Indian bank — SBI, HDFC, ICICI, Axis and more</p>
              </div>
            </li>
            <li className="hero-step">
              <span className="hero-step-num">2</span>
              <div>
                <p className="hero-step-label">We classify every transaction</p>
                <p className="hero-step-desc">9 categories via AI — Food, Shopping, Bills, Travel, and more</p>
              </div>
            </li>
            <li className="hero-step">
              <span className="hero-step-num">3</span>
              <div>
                <p className="hero-step-label">Get insights instantly</p>
                <p className="hero-step-desc">Spending breakdown, anomaly detection, risk score, and recurring charges</p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="col-12">
          <UploadHistory uploads={uploads} />
        </div>
      )}
    </div>
  )
}

// ── Filled dashboard ──────────────────────────────────────────
function FilledDashboard({ analysis, onUpload }) {
  const { kpis, risk, expense_by_category, monthly_trend, budget, recurring } = analysis

  return (
    <div className="dash-grid">

      {/* Row 1 — KPIs */}
      <div className="col-3">
        <KpiCard label="Income"   value={fmtINR(kpis.income)}
          sub={`${kpis.num_credits} credits`} icon={TrendingUp} />
      </div>
      <div className="col-3">
        <KpiCard label="Expenses" value={fmtINR(kpis.expenses)}
          sub={`${kpis.num_debits} transactions`} icon={TrendingDown} />
      </div>
      <div className="col-3">
        <KpiCard label="Savings"  value={fmtINR(kpis.savings)}
          sub={`${fmtPct(kpis.savings_pct)} of income`}
          variant={kpis.savings < 0 ? 'danger' : 'default'} icon={Wallet} />
      </div>
      <div className="col-3">
        <KpiCard label="Anomalies" value={String(kpis.anomaly_count)}
          sub={`${fmtPct(kpis.anomaly_pct)} of debits`}
          variant={kpis.anomaly_count > 0 ? 'danger' : 'default'} icon={ShieldAlert} />
      </div>

      {/* Row 2 — Trend + Risk */}
      <div className="col-8"><MonthlyTrend data={monthly_trend} /></div>
      <div className="col-4"><RiskScore risk={risk} /></div>

      {/* Row 3 — Expense chart */}
      <div className="col-12"><ExpenseChart data={expense_by_category} /></div>

      {/* Row 4 — Budget full width */}
      <div className="col-12"><BudgetBar budget={budget} /></div>

      {/* Row 5 — Recurring full width */}
      <div className="col-12"><RecurringTable recurring={recurring} /></div>

    </div>
  )
}
