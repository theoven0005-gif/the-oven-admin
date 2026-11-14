import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { Users, ShoppingBag } from 'lucide-react';
import type { Customer, Order } from '../lib/types';
import { money, fmt, initials } from '../lib/utils';
import { db } from '../lib/firebase';
import { PageHead, Empty, LoadingPanel, SearchInput, Stat } from '../components/ui';

interface CustomerRow extends Customer {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: any;
}

export default function Customers({ orders }: { orders: Order[] }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const s = await getDocs(query(collection(db, 'users'), limit(500)));
        setCustomers(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, 'id'>) })));
      } catch (e: any) {
        setError(e?.message || 'Could not load customers.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rows: CustomerRow[] = useMemo(() => {
    const agg = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt: any }>();
    for (const o of orders) {
      if (!o.customerId) continue;
      const cur = agg.get(o.customerId) || { orderCount: 0, totalSpent: 0, lastOrderAt: null };
      cur.orderCount += 1;
      if (o.status !== 'cancelled') cur.totalSpent += o.total || 0;
      const t = o.createdAt?.toDate ? o.createdAt.toDate().getTime() : 0;
      const last = cur.lastOrderAt?.toDate ? cur.lastOrderAt.toDate().getTime() : 0;
      if (t > last) cur.lastOrderAt = o.createdAt;
      agg.set(o.customerId, cur);
    }
    const needle = q.trim().toLowerCase();
    return customers
      .map((c) => {
        const a = agg.get(c.id) || { orderCount: 0, totalSpent: 0, lastOrderAt: null };
        return { ...c, ...a };
      })
      .filter((c) => !needle || `${c.name || ''} ${c.email || ''} ${c.phone || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [customers, orders, q]);

  const totalCustomers = customers.length;
  const repeatCustomers = rows.filter((r) => r.orderCount > 1).length;

  if (loading) return <LoadingPanel text="Loading customers…" />;

  return (
    <>
      <PageHead title="Customers" sub="Customer accounts connected to The Oven app." />
      {error && <div className="error banner">{error}</div>}
      <div className="stats compact" style={{ marginBottom: 20 }}>
        <Stat icon={<Users />} title="Total customers" value={String(totalCustomers)} sub="Registered accounts" tone="green" />
        <Stat icon={<ShoppingBag />} title="Repeat customers" value={String(repeatCustomers)} sub="Ordered more than once" tone="orange" />
      </div>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email or phone" />
      </div>
      <div className="panel customer-table">
        {rows.map((c) => (
          <div className="customer-line" key={c.id}>
            <div className="avatar">{initials(c.name || c.email)}</div>
            <div>
              <strong>{c.name || 'Unnamed customer'}</strong>
              <span>
                {c.email || 'No email'} · {c.phone || 'No phone'}
              </span>
            </div>
            <div className="customer-stats">
              <b>{c.orderCount}</b>
              <small>orders</small>
            </div>
            <div className="customer-stats">
              <b>{money(c.totalSpent)}</b>
              <small>spent</small>
            </div>
            <span className="muted">{c.lastOrderAt ? `Last order ${fmt(c.lastOrderAt)}` : 'No orders yet'}</span>
          </div>
        ))}
        {!rows.length && <Empty text={q ? 'No customers match your search.' : 'No customer records found. Check your Firestore users collection.'} />}
      </div>
    </>
  );
}
