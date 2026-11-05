import { useState } from 'react'
import { LuAlertCircle, LuBan, LuDownload, LuReceipt, LuStore, LuTrendingDown, LuTrendingUp, LuWallet } from 'react-icons/lu'
import { rpc, useRpc } from '../lib/useRpc'
import { dateTime, num, som } from '../lib/format'
import Stat from '../components/Stat'
import ReasonModal from '../components/ReasonModal'
import { PageHead, Period, useCafes } from './AdminPanel'

// Admin: kassalar kiritgan barcha xarajatlar
export default function AdminExpenses() {
  const [days, setDays] = useState(1)
  const [cafe, setCafe] = useState('')
  const [cancel, setCancel] = useState(null)
  const [cafes] = useCafes()
  const { data, error, loading, reload } = useRpc('admin_expenses', { p_days: days, p_cafe: cafe || null }, [days, cafe])
  const v = (x, f = som) => (data ? f(x) : '…')
  const net = data ? data.revenue - data.total : 0
  const maxCat = data?.by_category?.[0]?.total || 1
  const label = days === 1 ? 'Bugungi' : `${days} kunlik`

  const doCancel = async (note) => {
    await rpc('admin_cancel_expense', { p_id: cancel.id, p_note: note })
    setCancel(null); reload()
  }

  const exportCsv = () => {
    const rows = [['Sana', 'Kofexona', 'Kassir', 'Turi', 'Summa', 'Izoh', 'Holat', 'Bekor sababi']]
    for (const x of data?.items || []) rows.push([x.created_at, x.cafe_name, x.cashier_name, x.category, x.amount, x.note, x.status === 'active' ? 'Faol' : 'Bekor', x.cancel_note])
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `coffeegram-xarajatlar-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="page">
      <PageHead title="Xarajatlar" icon={LuWallet} sub="Kassalar kiritgan kunlik xarajatlar — har biri izoh bilan">
        <button className="btn btn-outline btn-sm" onClick={exportCsv} disabled={!data?.items?.length}><LuDownload size={15} /> Excel (CSV)</button>
      </PageHead>

      <div className="filters">
        <Period value={days} onChange={setDays} />
        <select className="select" value={cafe} onChange={(e) => setCafe(e.target.value)}>
          <option value="">Barcha kofexonalar</option>
          {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}

      <div className="stats">
        <Stat icon={LuWallet} label={`${label} xarajat`} value={v(data?.total)} dark hint={data ? `${data.count} ta yozuv` : ''} />
        <Stat icon={LuTrendingUp} label={`${label} tushum`} value={v(data?.revenue)} />
        <Stat icon={LuTrendingDown} label="Sof (tushum − xarajat)" value={data ? <span className={net >= 0 ? 'pos' : 'neg'}>{som(net)}</span> : '…'} wide />
      </div>

      <div className="live-grid">
        <section className="panel">
          <div className="panel-head"><h3><LuReceipt size={18} /> Xarajatlar ro‘yxati</h3><span className="muted small">{data?.items?.length ?? 0} ta</span></div>
          <div className="panel-body">
            {loading && !data && <div className="skeleton"><div /><div /></div>}
            {data && data.items.length === 0 && <div className="empty" style={{ marginTop: 8 }}><LuWallet size={32} />Bu davrda xarajat kiritilmagan</div>}
            <ul className="feed">
              {(data?.items || []).map((x) => (
                <li key={x.id} style={x.status === 'cancelled' ? { opacity: 0.55 } : null}>
                  <span className="feed-ico coffee"><LuWallet size={17} /></span>
                  <div className="feed-main">
                    <p><b>{x.category}</b> — {x.note}</p>
                    <small>
                      <span>{dateTime(x.created_at)}</span>
                      <span>· {x.cafe_name}</span>
                      <span>· {x.cashier_name || x.cashier_email}</span>
                      {x.status === 'cancelled' && <span style={{ color: 'var(--red)' }}>· bekor qilindi ({x.cancelled_by_name}): {x.cancel_note}</span>}
                    </small>
                  </div>
                  <div className="list-end">
                    <span className="feed-amt num" style={x.status === 'cancelled' ? { textDecoration: 'line-through' } : null}>−{num(x.amount)}</span>
                    {x.status === 'active' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setCancel(x)}><LuBan size={14} /> Bekor</button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="stack" style={{ gap: 16 }}>
          <section className="panel">
            <div className="panel-head"><h3><LuWallet size={18} /> Turlar bo‘yicha</h3></div>
            <div className="panel-body">
              {data && data.by_category.length === 0 && <p className="muted small" style={{ padding: '8px 0' }}>Ma’lumot yo‘q</p>}
              <ul className="mini-list">
                {(data?.by_category || []).map((c) => (
                  <li key={c.category}>
                    <div className="grow">
                      <b>{c.category} <span className="muted small">· {c.cnt} ta</span></b>
                      <span className="bar-inline" style={{ marginTop: 6 }}><i style={{ width: `${(c.total / maxCat) * 100}%` }} /></span>
                    </div>
                    <span className="num"><b>{num(c.total)}</b></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h3><LuStore size={18} /> Kofexonalar bo‘yicha</h3></div>
            <div className="panel-body">
              <ul className="mini-list">
                {(data?.by_cafe || []).map((c) => (
                  <li key={c.id}>
                    <span className="feed-ico dark"><LuStore size={16} /></span>
                    <div className="grow"><b>{c.name}</b><small>{c.cnt} ta yozuv</small></div>
                    <span className="num"><b>{num(c.total)}</b></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {cancel && (
        <ReasonModal
          title="Xarajatni bekor qilish"
          text={`${cancel.category} — ${som(cancel.amount)} · ${cancel.note}`}
          label="Bekor qilish sababi (majburiy)"
          placeholder="Masalan: ikki marta kiritilgan"
          confirmText="Bekor qilish"
          danger
          onConfirm={doCancel}
          onClose={() => setCancel(null)}
        />
      )}
    </div>
  )
}
