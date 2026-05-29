import { FileText } from 'lucide-react'
import { fmtDate } from '../utils/fmt'

// uploads: UploadOut[]
export default function UploadHistory({ uploads }) {
  return (
    <div className="card">
      <div className="card-section-title"><span>Statement History</span></div>
      {uploads.length === 0 ? (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-3)' }}>
          No past uploads.
        </p>
      ) : (
        <div className="upload-list">
          {uploads.map(u => (
            <div key={u.id} className="upload-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-2)', minWidth: 0 }}>
                <FileText
                  size={14}
                  style={{ color: 'var(--color-text-3)', flexShrink: 0, marginTop: 2 }}
                />
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
      )}
    </div>
  )
}
