import { useEffect, useState } from 'react'
import {
  LuActivity, LuClipboardList, LuCoffee, LuLayoutDashboard, LuLogOut, LuReceipt, LuStore, LuUserCog, LuUsers,
} from 'react-icons/lu'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Brand, Mark } from '../components/Logo'
import Live from './Live'
import Dashboard from './Dashboard'
import Transactions from './Transactions'
import Customers from './Customers'
import Cafes from './Cafes'
import Staff from './Staff'
import Menu from './Menu'

export const TABS = [
  ['live', LuActivity, 'Jonli'],
  ['tx', LuReceipt, 'Cheklar'],
  ['customers', LuUsers, 'Mijozlar'],
  ['dashboard', LuLayoutDashboard, 'Hisobot'],
  ['cafes', LuStore, 'Kofexonalar'],
  ['staff', LuUserCog, 'Xodimlar'],
  ['menu', LuClipboardList, 'Menyu'],
]

export function useCafes() {
  const [cafes, setCafes] = useState([])
  const load = () => supabase.from('cafes').select('*').order('name').then(({ data }) => setCafes(data || []))
  useEffect(() => { load() }, [])
  return [cafes, load]
}

export default function AdminPanel() {
  const { profile, signOut } = useAuth()
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem('cg-admin-tab') || 'live' } catch { return 'live' }
  })
  const go = (t) => {
    setTab(t)
    window.scrollTo({ top: 0 })
    try { localStorage.setItem('cg-admin-tab', t) } catch {}
  }
  const current = TABS.find((t) => t[0] === tab) || TABS[0]

  return (
    <div className="admin">
      <aside className="admin-side">
        <Brand light size={34} sub="Admin" />
        <nav>
          {TABS.map(([id, Icon, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
              <Icon size={19} />{label}{id === 'live' && <span className="live-dot" />}
            </button>
          ))}
        </nav>
        <div className="admin-me">
          <small>Administrator</small>
          <b>{profile.full_name || profile.email}</b>
          <button className="btn btn-light btn-sm" onClick={signOut}><LuLogOut size={15} /> Chiqish</button>
        </div>
      </aside>

      <header className="admin-mtop">
        <Mark size={30} light />
        <h1>{current[2]}</h1>
        <button className="icon-btn dark" onClick={signOut} aria-label="Chiqish"><LuLogOut size={18} /></button>
      </header>

      <main className="admin-main">
        {tab === 'live' && <Live onOpenTab={go} />}
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'tx' && <Transactions />}
        {tab === 'customers' && <Customers />}
        {tab === 'cafes' && <Cafes />}
        {tab === 'staff' && <Staff />}
        {tab === 'menu' && <Menu />}
      </main>

      <nav className="admin-bnav">
        {TABS.map(([id, Icon, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}><Icon size={21} />{label}</button>
        ))}
      </nav>
    </div>
  )
}

export function Period({ value, onChange, options = [[1, 'Bugun'], [7, '7 kun'], [30, '30 kun'], [365, 'Yil']] }) {
  return (
    <div className="seg">
      {options.map(([d, l]) => <button key={d} className={value === d ? 'on' : ''} onClick={() => onChange(d)}>{l}</button>)}
    </div>
  )
}

export function PageHead({ title, sub, icon: Icon, children }) {
  return (
    <div className="page-head">
      <div>
        <h2>{Icon && <Icon size={26} />}{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  )
}
