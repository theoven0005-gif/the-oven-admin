import { ReactNode, useEffect } from 'react';
import { ClipboardList, Search, X, Loader2, Trash2 } from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../lib/types';
import { statusLabel, paymentLabel } from '../lib/types';

/* ---------- Layout primitives ---------- */

export function PageHead({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function Stat({ icon, title, value, sub, tone = 'teal' }: { icon: ReactNode; title: string; value: string; sub: string; tone?: string }) {
  return (
    <div className={`stat ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

export function Empty({ text, icon }: { text: string; icon?: ReactNode }) {
  return (
    <div className="empty">
      {icon || <ClipboardList size={28} />}
      <p>{text}</p>
    </div>
  );
}

export function LoadingPanel({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="loading-panel">
      <Loader2 size={26} className="spin" />
      <p>{text}</p>
    </div>
  );
}

/* ---------- Badges ---------- */

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status s-${status}`}>{statusLabel[status]}</span>;
}

export function PayBadge({ status }: { status: PaymentStatus }) {
  return <span className={`pay p-${status}`}>{paymentLabel[status]}</span>;
}

/* ---------- Form primitives ---------- */

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="search">
      <Search size={17} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button type="button" className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span className="toggle-knob" />
      <span className="toggle-label">{label}</span>
    </button>
  );
}

/* ---------- Modal ---------- */

export function Modal({
  title,
  sub,
  onClose,
  children,
  wide,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  busy,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm-text">{message}</p>
      <div className="form-actions">
        <button className="ghost-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button className="danger" onClick={onConfirm} disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
