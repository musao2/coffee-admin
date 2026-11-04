import { useState } from 'react'
import { LuAlertCircle, LuMapPin, LuPencil, LuPlus, LuStore } from 'react-icons/lu'
import { rpc } from '../lib/useRpc'
import Modal from '../components/Modal'
import { PageHead, useCafes } from './AdminPanel'

export default function Cafes() {
  const [cafes, reload] = useCafes()
  const [edit, setEdit] = useState(null)
  return (
    <div className="page">
      <PageHead title="Kofexonalar" icon={LuStore} sub="Filiallar va ularning cashback foizi">
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({ name: '', address: '', cashback_percent: 5, is_active: true })}><LuPlus size={16} /> Kofexona qo‘shish</button>
      </PageHead>
      <div className="cards">
        {cafes.map((c) => (
          <div key={c.id} className={`cafe-card ${c.is_active ? '' : 'off'}`}>
            <div className="cafe-pct">{Number(c.cashback_percent)}%</div>
            <h3>{c.name}</h3>
            <p className="muted row" style={{ gap: 6 }}><LuMapPin size={14} />{c.address || 'Manzil kiritilmagan'}</p>
            <div className="cafe-foot">
              <span className={`tag ${c.is_active ? 'on' : 'off'}`}>{c.is_active ? 'Faol' : 'O‘chirilgan'}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setEdit(c)}><LuPencil size={14} /> Tahrirlash</button>
            </div>
          </div>
        ))}
      </div>
      {cafes.length === 0 && <div className="empty"><LuStore size={32} />Hali kofexona yo‘q</div>}
      {edit && <CafeModal cafe={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); reload() }} />}
    </div>
  )
}

function CafeModal({ cafe, onClose, onDone }) {
  const [f, setF] = useState({ ...cafe, cashback_percent: Number(cafe.cashback_percent) })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await rpc('admin_upsert_cafe', { p_id: f.id || null, p_name: f.name, p_address: f.address || '', p_percent: Number(f.cashback_percent), p_active: f.is_active })
      onDone()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={f.id ? 'Kofexonani tahrirlash' : 'Yangi kofexona'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Nomi</span><input value={f.name} onChange={set('name')} placeholder="Coffeegram — Chilonzor" required /></label>
        <label className="field"><span>Manzil</span><input value={f.address || ''} onChange={set('address')} /></label>
        <label className="field"><span>Cashback foizi (%)</span><input type="number" min="0" max="50" step="0.5" value={f.cashback_percent} onChange={set('cashback_percent')} required /></label>
        <label className="check"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Faol (o‘chirilsa kassa QR yarata olmaydi)</label>
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </form>
    </Modal>
  )
}
