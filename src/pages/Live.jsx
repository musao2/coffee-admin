import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LuActivity, LuAlertCircle, LuBan, LuCoffee, LuGift, LuKeyRound, LuLock, LuPause, LuPlay, LuQrCode, LuReceipt,
  LuRotateCcw, LuSlidersHorizontal, LuStore, LuTrendingUp, LuUnlock, LuUserCog, LuUserPlus, LuUsers, LuWallet, LuStar,
} from 'react-icons/lu'
import { rpc } from '../lib/useRpc'
import { num, som, timeAgo, timeOnly } from '../lib/format'
import Stat from '../components/Stat'
import ReceiptModal from '../components/Receipt'
import { PageHead } from './AdminPanel'

const REFRESH_MS = 5000

// Har bir harakat turi: ikonka, rang, guruh va matn
const A = {
  qr_created:          { icon: LuQrCode, c: 'amber', g: 'qr', t: (a) => <><b>{a.actor_name}</b> buyurtma QR’ini yaratdi{a.details === 'stamp' ? ` · ${a.amount2 || 0} ta kofe` : a.details === 'spend' ? ' · balansdan' : ' · cashback'}</>, amt: (a) => som(a.amount) },
  order_confirmed:     { icon: LuCoffee, c: 'green', g: 'sale', t: (a) => <><b>{a.customer_name || 'Mijoz'}</b> xarid qildi: {a.details}</>, amt: (a) => <><span className="pos">+{a.amount2} <LuCoffee size={12} /></span><br /><small className="muted">{num(a.amount)}</small></> },
  free_redeemed:       { icon: LuGift, c: 'coffee', g: 'sale', t: (a) => <><b>{a.customer_name || 'Mijoz'}</b> bepul kofe oldi: {a.details}</>, amt: (a) => <><span className="tag amber">bepul</span><br /><small className="muted">{num(a.amount)}</small></> },
  expense_added:       { icon: LuWallet, c: 'coffee', g: 'expense', t: (a) => <><b>{a.actor_name}</b> xarajat kiritdi: {a.details}</>, amt: (a) => <span className="neg">−{num(a.amount)}</span> },
  expense_cancelled:   { icon: LuBan, c: 'red', g: 'expense', t: (a) => <><b>{a.actor_name}</b> xarajatni bekor qildi: {a.details}</>, amt: (a) => <span style={{ textDecoration: 'line-through' }}>{num(a.amount)}</span> },
  stamps_adjusted:     { icon: LuStar, c: 'purple', g: 'customer', t: (a) => <><b>{a.actor_name}</b> {a.customer_name} kartochkasini tuzatdi</>, amt: (a) => <span className={a.amount > 0 ? 'pos' : 'neg'}>{a.amount > 0 ? '+' : ''}{a.amount} shtamp</span> },
  cashback_given:      { icon: LuGift, c: 'green', g: 'sale', t: (a) => <><b>{a.customer_name || 'Mijoz'}</b> cashback oldi (eski) · chek {som(a.amount)}</>, amt: (a) => <span className="pos">+{num(a.amount2)}</span> },
  balance_spent:       { icon: LuWallet, c: 'coffee', g: 'sale', t: (a) => <><b>{a.customer_name || 'Mijoz'}</b> balansdan to‘ladi · chek {som(a.amount)}</>, amt: (a) => <span className="neg">−{num(a.amount2)}</span> },
  qr_cancelled:        { icon: LuBan, c: 'red', g: 'qr', t: (a) => <><b>{a.actor_name || 'Tizim'}</b> QR’ni bekor qildi</>, amt: (a) => som(a.amount) },
  tx_reversed:         { icon: LuRotateCcw, c: 'red', g: 'sale', t: (a) => <><b>{a.actor_name}</b> chek №{a.receipt_no} ni qaytardi{a.customer_name ? ` (${a.customer_name})` : ''}</>, amt: (a) => som(a.amount) },
  balance_adjusted:    { icon: LuSlidersHorizontal, c: 'purple', g: 'customer', t: (a) => <><b>{a.actor_name}</b> {a.customer_name} balansini tuzatdi</>, amt: (a) => <span className={a.amount > 0 ? 'pos' : 'neg'}>{a.amount > 0 ? '+' : '−'}{num(Math.abs(a.amount))}</span> },
  customer_registered: { icon: LuUserPlus, c: 'green', g: 'customer', t: (a) => <>Yangi foydalanuvchi: <b>{a.customer_name || 'nomsiz'}</b></> },
  user_blocked:        { icon: LuLock, c: 'red', g: 'staff', t: (a) => <><b>{a.actor_name}</b> blokladi: {a.details}</> },
  user_unblocked:      { icon: LuUnlock, c: 'green', g: 'staff', t: (a) => <><b>{a.actor_name}</b> blokdan chiqardi: {a.details}</> },
  credentials_changed: { icon: LuKeyRound, c: 'dark', g: 'staff', t: (a) => <><b>{a.actor_name}</b> {a.customer_name || 'xodim'} kirish ma’lumotlarini o‘zgartirdi</> },
  role_changed:        { icon: LuUserCog, c: 'dark', g: 'staff', t: (a) => <><b>{a.actor_name || 'Tizim'}</b> rolni o‘zgartirdi</> },
  cafe_created:        { icon: LuStore, c: 'dark', g: 'settings', t: (a) => <><b>{a.actor_name}</b> kofexona qo‘shdi</> },
  cafe_updated:        { icon: LuStore, c: 'dark', g: 'settings', t: (a) => <><b>{a.actor_name}</b> kofexonani o‘zgartirdi</> },
  product_created:     { icon: LuCoffee, c: 'coffee', g: 'settings', t: (a) => <><b>{a.actor_name}</b> menyuga qo‘shdi</>, amt: (a) => num(a.amount) },
  product_updated:     { icon: LuCoffee, c: 'coffee', g: 'settings', t: (a) => <><b>{a.actor_name}</b> menyuni o‘zgartirdi</>, amt: (a) => num(a.amount) },
}
const GROUPS = [['all', 'Hammasi'], ['sale', 'Savdo'], ['expense', 'Xarajat'], ['qr', 'QR'], ['customer', 'Mijozlar'], ['staff', 'Xodimlar'], ['settings', 'Sozlamalar']]
const showDetails = new Set(['user_blocked', 'user_unblocked', 'qr_created', 'qr_cancelled', 'order_confirmed', 'free_redeemed', 'expense_added', 'expense_cancelled'])

