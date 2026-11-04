import { useState } from 'react'
import { LuAlertCircle, LuGift, LuLayoutDashboard, LuReceipt, LuSlidersHorizontal, LuTrendingUp, LuUserPlus, LuUsers, LuWallet } from 'react-icons/lu'
import { useRpc } from '../lib/useRpc'
import { num, som } from '../lib/format'
import Stat from '../components/Stat'
import { PageHead, Period } from './AdminPanel'

export default function Dashboard() {
  const [days, setDays] = useState(7)
  const { data, error } = useRpc('admin_stats', { p_days: days }, [days])
  const t = data?.totals
  const v = (x, f = num) => (data ? f(x) : '…')

  return (
    <div className="page">
      <PageHead title="Hisobot" icon={LuLayoutDashboard} sub="Butun tarmoq bo‘yicha ko‘rsatkichlar">
        <Period value={days} onChange={setDays} />
      </PageHead>
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}

      <div className="stats">
        <Stat icon={LuTrendingUp} label="Cheklar summasi" value={v(t?.amount, som)} dark />
        <Stat icon={LuReceipt} label="Tranzaksiyalar" value={v(t?.count)} />
        <Stat icon={LuGift} label="Berilgan cashback" value={v(t?.cashback, som)} />
        <Stat icon={LuWallet} label="Balansdan to‘langan" value={v(t?.balance_used, som)} />
        <Stat icon={LuUsers} label="Xarid qilgan mijozlar" value={v(t?.customers)} />
        <Stat icon={LuUserPlus} label="Yangi mijozlar" value={v(data?.new_customers)} />
        <Stat icon={LuUsers} label="Jami mijozlar" value={v(data?.customers_total)} />
        <Stat icon={LuSlidersHorizontal} label="Mijozlar bonusi (jami)" value={v(data?.liability, som)} hint="Ishlatilmagan bonuslar" />
      </div>

      <h3 className="section-title">Kofexonalar bo‘yicha</h3>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Kofexona</th><th className="r">Cheklar</th><th className="r">Summa</th><th className="r">Cashback</th><th className="r">Balansdan</th></tr></thead>
          <tbody>
            {(data?.by_cafe || []).map((c) => (
              <tr key={c.id}>
                <td className="primary" data-label="Kofexona">{c.name} {!c.is_active && <span className="tag off">o‘chirilgan</span>}</td>
                <td data-label="Cheklar" className="r num">{num(c.cnt)}</td>
                <td data-label="Summa" className="r num">{num(c.amount)}</td>
                <td data-label="Cashback" className="r num pos">{num(c.cashback)}</td>
                <td data-label="Balansdan" className="r num">{num(c.balance_used)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.by_cafe.length === 0 && <div className="empty">Kofexonalar yo‘q</div>}

      {days > 1 && (
        <>
          <h3 className="section-title">Kunlar bo‘yicha</h3>
          {data && data.daily.length === 0 ? <div className="empty">Bu davrda savdo yo‘q</div> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Sana</th><th className="r">Cheklar</th><th className="r">Summa</th><th className="r">Cashback</th><th className="r">Balansdan</th></tr></thead>
                <tbody>
                  {(data?.daily || []).map((d) => (
                    <tr key={d.day}>
                      <td className="primary" data-label="Sana">{new Date(d.day).toLocaleDateString('ru-RU')}</td>
                      <td data-label="Cheklar" className="r num">{num(d.cnt)}</td>
                      <td data-label="Summa" className="r num">{num(d.amount)}</td>
                      <td data-label="Cashback" className="r num pos">{num(d.cashback)}</td>
                      <td data-label="Balansdan" className="r num">{num(d.balance_used)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
