import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { api } from '../api/client'
import { fmtDate } from '../utils/fmt'
import { FileText } from 'lucide-react'
import '../styles/pages.css'

export default function History() {
  const [uploads,  setUploads]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    api.getUploads()
      .then(data => { setUploads(data); setLoading(false) })
      .catch(()  => setLoading(false))
  }, [])

  const filtered = search
    ? uploads.filter(u =>
        (u.filename ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.date_range ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : uploads

  return (
    <Layout title="History">
      <input
        className="history-search"
        placeholder="Filter by filename or date range…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <p style={{ color: 'var(--color-text-3)', fontSize: 'var(--text-sm)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">
            {uploads.length === 0 ? 'No statements uploaded yet' : 'No results'}
          </p>
          <p className="empty-state-body">
            {uploads.length === 0
              ? 'Upload a CSV from the Overview page to get started.'
              : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="card-section-title">
            <span>Statement History</span>
            <span className="card-section-title-secondary">{filtered.length} upload{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="upload-list">
            {filtered.map(u => (
              <div key={u.id} className="upload-item">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)', minWidth: 0 }}>
                  <FileText size={14} style={{ color: 'var(--color-text-3)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <p className="upload-filename">{u.filename ?? 'Unnamed file'}</p>
                    <p className="upload-meta">
                      {u.date_range ?? '—'}
                      {u.total_rows != null && ` · ${u.total_rows} rows`}
                    </p>
                  </div>
                </div>
                <p className="upload-date">{fmtDate(u.uploaded_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
