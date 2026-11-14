import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  limit,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Utensils, Pencil, Trash2, Plus, Loader2, Upload, Star, Sprout, Images } from 'lucide-react';
import type { MenuItem, Category } from '../lib/types';
import { money } from '../lib/utils';
import { db, storage } from '../lib/firebase';
import { menuSeed, categorySeed } from '../lib/menuSeed';
import { PageHead, Empty, LoadingPanel, Field, Toggle, SearchInput, Modal, ConfirmDialog } from '../components/ui';

const FLYERS = [
  { src: '/menu/menu-royalties-burgers.jpg', alt: 'Royalties & burgers flyer', caption: 'Royalties · Burgers · Wraps · Sandwiches' },
  { src: '/menu/menu-drinks-pizza.jpg', alt: 'Drinks & pizza flyer', caption: 'Drinks · Pizza · Pasta · Fries' },
  { src: '/menu/menu-deals-1-12.jpg', alt: 'Deals 1 to 12 flyer', caption: 'Deals 1–12' },
  { src: '/menu/menu-deals-13-22.jpg', alt: 'Deals 13 to 22 flyer', caption: 'Deals 13–22' },
];

interface FormState {
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
  featured: boolean;
}

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'items' | 'flyer'>('items');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [availFilter, setAvailFilter] = useState('all');
  const [editing, setEditing] = useState<MenuItem | null | 'new'>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const unsubs = [
      onSnapshot(
        query(collection(db, 'menuItems'), orderBy('category')),
        (s) => {
          setItems(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MenuItem, 'id'>) })));
          setLoading(false);
        },
        () => setLoading(false)
      ),
      onSnapshot(query(collection(db, 'categories'), orderBy('sortOrder')), (s) =>
        setCategories(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })))
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (catFilter === 'all' || i.category === catFilter) &&
        (availFilter === 'all' || (availFilter === 'available' ? i.available !== false : i.available === false)) &&
        (!needle || `${i.name} ${i.description || ''}`.toLowerCase().includes(needle))
    );
  }, [items, q, catFilter, availFilter]);

  const toggleAvailable = async (item: MenuItem) => {
    await updateDoc(doc(db, 'menuItems', item.id), { available: !(item.available !== false), updatedAt: serverTimestamp() });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      if (deleting.imagePath) {
        try {
          await deleteObject(ref(storage, deleting.imagePath));
        } catch {
          /* image may already be gone */
        }
      }
      await deleteDoc(doc(db, 'menuItems', deleting.id));
      setDeleting(null);
    } catch (e: any) {
      alert(e?.message || 'Could not delete the item.');
    } finally {
      setBusy(false);
    }
  };

  /** Writes the real menu (menuSeed.ts) into menuItems + categories. Skips when already seeded. */
  const seedMenu = async () => {
    setSeeding(true);
    setNotice('');
    try {
      const existing = await getDocs(query(collection(db, 'menuItems'), limit(1)));
      if (!existing.empty) {
        setNotice(`Menu already has items — seeding skipped to avoid duplicates.`);
        return;
      }
      const batch = writeBatch(db);
      for (const m of menuSeed) {
        batch.set(doc(collection(db, 'menuItems')), {
          ...m,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();

      const existingCats = await getDocs(query(collection(db, 'categories'), limit(1)));
      if (existingCats.empty) {
        const cb = writeBatch(db);
        for (const c of categorySeed) {
          cb.set(doc(collection(db, 'categories')), { ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
        await cb.commit();
      }
      setNotice(`Seeded ${menuSeed.length} real menu items and ${categorySeed.length} categories.`);
    } catch (e: any) {
      setNotice(`Seeding failed: ${e?.message || 'unknown error'}`);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <LoadingPanel text="Loading menu…" />;

  return (
    <>
      <PageHead title="Menu" sub="Manage menu items, prices and availability.">
        <button className="ghost-btn" onClick={seedMenu} disabled={seeding} title="Write the real The Oven menu into Firestore (skips if already seeded)">
          {seeding ? <Loader2 size={16} className="spin" /> : <Sprout size={16} />}
          {seeding ? 'Seeding…' : 'Seed real menu'}
        </button>
        <button className="primary" onClick={() => setEditing('new')}>
          <Plus size={17} /> Add menu item
        </button>
      </PageHead>

      {notice && <div className="notice-banner">{notice}</div>}

      <div className="tabs">
        <button className={tab === 'items' ? 'tab active' : 'tab'} onClick={() => setTab('items')}>
          <Utensils size={15} /> Menu items ({items.length})
        </button>
        <button className={tab === 'flyer' ? 'tab active' : 'tab'} onClick={() => setTab('flyer')}>
          <Images size={15} /> Flyer view
        </button>
      </div>

      {tab === 'flyer' ? (
        <div className="flyer-grid">
          {FLYERS.map((f) => (
            <a className="panel flyer-card" key={f.src} href={f.src} target="_blank" rel="noreferrer">
              <img src={f.src} alt={f.alt} />
              <div className="flyer-caption">{f.caption}</div>
            </a>
          ))}
        </div>
      ) : (
        <>
      <div className="toolbar">
        <SearchInput value={q} onChange={setQ} placeholder="Search menu items" />
        <div className="toolbar-selects">
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.filter((c) => c.active !== false).map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={availFilter} onChange={(e) => setAvailFilter(e.target.value)}>
            <option value="all">Availability: all</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="menu-grid">
        {filtered.map((i) => (
          <div className="menu-card" key={i.id}>
            <div className="menu-img">
              {i.imageUrl ? <img src={i.imageUrl} alt={i.name} /> : <Utensils />}
              {i.featured && (
                <span className="featured-flag">
                  <Star size={12} /> Featured
                </span>
              )}
            </div>
            <div>
              <span>{i.category || 'Uncategorized'}</span>
              <h3>{i.name}</h3>
              <p>{i.description || ''}</p>
              <strong>
                {i.sizes && i.sizes.length ? `from ${money(Math.min(...i.sizes.map((s) => s.price)))}` : money(i.price)}
              </strong>
              {i.sizes && i.sizes.length > 0 && (
                <small className="sizes-line">{i.sizes.map((s) => `${s.label}: ${money(s.price)}`).join(' · ')}</small>
              )}
            </div>
            <div className={`availability ${i.available === false ? 'off' : ''}`}>
              {i.available === false ? 'Unavailable' : 'Available'}
            </div>
            <div className="card-actions">
              <button className="ghost-btn small" onClick={() => toggleAvailable(i)} title="Toggle availability">
                {i.available === false ? 'Mark available' : 'Mark unavailable'}
              </button>
              <button className="icon-btn small" onClick={() => setEditing(i)} title="Edit">
                <Pencil size={15} />
              </button>
              <button className="icon-btn small danger-ic" onClick={() => setDeleting(i)} title="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {!filtered.length && (
        <Empty text={q || catFilter !== 'all' ? 'No menu items match your filters.' : 'No menu items yet — use "Seed real menu" to load the real menu, or add your first item above.'} icon={<Utensils size={28} />} />
      )}
        </>
      )}

      {editing && (
        <MenuItemForm
          item={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete menu item"
          message={`Delete "${deleting.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </>
  );
}

function MenuItemForm({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price != null ? String(item.price) : '',
    category: item?.category || '',
    available: item?.available !== false,
    featured: item?.featured === true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const r = new FileReader();
      r.onload = () => setPreview(r.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview(item?.imageUrl || null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const price = Number(form.price);
    if (!form.name.trim()) return setError('Name is required.');
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid price.');
    if (!form.category.trim()) return setError('Pick a category.');
    setSaving(true);
    try {
      let imageUrl = item?.imageUrl;
      let imagePath = item?.imagePath;
      if (file) {
        const path = `menu/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const snap = await uploadBytes(ref(storage, path), file);
        imageUrl = await getDownloadURL(snap.ref);
        imagePath = path;
        if (item?.imagePath && item.imagePath !== path) {
          try {
            await deleteObject(ref(storage, item.imagePath));
          } catch {
            /* ignore */
          }
        }
      }
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category.trim(),
        imageUrl: imageUrl || null,
        imagePath: imagePath || null,
        available: form.available,
        featured: form.featured,
        updatedAt: serverTimestamp(),
      };
      if (item) {
        // Keep seeded size variants — the form edits the base fields only.
        await updateDoc(doc(db, 'menuItems', item.id), item.sizes ? { ...data, sizes: item.sizes } : data);
      } else {
        await addDoc(collection(db, 'menuItems'), { ...data, createdAt: serverTimestamp() });
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={item ? 'Edit menu item' : 'Add menu item'} sub={item ? `Updating "${item.name}"` : 'Appears in the customer app instantly.'} onClose={onClose} wide>
      <form onSubmit={submit} className="item-form">
        <div className="form-grid">
          <div className="form-left">
            <Field label="Name">
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Special Fajita" maxLength={80} />
            </Field>
            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Short appetising description…" maxLength={300} />
            </Field>
            <div className="two-col">
              <Field label="Price (Rs.)">
                <input type="number" min={0} step="1" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="1150" />
              </Field>
              <Field label="Category">
                <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Select…</option>
                  {categories.filter((c) => c.active !== false).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="toggle-row">
              <Toggle checked={form.available} onChange={(v) => set('available', v)} label="Available for ordering" />
              <Toggle checked={form.featured} onChange={(v) => set('featured', v)} label="Featured item" />
            </div>
          </div>
          <div className="form-right">
            <Field label="Photo">
              <div className="upload-box" onClick={() => fileRef.current?.click()}>
                {preview ? <img src={preview} alt="Preview" /> : <Upload size={28} />}
                <span>{preview ? 'Click to replace' : 'Click to upload'}</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </Field>
          </div>
        </div>
        {error && <div className="error banner">{error}</div>}
        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving && <Loader2 size={16} className="spin" />}
            {saving ? 'Saving…' : item ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
