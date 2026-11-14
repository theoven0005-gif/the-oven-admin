import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { WalletCards, CheckCircle2, Truck, ExternalLink, Loader2, ChevronRight } from 'lucide-react';
import type { Order, PaymentStatus } from '../lib/types';
import { paymentLabel } from '../lib/types';
import { money, fmt, shortId } from '../lib/utils';
import { PageHead, Stat, Empty, PayBadge, SearchInput } from '../components/ui';
import { updateOrder } from './Orders';

export default function Payments({ orders }: { orders: Order[] }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending_verification' | 'cash_due' | 'all' | PaymentStatus>('pending_verification');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = orders.filter((o) => o.paymentStatus === 'pending_verification');
  const cashDue = orders.filter((o) => o.paymentStatus === 'cash_due');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.paymentStatus !== statusFilter) return false;
      if (!needle) return true;
      return `${o.id} ${o.customerName} ${o.phone || ''} ${o.paymentBank || ''}`.toLowerCase().includes(needle);
    });
  }, [orders, statusFilter, q]);

  const review = async (o: Order, approved: boolean) => {
    setBusyId(o.id);
    try {
      await updateOrder(o.id, { paymentStatus: approved ? 'approved' : 'rejected' });
    } catch (e: any) {
      alert(e?.message || 'Could not update payment.');
    } finally {
      setBusyId(null);
    }
  };

  const collectCash = async (o: Order) => {
    setBusyId(o.id);
    try {
      await updateOrder(o.id, { paymentStatus: 'cash_collected' });
    } catch (e: any) {
      alert(e?.message || 'Could not update payment.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHead title="Payment verification" sub="Review uploaded payment proof before accepting online-payment orders." />

      <div className="stats compact">
        <Stat icon={<WalletCards />} title="Awaiting review" value={String(pending.length)} sub="Customer screenshots" tone="orange" />
        <Stat icon={<CheckCircle2 />} title="Approved" value={String(orders.filter((o) => o.paymentStatus === 'approved').length)} sub="Verified online payments" tone="green" />
        <Stat icon={<Truck />} title="Cash due" value={String(cashDue.length)} sub="COD orders" />
      </div>

      {/* Verification queue — inline approve/reject */}
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h3>Verification queue</h3>
            <p>Online transfers waiting for your approval.</p>
          </div>
          <b className="queue-count">{pending.length} pending</b>
        </div>
        {pending.map((o) => (
          <div className="queue-row" key={o.id}>
            <div className="queue-main">
              <strong>
                #{shortId(o.id)} · {o.customerName}
              </strong>
              <small>
                {o.paymentBank || 'Bank not specified'} · {money(o.total)} · {fmt(o.createdAt)}
              </small>
            </div>
            {o.paymentScreenshotUrl ? (
              <a className="proof-btn" href={o.paymentScreenshotUrl} target="_blank" rel="noreferrer">
                Screenshot <ExternalLink size={13} />
              </a>
            ) : (
              <span className="proof-missing">Missing screenshot</span>
            )}
            <div className="queue-actions">
              <button
                className="primary small"
                disabled={busyId === o.id}
                onClick={() => review(o, true)}
              >
                {busyId === o.id ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Approve
              </button>
              <button className="danger-outline small" disabled={busyId === o.id} onClick={() => review(o, false)}>
                Reject
              </button>
            </div>
          </div>
        ))}
        {!pending.length && <Empty text="No online payments are waiting for review." icon={<CheckCircle2 size={28} />} />}
      </section>

      {/* COD tracking */}
      <section className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h3>Cash on delivery</h3>
            <p>Mark cash collected only after the money is in hand.</p>
          </div>
          <b className="queue-count">{cashDue.length} due</b>
        </div>
        {cashDue.map((o) => (
          <div className="queue-row" key={o.id}>
            <div className="queue-main">
              <strong>
                #{shortId(o.id)} · {o.customerName}
              </strong>
              <small>
                {o.address || o.phone || 'No details'} · {fmt(o.createdAt)}
              </small>
            </div>
            <b className="queue-amount">{money(o.total)}</b>
            <div className="queue-actions">
              <button className="primary small" disabled={busyId === o.id} onClick={() => collectCash(o)}>
                {busyId === o.id ? <Loader2 size={14} className="spin" /> : <Truck size={14} />} Cash collected
              </button>
            </div>
          </div>
        ))}
        {!cashDue.length && <Empty text="No cash-on-delivery orders are outstanding." icon={<Truck size={28} />} />}
      </section>

      {/* Full history */}
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search order, customer or bank" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="pending_verification">Awaiting review</option>
          <option value="cash_due">Cash due</option>
          <option value="all">All payments</option>
          {(Object.keys(paymentLabel) as PaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {paymentLabel[s]}
            </option>
          ))}
        </select>
      </div>
      <div className="orders-table panel">
        <div className="table-head payments-head">
          <span>Order</span>
          <span>Customer</span>
          <span>Method</span>
          <span>Amount</span>
          <span>Status</span>
          <span />
        </div>
        {filtered.map((o) => (
          <NavLink className="table-row payments-head" key={o.id} to={`/orders/${o.id}`}>
            <span>
              <strong>#{shortId(o.id)}</strong>
              <small>{fmt(o.createdAt)}</small>
            </span>
            <span>
              {o.customerName}
              <small>{o.paymentBank || '—'}</small>
            </span>
            <span>{o.paymentMethod === 'cod' ? 'COD' : o.paymentMethod === 'cash' ? 'Cash' : 'Online'}</span>
            <span>
              <strong>{money(o.total)}</strong>
            </span>
            <span>
              <PayBadge status={o.paymentStatus} />
            </span>
            <span>
              <ChevronRight size={17} />
            </span>
          </NavLink>
        ))}
        {!filtered.length && <Empty text="No payments match this filter." />}
      </div>
    </>
  );
}
