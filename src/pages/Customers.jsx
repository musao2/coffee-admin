import { useState } from 'react'
import { LuAlertCircle, LuCoffee, LuGift, LuLock, LuMinus, LuPlus, LuSearch, LuStar, LuUnlock, LuUsers } from 'react-icons/lu'
import { rpc, useRpc } from '../lib/useRpc'
import { dateTime, num } from '../lib/format'
import Modal from '../components/Modal'
import StampCard from '../components/StampCard'
import { PageHead } from './AdminPanel'

const GOAL = 9

export default function Customers() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [adjust, setAdjust] = useState(null)
  const { data, error, loading, reload } = useRpc('admin_customers', { p_search: search || null, p_limit: 300 }, [search])

  const toggle = async (c) => {
    if (!window.confirm(`${c.full_name || c.phone} — ${c.is_active ? 'bloklansinmi' : 'faollashtirilsinmi'}?`)) return
    try { await rpc('admin_set_active', { p_user: c.id, p_active: !c.is_active }); reload() } catch (e) { window.alert(e.message) }
  }

  return (
    <div className="page">
      <PageHead title="Mijozlar" icon={LuUsers} sub={data ? `${data.length} ta mijoz · kofe kartochkalari` : ''} />
      <form onSubmit={(e) => { e.preventDefault(); setSearch(q) }} className="search">
        <LuSearch size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Telefon yoki ism bo‘yicha qidirish" />
      </form>
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
      {loading && !data && <div className="skeleton"><div /><div /></div>}
      {data?.length === 0 && <div className="empty"><LuUsers size={32} />Mijozlar topilmadi</div>}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mijoz</th><th>Telefon</th><th>Kartochka</th><th className="r">Bepul</th><th className="r">Jami kofe</th><th>Sevimli</th><th>Oxirgi tashrif</th><th>Holat</th><th /></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className={c.is_active ? '' : 'dim'}>
                  <td className="primary" data-label="Mijoz">{c.full_name || '—'}<span className="sub">{dateTime(c.created_at)} dan</span></td>
                  <td data-label="Telefon">{c.phone}</td>
                  <td data-label="Kartochka">
                    <span className="mini-stamps" title={`${c.stamps}/${GOAL}`}>
                      {Array.from({ length: GOAL }, (_, i) => <i key={i} className={i < c.stamps ? 'on' : ''} />)}
                      <b className="num">{c.stamps}/{GOAL}</b>
                    </span>
                  </td>
                  <td data-label="Bepul" className="r num">{c.free_available > 0 ? <span className="tag amber"><LuGift size={12} /> {c.free_available}</span> : '0'}</td>
                  <td data-label="Jami kofe" className="r num">{num(c.coffees_total)}{c.free_total > 0 && <span className="sub">{c.free_total} bepul</span>}</td>
                  <td data-label="Sevimli">{c.favorite || '—'}</td>
                  <td data-label="Oxirgi tashrif">{c.last_at ? dateTime(c.last_at) : '—'}</td>
                  <td data-label="Holat"><span className={`tag ${c.is_active ? 'on' : 'off'}`}>{c.is_active ? 'Faol' : 'Bloklangan'}</span></td>
                  <td className="acts"><div>
                    <button className="btn btn-outline btn-sm" onClick={() => setAdjust(c)}><LuStar size={14} /> Shtamp</button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggle(c)}>{c.is_active ? <><LuLock size={14} /> Bloklash</> : <><LuUnlock size={14} /> Ochish</>}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {adjust && <AdjustModal customer={adjust} onClose={() => setAdjust(null)} onDone={() => { setAdjust(null); reload() }} />}
    </div>
  )
}

function AdjustModal({ customer, onClose, onDone }) {
  const [sign, setSign] = useState(1)
  const [n, setN] = useState(1)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const total = customer.free_available * GOAL + customer.stamps + sign * n
  const after = total >= 0 ? { stamps: total % GOAL, free: Math.floor(total / GOAL) } : null

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await rpc('admin_adjust_stamps', { p_user: customer.id, p_delta: sign * n, p_note: note }); onDone() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="Kartochkani tuzatish" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="muted">{customer.full_name} · {customer.phone}</p>
        <StampCard compact stamps={customer.stamps} free={customer.free_available} goal={GOAL} title="Hozir" />
        <div className="seg">
          <button type="button" className={sign === 1 ? 'on' : ''} onClick={() => setSign(1)}><LuPlus size={16} /> Qo‘shish</button>
          <button type="button" className={sign === -1 ? 'on' : ''} onClick={() => setSign(-1)}><LuMinus size={16} /> Ayirish</button>
        </div>
        <label className="field"><span>Shtamplar soni ({GOAL} shtamp = 1 bepul kofe)</span>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="icon-btn" onClick={() => setN((x) => Math.max(1, x - 1))} aria-label="Kamaytirish"><LuMinus size={18} /></button>
            <input className="input grow center" inputMode="numeric" value={n} onChange={(e) => setN(Math.max(1, Math.min(500, parseInt(e.target.value.replace(/\D/g, '') || '1', 10))))} />
            <button type="button" className="icon-btn" onClick={() => setN((x) => Math.min(500, x + 1))} aria-label="Ko‘paytirish"><LuPlus size={18} /></button>
          </div>
        </label>
        <label className="field"><span>Sabab (majburiy, jurnalda ko‘rinadi)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: aksiya, xato tuzatish" required /></label>
        {after ? (
          <div className="alert"><LuCoffee size={18} />Keyin: <b>&nbsp;{after.stamps}/{GOAL} shtamp</b>{after.free > 0 && <>, <b>&nbsp;{after.free} ta bepul kofe</b></>}</div>
        ) : <div className="alert err"><LuAlertCircle size={18} />Mijozda buncha shtamp yo‘q</div>}
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy || !after}>{busy ? 'Saqlanmoqda…' : 'Tasdiqlash'}</button>
      </form>
    </Modal>
  )
}
