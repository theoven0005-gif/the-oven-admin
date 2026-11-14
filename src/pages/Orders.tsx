import { useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import {
  ChevronRight, Truck, Store, Utensils, CheckCircle2, Clock3, Eye, ExternalLink, Loader2,
  MessageSquareText, WalletCards,
} from 'lucide-react';
import type { Order, OrderStatus, OrderType } from '../lib/types';
import { statusLabel, typeLabel, pipelineFor, nextStatus } from '../lib/types';
import { money, fmt, shortId } from '../lib/utils';
import { db } from '../lib/firebase';
import { PageHead, Empty, StatusBadge, PayBadge, SearchInput, Field } from '../components/ui';

export async function updateOrder(id: string, data: Partial<Order>) {
  await updateDoc(doc(db, 'orders', id), { ...data, updatedAt: serverTimestamp() });
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Accept order',
  confirmed: 'Start preparing',
  preparing: 'Mark ready',
  ready: 'Move forward',
  out_for_delivery: 'Mark delivered',
  delivered: 'Complete order',
  picked_up: 'Complete order',
  served: 'Complete order',
};

export default function Orders({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<'all' | OrderType | OrderStatus>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchFilter = filter === 'all' || o.type === filter || o.status === filter;
      if (!matchFilter) return false;
      if (!needle) return true;
      return `${o.id} ${o.customerName} ${o.phone || ''} ${o.address || ''}`.toLowerCase().includes(needle);
    });
  }, [orders, filter, q]);

  return (
    <>
      <PageHead title="Orders" sub="Accept, prepare, dispatch and complete customer orders.">
        <div className="live-pill">
          <span /> Live updates
        </div>
      </PageHead>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search order, customer or phone" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
          <option value="all">All orders</option>
          <optgroup label="Status">
            <option value="pending">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </optgroup>
          <optgroup label="Type">
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
            <option value="dine-in">Dine-in</option>
          </optgroup>
        </select>
      </div>
      <div className="orders-table panel">
        <div className="table-head">
          <span>Order</span>
          <span>Customer</span>
          <span>Type</span>
          <span>Total</span>
          <span>Status</span>
          <span>Payment</span>
          <span />
        </div>
        {filtered.map((o) => (
          <NavLink className="table-row" key={o.id} to={`/orders/${o.id}`}>
            <span>
              <strong>#{shortId(o.id)}</strong>
              <small>{fmt(o.createdAt)}</small>
            </span>
            <span>
              {o.customerName}
              <small>{o.phone || 'No phone'}</small>
            </span>
            <span>
              <TypeIcon type={o.type} />
              {typeLabel[o.type]}
            </span>
            <span>
              <strong>{money(o.total)}</strong>
            </span>
            <span>
              <StatusBadge status={o.status} />
            </span>
            <span>
              <PayBadge status={o.paymentStatus} />
            </span>
            <span>
              <ChevronRight size={17} />
            </span>
          </NavLink>
        ))}
        {!filtered.length && <Empty text="No matching orders." />}
      </div>
    </>
  );
}

function TypeIcon({ type }: { type: OrderType }) {
  return type === 'delivery' ? <Truck size={16} /> : type === 'pickup' ? <Store size={16} /> : <Utensils size={16} />;
}

