import Sidebar from './Sidebar'
import Topbar from './Topbar'
import '../styles/layout.css'

export default function Layout({ title, meta, onUpload, children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-body">
        <Topbar title={title} meta={meta} onUpload={onUpload} />
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  )
}
