import { LuUsers } from 'react-icons/lu'
import { genderLabel, num, som } from '../lib/format'

// Jonli sahifa uchun ixcham panel: jins bo'yicha mijozlar va bugungi xarid
export default function GenderPanel({ demo, onOpenTab }) {
  if (!demo) return null
  const total = demo.customers_total || 0
  const g = Object.fromEntries((demo.by_gender || []).map((x) => [x.gender, x]))
  const m = g.male || {}
  const f = g.female || {}
  const pct = (n) => (total ? Math.round(((n || 0) / total) * 100) : 0)
  const top = Object.fromEntries((demo.top_by_gender || []).map((t) => [t.gender, t]))
  const ages = (demo.by_age || []).filter((a) => a.age_group !== 'Noma’lum' && a.customers > 0)
  const maxAge = Math.max(1, ...ages.map((a) => a.customers))

  return (
    <section className="panel">
      <div className="panel-head">
        <h3><LuUsers size={18} /> Mijozlar: jins va yosh</h3>
        <button className="link small" onClick={() => onOpenTab('dashboard')}>Batafsil</button>
      </div>
      <div className="panel-body">
        {total === 0 ? <p className="muted small" style={{ padding: '8px 0' }}>Hali mijozlar yo‘q</p> : (
          <>
            <div className="gender-bar" style={{ marginTop: 8 }}>
              <i className="m" style={{ width: `${pct(m.customers)}%` }}>{pct(m.customers) >= 15 && `Erkak ${pct(m.customers)}%`}</i>
              <i className="f" style={{ width: `${pct(f.customers)}%` }}>{pct(f.customers) >= 15 && `Ayol ${pct(f.customers)}%`}</i>
            </div>
            <ul className="mini-list">
              {['male', 'female'].map((k) => (
                <li key={k}>
                  <span className={`gender-dot ${k}`} />
                  <div className="grow">
                    <b>{genderLabel[k]} · {num(g[k]?.customers || 0)} mijoz</b>
                    <small>bugun: {num(g[k]?.buyers || 0)} kishi xarid qildi · {num(g[k]?.coffees || 0)} kofe{top[k] ? ` · ko‘proq ${top[k].name}` : ''}</small>
                  </div>
                  <span className="num"><b>{som(g[k]?.revenue || 0)}</b></span>
                </li>
              ))}
              {g.unknown?.customers > 0 && (
                <li><span className="gender-dot" /><div className="grow"><b>Kiritilmagan · {num(g.unknown.customers)}</b><small>jins/yoshini hali to‘ldirmagan</small></div></li>
              )}
            </ul>
            {ages.length > 0 && (
              <div className="age-mini">
                {ages.map((a) => (
                  <div key={a.age_group} title={`${a.age_group}: ${a.customers} mijoz (erkak ${a.male}, ayol ${a.female})`}>
                    <span className="age-col"><i style={{ height: `${(a.customers / maxAge) * 100}%` }} /></span>
                    <b className="num">{a.customers}</b>
                    <small>{a.age_group}</small>
                  </div>
                ))}
              </div>
            )}
            {demo.avg_age && <p className="muted small" style={{ marginTop: 8 }}>O‘rtacha yosh: <b>{demo.avg_age}</b></p>}
          </>
        )}
      </div>
    </section>
  )
}
