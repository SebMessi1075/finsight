import { NavLink } from 'react-router-dom'
import { BarChart2, LayoutDashboard, List, AlertTriangle, Clock, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

const NAV = [
  { label: 'Overview',     icon: LayoutDashboard, path: '/dashboard'     },
  { label: 'Transactions', icon: List,            path: '/transactions'  },
  { label: 'Anomalies',    icon: AlertTriangle,   path: '/anomalies'     },
  { label: 'History',      icon: Clock,           path: '/history'       },
]

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-wordmark">
        <BarChart2 size={16} />
        <span className="sidebar-wordmark-text">FinSight</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ label, icon: Icon, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              'sidebar-nav-item' + (isActive ? ' active' : '')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initials(user?.name)}</div>
        <div className="sidebar-user-info">
          <p className="sidebar-user-name">{user?.name}</p>
          <p className="sidebar-user-email">{user?.email}</p>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
