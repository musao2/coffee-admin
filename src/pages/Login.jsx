import { useState } from 'react'
import { LuActivity, LuAlertCircle, LuArrowRight, LuReceipt, LuStore, LuUsers } from 'react-icons/lu'
import { supabase } from '../lib/supabase'
import { errText } from '../lib/format'
import { Mark } from '../components/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    setBusy(false)
    if (error) setError(errText(error))
  }

  return (
    <div className="auth">
      <div className="auth-hero">
        <div className="rays" aria-hidden="true" />
        <span className="badge">ADMIN</span>
        <Mark size={110} light className="mark" />
        <h1>Coffeegram</h1>
        <p>Boshqaruv markazi: tarmoqdagi hamma narsa bir joyda</p>
        <div className="row wrap" style={{ justifyContent: 'center', gap: 16, color: 'rgba(244,238,228,.7)', fontSize: 13 }}>
          <span className="row" style={{ gap: 6 }}><LuActivity size={16} /> Jonli kuzatuv</span>
          <span className="row" style={{ gap: 6 }}><LuReceipt size={16} /> Cheklar</span>
          <span className="row" style={{ gap: 6 }}><LuUsers size={16} /> Mijozlar</span>
          <span className="row" style={{ gap: 6 }}><LuStore size={16} /> Kofexonalar</span>
        </div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>Administrator kirishi</h2>
        <p className="muted">Faqat admin huquqi berilgan akkauntlar kira oladi.</p>
        <label className="field"><span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@coffeegram.uz" autoComplete="username" required />
        </label>
        <label className="field"><span>Parol</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? 'Tekshirilmoqda…' : 'Kirish'} {!busy && <LuArrowRight size={18} />}</button>
      </form>
    </div>
  )
}
