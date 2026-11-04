import { LuLogOut } from 'react-icons/lu'
import { useAuth } from './lib/auth'
import { supabaseConfigured } from './lib/supabase'
import Splash from './components/Splash'
import { Mark } from './components/Logo'
import Login from './pages/Login'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  const { session, profile, ready, signOut } = useAuth()

  if (!supabaseConfigured) {
    return <div className="splash"><Mark size={64} /><h2>Supabase ulanmagan</h2><p><code>.env</code> faylini to‘ldiring.</p></div>
  }
  if (!ready) return <Splash text="Admin panel yuklanmoqda…" />
  if (!session) return <Login />
  if (!profile) return <Splash text="Profil yuklanmoqda…" />
  if (profile.role !== 'admin' || profile.is_active === false) {
    return (
      <div className="splash">
        <Mark size={64} />
        <h2>Kirish taqiqlangan</h2>
        <p>Bu panel faqat administratorlar uchun. <b>{profile.email || profile.phone}</b> akkaunti admin emas.</p>
        <button className="btn btn-primary" onClick={signOut}><LuLogOut size={18} /> Boshqa akkaunt bilan kirish</button>
      </div>
    )
  }
  return <AdminPanel />
}
