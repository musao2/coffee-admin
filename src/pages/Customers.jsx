import { useState } from 'react'
import { LuAlertCircle, LuLock, LuMinus, LuPlus, LuSearch, LuSlidersHorizontal, LuUnlock, LuUsers } from 'react-icons/lu'
import { rpc, useRpc } from '../lib/useRpc'
import { dateTime, num, som } from '../lib/format'
import Modal from '../components/Modal'
import { PageHead } from './AdminPanel'

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
      <PageHead title="Mijozlar" icon={LuUsers} sub={data ? `${data.length} ta mijoz` : ''} />
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
            <thead><tr><th>Mijoz</th><th>Telefon</th><th className="r">Balans</th><th className="r">Xaridlar</th><th className="r">Jami cashback</th><th>Oxirgi faollik</th><th>Holat</th><th /></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className={c.is_active ? '' : 'dim'}>
                  <td className="primary" data-label="Mijoz">{c.full_name || '—'}<span className="sub">{dateTime(c.created_at)} dan</span></td>
                  <td data-label="Telefon">{c.phone}</td>
                  <td data-label="Balans" className="r num"><b>{num(c.balance)}</b></td>
                  <td data-label="Xaridlar" className="r num">{num(c.tx_count)}</td>
                  <td data-label="Jami cashback" className="r num pos">{num(c.earned)}</td>
                  <td data-label="Oxirgi faollik">{c.last_at ? dateTime(c.last_at) : '—'}</td>
                  <td data-label="Holat"><span className={`tag ${c.is_active ? 'on' : 'off'}`}>{c.is_active ? 'Faol' : 'Bloklangan'}</span></td>
                  <td className="acts"><div>
                    <button className="btn btn-outline btn-sm" onClick={() => setAdjust(c)}><LuSlidersHorizontal size={14} /> Balans</button>
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
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const n = parseInt(amount.replace(/\D/g, '') || '0', 10)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await rpc('admin_adjust_balance', { p_user: customer.id, p_delta: sign * n, p_note: note }); onDone() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="Balansni tuzatish" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="muted">{customer.full_name} · {customer.phone}<br />Hozirgi balans: <b>{som(customer.balance)}</b></p>
        <div className="seg">
          <button type="button" className={sign === 1 ? 'on' : ''} onClick={() => setSign(1)}><LuPlus size={16} /> Qo‘shish</button>
          <button type="button" className={sign === -1 ? 'on' : ''} onClick={() => setSign(-1)}><LuMinus size={16} /> Ayirish</button>
        </div>
        <label className="field"><span>Summa (so‘m)</span><input inputMode="numeric" value={amount ? num(n) : ''} onChange={(e) => setAmount(e.target.value)} placeholder="10 000" required /></label>
        <label className="field"><span>Sabab (majburiy, chekda va jurnalda ko‘rinadi)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: aksiya bonusi" required /></label>
        {n > 0 && <div className="alert">Yangi balans: <b>&nbsp;{som(customer.balance + sign * n)}</b></div>}
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy || !n}>{busy ? 'Saqlanmoqda…' : 'Tasdiqlash'}</button>
      </form>
    </Modal>
  )
}
