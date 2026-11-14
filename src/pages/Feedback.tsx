import { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc } from 'firebase/firestore';
import { MessageSquare, Trash2, Star } from 'lucide-react';
import type { FeedbackItem } from '../lib/types';
import { fmt, initials } from '../lib/utils';
import { db } from '../lib/firebase';
import { PageHead, Empty, LoadingPanel, SearchInput, ConfirmDialog, Stat } from '../components/ui';

export default function Feedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [deleting, setDeleting] = useState<FeedbackItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(200)),
      (s) => {
        setItems(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackItem, 'id'>) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const avg = useMemo(() => {
    const rated = items.filter((i) => Number(i.rating) > 0);
    return rated.length ? rated.reduce((s, i) => s + Number(i.rating), 0) / rated.length : 0;
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (f) =>
        (ratingFilter === 'all' || String(f.rating) === ratingFilter) &&
        (!needle || `${f.customerName || ''} ${f.comment || ''} ${f.orderId || ''}`.toLowerCase().includes(needle))
    );
  }, [items, q, ratingFilter]);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'feedback', deleting.id));
      setDeleting(null);
    } catch (e: any) {
      alert(e?.message || 'Could not delete feedback.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingPanel text="Loading feedback…" />;

  return (
    <>
      <PageHead title="Customer feedback" sub="Ratings and comments after completed orders." />
      <div className="stats compact" style={{ marginBottom: 20 }}>
        <Stat icon={<Star />} title="Average rating" value={avg ? avg.toFixed(1) : '—'} sub={`${items.length} reviews`} tone="orange" />
        <Stat
          icon={<MessageSquare />}
          title="5-star reviews"
          value={String(items.filter((i) => Number(i.rating) === 5).length)}
          sub="Highest rated"
          tone="green"
        />
      </div>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search customer, comment or order" />
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="all">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>
      <div className="feedback-grid">
        {filtered.map((f) => (
          <div className="panel feedback" key={f.id}>
            <div className="feedback-top">
              <div className="avatar">{initials(f.customerName)}</div>
              <div>
                <strong>{f.customerName || 'Customer'}</strong>
                <small>{fmt(f.createdAt)}</small>
              </div>
              <b className="stars">
                {'★'.repeat(Math.min(5, Number(f.rating || 0)))}
                <span>{'★'.repeat(Math.max(0, 5 - Number(f.rating || 0)))}</span>
              </b>
            </div>
            <p>{f.comment || 'No written comment.'}</p>
            <div className="feedback-foot">
              <small>Order #{String(f.orderId || '').slice(0, 8).toUpperCase()}</small>
              <button className="icon-btn small danger-ic" onClick={() => setDeleting(f)} title="Delete feedback">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!filtered.length && <Empty text="Feedback submitted by customers will appear here." icon={<MessageSquare size={28} />} />}
      {deleting && (
        <ConfirmDialog
          title="Delete feedback"
          message="Delete this customer feedback? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </>
  );
}
