import { LuAlertCircle, LuCoffee, LuCrown, LuGift, LuTrophy } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { dateTime, genderLabel, num, som } from '../lib/format'

const MEDAL = ['gold', 'silver', 'bronze']

// Eng ko'p xarid qilgan mijozlar — Hisobotning birinchi qatori
export default function TopCustomers({ days, limit = 10 }) {
  const { data, error, loading } = useRpc('admin_top_customers', { p_days: days, p_limit: limit }, [days, limit])
  const label = days === 1 ? 'bugun' : days === 365 ? 'bir yilda' : `${days} kunda`

  return (
    <section className="panel top-panel">
      <div className="panel-head">
        <h3><LuTrophy size={18} /> Eng ko‘p xarid qilganlar — TOP {limit}</h3>
        <span className="muted small">{label} · tushum bo‘yicha</span>
      </div>
      <div className="panel-body">
        {error && <div className="alert err" style={{ marginTop: 8 }}><LuAlertCircle size={18} />{error}</div>}
        {loading && !data && <div className="skeleton" style={{ marginTop: 8 }}><div /><div /></div>}
        {data && data.length === 0 && <p className="muted small" style={{ padding: '10px 0' }}>Bu davrda mijozlar xarid qilmagan</p>}

        {data?.length > 0 && (
          <div className="podium">
            {data.slice(0, 3).map((c, i) => (
              <div key={c.id} className={`podium-card ${MEDAL[i]}`}>
                <span className="medal">{i === 0 ? <LuCrown size={18} /> : i + 1}</span>
                <b className="podium-name">{c.full_name || 'Nomsiz'}</b>
                <small className="muted">{c.phone}</small>
                <span className="row wrap" style={{ gap: 4, justifyContent: 'center' }}>
                  {c.gender && <span className={`tag ${c.gender === 'female' ? 'amber' : 'dark'}`}>{genderLabel[c.gender]}</span>}
                  {c.age != null && <span className="tag">{c.age} yosh</span>}
                </span>
                <span className="podium-sum num">{som(c.revenue)}</span>
                <small className="muted"><LuCoffee size={12} /> {c.coffees} kofe · {c.orders} chek{c.favorite ? ` · ${c.favorite}` : ''}</small>
              </div>
            ))}
          </div>
        )}

        {data?.length > 3 && (
          <ul className="mini-list" style={{ marginTop: 6 }}>
            {data.slice(3).map((c) => (
              <li key={c.id}>
                <span className="rank-no">{c.rank}</span>
                <div className="grow">
                  <b>{c.full_name || 'Nomsiz'} <span className="muted small">· {c.phone}</span></b>
                  <small>
                    {[c.gender && genderLabel[c.gender], c.age != null && `${c.age} yosh`, `${c.coffees} kofe`, `${c.orders} chek`, c.favorite, c.free_used > 0 && `${c.free_used} bepul`].filter(Boolean).join(' · ')}
                    {c.last_at && ` · oxirgi: ${dateTime(c.last_at)}`}
                  </small>
                </div>
                <div className="list-end"><b className="num">{num(c.revenue)}</b>{c.free_available > 0 && <small><LuGift size={11} /> {c.free_available} bepul tayyor</small>}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
