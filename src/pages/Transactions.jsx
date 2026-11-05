import { useState } from 'react'
import { LuAlertCircle, LuDownload, LuReceipt, LuRotateCcw, LuSearch } from 'react-icons/lu'
import { rpc, useRpc } from '../lib/useRpc'
import { dateTime, num, statusLabel, typeLabel } from '../lib/format'
import ReceiptModal from '../components/Receipt'
import ReasonModal from '../components/ReasonModal'
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

  const [reverseTx, setReverseTx] = useState(null)
  const doReverse = async (note) => {
    await rpc('admin_reverse_transaction', { p_id: reverseTx.id, p_note: note })
    setReverseTx(null); setReceiptId(null); reload()
  }
  const cancelPending = async (r) => {
    if (!window.confirm('Bu ochiq QR bekor qilinsinmi?')) return
    try { await rpc('admin_cancel_transaction', { p_id: r.id }); reload() } catch (e) { window.alert(e.message) }
  }

  const exportCsv = () => {
    const rows = [['Chek', 'Sana', 'Kofexona', 'Kassir', 'Mijoz', 'Telefon', 'Turi', 'Holat', 'Buyurtma', 'Summa', 'Bepul kofe chegirmasi', 'To‘lov', 'Shtamp', 'Izoh']]
    for (const r of data || []) rows.push([r.receipt_no, r.confirmed_at || r.created_at, r.cafe_name, r.cashier_name, r.customer_name, r.customer_phone, typeLabel[r.type], statusLabel[r.status], (r.items || []).map((i) => `${i.qty}x ${i.name}`).join(', '), r.amount, r.discount, r.type === 'adjust' ? '' : r.amount - (r.discount || 0) - (r.balance_used || 0), r.stamps_earned, r.note])
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
          <option value="stamp">Xarid (kartochka)</option>
          <option value="adjust">Admin tuzatish</option>
          <option value="cashback">Cashback (eski)</option>
          <option value="spend">Balansdan (eski)</option>
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
            <thead><tr><th>Chek</th><th>Vaqt</th><th>Kofexona / kassir</th><th>Mijoz</th><th>Buyurtma</th><th>Holat</th><th className="r">To‘lov</th><th className="r">Shtamp</th><th /></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className={`${r.receipt_no ? 'click' : ''} ${r.status === 'reversed' ? 'dim' : ''}`} onClick={() => r.receipt_no && setReceiptId(r.id)}>
                  <td className="primary" data-label="Chek">{r.receipt_no ? `№${r.receipt_no}` : 'QR (tasdiqlanmagan)'}</td>
                  <td data-label="Vaqt">{dateTime(r.confirmed_at || r.created_at)}</td>
                  <td data-label="Kofexona">{r.cafe_name || '—'}<span className="sub">{r.cashier_name}</span></td>
                  <td data-label="Mijoz">{r.customer_name || '—'}<span className="sub">{r.customer_phone}</span></td>
                  <td data-label="Buyurtma">{r.type === 'stamp' ? ((r.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ') || '—') : <span className={`tag ${r.type}`}>{typeLabel[r.type]}</span>}{r.free_used > 0 && <span className="sub">bepul: −{num(r.discount)}</span>}</td>
                  <td data-label="Holat"><span className={`tag ${r.status}`}>{statusLabel[r.status]}</span></td>
                  <td data-label="To‘lov" className="r num">{r.type === 'adjust' ? '—' : num(r.amount - (r.discount || 0) - (r.balance_used || 0))}</td>
                  <td data-label="Shtamp" className="r num">{r.stamps_earned ? <span className={r.stamps_earned > 0 ? 'pos' : 'neg'}>{r.stamps_earned > 0 ? '+' : ''}{r.stamps_earned}</span> : '—'}{r.free_used > 0 && <span className="sub">bepul kofe</span>}</td>
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
          actions={(r) => r.status === 'confirmed' && <button className="btn btn-danger" onClick={() => setReverseTx(r)}><LuRotateCcw size={17} /> Chekni bekor qilish</button>} />
      )}
      {reverseTx && (
        <ReasonModal title={`Chek №${reverseTx.receipt_no} ni bekor qilish`}
          text="Chek bekor qilinadi, mijozning shtamplari va ishlatilgan bepul kofe qaytariladi."
          label="Sabab (majburiy)" placeholder="Masalan: kassir xato kiritgan" confirmText="Chekni bekor qilish" danger
          onConfirm={doReverse} onClose={() => setReverseTx(null)} />
      )}
    </div>
  )
}
