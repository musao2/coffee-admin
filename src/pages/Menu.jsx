import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { rpc } from '../lib/useRpc'
import { num } from '../lib/format'
import {
  LuAlertCircle, LuArrowDown, LuArrowUp, LuClipboardList, LuCoffee, LuEye, LuEyeOff, LuFolderPlus, LuPencil, LuPlus, LuTrash2,
} from 'react-icons/lu'
import Modal from '../components/Modal'
import { PageHead } from './AdminPanel'

export default function Menu() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [filter, setFilter] = useState('Hammasi')
  const [edit, setEdit] = useState(null)
  const [editCat, setEditCat] = useState(null)
  const [error, setError] = useState('')

  const load = () => Promise.all([
    supabase.from('products').select('*').order('sort').order('name'),
    supabase.from('categories').select('*').order('sort').order('name'),
  ]).then(([p, c]) => {
    setItems(p.data || [])
    // jadval hali yaratilmagan bo'lsa (08 SQL ishga tushmagan) — mahsulotlardan olamiz
    if (c.error) setCats([...new Set((p.data || []).map((x) => x.category))].map((name, i) => ({ id: name, name, sort: i, is_active: true, virtual: true })))
    else setCats(c.data || [])
  })
  useEffect(() => { load() }, [])

  const count = useMemo(() => items.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {}), [items])
  const shown = filter === 'Hammasi' ? items : items.filter((p) => p.category === filter)
  const ordered = [...cats.map((c) => c.name), ...new Set(items.map((p) => p.category).filter((n) => !cats.some((c) => c.name === n)))]
  const groups = ordered.map((name) => [name, shown.filter((p) => p.category === name)]).filter(([, list]) => list.length)

  const move = async (i, d) => {
    const arr = [...cats]
    const j = i + d
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setCats(arr)
    try { await rpc('admin_sort_categories', { p_ids: arr.map((c) => c.id) }) } catch (e) { setError(e.message); load() }
  }
  const toggle = async (c) => {
    try { await rpc('admin_upsert_category', { p_id: c.id, p_name: c.name, p_sort: c.sort, p_active: !c.is_active }); load() } catch (e) { setError(e.message) }
  }
  const remove = async (c) => {
    if (!window.confirm(`“${c.name}” kategoriyasi o‘chirilsinmi?`)) return
    try { await rpc('admin_delete_category', { p_id: c.id }); if (filter === c.name) setFilter('Hammasi'); load() } catch (e) { setError(e.message) }
  }

  return (
    <div className="page">
      <PageHead title="Menyu" icon={LuClipboardList} sub="Kategoriyalar va mahsulotlar — kassada shu tartibda ko‘rinadi">
        <button className="btn btn-outline btn-sm" onClick={() => setEditCat({ name: '', is_active: true })}><LuFolderPlus size={16} /> Kategoriya</button>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit({ name: '', category: filter !== 'Hammasi' ? filter : cats[0]?.name || 'Kofe', price: '', sort: items.length + 1, is_active: true, is_stamp: true })}><LuPlus size={16} /> Mahsulot</button>
      </PageHead>
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}

      <section className="panel">
        <div className="panel-head">
          <h3>Kategoriyalar</h3>
          <span className="muted small">Kassadagi tugmalar tartibi</span>
        </div>
        <div className="panel-body">
          {cats.length === 0 && <p className="muted small" style={{ padding: '8px 0' }}>Hali kategoriya yo‘q — “Kategoriya” tugmasi bilan qo‘shing</p>}
          <ul className="mini-list">
            {cats.map((c, i) => (
              <li key={c.id} style={c.is_active ? null : { opacity: 0.55 }}>
                <div className="row" style={{ gap: 2 }}>
                  <button className="icon-btn sm" onClick={() => move(i, -1)} disabled={i === 0 || c.virtual} aria-label="Yuqoriga"><LuArrowUp size={15} /></button>
                  <button className="icon-btn sm" onClick={() => move(i, 1)} disabled={i === cats.length - 1 || c.virtual} aria-label="Pastga"><LuArrowDown size={15} /></button>
                </div>
                <div className="grow">
                  <b>{c.name} {!c.is_active && <span className="tag off">kassada ko‘rinmaydi</span>}</b>
                  <small>{count[c.name] || 0} ta mahsulot</small>
                </div>
                {!c.virtual && (
                  <div className="row" style={{ gap: 4 }}>
                    <button className="icon-btn sm" onClick={() => toggle(c)} title={c.is_active ? 'Kassada yashirish' : 'Kassada ko‘rsatish'} aria-label="Ko‘rinish">{c.is_active ? <LuEye size={15} /> : <LuEyeOff size={15} />}</button>
                    <button className="icon-btn sm" onClick={() => setEditCat(c)} aria-label="Nomini o‘zgartirish"><LuPencil size={15} /></button>
                    <button className="icon-btn sm" onClick={() => remove(c)} disabled={(count[c.name] || 0) > 0} title={(count[c.name] || 0) > 0 ? 'Avval mahsulotlarni boshqa kategoriyaga o‘tkazing' : 'O‘chirish'} aria-label="O‘chirish"><LuTrash2 size={15} /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {cats.some((c) => c.virtual) && <div className="alert warn" style={{ marginTop: 8 }}><LuAlertCircle size={18} />Kategoriyalarni boshqarish uchun Supabase’da 08_categories.sql ni ishga tushiring.</div>}
        </div>
      </section>

      <div className="chips">
        {['Hammasi', ...cats.map((c) => c.name)].map((c) => <button key={c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>{c}{c !== 'Hammasi' && ` · ${count[c] || 0}`}</button>)}
      </div>

      {groups.map(([c, list]) => (
        <section key={c}>
          <h3 className="section-title">{c}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nomi</th><th className="r">Narx</th><th>Kartochka</th><th>Tartib</th><th>Holat</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} onClick={() => setEdit(p)} className={`click ${p.is_active ? '' : 'dim'}`}>
                    <td className="primary" data-label="Nomi">{p.name}</td>
                    <td data-label="Narx" className="r num">{num(p.price)} so‘m</td>
                    <td data-label="Kartochka">{p.is_stamp ? <span className="tag spend"><LuCoffee size={12} /> shtamp beradi</span> : <span className="muted small">—</span>}</td>
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
      {items.length > 0 && groups.length === 0 && <div className="empty"><LuClipboardList size={32} />Bu kategoriyada mahsulot yo‘q</div>}

      {edit && <ProductModal p={edit} cats={cats} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load() }} />}
      {editCat && <CategoryModal c={editCat} onClose={() => setEditCat(null)} onDone={() => { setEditCat(null); load() }} />}
    </div>
  )
}

function CategoryModal({ c, onClose, onDone }) {
  const [name, setName] = useState(c.name || '')
  const [active, setActive] = useState(c.is_active !== false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { await rpc('admin_upsert_category', { p_id: c.id || null, p_name: name, p_sort: c.sort ?? null, p_active: active }); onDone() }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <Modal title={c.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Nomi</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Sovuq ichimliklar" autoFocus required /></label>
        {c.id && <p className="muted small">Nomi o‘zgarsa, shu kategoriyadagi barcha mahsulotlar ham yangi nomga o‘tadi.</p>}
        <label className="check"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Kassada ko‘rinadi</label>
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </form>
    </Modal>
  )
}

function ProductModal({ p, cats, onClose, onDone }) {
  const [f, setF] = useState({ ...p, price: String(p.price || '') })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const options = cats.some((c) => c.name === f.category) || !f.category ? cats.map((c) => c.name) : [f.category, ...cats.map((c) => c.name)]

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await rpc('admin_upsert_product', {
        p_id: f.id || null, p_name: f.name, p_category: f.category,
        p_price: parseInt(String(f.price).replace(/\D/g, '') || '0', 10), p_active: f.is_active, p_sort: parseInt(f.sort || 0, 10), p_stamp: !!f.is_stamp,
      })
      onDone()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal title={f.id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Nomi</span><input value={f.name} onChange={set('name')} required /></label>
        <label className="field"><span>Kategoriya</span>
          <select value={f.category} onChange={set('category')} required>
            {options.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="field"><span>Narx (so‘m)</span><input inputMode="numeric" value={f.price} onChange={set('price')} required /></label>
        <label className="field"><span>Tartib raqami (kategoriya ichida)</span><input type="number" value={f.sort} onChange={set('sort')} /></label>
        <label className="check"><input type="checkbox" checked={!!f.is_stamp} onChange={set('is_stamp')} /> Kofe kartochkasiga shtamp beradi (9 ta = 1 bepul)</label>
        <label className="check"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Sotuvda (kassada ko‘rinadi)</label>
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </form>
    </Modal>
  )
}
