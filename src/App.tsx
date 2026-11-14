import { useEffect, useState, type FormEvent } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, User } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import {
  LayoutDashboard, ClipboardList, WalletCards, Users, Utensils, MessageSquare, Settings, Bell,
  LogOut, Menu as MenuIcon, X, Tags, Megaphone, ShieldAlert, Loader2,
} from 'lucide-react';
import { auth, db, getMessagingIfSupported } from './lib/firebase';
import type { Order } from './lib/types';
import Dashboard from './pages/Dashboard';
import Orders, { OrderDetail } from './pages/Orders';
import Payments from './pages/Payments';
import Customers from './pages/Customers';
import Menu from './pages/Menu';
import Categories from './pages/Categories';
import Banners from './pages/Banners';
import Feedback from './pages/Feedback';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/Settings';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard],
  ['/orders', 'Orders', ClipboardList],
  ['/payments', 'Payments', WalletCards],
  ['/customers', 'Customers', Users],
  ['/menu', 'Menu', Utensils],
  ['/categories', 'Categories', Tags],
  ['/banners', 'Banners', Megaphone],
  ['/feedback', 'Feedback', MessageSquare],
  ['/notifications', 'Notifications', Bell],
  ['/settings', 'Settings', Settings],
] as const;

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoaded(true);
      }),
    []
  );
  return { user, loaded };
}

function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(300));
    return onSnapshot(
      q,
      (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }))),
      (e) => console.error(e)
    );
  }, []);
  return orders;
}

export default function App() {
  const { user, loaded } = useAuth();
  if (!loaded) return <div className="boot">Loading The Oven Admin…</div>;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="*" element={user ? <AdminGate user={user} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

/** Checks the admins/{uid} allowlist before letting anyone into the console. */
function AdminGate({ user }: { user: User }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid));
        if (!cancelled) setIsAdmin(snap.exists());
      } catch {
        // permission-denied or missing doc both mean "not an admin"
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (checking)
    return (
      <div className="boot">
        <Loader2 size={22} className="spin" /> Verifying admin access…
      </div>
    );
  if (!isAdmin) return <AccessDenied user={user} />;
  return <Shell user={user} />;
}

function AccessDenied({ user }: { user: User }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="denied-icon">
          <ShieldAlert size={30} />
        </div>
        <h1>Access denied</h1>
        <p>
          <b>{user.email}</b> is not registered as a restaurant admin.
          <br />
          Ask an existing admin to add your UID (<code>{user.uid.slice(0, 8)}…</code>) to the <code>admins</code> collection in Firestore.
        </p>
        <button className="danger-outline full" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      nav('/');
    } catch (e: any) {
      const code = e?.code || '';
      setErr(
        code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : code === 'auth/too-many-requests'
          ? 'Too many attempts. Please wait a moment and try again.'
          : e?.message || 'Login failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-mark">O</div>
        <h1>The Oven</h1>
        <p>Restaurant Operations Console</p>
        <form onSubmit={submit}>
          <label>
            Admin email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="admin@theoven.pk" />
          </label>
          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" />
          </label>
          {err && <div className="error">{err}</div>}
          <button className="primary full" disabled={busy}>
            {busy && <Loader2 size={17} className="spin" />}
            {busy ? 'Signing in…' : 'Sign in to Admin'}
          </button>
        </form>
        <small>Use a Firebase Authentication admin account. Do not hard-code credentials.</small>
      </div>
    </div>
  );
}

function Shell({ user }: { user: User }) {
  const orders = useOrders();
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();
  const pending = orders.filter((o) => o.status === 'pending').length;

  // Register this admin's FCM token so Cloud Functions can push order alerts.
  useEffect(() => {
    (async () => {
      try {
        const m = await getMessagingIfSupported();
        if (!m) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
        const token = await getToken(m, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        if (token) {
          await setDoc(
            doc(db, 'adminDevices', user.uid),
            { uid: user.uid, fcmToken: token, updatedAt: serverTimestamp() },
            { merge: true }
          ).catch(() => {});
        }
        onMessage(m, (p) => {
          const n = p.notification;
          if (n) new Notification(n.title || 'The Oven', { body: n.body || '' });
        });
      } catch (e) {
        console.log(e);
      }
    })();
  }, [user]);

  const crumb = loc.pathname === '/' ? 'Dashboard' : loc.pathname.slice(1).split('/')[0];

  return (
    <div className="app-shell">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="sidebar-brand">
          <span>O</span>
          <div>
            <strong>The Oven</strong>
            <small>Admin Panel</small>
          </div>
          <button className="icon-btn mobile-only" onClick={() => setMobile(false)} aria-label="Close menu">
            <X />
          </button>
        </div>
        <nav>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setMobile(false)} className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={19} />
              <span>{label}</span>
              {label === 'Orders' && pending > 0 ? <b className="nav-badge">{pending}</b> : null}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-mini">
            <div className="avatar">{(user.email || 'A')[0].toUpperCase()}</div>
            <div>
              <strong>Restaurant Admin</strong>
              <small>{user.email}</small>
            </div>
          </div>
          <button className="logout" onClick={() => signOut(auth)}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="icon-btn mobile-only" onClick={() => setMobile(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <div>
            <div className="crumb">The Oven / {crumb}</div>
            <h2>{crumb === 'Dashboard' ? 'Good day, Admin' : 'Restaurant Operations'}</h2>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => nav('/notifications')} aria-label="Notifications">
              <Bell size={20} />
              {pending > 0 && <i />}
            </button>
            <div className="online">
              <span /> Live
            </div>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard orders={orders} />} />
            <Route path="/orders" element={<Orders orders={orders} />} />
            <Route path="/orders/:id" element={<OrderDetail orders={orders} />} />
            <Route path="/payments" element={<Payments orders={orders} />} />
            <Route path="/customers" element={<Customers orders={orders} />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/banners" element={<Banners />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
