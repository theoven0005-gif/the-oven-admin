import { useEffect, useState, type FormEvent } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, Save, AlertCircle, Clock3 } from 'lucide-react';
import type { RestaurantSettings } from '../lib/types';
import { db } from '../lib/firebase';
import { PageHead, LoadingPanel, Field } from '../components/ui';

const DEFAULTS: RestaurantSettings = {
  name: 'The Oven',
  phone: '',
  address: '',
  deliveryFee: 150,
  minOrder: 500,
  openingTime: '11:00',
  closingTime: '23:00',
  accountTitle: '',
  accountNumber: '',
  paymentNote: 'Please enter your Order ID in the transfer reference if your bank supports it.',
  announcements: '',
};

export default function Settings() {
  const [form, setForm] = useState<RestaurantSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'restaurant'));
        if (snap.exists()) {
          setForm({ ...DEFAULTS, ...(snap.data() as Partial<RestaurantSettings>) });
        }
      } catch (e: any) {
        setError(e?.message || 'Could not load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof RestaurantSettings>(k: K, v: RestaurantSettings[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'settings', 'restaurant'),
        {
          ...form,
          deliveryFee: Number(form.deliveryFee) || 0,
          minOrder: Number(form.minOrder) || 0,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPanel text="Loading settings…" />;

  return (
    <>
      <PageHead title="Settings" sub="Restaurant configuration. The customer app reads these values.">
        {saved && <span className="saved-pill">✓ Saved</span>}
      </PageHead>
      {error && <div className="error banner">{error}</div>}

      <form onSubmit={save} className="settings-grid">
        <section className="panel form-panel">
          <h3>Restaurant profile</h3>
          <Field label="Restaurant name">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={60} />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+92 3XX XXXXXXX" maxLength={20} />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Restaurant street address" maxLength={160} />
          </Field>
          <div className="two-col">
            <Field label="Delivery fee (Rs.)">
              <input type="number" min={0} value={form.deliveryFee} onChange={(e) => set('deliveryFee', Number(e.target.value))} />
            </Field>
            <Field label="Minimum order (Rs.)">
              <input type="number" min={0} value={form.minOrder} onChange={(e) => set('minOrder', Number(e.target.value))} />
            </Field>
          </div>
        </section>

        <section className="panel form-panel">
          <h3>
            <Clock3 size={16} /> Opening hours
          </h3>
          <div className="two-col">
            <Field label="Opens at">
              <input type="time" value={form.openingTime} onChange={(e) => set('openingTime', e.target.value)} />
            </Field>
            <Field label="Closes at">
              <input type="time" value={form.closingTime} onChange={(e) => set('closingTime', e.target.value)} />
            </Field>
          </div>
          <Field label="Announcement" hint="Optional — shown at the top of the app home screen when set.">
            <input value={form.announcements || ''} onChange={(e) => set('announcements', e.target.value)} placeholder="e.g. Eid holiday hours apply" maxLength={140} />
          </Field>
        </section>

        <section className="panel form-panel">
          <h3>Payment instructions</h3>
          <p className="muted">Your restaurant receiving account details. The customer app should display these before taking the screenshot.</p>
          <Field label="Receiving account title">
            <input value={form.accountTitle} onChange={(e) => set('accountTitle', e.target.value)} placeholder="The Oven Restaurant" maxLength={80} />
          </Field>
          <Field label="IBAN / account number">
            <input value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} placeholder="PK…" maxLength={60} />
          </Field>
          <Field label="Payment note">
            <textarea rows={2} value={form.paymentNote} onChange={(e) => set('paymentNote', e.target.value)} maxLength={200} />
          </Field>
          <div className="tip">
            <AlertCircle size={18} />
            <div>
              <strong>Important</strong>
              <p>Do not rely on a screenshot alone for high-value payments. Verify the transfer in the restaurant's actual bank account before approving.</p>
            </div>
          </div>
        </section>

        <section className="panel form-panel">
          <h3>COD workflow</h3>
          <p className="muted">
            Recommended: COD orders start as <b>Cash due</b>. The rider/restaurant marks cash collected only after receiving the money. Then the
            order can be completed and the customer receives the final notification.
          </p>
          <div className="cod-flow">
            <span>Order accepted</span>→<span>Cash due</span>→<span>Delivered</span>→<span>Cash collected</span>→<span>Completed</span>
          </div>
          <button type="submit" className="primary full" disabled={saving} style={{ marginTop: 18 }}>
            {saving ? <Loader2 size={17} className="spin" /> : <Save size={17} />}
            {saving ? 'Saving…' : 'Save all settings'}
          </button>
        </section>
      </form>
    </>
  );
}
