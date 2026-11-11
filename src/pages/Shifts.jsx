import { useState } from 'react'
import { LuAlertCircle, LuClock, LuLock, LuStore, LuTrendingDown, LuTrendingUp, LuUnlock } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { dateTime, num, som } from '../lib/format'
import Stat from '../components/Stat'
import { PageHead, Period, useCafes } from './AdminPanel'

const hm = (iso) => (iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '')
const dur = (a, b) => { const m = Math.max(0, Math.round(((b ? new Date(b) : new Date()) - new Date(a)) / 60000)); return m < 60 ? `${m} daq` : `${Math.floor(m / 60)} soat ${m % 60} daq` }

// Admin: barcha kassalarning smenalari — kim ochdi/yopdi, tushum, naqd pul farqi
export default function Shifts() {
  const [days, setDays] = useState(7)
  const [cafe, setCafe] = useState('')
  const [cafes] = useCafes()
  const { data, error, loading } = useRpc('admin_shifts', { p_days: days, p_cafe: cafe || null }, [days, cafe])
  const list = data || []
  const open = list.filter((s) => s.is_open)
  const closed = list.filter((s) => !s.is_open)
  const paid = list.reduce((a, s) => a + Number(s.paid), 0)
  const shortage = closed.reduce((a, s) => a + Math.min(0, Number(s.totals?.difference || 0)), 0)
  const extra = closed.reduce((a, s) => a + Math.max(0, Number(s.totals?.difference || 0)), 0)

  return (
    <div className="page">
      <PageHead title="Smenalar" icon={LuClock} sub="Kassirlar smenani ochib-yopadi: tushum, xarajat va kassadagi naqd pul farqi" />
      <div className="row wrap" style={{ gap: 10 }}>
        <Period value={days} onChange={setDays} options={[[1, 'Bugun'], [7, '7 kun'], [30, '30 kun'], [90, '3 oy']]} />
        {cafes.length > 1 && (
          <select className="select" value={cafe} onChange={(e) => setCafe(e.target.value)}>
            <option value="">Barcha kofexonalar</option>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      {error && <div className="alert err"><LuAlertCircle size={18} />{/function|schema cache/i.test(error) ? 'Supabase’da 14_shifts.sql ishga tushirilmagan' : error}</div>}

      <div className="stats">
        <Stat icon={LuUnlock} label="Hozir ochiq smenalar" value={data ? open.length : '…'} hint={open.map((s) => s.cafe_name).join(', ')} />
        <Stat icon={LuLock} label="Yopilgan smenalar" value={data ? closed.length : '…'} />
        <Stat icon={LuTrendingUp} label="Smenalar tushumi" value={data ? som(paid) : '…'} dark />
        <Stat icon={LuTrendingDown} label="Kamomad (jami)" value={data ? som(-shortage) : '…'} hint={extra ? `Ortiqcha: ${som(extra)}` : ''} />
      </div>

      {loading && !data && <div className="skeleton"><div /><div /></div>}
      {data && list.length === 0 && <div className="empty"><LuClock size={32} />Bu davrda smena ochilmagan</div>}
      {list.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Smena</th><th>Kofexona</th><th>Vaqt</th><th>Kassir</th><th className="r">Cheklar</th><th className="r">Tushum</th><th className="r">Xarajat</th><th className="r">Kutilgan naqd</th><th className="r">Sanalgan</th><th className="r">Farq</th></tr></thead>
            <tbody>
              {list.map((s) => {
                const diff = s.totals?.difference
                const expected = s.totals?.expected_cash ?? s.opening_cash + s.paid - s.expenses
                return (
                  <tr key={s.id}>
                    <td className="primary" data-label="Smena">№{s.shift_no} {s.is_open ? <span className="tag on">ochiq</span> : null}</td>
                    <td data-label="Kofexona"><span className="row" style={{ gap: 6 }}><LuStore size={14} />{s.cafe_name}</span></td>
                    <td data-label="Vaqt">{dateTime(s.opened_at)} – {s.closed_at ? hm(s.closed_at) : 'hozir'}<span className="sub">{dur(s.opened_at, s.closed_at)}</span></td>
                    <td data-label="Kassir">{s.opened_by_name}{s.closed_by_name && s.closed_by_name !== s.opened_by_name && <span className="sub">yopgan: {s.closed_by_name}</span>}</td>
                    <td data-label="Cheklar" className="r num">{num(s.count)}</td>
                    <td data-label="Tushum" className="r num"><b>{num(s.paid)}</b></td>
                    <td data-label="Xarajat" className="r num">{s.expenses ? `−${num(s.expenses)}` : '0'}</td>
                    <td data-label="Kutilgan naqd" className="r num">{num(expected)}<span className="sub">boshida {num(s.opening_cash)}</span></td>
                    <td data-label="Sanalgan" className="r num">{s.closing_cash != null ? num(s.closing_cash) : '—'}</td>
                    <td data-label="Farq" className="r num">
                      {diff == null ? '—' : diff === 0 ? <span className="tag on">to‘g‘ri</span> : <span className={`tag ${diff < 0 ? 'off' : 'amber'}`}>{diff > 0 ? '+' : ''}{num(diff)}</span>}
                      {s.note && <span className="sub">{s.note}</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
