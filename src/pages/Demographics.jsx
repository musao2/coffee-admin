import { LuAlertCircle, LuCake, LuUsers } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { genderLabel, num, som } from '../lib/format'
import Stat from '../components/Stat'

// Mijozlar demografiyasi: jins va yosh guruhlari bo'yicha mijozlar va savdo
export default function Demographics({ days }) {
  const { data, error } = useRpc('admin_demographics', { p_days: days }, [days])
  if (error) return <div className="alert err"><LuAlertCircle size={18} />{error}</div>
  const g = data?.by_gender || []
  const total = data?.customers_total || 0
  const male = g.find((x) => x.gender === 'male')
  const female = g.find((x) => x.gender === 'female')
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
  const ages = data?.by_age || []
  const maxAge = Math.max(1, ...ages.map((a) => a.customers))
  const top = Object.fromEntries((data?.top_by_gender || []).map((t) => [t.gender, t]))
  const label = days === 1 ? 'bugun' : `${days} kun`

  return (
    <>
      <h3 className="section-title">Mijozlar demografiyasi</h3>
      <div className="stats">
        <Stat icon={LuUsers} label="Erkaklar" value={data ? `${num(male?.customers || 0)} · ${pct(male?.customers || 0)}%` : '…'} hint={top.male ? `sevimli: ${top.male.name}` : ''} />
        <Stat icon={LuUsers} label="Ayollar" value={data ? `${num(female?.customers || 0)} · ${pct(female?.customers || 0)}%` : '…'} hint={top.female ? `sevimli: ${top.female.name}` : ''} />
        <Stat icon={LuCake} label="O‘rtacha yosh" value={data ? (data.avg_age ? `${data.avg_age} yosh` : '—') : '…'} />
        <Stat icon={LuAlertCircle} label="Ma’lumot to‘ldirgan" value={data ? `${num(data.filled)} / ${num(total)}` : '…'} hint="jins va yoshini kiritgan mijozlar" />
      </div>

      {total > 0 && (
        <div className="gender-bar" title="Jins bo‘yicha ulush">
          <i className="m" style={{ width: `${pct(male?.customers || 0)}%` }}>{pct(male?.customers || 0) >= 12 && `Erkak ${pct(male?.customers || 0)}%`}</i>
          <i className="f" style={{ width: `${pct(female?.customers || 0)}%` }}>{pct(female?.customers || 0) >= 12 && `Ayol ${pct(female?.customers || 0)}%`}</i>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Yosh guruhi</th><th>Mijozlar</th><th className="r">Erkak</th><th className="r">Ayol</th><th className="r">Kofe ({label})</th><th className="r">Tushum ({label})</th></tr></thead>
          <tbody>
            {ages.map((a) => (
              <tr key={a.age_group}>
                <td className="primary" data-label="Yosh guruhi">{a.age_group}</td>
                <td data-label="Mijozlar" style={{ minWidth: 140 }}>
                  <span className="row" style={{ gap: 8 }}><span className="bar-inline"><i style={{ width: `${(a.customers / maxAge) * 100}%` }} /></span><b className="num">{a.customers}</b></span>
                </td>
                <td data-label="Erkak" className="r num">{a.male}</td>
                <td data-label="Ayol" className="r num">{a.female}</td>
                <td data-label={`Kofe (${label})`} className="r num">{num(a.coffees)}</td>
                <td data-label={`Tushum (${label})`} className="r num">{num(a.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Jins</th><th className="r">Mijozlar</th><th className="r">Xarid qilgan ({label})</th><th className="r">Cheklar</th><th className="r">Kofe</th><th className="r">Tushum</th><th>Sevimli kofe</th></tr></thead>
          <tbody>
            {g.map((x) => (
              <tr key={x.gender}>
                <td className="primary" data-label="Jins">{genderLabel[x.gender] || x.gender}</td>
                <td data-label="Mijozlar" className="r num">{num(x.customers)}</td>
                <td data-label={`Xarid qilgan (${label})`} className="r num">{num(x.buyers)}</td>
                <td data-label="Cheklar" className="r num">{num(x.orders)}</td>
                <td data-label="Kofe" className="r num">{num(x.coffees)}</td>
                <td data-label="Tushum" className="r num"><b>{som(x.revenue)}</b></td>
                <td data-label="Sevimli kofe">{top[x.gender]?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
