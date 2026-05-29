import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Upload, FileText, XCircle } from 'lucide-react'
import { api } from '../api/client'
import '../styles/upload.css'

function fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

// onSuccess(analysisResult) — called when upload completes
// onClose() — called when user dismisses
export default function UploadModal({ onSuccess, onClose, initialFile = null }) {
  const [dragging, setDragging] = useState(false)
  const [file,     setFile]     = useState(initialFile)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const inputRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !loading) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [loading, onClose])

  function pickFile(f) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Only CSV files are accepted.')
      return
    }
    setError('')
    setFile(f)
  }

  // ── Drag handlers ──
  function onDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    pickFile(e.dataTransfer.files?.[0])
  }

  // ── Upload ──
  const handleAnalyze = useCallback(async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const result = await api.analyze(file)
      onSuccess(result)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [file, onSuccess])

  function handleBackdrop(e) {
    if (e.target === e.currentTarget && !loading) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">Upload Statement</h2>
          {!loading && (
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading ? (
            <div className="upload-loading">
              <div className="spinner" />
              <p className="upload-loading-title">Analyzing your statement…</p>
              <p className="upload-loading-sub">
                Classifying transactions and detecting anomalies
              </p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                className={`drop-zone${dragging ? ' drop-zone--over' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
              >
                <Upload size={24} className="drop-icon" />
                <p className="drop-primary">Drop CSV here or click to browse</p>
                <p className="drop-secondary">
                  Supports most bank export formats — Date, Description, Amount columns
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={e => pickFile(e.target.files?.[0])}
                />
              </div>

              {/* Selected file */}
              {file && (
                <div className="file-pill">
                  <FileText size={16} className="file-pill-icon" />
                  <span className="file-pill-name">{file.name}</span>
                  <span className="file-pill-size">{fmtSize(file.size)}</span>
                  <button
                    className="file-pill-remove"
                    onClick={() => { setFile(null); setError('') }}
                    aria-label="Remove file"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              {/* Error */}
              {error && <p className="upload-error">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={!file}
            >
              Analyze
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
