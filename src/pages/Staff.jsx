import { useState } from 'react'
import { rpc, useRpc } from '../lib/useRpc'
import { createSignupClient } from '../lib/supabase'
import { errText } from '../lib/format'
import { useAuth } from '../lib/auth'
import { LuAlertCircle, LuCheck, LuEye, LuEyeOff, LuInfo, LuKeyRound, LuLock, LuPencil, LuRefreshCw, LuUnlock, LuUserCog, LuUserPlus } from 'react-icons/lu'
import Modal from '../components/Modal'
import { PageHead, useCafes } from './AdminPanel'

const ROLE = { cashier: 'Kassir', admin: 'Admin', customer: 'Mijoz' }

export default function Staff() {
  const { profile } = useAuth()
  const { data, error, reload } = useRpc('admin_staff', {}, [])
  const [cafes] = useCafes()
  const [edit, setEdit] = useState(null)
  const [create, setCreate] = useState(false)

  const toggle = async (s) => {
    if (!window.confirm(`${s.full_name || s.email} — ${s.is_active ? 'bloklansinmi' : 'faollashtirilsinmi'}?`)) return
    try { await rpc('admin_set_active', { p_user: s.id, p_active: !s.is_active }); reload() } catch (e) { window.alert(e.message) }
  }

  return (
    <div className="page">
      <PageHead title="Xodimlar" icon={LuUserCog} sub="Kassirlar va administratorlar">
        <button className="btn btn-primary btn-sm" onClick={() => setCreate(true)} disabled={!cafes.length}><LuUserPlus size={16} /> Kassir qo‘shish</button>
      </PageHead>
      {!cafes.length && <div className="alert warn"><LuAlertCircle size={18} />Avval “Kofexonalar” bo‘limida kofexona qo‘shing.</div>}
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Ism</th><th>Email (login)</th><th>Rol</th><th>Kofexona</th><th>Holat</th><th /></tr></thead>
          <tbody>
            {(data || []).map((s) => (
              <tr key={s.id} className={s.is_active ? '' : 'dim'}>
                <td className="primary" data-label="Ism">{s.full_name || '—'}{s.id === profile.id && <span className="sub">(siz)</span>}</td>
                <td data-label="Email">{s.email}</td>
                <td data-label="Rol"><span className={`tag ${s.role === 'admin' ? 'dark' : 'spend'}`}>{ROLE[s.role]}</span></td>
                <td data-label="Kofexona">{s.cafe_name || '—'}</td>
                <td data-label="Holat"><span className={`tag ${s.is_active ? 'on' : 'off'}`}>{s.is_active ? 'Faol' : 'Bloklangan'}</span></td>
                <td className="acts"><div>
                  <button className="btn btn-outline btn-sm" onClick={() => setEdit(s)}><LuPencil size={14} /> Tahrirlash</button>
                  {s.id !== profile.id && (
                    <button className="btn btn-outline btn-sm" onClick={() => toggle(s)}>{s.is_active ? <><LuLock size={14} /> Bloklash</> : <><LuUnlock size={14} /> Ochish</>}</button>
                  )}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {edit && <EditModal staff={edit} self={edit.id === profile.id} cafes={cafes} onClose={() => setEdit(null)} onDone={() => { setEdit(null); reload() }} />}
      {create && <CreateModal cafes={cafes} onClose={() => setCreate(false)} onDone={() => { setCreate(false); reload() }} />}
    </div>
  )
}

function EditModal({ staff, self, cafes, onClose, onDone }) {
  const [name, setName] = useState(staff.full_name || '')
  const [role, setRole] = useState(staff.role)
  const [cafe, setCafe] = useState(staff.cafe_id || cafes[0]?.id || '')
  const [email, setEmail] = useState(staff.email || '')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const emailChanged = email.trim().toLowerCase() !== (staff.email || '').toLowerCase()

  const submit = async (e) => {
    e.preventDefault()
    if (password && password.length < 6) return setError('Parol kamida 6 ta belgidan iborat bo‘lsin')
    setBusy(true); setError('')
    try {
      // 1) ism, rol, kofexona
      await rpc('admin_set_staff', { p_user: staff.id, p_role: self ? 'admin' : role, p_cafe: role === 'cashier' ? cafe : null, p_name: name })
      // 2) login (email) va parol — faqat o'zgargan bo'lsa
      if (emailChanged || password) {
        await rpc('admin_set_credentials', { p_user: staff.id, p_email: emailChanged ? email : null, p_password: password || null })
      }
      if (emailChanged || password) {
        setDone({ email: email.trim().toLowerCase(), password })
      } else onDone()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  const genPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const arr = new Uint32Array(10)
    crypto.getRandomValues(arr)
    setPassword(Array.from(arr, (n) => chars[n % chars.length]).join(''))
    setShowPass(true)
  }

  if (done) {
    return (
      <Modal title="Saqlandi" onClose={onDone}>
        <div className="form">
          <div className="alert ok"><LuCheck size={18} />Ma’lumotlar yangilandi.{done.password && ' Xodimning eski sessiyalari yopildi — u yangi parol bilan qayta kiradi.'}</div>
          <div className="card flat stack" style={{ gap: 8 }}>
            <div className="row"><span className="muted grow">Login (email)</span><b>{done.email}</b></div>
            {done.password && <div className="row"><span className="muted grow">Yangi parol</span><b className="num">{done.password}</b></div>}
          </div>
          {done.password && <p className="muted small">Parolni xodimga xavfsiz yo‘l bilan bering. Bu oyna yopilgach parol boshqa ko‘rsatilmaydi.</p>}
          <button className="btn btn-primary btn-lg btn-block" onClick={onDone}>Tayyor</button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={self ? 'Mening akkauntim' : 'Xodimni tahrirlash'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Ism</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>

        {!self && (
          <label className="field"><span>Rol</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="cashier">Kassir</option>
              <option value="admin">Admin</option>
              <option value="customer">Mijoz (xodimlikdan chiqarish)</option>
            </select>
          </label>
        )}
        {!self && role === 'cashier' && (
          <label className="field"><span>Kofexona</span>
            <select value={cafe} onChange={(e) => setCafe(e.target.value)}>
              {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}

        <div className="eyebrow row" style={{ marginTop: 4 }}><LuKeyRound size={14} /> Kirish ma’lumotlari</div>
        <label className="field"><span>Email (login)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
        </label>
        <label className="field"><span>Yangi parol <span className="muted">— o‘zgartirmaslik uchun bo‘sh qoldiring</span></span>
          <div className="row" style={{ gap: 8 }}>
            <input className="input grow" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="kamida 6 belgi" autoComplete="new-password" />
            <button type="button" className="icon-btn" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}>
              {showPass ? <LuEyeOff size={18} /> : <LuEye size={18} />}
            </button>
            <button type="button" className="icon-btn" onClick={genPassword} title="Parol yaratish" aria-label="Tasodifiy parol yaratish"><LuRefreshCw size={18} /></button>
          </div>
        </label>
        {(emailChanged || password) && (
          <div className="alert warn"><LuInfo size={18} />
            {password ? 'Parol o‘zgarsa, xodim barcha qurilmalardan chiqariladi va yangi parol bilan kiradi.' : 'Xodim endi yangi email bilan kiradi.'}
          </div>
        )}
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Saqlanmoqda…' : 'Saqlash'}</button>
      </form>
    </Modal>
  )
}

function CreateModal({ cafes, onClose, onDone }) {
  const [f, setF] = useState({ name: '', email: '', password: '', cafe: cafes[0]?.id || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (f.password.length < 6) return setError('Parol kamida 6 ta belgi')
    setBusy(true); setError('')
    try {
      // Alohida klient: adminning o'z sessiyasi o'zgarmaydi
      const { data, error } = await createSignupClient().auth.signUp({
        email: f.email.trim(), password: f.password, options: { data: { full_name: f.name.trim() } },
      })
      if (error) throw new Error(errText(error))
      if (!data.user?.id || data.user.identities?.length === 0) throw new Error('Bu email allaqachon ro‘yxatdan o‘tgan')
      await rpc('admin_set_staff', { p_user: data.user.id, p_role: 'cashier', p_cafe: f.cafe, p_name: f.name })
      onDone()
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <Modal title="Yangi kassir" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Ism</span><input value={f.name} onChange={set('name')} placeholder="Kassir 1" required /></label>
        <label className="field"><span>Email (login)</span><input type="email" value={f.email} onChange={set('email')} placeholder="kassir2@coffeegram.uz" required autoComplete="off" /></label>
        <label className="field"><span>Parol</span><input type="text" value={f.password} onChange={set('password')} placeholder="kamida 6 belgi" required autoComplete="new-password" /></label>
        <label className="field"><span>Kofexona</span>
          <select value={f.cafe} onChange={set('cafe')}>
            {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <p className="muted small">Login va parolni kassirga bering. U Kassa ilovasidan (coffee-kassa) kiradi.</p>
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Yaratilmoqda…' : 'Kassir yaratish'}</button>
      </form>
    </Modal>
  )
}
