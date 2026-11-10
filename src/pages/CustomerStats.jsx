import { LuCake, LuClipboardCheck, LuUsers } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { num } from '../lib/format'
import Stat from '../components/Stat'

// Mijozlar sahifasining tepasidagi statistika: jins, yosh, to'ldirganlar
export default function CustomerStats({ onFilter, active }) {
  const { data } = useRpc('admin_demographics', { p_days: 30 }, [])
  if (!data) return <div className="skeleton"><div /></div>
  const total = data.customers_total || 0
  const g = Object.fromEntries((data.by_gender || []).map((x) => [x.gender, x]))
  const m = g.male?.customers || 0
  const f = g.female?.customers || 0
  const u = g.unknown?.customers || 0
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
  const ages = (data.by_age || []).filter((a) => a.customers > 0)
  const maxAge = Math.max(1, ...ages.map((a) => a.customers))
  const top = Object.fromEntries((data.top_by_gender || []).map((t) => [t.gender, t]))

  return (
    <section className="cust-stats">
      <div className="stats">
        <Stat icon={LuUsers} label="Jami mijozlar" value={num(total)} dark />
        <Stat icon={LuUsers} label="Erkaklar" value={`${num(m)} · ${pct(m)}%`} hint={top.male ? `ko‘proq ${top.male.name}` : ''} />
        <Stat icon={LuUsers} label="Ayollar" value={`${num(f)} · ${pct(f)}%`} hint={top.female ? `ko‘proq ${top.female.name}` : ''} />
        <Stat icon={LuCake} label="O‘rtacha yosh" value={data.avg_age ? `${data.avg_age}` : '—'} hint={`${num(data.filled)} / ${num(total)} ma’lumot to‘ldirgan`} />
      </div>

      {total > 0 && (
        <div className="panel" style={{ padding: 14 }}>
          <div className="gender-bar">
            <i className="m" style={{ width: `${pct(m)}%` }}>{pct(m) >= 12 && `Erkak ${pct(m)}%`}</i>
            <i className="f" style={{ width: `${pct(f)}%` }}>{pct(f) >= 12 && `Ayol ${pct(f)}%`}</i>
            {u > 0 && <i className="u" style={{ width: `${pct(u)}%` }}>{pct(u) >= 12 && `Kiritilmagan ${pct(u)}%`}</i>}
          </div>
          <div className="chips" style={{ marginTop: 12 }}>
            {[['all', 'Hammasi'], ['male', `Erkaklar · ${m}`], ['female', `Ayollar · ${f}`], ['unknown', `Kiritilmagan · ${u}`]].map(([k, l]) => (
              <button key={k} className={active === k ? 'on' : ''} onClick={() => onFilter(k)}>{l}</button>
            ))}
          </div>
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
          {u > 0 && <p className="muted small row" style={{ gap: 6, marginTop: 10 }}><LuClipboardCheck size={14} /> {u} ta mijoz hali jins/yoshini kiritmagan — ilovaga kirganda so‘raladi.</p>}
        </div>
      )}
    </section>
  )
}
