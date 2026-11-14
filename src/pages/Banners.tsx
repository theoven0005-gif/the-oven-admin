import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Megaphone, Pencil, Trash2, Plus, Loader2, Upload, Eye } from 'lucide-react';
import type { Banner } from '../lib/types';
import { db, storage } from '../lib/firebase';
import { PageHead, Empty, LoadingPanel, Field, Toggle, Modal, ConfirmDialog } from '../components/ui';

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'banners'), orderBy('sortOrder')),
      (s) => {
        setBanners(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Banner, 'id'>) })));
        setLoading(false);
      },
      () => setLoading(false)
    );
  }, []);

  const toggleActive = async (b: Banner) => {
    await updateDoc(doc(db, 'banners', b.id), { active: !(b.active !== false), updatedAt: serverTimestamp() });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      if (deleting.imagePath) {
        try {
          await deleteObject(ref(storage, deleting.imagePath));
        } catch {
          /* ignore */
        }
      }
      await deleteDoc(doc(db, 'banners', deleting.id));
      setDeleting(null);
    } catch (e: any) {
      alert(e?.message || 'Could not delete the banner.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingPanel text="Loading banners…" />;

  return (
    <>
      <PageHead title="Banners & promotions" sub="Hero banners shown at the top of the customer app home screen.">
        <button className="primary" onClick={() => setEditing('new')}>
          <Plus size={17} /> Add banner
        </button>
      </PageHead>

      <div className="banner-grid">
        {banners.map((b) => (
          <div className="banner-card panel" key={b.id}>
            <div className="banner-img">
              {b.imageUrl ? <img src={b.imageUrl} alt={b.title} /> : <Megaphone size={30} />}
              <span className={`availability ${b.active === false ? 'off' : ''}`} style={{ position: 'absolute', top: 12, right: 12 }}>
                {b.active === false ? 'Hidden' : 'Live'}
              </span>
            </div>
            <div className="banner-info">
              <h3>{b.title}</h3>
              {b.subtitle && <p>{b.subtitle}</p>}
              <div className="card-actions">
                <button className="ghost-btn small" onClick={() => toggleActive(b)}>
                  {b.active === false ? 'Show' : 'Hide'}
                </button>
                <button className="icon-btn small" onClick={() => setEditing(b)} title="Edit">
                  <Pencil size={15} />
                </button>
                <button className="icon-btn small danger-ic" onClick={() => setDeleting(b)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {!banners.length && (
        <Empty text="No banners yet. Add one to promote offers on the app home screen." icon={<Megaphone size={28} />} />
      )}

      {editing && (
        <BannerForm item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete banner"
          message={`Delete "${deleting.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </>
  );
}

function BannerForm({ item, onClose, onSaved }: { item: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title || '');
  const [subtitle, setSubtitle] = useState(item?.subtitle || '');
  const [sortOrder, setSortOrder] = useState(item?.sortOrder != null ? String(item.sortOrder) : '');
  const [active, setActive] = useState(item?.active !== false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(item?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!title.trim()) return setError('Title is required.');
    setSaving(true);
    try {
      let imageUrl = item?.imageUrl;
      let imagePath = item?.imagePath;
      if (file) {
        const path = `banners/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
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
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        imageUrl: imageUrl || null,
        imagePath: imagePath || null,
        sortOrder: sortOrder.trim() === '' ? 0 : Number(sortOrder) || 0,
        active,
        updatedAt: serverTimestamp(),
      };
      if (item) await updateDoc(doc(db, 'banners', item.id), data);
      else await addDoc(collection(db, 'banners'), { ...data, createdAt: serverTimestamp() });
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'Could not save the banner.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={item ? 'Edit banner' : 'Add banner'} onClose={onClose} wide>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="form-left">
            <Field label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekend Deal — 20% Off" maxLength={80} />
            </Field>
            <Field label="Subtitle">
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Optional tagline" maxLength={140} />
            </Field>
            <div className="two-col">
              <Field label="Sort order">
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
              </Field>
              <div style={{ paddingTop: 28 }}>
                <Toggle checked={active} onChange={setActive} label="Show in app" />
              </div>
            </div>
          </div>
          <div className="form-right">
            <Field label="Banner image" hint="Wide images (16:9) look best.">
              <div className="upload-box wide" onClick={() => fileRef.current?.click()}>
                {preview ? <img src={preview} alt="Preview" /> : <Upload size={28} />}
                <span>{preview ? 'Click to replace' : 'Click to upload'}</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
            </Field>
            {preview && (
              <a className="proof-btn" href={preview} target="_blank" rel="noreferrer">
                <Eye size={14} /> Preview image
              </a>
            )}
          </div>
        </div>
        {error && <div className="error banner">{error}</div>}
        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving && <Loader2 size={16} className="spin" />}
            {saving ? 'Saving…' : item ? 'Save changes' : 'Add banner'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
