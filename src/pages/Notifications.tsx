import { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy, onSnapshot, limit, deleteDoc, doc } from 'firebase/firestore';
import { Bell, Trash2, Loader2 } from 'lucide-react';
import type { AppNotification } from '../lib/types';
import { fmt } from '../lib/utils';
import { db } from '../lib/firebase';
import { PageHead, Empty, LoadingPanel, ConfirmDialog } from '../components/ui';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export default function Notifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(300)),
      (s) => {
        setItems(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const oldItems = useMemo(() => {
    const cutoff = Date.now() - THIRTY_DAYS;
    return items.filter((n) => {
      const t = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : 0;
      return t > 0 && t < cutoff;
    });
  }, [items]);

  const clearOld = async () => {
    setBusy(true);
    try {
      // Firestore has no bulk delete in the client SDK; delete individually.
      for (const n of oldItems) {
        await deleteDoc(doc(db, 'notifications', n.id));
      }
      setConfirmClear(false);
    } catch (e: any) {
      alert(e?.message || 'Could not clear old notifications.');
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      for (const n of items) {
        await deleteDoc(doc(db, 'notifications', n.id));
      }
    } catch (e: any) {
      alert(e?.message || 'Could not clear the log.');
    } finally {
      setClearing(false);
    }
  };

  if (loading) return <LoadingPanel text="Loading notifications…" />;

  return (
    <>
      <PageHead title="Notification log" sub="Audit trail for order and payment messages.">
        <div className="page-actions-row">
          <button className="ghost-btn" onClick={() => setConfirmClear(true)} disabled={!oldItems.length}>
            <Trash2 size={16} /> Clear older than 30 days ({oldItems.length})
          </button>
          <button className="danger-outline" onClick={clearAll} disabled={!items.length || clearing}>
            {clearing ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />} Clear all
          </button>
        </div>
      </PageHead>

      <div className="panel notif-list">
        {items.map((n) => (
          <div className="notif" key={n.id}>
            <div className="notif-icon">
              <Bell size={17} />
            </div>
            <div>
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <small>
                {fmt(n.createdAt)} {n.orderId && `· Order #${n.orderId.slice(0, 7).toUpperCase()}`}
              </small>
            </div>
            <button className="icon-btn small danger-ic" title="Delete" onClick={() => deleteDoc(doc(db, 'notifications', n.id))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!items.length && <Empty text="No notification records yet." />}
      </div>

      {confirmClear && (
        <ConfirmDialog
          title="Clear old notifications"
          message={`Delete ${oldItems.length} notification(s) older than 30 days? Recent records are kept.`}
          confirmLabel="Clear old"
          onConfirm={clearOld}
          onCancel={() => setConfirmClear(false)}
          busy={busy}
        />
      )}
    </>
  );
}