export default function Live({ onOpenTab }) {
  const [live, setLive] = useState(null)
  const [feed, setFeed] = useState([])
  const [fresh, setFresh] = useState(new Set())
  const [group, setGroup] = useState('all')
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState('')
  const [updated, setUpdated] = useState(null)
  const [receiptId, setReceiptId] = useState(null)
  const [, tick] = useState(0)
  const lastId = useRef(null)

  const load = useCallback(async () => {
    try {
      const [l, items] = await Promise.all([
        rpc('admin_live'),
        rpc('admin_activity', { p_limit: lastId.current ? 100 : 150, p_after: lastId.current }),
      ])
      try { l.expenses = await rpc('admin_expenses', { p_days: 1 }) } catch { l.expenses = null }
      setLive(l)
      if (items.length) {
        if (lastId.current) setFresh(new Set(items.map((i) => i.id)))
        lastId.current = items[0].id
        setFeed((f) => [...items, ...f].slice(0, 400))
      }
      setUpdated(new Date())
      setError('')
    } catch (e) { setError(e.message) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (paused) return
    const t = setInterval(load, REFRESH_MS)
    const c = setInterval(() => tick((x) => x + 1), 15000)
    return () => { clearInterval(t); clearInterval(c) }
  }, [paused, load])

  const cancelQr = async (q) => {
    if (!window.confirm(`${q.cafe_name} · ${som(q.amount)} — bu QR bekor qilinsinmi?`)) return
    try { await rpc('admin_cancel_transaction', { p_id: q.id }); load() } catch (e) { window.alert(e.message) }
  }

  const t = live?.today
  const v = (x, f = num) => (live ? f(x) : '…')
  const shown = group === 'all' ? feed : feed.filter((a) => A[a.action]?.g === group)
  const isOnline = (iso) => iso && Date.now() - new Date(iso) < 15 * 60 * 1000

  return (
    <div className="page">
      <PageHead title="Jonli kuzatuv" icon={LuActivity} sub="Tizimdagi har bir harakat shu yerda real vaqtda ko‘rinadi">
        <span className={`live-status ${paused ? 'paused' : ''}`}><span className="live-dot" />{paused ? 'To‘xtatilgan' : `Yangilandi ${updated ? timeOnly(updated) : '…'}`}</span>
        <button className="btn btn-outline btn-sm" onClick={() => setPaused((p) => !p)}>{paused ? <><LuPlay size={15} /> Davom</> : <><LuPause size={15} /> Pauza</>}</button>
      </PageHead>
      {error && <div className="alert err"><LuAlertCircle size={18} />{error}</div>}

      <div className="stats">
        <Stat icon={LuTrendingUp} label="Bugungi tushum" value={v(t?.paid, som)} dark />
        <Stat icon={LuReceipt} label="Bugungi cheklar" value={v(t?.count)} />
        <Stat icon={LuCoffee} label="Sotilgan kofe" value={v(t?.coffees)} />
        <Stat icon={LuGift} label="Bepul berilgan kofe" value={v(t?.free_given)} />
        <Stat icon={LuUsers} label="Bugun xarid qilganlar" value={v(t?.customers)} />
        <Stat icon={LuUserPlus} label="Yangi mijozlar" value={v(live?.new_customers)} />
        <Stat icon={LuQrCode} label="Ochiq QR’lar" value={v(live?.open_qr?.length)} hint="Hali skanerlanmagan" />
        <Stat icon={LuStar} label="Kutilayotgan bepul kofe" value={v(live?.free_outstanding)} hint="Mijozlar hali ishlatmagan" />
        <Stat icon={LuWallet} label="Bugungi xarajat" value={live ? (live.expenses ? som(live.expenses.total) : '—') : '…'} hint={live?.expenses ? `${live.expenses.count} ta yozuv · batafsil “Xarajatlar”da` : ''} />
        <Stat icon={LuTrendingUp} label="Bugungi sof (tushum − xarajat)" value={live?.expenses ? som((t?.paid || 0) - live.expenses.total) : '…'} />
      </div>

      <div className="live-grid">
        <section className="panel">
          <div className="panel-head">
            <h3><LuActivity size={18} /> Harakatlar lentasi</h3>
            <span className="muted small">{shown.length} ta</span>
          </div>
          <div className="chips">
            {GROUPS.map(([id, l]) => <button key={id} className={group === id ? 'on' : ''} onClick={() => setGroup(id)}>{l}</button>)}
          </div>
          <div className="panel-body">
            {live === null && <div className="skeleton"><div /><div /><div /></div>}
            {live && shown.length === 0 && <div className="empty" style={{ marginTop: 8 }}><LuActivity size={32} />Hozircha harakat yo‘q</div>}
            <ul className="feed">
              {shown.map((a) => {
                const m = A[a.action] || { icon: LuActivity, c: '', t: () => a.action }
                const Icon = m.icon
                const canOpen = a.tx_id && a.receipt_no
                return (
                  <li key={a.id} className={fresh.has(a.id) ? 'new' : ''}>
                    <span className={`feed-ico ${m.c}`}><Icon size={17} /></span>
                    <div className="feed-main">
                      <p>{m.t(a)}</p>
                      <small>
                        <span title={new Date(a.created_at).toLocaleString('ru-RU')}>{timeAgo(a.created_at)}</span>
                        {a.cafe_name && <span>· {a.cafe_name}</span>}
                        {a.customer_phone && a.action !== 'customer_registered' && <span>· {a.customer_phone}</span>}
                        {a.action === 'customer_registered' && a.details && <span>· {a.details}</span>}
                        {(!showDetails.has(a.action) && a.details && a.action !== 'customer_registered') && <span>· {a.details}</span>}
                        {canOpen && <button className="link" onClick={() => setReceiptId(a.tx_id)}>chek №{a.receipt_no}</button>}
                      </small>
                    </div>
                    {m.amt && <span className="feed-amt num">{m.amt(a)}</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <div className="stack" style={{ gap: 16 }}>
          <section className="panel">
            <div className="panel-head"><h3><LuQrCode size={18} /> Ochiq QR’lar</h3><span className="tag pending">{live?.open_qr?.length ?? '…'}</span></div>
            <div className="panel-body">
              {live && live.open_qr.length === 0 && <p className="muted small" style={{ padding: '8px 0' }}>Skanerlanmagan QR yo‘q</p>}
              <ul className="mini-list">
                {(live?.open_qr || []).map((q) => (
                  <li key={q.id}>
                    <span className="feed-ico amber"><LuCoffee size={16} /></span>
                    <div className="grow">
                      <b className="num">{som(q.amount)} · {q.stamp_qty ?? 0} kofe {q.on_display ? <span className="tag green">ekranda</span> : <span className="tag">chekda</span>}</b>
                      <small>{q.cafe_name} · {q.cashier_name} · {timeAgo(q.created_at)}</small>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => cancelQr(q)} aria-label="Bekor qilish"><LuBan size={15} /></button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3><LuUserCog size={18} /> Kassirlar</h3><button className="link small" onClick={() => onOpenTab('staff')}>Boshqarish</button></div>
            <div className="panel-body">
              {live && live.cashiers.length === 0 && <p className="muted small" style={{ padding: '8px 0' }}>Kassirlar yo‘q</p>}
              <ul className="mini-list">
                {(live?.cashiers || []).map((k) => (
                  <li key={k.id}>
                    <span className={`online ${isOnline(k.last_at) ? 'on' : ''}`} title={isOnline(k.last_at) ? 'So‘nggi 15 daqiqada faol' : 'Faol emas'} />
                    <div className="grow">
                      <b>{k.full_name || k.email} {!k.is_active && <span className="tag off">bloklangan</span>}</b>
                      <small>{k.cafe_name || 'kofexonasiz'} · {k.last_at ? `oxirgi QR ${timeAgo(k.last_at)}` : 'hali ishlamagan'}</small>
                    </div>
                    <div className="list-end"><span className="num">{num(k.today_amount)}</span><small>bugun {k.today_count} chek</small></div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3><LuStore size={18} /> Kofexonalar · bugun</h3><button className="link small" onClick={() => onOpenTab('cafes')}>Boshqarish</button></div>
            <div className="panel-body">
              <ul className="mini-list">
                {(live?.cafes || []).map((c) => (
                  <li key={c.id}>
                    <span className="feed-ico dark"><LuStore size={16} /></span>
                    <div className="grow">
                      <b>{c.name} {!c.is_active && <span className="tag off">o‘chirilgan</span>}</b>
                      <small>{c.coffees} kofe · {c.free_given} bepul · {c.last_at ? timeAgo(c.last_at) : 'faollik yo‘q'}</small>
                    </div>
                    <div className="list-end"><span className="num">{num(c.amount)}</span><small>{c.cnt} chek</small></div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>

      {receiptId && <ReceiptModal id={receiptId} onClose={() => setReceiptId(null)} />}
    </div>
  )
}
