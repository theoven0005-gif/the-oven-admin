import { useEffect, useState, type FormEvent } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { Tags, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import type { Category } from '../lib/types';
import { db } from '../lib/firebase';
import { PageHead, Empty, LoadingPanel, Field, Toggle, Modal, ConfirmDialog } from '../components/ui';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'categories'), orderBy('sortOrder')),
      (s) => {
        setCategories(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDoc(doc(db, 'categories', deleting.id));
      setDeleting(null);
    } catch (e: any) {
      alert(e?.message || 'Could not delete the category.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingPanel text="Loading categories…" />;

  return (
    <>
      <PageHead title="Categories" sub="Organise your menu into categories for the customer app.">
        <button className="primary" onClick={() => setEditing('new')}>
          <Plus size={17} /> Add category
        </button>
      </PageHead>

      <div className="panel">
        <div className="table-head cats-head">
          <span>Category</span>
          <span>Description</span>
          <span>Sort</span>
          <span>Status</span>
          <span />
        </div>
        {categories.map((c) => (
          <div className="table-row cats-head" key={c.id}>
            <span>
              <strong>{c.name}</strong>
            </span>
            <span className="muted">{c.description || '—'}</span>
            <span>{c.sortOrder ?? '—'}</span>
            <span>
              <span className={`status ${c.active === false ? 's-cancelled' : 's-ready'}`}>
                {c.active === false ? 'Hidden' : 'Visible'}
              </span>
            </span>
            <span className="row-actions">
              <button className="icon-btn small" onClick={() => setEditing(c)} title="Edit">
                <Pencil size={15} />
              </button>
              <button className="icon-btn small danger-ic" onClick={() => setDeleting(c)} title="Delete">
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
        {!categories.length && (
          <Empty text="No categories yet. Add one — the Menu page uses them for the category picker." icon={<Tags size={28} />} />
        )}
      </div>

      {editing && (
        <CategoryForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleting.name}"? Menu items keep their old category text, so update them after.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </>
  );
}

function CategoryForm({ item, onClose, onSaved }: { item: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [sortOrder, setSortOrder] = useState(item?.sortOrder != null ? String(item.sortOrder) : '');
  const [active, setActive] = useState(item?.active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required.');
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        sortOrder: sortOrder.trim() === '' ? 0 : Number(sortOrder) || 0,
        active,
        updatedAt: serverTimestamp(),
      };
      if (item) await updateDoc(doc(db, 'categories', item.id), data);
      else await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() });
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={item ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Burgers" maxLength={60} />
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional short description" maxLength={140} />
        </Field>
        <Field label="Sort order">
          <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
        </Field>
        <Toggle checked={active} onChange={setActive} label="Visible in app" />
        {error && <div className="error banner">{error}</div>}
        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving && <Loader2 size={16} className="spin" />}
            {saving ? 'Saving…' : item ? 'Save changes' : 'Add category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