export function OrderDetail({ orders }: { orders: Order[] }) {
  const id = useLocation().pathname.split('/').pop()!;
  const o = orders.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!o) return <Empty text="Order not found or still loading." />;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      alert(e?.message || 'Could not update the order.');
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    const next = nextStatus(o);
    if (!next) return;
    run(() => updateOrder(o.id, { status: next }));
  };

  const next = nextStatus(o);

  return (
    <>
      <div className="page-head">
        <div>
          <NavLink to="/orders" className="back">
            ← Orders
          </NavLink>
          <h1>Order #{id.slice(0, 8).toUpperCase()}</h1>
          <p>
            {fmt(o.createdAt)} · {o.customerName} · {typeLabel[o.type]}
          </p>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className="detail-grid">
        <section className="panel detail-main">
          <div className="panel-head">
            <div>
              <h3>Order timeline</h3>
              <p>Advance the order to keep the customer updated automatically.</p>
            </div>
          </div>
          <Timeline o={o} />
          <div className="action-box">
            {next && (
              <button disabled={busy} className="primary" onClick={advance}>
                {busy ? <Loader2 size={18} className="spin" /> : <CheckCircle2 size={18} />}
                {NEXT_LABEL[o.status] || 'Move forward'} — {statusLabel[next]}
              </button>
            )}
            {!['completed', 'cancelled'].includes(o.status) && (
              <button disabled={busy} className="danger-outline" onClick={() => run(() => updateOrder(o.id, { status: 'cancelled' }))}>
                Cancel order
              </button>
            )}
          </div>

          <div className="panel-head" style={{ borderTop: '1px solid var(--line)' }}>
            <div>
              <h3>Order notes</h3>
              <p>Internal notes — visible to staff only, not the customer.</p>
            </div>
          </div>
          <div className="notes-editor">
            <Field label="Notes">
              <textarea
                rows={3}
                value={notesDraft ?? o.notes ?? ''}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="e.g. Extra spicy, call before arriving…"
              />
            </Field>
            {notesDraft !== null && notesDraft !== (o.notes ?? '') && (
              <div className="form-actions">
                <button className="ghost-btn" onClick={() => setNotesDraft(null)}>
                  Discard
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => run(() => updateOrder(o.id, { notes: notesDraft })).then(() => setNotesDraft(null))}
                >
                  Save notes
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="detail-side">
          <section className="panel">
            <div className="panel-head">
              <h3>Customer</h3>
            </div>
            <div className="customer-card">
              <div className="avatar big">{o.customerName.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{o.customerName}</strong>
                <span>{o.phone || 'No phone provided'}</span>
              </div>
            </div>
            {o.address && (
              <div className="info-line">
                <b>Delivery address</b>
                <span>{o.address}</span>
              </div>
            )}
            {o.tableNumber && (
              <div className="info-line">
                <b>Table</b>
                <span>{o.tableNumber}</span>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Payment</h3>
              <PayBadge status={o.paymentStatus} />
            </div>
            <div className="info-line">
              <b>Method</b>
              <span>{o.paymentMethod === 'cod' ? 'Cash on Delivery' : o.paymentMethod === 'cash' ? 'Cash' : 'Online transfer'}</span>
            </div>
            {o.paymentBank && (
              <div className="info-line">
                <b>Bank</b>
                <span>{o.paymentBank}</span>
              </div>
            )}
            {o.paymentScreenshotUrl && (
              <a className="proof-link" href={o.paymentScreenshotUrl} target="_blank" rel="noreferrer">
                <Eye size={16} /> View payment screenshot <ExternalLink size={14} />
              </a>
            )}
            {o.paymentStatus === 'pending_verification' && (
              <div className="payment-actions">
                <button className="primary" disabled={busy} onClick={() => run(() => updateOrder(o.id, { paymentStatus: 'approved' }))}>
                  Approve payment
                </button>
                <button className="danger-outline" disabled={busy} onClick={() => run(() => updateOrder(o.id, { paymentStatus: 'rejected' }))}>
                  Reject
                </button>
              </div>
            )}
            {o.paymentStatus === 'cash_due' && (
              <div className="payment-actions">
                <button
                  className="primary full"
                  disabled={busy}
                  onClick={() => run(() => updateOrder(o.id, { paymentStatus: 'cash_collected' }))}
                >
                  <WalletCards size={16} /> Mark cash collected
                </button>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>Items</h3>
            </div>
            {(o.items || []).map((i, n) => (
              <div className="item" key={n}>
                <span>
                  <b>{i.quantity}×</b> {i.name}
                  {i.size && ` · ${i.size}`}
                  {i.notes && <small className="item-note">{i.notes}</small>}
                </span>
                <strong>{money(i.price * i.quantity)}</strong>
              </div>
            ))}
            <div className="totals">
              <span>Subtotal</span>
              <b>{money(o.subtotal)}</b>
              <span>Delivery</span>
              <b>{money(o.deliveryFee)}</b>
              <strong>Total</strong>
              <strong>{money(o.total)}</strong>
            </div>
          </section>

          <button className="ghost-btn full" onClick={() => navigate('/payments')}>
            <MessageSquareText size={16} /> Go to payment verification
          </button>
        </aside>
      </div>
    </>
  );
}

function Timeline({ o }: { o: Order }) {
  const steps = pipelineFor(o.type);
  const current = steps.indexOf(o.status);
  const isCancelled = o.status === 'cancelled';
  return (
    <div className="timeline">
      {steps.map((s, i) => (
        <div className={`time-step ${!isCancelled && i <= current ? 'done' : ''}`} key={s}>
          <div className="time-dot">
            {i < current && !isCancelled ? <CheckCircle2 size={17} /> : i === current && !isCancelled ? <Clock3 size={17} /> : <span />}
          </div>
          <div>
            <strong>{statusLabel[s]}</strong>
            <small>{i === 0 ? 'Customer placed order' : i === current && !isCancelled ? 'Current status' : 'Next step'}</small>
          </div>
        </div>
      ))}
      {isCancelled && (
        <div className="time-step done cancelled-step">
          <div className="time-dot red">
            <span />
          </div>
          <div>
            <strong>Cancelled</strong>
            <small>This order was cancelled</small>
          </div>
        </div>
      )}
    </div>
  );
}
