import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { rpc } from '../lib/useRpc'
import { num } from '../lib/format'
import { LuAlertCircle, LuClipboardList, LuPlus } from 'react-icons/lu'
import Modal from '../components/Modal'
import { PageHead } from './AdminPanel'

export default function Menu() {
  const [items, setItems] = useState([])
  const [edit, setEdit] = useState(null)
  const load = () => supabase.from('products').select('*').order('sort').order('name').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const groups = items.reduce((g, p) => ((g[p.category] ||= []).push(p), g), {})
  const cats = Object.keys(groups)

  return (
    <div className="page">
      <PageHead title="Menyu" icon={LuClipboardList} sub="Kassada tanlanadigan mahsulotlar va narxlar (barcha kofexonalar uchun)">
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({ name: '', category: cats[0] || 'Kofe', price: '', sort: items.length + 1, is_active: true })}><LuPlus size={16} /> Mahsulot</button>
      </PageHead>
      {cats.map((c) => (
        <section key={c}>
          <h3 className="section-title">{c}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nomi</th><th className="r">Narx</th><th>Tartib</th><th>Holat</th></tr></thead>
              <tbody>
                {groups[c].map((p) => (
                  <tr key={p.id} onClick={() => setEdit(p)} className={`click ${p.is_active ? '' : 'dim'}`}>
                    <td className="primary" data-label="Nomi">{p.name}</td>
                    <td data-label="Narx" className="r num">{num(p.price)} so‘m</td>
                    <td data-label="Tartib">{p.sort}</td>
                    <td data-label="Holat"><span className={`tag ${p.is_active ? 'on' : 'off'}`}>{p.is_active ? 'Sotuvda' : 'Yashirilgan'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {items.length === 0 && <div className="empty"><LuClipboardList size={32} />Menyu bo‘sh</div>}
      {edit && <ProductModal p={edit} cats={cats} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load() }} />}
    </div>
  )
}

function ProductModal({ p, cats, onClose, onDone }) {
  const [f, setF] = useState({ ...p, price: String(p.price || '') })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await rpc('admin_upsert_product', {
        p_id: f.id || null, p_name: f.name, p_category: f.category,
        p_price: parseInt(String(f.price).replace(/\D/g, '') || '0', 10), p_active: f.is_active, p_sort: parseInt(f.sort || 0, 10),
      })
      onDone()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={f.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Nomi</span><input value={f.name} onChange={set('name')} required /></label>
        <label className="field"><span>Kategoriya</span>
          <input list="cats" value={f.category} onChange={set('category')} required />
          <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="field"><span>Narx (so‘m)</span><input inputMode="numeric" value={f.price} onChange={set('price')} required /></label>
        <label className="field"><span>Tartib raqami</span><input type="number" value={f.sort} onChange={set('sort')} /></label>
        <label className="check"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Sotuvda (kassada ko‘rinadi)</label>
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </form>
    </Modal>
  )
}
