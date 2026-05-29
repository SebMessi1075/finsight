import { Upload } from 'lucide-react'

export default function Topbar({ title, meta, onUpload }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        {meta && <span className="topbar-meta">{meta}</span>}
      </div>
      {onUpload && (
        <div className="topbar-right">
          <button className="btn-upload" onClick={onUpload}>
            <Upload size={14} />
            Upload CSV
          </button>
        </div>
      )}
    </header>
  )
}
