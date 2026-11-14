import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, WalletCards, ChefHat, AlertCircle, Bell, ChevronRight } from 'lucide-react';
import type { Order, OrderStatus } from '../lib/types';
import { statusLabel, typeLabel } from '../lib/types';
import { money, fmt, isToday, shortId } from '../lib/utils';
import { PageHead, Stat, Empty, StatusBadge } from '../components/ui';

export default function Dashboard({ orders }: { orders: Order[] }) {
  const stats = useMemo(() => {
    const today = orders.filter((o) => isToday(o.createdAt));
    const billable = today.filter((o) => o.status !== 'cancelled');
    const revenue = billable.reduce((s, o) => s + (o.total || 0), 0);
    const aov = billable.length ? revenue / billable.length : 0;

    // Top items across the last 7 days (excl. cancelled).
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const itemSales = new Map<string, { qty: number; revenue: number }>();
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      const d = o.createdAt?.toDate ? o.createdAt.toDate().getTime() : 0;
      if (d < weekAgo) continue;
      for (const i of o.items || []) {
        const cur = itemSales.get(i.name) || { qty: 0, revenue: 0 };
        cur.qty += i.quantity || 1;
        cur.revenue += (i.price || 0) * (i.quantity || 1);
        itemSales.set(i.name, cur);
      }
    }
    const topItems = [...itemSales.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Funnel of live (non-terminal) orders by status.
    const live = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
    const funnel: Record<string, number> = {};
    for (const o of live) funnel[o.status] = (funnel[o.status] || 0) + 1;

    return { today, billable, revenue, aov, topItems, funnel, liveCount: live.length };
  }, [orders]);

  const funnelSteps: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

  return (
    <>
      <PageHead title="Operations overview" sub="Monitor live orders, payments and kitchen activity.">
        <NavLink to="/orders" className="primary">
          View live orders <ChevronRight size={17} />
        </NavLink>
      </PageHead>

      <div className="stats">
        <Stat icon={<ClipboardList />} title="Today's orders" value={String(stats.today.length)} sub={`${stats.funnel['pending'] || 0} awaiting action`} tone="green" />
        <Stat icon={<WalletCards />} title="Today's revenue" value={money(stats.revenue)} sub={`${stats.billable.length} billable orders`} />
        <Stat icon={<ChefHat />} title="Average order value" value={money(Math.round(stats.aov))} sub="Today, excluding cancelled" tone="orange" />
        <Stat icon={<AlertCircle />} title="Payment review" value={String(orders.filter((o) => o.paymentStatus === 'pending_verification').length)} sub="Need verification" tone="red" />
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Live order queue</h3>
              <p>Newest orders appear automatically.</p>
            </div>
            <NavLink to="/orders">View all</NavLink>
          </div>
          <div className="order-list">
            {orders.slice(0, 6).map((o) => (
              <NavLink key={o.id} to={`/orders/${o.id}`} className="order-row">
                <div className="order-main">
                  <strong>#{shortId(o.id)}</strong>
                  <span>
                    {o.customerName} · {typeLabel[o.type]}
                  </span>
                </div>
                <div className="order-meta">
                  <b>{money(o.total)}</b>
                  <StatusBadge status={o.status} />
                  <small>{fmt(o.createdAt)}</small>
                </div>
              </NavLink>
            ))}
          </div>
          {!orders.length && <Empty text="No orders yet. New customer orders will appear here." />}
        </section>

        <div className="side-stack">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Order flow</h3>
                <p>Where today's active orders are.</p>
              </div>
            </div>
            <div className="flow">
              {funnelSteps.map((s) => (
                <div className="flow-row" key={s}>
                  <span className="dot" />
                  <strong>{statusLabel[s]}</strong>
                  <b>{stats.funnel[s] || 0}</b>
                </div>
              ))}
              <div className="flow-row">
                <span className="dot done" />
                <strong>Live orders total</strong>
                <b>{stats.liveCount}</b>
              </div>
            </div>
            <div className="tip">
              <Bell size={18} />
              <div>
                <strong>Customer updates are automatic</strong>
                <p>When staff changes an order status, the backend sends the matching customer notification.</p>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h3>Top items (7 days)</h3>
                <p>By quantity sold, completed orders only excluded for cancelled.</p>
              </div>
            </div>
            <div className="top-items">
              {stats.topItems.map((t, i) => (
                <div className="top-item" key={t.name}>
                  <b className="rank">{i + 1}</b>
                  <div>
                    <strong>{t.name}</strong>
                    <small>
                      {t.qty} sold · {money(t.revenue)}
                    </small>
                  </div>
                </div>
              ))}
              {!stats.topItems.length && <Empty text="No sales in the last 7 days." />}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
