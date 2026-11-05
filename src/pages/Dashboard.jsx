import { useState } from 'react'
import { LuAlertCircle, LuCoffee, LuGift, LuLayoutDashboard, LuReceipt, LuStar, LuTrendingUp, LuUserPlus, LuUsers } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { num, som } from '../lib/format'
import Stat from '../components/Stat'
import { PageHead, Period } from './AdminPanel'

export default function Dashboard() {
  const [days, setDays] = useState(7)
  const { data, error } = useRpc('admin_stats', { p_days: days }, [days])
  const t = data?.totals
  const v = (x, f = num) => (data ? f(x) : '…')
  const top = data?.top_products || []
  const maxQ = top[0]?.qty || 1

  return (
    <div className="page">
      <PageHead title="Hisobot" icon={LuLayoutDashboard} sub="Butun tarmoq bo‘yicha ko‘rsatkichlar">
        <Period value={days} onChange={setDays} />
      </PageHead>
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}

      <div className="stats">
        <Stat icon={LuTrendingUp} label="Tushum (to‘langan)" value={v(t?.paid, som)} dark />
        <Stat icon={LuReceipt} label="Cheklar" value={v(t?.count)} />
        <Stat icon={LuCoffee} label="Sotilgan kofe" value={v(t?.coffees)} />
        <Stat icon={LuGift} label="Bepul berilgan kofe" value={v(t?.free_given)} hint={data ? `chegirma: ${som(t?.discount)}` : ''} />
        <Stat icon={LuUsers} label="Xarid qilgan mijozlar" value={v(t?.customers)} />
        <Stat icon={LuUserPlus} label="Yangi mijozlar" value={v(data?.new_customers)} />
        <Stat icon={LuUsers} label="Jami mijozlar" value={v(data?.customers_total)} />
        <Stat icon={LuStar} label="Kutilayotgan bepul kofe" value={v(data?.free_outstanding)} hint="Mijozlar hali ishlatmagan" />
      </div>

      <h3 className="section-title">Eng ko‘p sotilganlar</h3>
      {data && top.length === 0 ? <div className="empty">Bu davrda savdo yo‘q</div> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mahsulot</th><th>Ulush</th><th className="r">Soni</th><th className="r">Summa</th></tr></thead>
            <tbody>
              {top.map((p) => (
                <tr key={p.name}>
                  <td className="primary" data-label="Mahsulot">{p.name} {p.stamp && <LuCoffee size={13} style={{ color: 'var(--caramel)', verticalAlign: -2 }} />}</td>
                  <td data-label="Ulush" style={{ minWidth: 120 }}><span className="bar-inline"><i style={{ width: `${(p.qty / maxQ) * 100}%` }} /></span></td>
                  <td data-label="Soni" className="r num"><b>{num(p.qty)}</b></td>
                  <td data-label="Summa" className="r num">{num(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="section-title">Kofexonalar bo‘yicha</h3>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Kofexona</th><th className="r">Cheklar</th><th className="r">Kofe</th><th className="r">Bepul</th><th className="r">Tushum</th></tr></thead>
          <tbody>
            {(data?.by_cafe || []).map((c) => (
              <tr key={c.id}>
                <td className="primary" data-label="Kofexona">{c.name} {!c.is_active && <span className="tag off">o‘chirilgan</span>}</td>
                <td data-label="Cheklar" className="r num">{num(c.cnt)}</td>
                <td data-label="Kofe" className="r num">{num(c.coffees)}</td>
                <td data-label="Bepul" className="r num">{num(c.free_given)}</td>
                <td data-label="Tushum" className="r num"><b>{num(c.paid)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {days > 1 && data?.daily?.length > 0 && (
        <>
          <h3 className="section-title">Kunlar bo‘yicha</h3>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Sana</th><th className="r">Cheklar</th><th className="r">Kofe</th><th className="r">Bepul</th><th className="r">Tushum</th></tr></thead>
              <tbody>
                {data.daily.map((d) => (
                  <tr key={d.day}>
                    <td className="primary" data-label="Sana">{new Date(d.day).toLocaleDateString('ru-RU')}</td>
                    <td data-label="Cheklar" className="r num">{num(d.cnt)}</td>
                    <td data-label="Kofe" className="r num">{num(d.coffees)}</td>
                    <td data-label="Bepul" className="r num">{num(d.free_given)}</td>
                    <td data-label="Tushum" className="r num"><b>{num(d.paid)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
