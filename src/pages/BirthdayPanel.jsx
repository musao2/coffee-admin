import { useState } from 'react'
import { LuCake, LuPhone } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { num } from '../lib/format'

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
export const birthText = (s) => { const [y, m, d] = s.split('-'); return `${Number(d)}-${MONTHS[Number(m) - 1]}, ${y}` }
const dayMonth = (s) => { const [, m, d] = s.split('-'); return `${Number(d)}-${MONTHS[Number(m) - 1]}` }
export const bdayIn = (n) => (n == null ? '' : n === 0 ? 'Bugun!' : n === 1 ? 'Ertaga' : `${n} kundan keyin`)

const RANGES = [[7, '7 kun'], [30, '30 kun'], [90, '3 oy']]

// Admin: bugungi va yaqin tug'ilgan kunlar (Jonli va Mijozlar sahifalarida)
export default function BirthdayPanel({ onOpenTab, limit = 8 }) {
  const [days, setDays] = useState(7)
  const [all, setAll] = useState(false)
  const { data, error } = useRpc('admin_birthdays', { p_days: days }, [days])
  const list = data?.list || []
  const today = list.filter((c) => c.bday_in === 0)
  const shown = all ? list : list.slice(0, limit)

  return (
    <section className="panel bday-panel">
      <div className="panel-head">
        <h3><LuCake size={18} /> Tug‘ilgan kunlar</h3>
        {today.length > 0 ? <span className="tag amber">Bugun: {today.length}</span> : onOpenTab && <button className="link small" onClick={() => onOpenTab('customers')}>Mijozlar</button>}
      </div>
      <div className="chips">
        {RANGES.map(([d, l]) => <button key={d} className={days === d ? 'on' : ''} onClick={() => { setDays(d); setAll(false) }}>{l}</button>)}
      </div>
      <div className="panel-body">
        {error && <p className="muted small" style={{ padding: '8px 0' }}>{/function|schema cache/i.test(error) ? 'Supabase’da 12_birth_date.sql ishga tushirilmagan' : error}</p>}
        {!data && !error && <div className="skeleton"><div /><div /></div>}
        {data && list.length === 0 && <p className="muted small" style={{ padding: '8px 0' }}>Keyingi {days} kunda tug‘ilgan kun yo‘q</p>}
        <ul className="mini-list">
          {shown.map((c) => (
            <li key={c.id} className={c.bday_in === 0 ? 'bday-today' : ''}>
              <span className={`bday-date ${c.bday_in === 0 ? 'on' : ''}`}>
                <b>{Number(c.birth_date.slice(8, 10))}</b>
                <small>{MONTHS[Number(c.birth_date.slice(5, 7)) - 1].slice(0, 3)}</small>
              </span>
              <div className="grow">
                <b>{c.full_name || 'Ismsiz'} · {c.turns} yosh</b>
                <small>
                  {c.bday_in === 0 ? '🎂 Bugun tug‘ilgan kuni' : `${dayMonth(c.birth_date)} · ${bdayIn(c.bday_in)}`}
                  {' · '}{num(c.coffees_total)} kofe
                </small>
              </div>
              {c.phone && <a className="icon-btn sm" href={`tel:${c.phone}`} title={`Qo‘ng‘iroq: ${c.phone}`} aria-label="Qo‘ng‘iroq qilish"><LuPhone size={15} /></a>}
            </li>
          ))}
        </ul>
        {list.length > limit && <button className="link small" onClick={() => setAll((x) => !x)}>{all ? 'Yig‘ish' : `Yana ${list.length - limit} ta`}</button>}
        {data?.without_date > 0 && <p className="muted small" style={{ marginTop: 8 }}>{num(data.without_date)} mijoz tug‘ilgan kunini hali kiritmagan</p>}
      </div>
    </section>
  )
}
