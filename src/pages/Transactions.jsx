import { useState } from 'react'
import { LuAlertCircle, LuDownload, LuReceipt, LuRotateCcw, LuSearch } from 'react-icons/lu'
import { rpc, useRpc } from '../lib/useRpc'
import { dateTime, num, statusLabel, typeLabel } from '../lib/format'
import ReceiptModal from '../components/Receipt'
import { PageHead, Period, useCafes } from './AdminPanel'

export default function Transactions() {
  const [days, setDays] = useState(7)
  const [cafe, setCafe] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [receiptId, setReceiptId] = useState(null)
  const [cafes] = useCafes()
  const args = { p_days: days, p_cafe: cafe || null, p_type: type || null, p_status: status || null, p_search: search || null, p_limit: 300 }
  const { data, error, loading, reload } = useRpc('admin_transactions', args, [days, cafe, type, status, search])

  const reverse = async (r) => {
    const note = window.prompt(`Chek №${r.receipt_no} bekor qilinadi va mijoz balansi qaytariladi.\nSababini yozing:`)
    if (!note) return
    try { await rpc('admin_reverse_transaction', { p_id: r.id, p_note: note }); setReceiptId(null); reload() } catch (e) { window.alert(e.message) }
  }
  const cancelPending = async (r) => {
    if (!window.confirm('Bu ochiq QR bekor qilinsinmi?')) return
    try { await rpc('admin_cancel_transaction', { p_id: r.id }); reload() } catch (e) { window.alert(e.message) }
  }

  const exportCsv = () => {
    const rows = [['Chek', 'Sana', 'Kofexona', 'Kassir', 'Mijoz', 'Telefon', 'Turi', 'Holat', 'Summa', 'Cashback', 'Balansdan', 'Izoh']]
    for (const r of data || []) rows.push([r.receipt_no, r.confirmed_at || r.created_at, r.cafe_name, r.cashier_name, r.customer_name, r.customer_phone, typeLabel[r.type], statusLabel[r.status], r.amount, r.cashback_amount, r.balance_used, r.note])
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `coffeegram-cheklar-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="page">
      <PageHead title="Cheklar" icon={LuReceipt} sub="Barcha tranzaksiyalar: ko‘rish, chop etish, bekor qilish">
        <button className="btn btn-outline btn-sm" onClick={exportCsv} disabled={!data?.length}><LuDownload size={15} /> Excel (CSV)</button>
      </PageHead>

      <div className="filters">
        <Period value={days} onChange={setDays} />
        <select className="select" value={cafe} onChange={(e) => setCafe(e.target.value)}>
          <option value="">Barcha kofexonalar</option>
          {cafes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Barcha turlar</option>
          <option value="cashback">Cashback</option>
          <option value="spend">Balansdan</option>
          <option value="adjust">Admin tuzatish</option>
        </select>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha holatlar</option>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(q) }} className="search">
          <LuSearch size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Telefon, ism yoki chek №" />
        </form>
      </div>

      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}
      {loading && !data && <div className="skeleton"><div /><div /><div /></div>}
      {data?.length === 0 && <div className="empty"><LuReceipt size={32} />Hech narsa topilmadi</div>}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Chek</th><th>Vaqt</th><th>Kofexona / kassir</th><th>Mijoz</th><th>Turi</th><th>Holat</th><th className="r">Summa</th><th className="r">Bonus</th><th /></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className={`${r.receipt_no ? 'click' : ''} ${r.status === 'reversed' ? 'dim' : ''}`} onClick={() => r.receipt_no && setReceiptId(r.id)}>
                  <td className="primary" data-label="Chek">{r.receipt_no ? `№${r.receipt_no}` : 'QR (tasdiqlanmagan)'}</td>
                  <td data-label="Vaqt">{dateTime(r.confirmed_at || r.created_at)}</td>
                  <td data-label="Kofexona">{r.cafe_name || '—'}<span className="sub">{r.cashier_name}</span></td>
                  <td data-label="Mijoz">{r.customer_name || '—'}<span className="sub">{r.customer_phone}</span></td>
                  <td data-label="Turi"><span className={`tag ${r.type}`}>{typeLabel[r.type]}</span></td>
                  <td data-label="Holat"><span className={`tag ${r.status}`}>{statusLabel[r.status]}</span></td>
                  <td data-label="Summa" className="r num">{num(r.amount)}</td>
                  <td data-label="Bonus" className="r num">{r.cashback_amount ? <span className="pos">+{num(r.cashback_amount)}</span> : r.balance_used ? <span className="neg">−{num(r.balance_used)}</span> : '—'}</td>
                  <td className="acts" onClick={(e) => e.stopPropagation()}>
                    <div>{r.status === 'pending' && <button className="btn btn-outline btn-sm" onClick={() => cancelPending(r)}>QR’ni bekor qilish</button>}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {receiptId && (
        <ReceiptModal id={receiptId} onClose={() => setReceiptId(null)}
          actions={(r) => r.status === 'confirmed' && <button className="btn btn-danger" onClick={() => reverse(r)}><LuRotateCcw size={17} /> Chekni bekor qilish</button>} />
      )}
    </div>
  )
}
