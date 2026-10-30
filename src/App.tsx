import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import {
  Leaf, Sun, Moon, Bell, Search, Menu, X, Heart, MapPin, Clock,
  Users, Package, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  LogOut, Utensils, Apple, ChefHat, Filter, Phone, Mail, User as UserIcon,
  Building2, Calendar, Weight, Info, Gift, Sparkles, ChevronRight,
  Trash2, Eye
} from 'lucide-react';

// ============ TYPES ============
type Role = 'donor' | 'acceptor';
type AuthMode = 'login' | 'register';
type Page = 'auth' | 'donor' | 'acceptor';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  locality: string;
  role: Role;
  organization?: string;
}

interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorLocality: string;
  foodType: string;
  quantity: string;
  serves: number;
  isVeg: boolean;
  preparedOn: string;
  bestBefore: string;
  packaging: string;
  pickupMethod: 'pickup' | 'dropoff' | 'either';
  notes: string;
  status: 'available' | 'claimed' | 'expired';
  claimedBy?: string;
  createdAt: string;
}

interface Notification {
  id: string;
  acceptorId: string;
  donationId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ============ CONTEXT ============
interface AppContextType {
  theme: string;
  toggleTheme: () => void;
  user: User | null;
  setUser: (u: User | null) => void;
  donations: FoodDonation[];
  addDonation: (d: Omit<FoodDonation, 'id' | 'createdAt' | 'status'>) => void;
  claimDonation: (id: string) => void;
  deleteDonation: (id: string) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  showToast: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);
const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext');
  return ctx;
};

// ============ HELPERS ============
const uid = () => Math.random().toString(36).slice(2, 11);
const LS = {
  get: <T,>(k: string, d: T): T => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; }
  },
  set: (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

// ============ TOAST ============
function Toast({ type, message, onClose }: { type: 'success' | 'error' | 'warning'; message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, text: 'text-green-800 dark:text-green-200' },
    error: { bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800', icon: <XCircle className="w-5 h-5 text-red-600" />, text: 'text-red-800 dark:text-red-200' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, text: 'text-amber-800 dark:text-amber-200' },
  };
  const c = config[type];

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${c.bg} animate-slide-in`}>
      {c.icon}
      <span className={`text-sm font-medium ${c.text}`}>{message}</span>
      <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============ AUTH PAGE ============
function AuthPage() {
  const { setUser, showToast } = useApp();
  const [mode, setMode] = useState<AuthMode>('login');
  const [role, setRole] = useState<Role>('donor');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', locality: '', organization: '', password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === 'register') {
      if (!form.name.trim()) e.name = 'Name is required';
      if (!form.phone.trim()) e.phone = 'Phone is required';
      else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone';
      if (!form.locality.trim()) e.locality = 'Locality is required';
      if (role === 'acceptor' && !form.organization.trim()) e.organization = 'Organization name is required';
    }
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password.trim()) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    const users = LS.get<Record<string, User>>('ff_users', {});

    if (mode === 'register') {
      if (users[form.email]) {
        showToast('error', 'An account with this email already exists');
        return;
      }
      const newUser: User = {
        id: uid(),
        name: form.name,
        email: form.email,
        phone: form.phone,
        locality: form.locality,
        role,
        organization: role === 'acceptor' ? form.organization : undefined,
      };
      users[form.email] = newUser;
      LS.set('ff_users', users);
      LS.set('ff_current_user', newUser);
      setUser(newUser);
      showToast('success', `Welcome to FreshFlow, ${newUser.name}!`);
    } else {
      const user = users[form.email];
      if (!user) {
        showToast('error', 'No account found with this email');
        return;
      }
      LS.set('ff_current_user', user);
      setUser(user);
      showToast('success', `Welcome back, ${user.name}!`);
    }
  };

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)]">
      {/* Left side - Branding */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-forest via-forest to-forest-light p-8 lg:p-16 flex flex-col justify-between text-white min-h-[280px] lg:min-h-screen">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FreshFlow</h1>
              <p className="text-xs text-white/70">Nourish • Share • Sustain</p>
            </div>
          </div>
          <div className="hidden lg:block max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-4">
              No food should go to waste.
            </h2>
            <p className="text-white/80 text-lg">
              Connect donors with those in need. Every meal shared is a step toward a hunger-free community.
            </p>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block">
          <div className="flex gap-6">
            {[
              { icon: <Gift className="w-5 h-5" />, label: '500+ Donations' },
              { icon: <Users className="w-5 h-5" />, label: '200+ Families' },
              { icon: <Heart className="w-5 h-5" />, label: 'Zero Waste' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/90">
                {s.icon}
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white/5" />
      </div>

      {/* Right side - Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">FreshFlow</h1>
          </div>

          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-[var(--text-muted)] mb-8">
            {mode === 'login' ? 'Sign in to continue your journey of sharing.' : 'Join the movement to end food waste.'}
          </p>

          {/* Role selector (only in register) */}
          {mode === 'register' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('donor')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    role === 'donor'
                      ? 'border-forest bg-forest/5'
                      : 'border-[var(--border-color)] hover:border-forest/40'
                  }`}
                >
                  <ChefHat className={`w-6 h-6 mb-2 ${role === 'donor' ? 'text-forest' : 'text-[var(--text-muted)]'}`} />
                  <p className={`font-semibold ${role === 'donor' ? 'text-forest' : 'text-[var(--text-primary)]'}`}>Donate Food</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">I have food to share</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('acceptor')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    role === 'acceptor'
                      ? 'border-forest bg-forest/5'
                      : 'border-[var(--border-color)] hover:border-forest/40'
                  }`}
                >
                  <Gift className={`w-6 h-6 mb-2 ${role === 'acceptor' ? 'text-forest' : 'text-[var(--text-muted)]'}`} />
                  <p className={`font-semibold ${role === 'acceptor' ? 'text-forest' : 'text-[var(--text-primary)]'}`}>Receive Food</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">I need food for my community</p>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <FormField label="Full Name" icon={<UserIcon className="w-4 h-4" />} error={errors.name}>
                  <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Doe" className="form-input" />
                </FormField>
                <FormField label="Phone Number" icon={<Phone className="w-4 h-4" />} error={errors.phone}>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="9876543210" className="form-input" />
                </FormField>
                <FormField label="Your Locality / Area" icon={<MapPin className="w-4 h-4" />} error={errors.locality}>
                  <input type="text" value={form.locality} onChange={e => update('locality', e.target.value)} placeholder="e.g. Koramangala, Bengaluru" className="form-input" />
                </FormField>
                {role === 'acceptor' && (
                  <FormField label="Organization / NGO Name" icon={<Building2 className="w-4 h-4" />} error={errors.organization}>
                    <input type="text" value={form.organization} onChange={e => update('organization', e.target.value)} placeholder="e.g. Akshaya Patra" className="form-input" />
                  </FormField>
                )}
              </>
            )}

            <FormField label="Email Address" icon={<Mail className="w-4 h-4" />} error={errors.email}>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@example.com" className="form-input" />
            </FormField>
            <FormField label="Password" icon={<XCircle className="w-4 h-4" />} error={errors.password}>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="••••••••" className="form-input" />
            </FormField>

            <button
              type="submit"
              className="w-full py-3 bg-forest text-white rounded-xl font-semibold hover:bg-forest-dark transition-colors shadow-md shadow-forest/20 flex items-center justify-center gap-2"
            >
              {mode === 'login' ? 'Sign In' : `Create ${role === 'donor' ? 'Donor' : 'Acceptor'} Account`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
              className="text-forest font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, icon, error, children }: { label: string; icon?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</span>}
        <div className={icon ? 'pl-10' : ''}>{children}</div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ============ HEADER ============
function Header() {
  const { theme, toggleTheme, user, setUser, notifications } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
      <div className="flex items-center gap-4 px-4 lg:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">FreshFlow</h1>
          </div>
        </div>

        <div className="flex-1" />

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(s => !s)}
            className="relative p-2.5 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>
          {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-[var(--text-secondary)]" /> : <Sun className="w-5 h-5 text-[var(--text-secondary)]" />}
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-[var(--border-color)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest to-forest-light flex items-center justify-center text-white text-sm font-semibold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role}</p>
          </div>
          <button
            onClick={() => { localStorage.removeItem('ff_current_user'); setUser(null); }}
            className="p-2 rounded-xl hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, clearNotifications } = useApp();

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xl z-50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className="text-xs text-forest hover:underline">Clear all</button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
            </div>
          ) : (
            notifications.slice().reverse().map(n => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`w-full text-left p-4 border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors ${!n.read ? 'bg-forest/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-forest text-white' : 'bg-[var(--hover-bg)] text-[var(--text-muted)]'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>{n.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-forest flex-shrink-0 mt-2" />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ============ DONOR DASHBOARD ============
function DonorDashboard() {
  const { user, donations, addDonation, deleteDonation, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    foodType: '', quantity: '', serves: '', isVeg: true,
    preparedOn: '', bestBefore: '', packaging: '',
    pickupMethod: 'pickup' as 'pickup' | 'dropoff' | 'either', notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const myDonations = donations.filter(d => d.donorId === user?.id);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.foodType.trim()) e.foodType = 'Required';
    if (!form.quantity.trim()) e.quantity = 'Required';
    if (!form.serves || Number(form.serves) < 1) e.serves = 'Enter valid number';
    if (!form.preparedOn) e.preparedOn = 'Required';
    if (!form.bestBefore) e.bestBefore = 'Required';
    else if (new Date(form.bestBefore) <= new Date()) e.bestBefore = 'Must be in the future';
    if (!form.packaging.trim()) e.packaging = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || !user) return;
    addDonation({
      donorId: user.id,
      donorName: user.name,
      donorPhone: user.phone,
      donorLocality: user.locality,
      foodType: form.foodType,
      quantity: form.quantity,
      serves: Number(form.serves),
      isVeg: form.isVeg,
      preparedOn: form.preparedOn,
      bestBefore: form.bestBefore,
      packaging: form.packaging,
      pickupMethod: form.pickupMethod,
      notes: form.notes,
    });
    setForm({ foodType: '', quantity: '', serves: '', isVeg: true, preparedOn: '', bestBefore: '', packaging: '', pickupMethod: 'pickup', notes: '' });
    setShowForm(false);
    showToast('success', 'Food listed! Acceptors in your area have been notified.');
  };

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-forest-light p-6 lg:p-8 text-white">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur rounded-full text-xs font-medium mb-3">
            <Heart className="w-3 h-3" /> Thank you for sharing
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">Hello, {user?.name.split(' ')[0]} 👋</h2>
          <p className="text-white/80 text-sm lg:text-base">
            You've shared <span className="font-bold text-white">{myDonations.length}</span> meal{myDonations.length !== 1 ? 's' : ''} with your community. Every donation matters.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-5 px-5 py-2.5 bg-white text-forest rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-2"
          >
            <Package className="w-4 h-4" /> Donate Food Now
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 hidden md:block">
          <Apple className="w-full h-full" />
        </div>
      </div>

      {/* Donation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">List a Food Donation</h3>
                <p className="text-sm text-[var(--text-muted)]">Fill in the details so acceptors know what's available</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[var(--hover-bg)]" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Food type + veg toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Food Type *</label>
                  <input type="text" value={form.foodType} onChange={e => update('foodType', e.target.value)} placeholder="e.g. Cooked Rice & Dal" className="form-input" />
                  {errors.foodType && <p className="text-xs text-red-500 mt-1">{errors.foodType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Quantity *</label>
                  <input type="text" value={form.quantity} onChange={e => update('quantity', e.target.value)} placeholder="e.g. 5 kg, 10 plates" className="form-input" />
                  {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Serves approx. *</label>
                  <input type="number" min="1" value={form.serves} onChange={e => update('serves', e.target.value)} placeholder="Number of people" className="form-input" />
                  {errors.serves && <p className="text-xs text-red-500 mt-1">{errors.serves}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Food Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => update('isVeg', true)} className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.isVeg ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-700' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                      🟢 Veg
                    </button>
                    <button type="button" onClick={() => update('isVeg', false)} className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${!form.isVeg ? 'border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                      🔴 Non-Veg
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Prepared On *</label>
                  <input type="datetime-local" value={form.preparedOn} onChange={e => update('preparedOn', e.target.value)} className="form-input" />
                  {errors.preparedOn && <p className="text-xs text-red-500 mt-1">{errors.preparedOn}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Best Before *</label>
                  <input type="datetime-local" value={form.bestBefore} onChange={e => update('bestBefore', e.target.value)} className="form-input" />
                  {errors.bestBefore && <p className="text-xs text-red-500 mt-1">{errors.bestBefore}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Packaging Details *</label>
                <input type="text" value={form.packaging} onChange={e => update('packaging', e.target.value)} placeholder="e.g. Steel containers, sealed bags" className="form-input" />
                {errors.packaging && <p className="text-xs text-red-500 mt-1">{errors.packaging}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Handover Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pickup', 'dropoff', 'either'] as const).map(m => (
                    <button key={m} type="button" onClick={() => update('pickupMethod', m)} className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all capitalize ${form.pickupMethod === m ? 'border-forest bg-forest/5 text-forest' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                      {m === 'pickup' ? '🚶 Pickup' : m === 'dropoff' ? '🚗 Drop-off' : '🤝 Either'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Additional Notes</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} placeholder="Allergens, spice level, any special instructions..." className="form-input resize-none" />
              </div>

              <div className="bg-cream dark:bg-forest/10 border border-cream-dark dark:border-forest/20 rounded-xl p-4 flex gap-3">
                <MapPin className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Pickup Location</p>
                  <p className="text-sm text-[var(--text-muted)]">{user?.locality}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Acceptors in this locality will be notified</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-[var(--border-color)] rounded-xl font-semibold text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-forest text-white rounded-xl font-semibold hover:bg-forest-dark transition-colors shadow-md shadow-forest/20">
                  List Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* My Donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">My Donations</h3>
          <span className="text-sm text-[var(--text-muted)]">{myDonations.length} total</span>
        </div>

        {myDonations.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl p-12 border border-[var(--border-color)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-forest" />
            </div>
            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No donations yet</h4>
            <p className="text-sm text-[var(--text-muted)] mb-4">Be the first to share a meal in your community!</p>
            <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors">
              List Your First Donation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myDonations.map(d => (
              <DonationCard key={d.id} donation={d} isDonor onDelete={() => deleteDonation(d.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DonationCard({ donation, isDonor, onClaim, onDelete }: { donation: FoodDonation; isDonor?: boolean; onClaim?: () => void; onDelete?: () => void }) {
  const { user } = useApp();
  const isExpired = new Date(donation.bestBefore) < new Date();
  const status = isExpired ? 'expired' : donation.status;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: 'Available', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
    claimed: { label: 'Claimed', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    expired: { label: 'Expired', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/20' },
  };
  const s = statusConfig[status];

  const timeLeft = !isExpired ? getTimeLeft(donation.bestBefore) : null;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${donation.isVeg ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <Utensils className={`w-5 h-5 ${donation.isVeg ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)]">{donation.foodType}</h4>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {donation.donorLocality}
            </p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
          {s.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Weight className="w-4 h-4 text-[var(--text-muted)]" />
          <span>{donation.quantity}</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Users className="w-4 h-4 text-[var(--text-muted)]" />
          <span>Serves {donation.serves}</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="truncate">Prepared {new Date(donation.preparedOn).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Package className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="truncate">{donation.packaging}</span>
        </div>
      </div>

      {timeLeft && status === 'available' && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Best before in <strong>{timeLeft}</strong></span>
        </div>
      )}

      {donation.notes && (
        <p className="text-xs text-[var(--text-muted)] mb-3 italic">"{donation.notes}"</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
        <div className="text-xs text-[var(--text-muted)]">
          <p className="font-medium text-[var(--text-secondary)]">{donation.donorName}</p>
          {isDonor ? (
            <p>📞 {donation.donorPhone}</p>
          ) : (
            <p>📞 {donation.donorPhone} • {donation.pickupMethod}</p>
          )}
        </div>
        <div className="flex gap-2">
          {isDonor && onDelete && status === 'available' && (
            <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors" aria-label="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!isDonor && onClaim && status === 'available' && (
            <button onClick={onClaim} className="px-4 py-2 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Claim
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return `${Math.floor(diff / (1000 * 60))} min`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''}`;
}

// ============ ACCEPTOR DASHBOARD ============
function AcceptorDashboard() {
  const { user, donations, claimDonation, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterVeg, setFilterVeg] = useState<'all' | 'veg' | 'nonveg'>('all');

  const availableInLocality = useMemo(() => {
    return donations.filter(d => {
      if (d.status !== 'available') return false;
      if (new Date(d.bestBefore) < new Date()) return false;
      const matchLocality = d.donorLocality.toLowerCase() === user?.locality.toLowerCase();
      const matchSearch = !search || d.foodType.toLowerCase().includes(search.toLowerCase());
      const matchVeg = filterVeg === 'all' || (filterVeg === 'veg' ? d.isVeg : !d.isVeg);
      return matchLocality && matchSearch && matchVeg;
    });
  }, [donations, user, search, filterVeg]);

  const myClaims = donations.filter(d => d.claimedBy === user?.id);

  const handleClaim = (d: FoodDonation) => {
    claimDonation(d.id);
    showToast('success', `You claimed "${d.foodType}". Contact ${d.donorName} at ${d.donorPhone}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cream to-cream-dark dark:from-forest/20 dark:to-forest/10 p-6 lg:p-8 border border-cream-dark dark:border-forest/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-forest/10 rounded-full text-xs font-medium text-forest mb-3">
            <MapPin className="w-3 h-3" /> {user?.locality}
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2">Food available near you</h2>
          <p className="text-[var(--text-secondary)] text-sm lg:text-base">
            <span className="font-bold text-forest">{availableInLocality.length}</span> donation{availableInLocality.length !== 1 ? 's' : ''} in your locality. Claim one to feed your community.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border-color)]">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search food type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'veg', 'nonveg'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterVeg(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterVeg === f
                    ? 'bg-forest text-white shadow-md shadow-forest/20'
                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-forest/30'
                }`}
              >
                {f === 'all' ? '🍽️ All' : f === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Available donations */}
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-forest" /> Available Now
        </h3>
        {availableInLocality.length === 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl p-12 border border-[var(--border-color)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-forest" />
            </div>
            <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              {search || filterVeg !== 'all' ? 'No matching donations' : 'No food available yet'}
            </h4>
            <p className="text-sm text-[var(--text-muted)]">
              {search || filterVeg !== 'all'
                ? 'Try adjusting your filters'
                : "You'll be notified as soon as a donor in your locality lists food"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableInLocality.map(d => (
              <DonationCard key={d.id} donation={d} onClaim={() => handleClaim(d)} />
            ))}
          </div>
        )}
      </div>

      {/* My Claims */}
      {myClaims.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-forest" /> My Claims
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClaims.map(d => (
              <DonationCard key={d.id} donation={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [theme, setTheme] = useState<string>(() => LS.get('ff_theme', 'light'));
  const [user, setUser] = useState<User | null>(() => LS.get<User | null>('ff_current_user', null));
  const [donations, setDonations] = useState<FoodDonation[]>(() => LS.get<FoodDonation[]>('ff_donations', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => LS.get<Notification[]>('ff_notifications', []));
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
    LS.set('ff_theme', theme);
  }, [theme]);

  useEffect(() => { LS.set('ff_donations', donations); }, [donations]);
  useEffect(() => { LS.set('ff_notifications', notifications); }, [notifications]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
  };

  const addDonation = (d: Omit<FoodDonation, 'id' | 'createdAt' | 'status'>) => {
    const newDonation: FoodDonation = {
      ...d,
      id: uid(),
      status: 'available',
      createdAt: new Date().toISOString(),
    };
    setDonations(prev => [newDonation, ...prev]);

    // Notify all acceptors in the same locality
    const users = LS.get<Record<string, User>>('ff_users', {});
    const acceptorsInLocality = Object.values(users).filter(
      u => u.role === 'acceptor' && u.locality.toLowerCase() === d.donorLocality.toLowerCase()
    );
    const newNotifs: Notification[] = acceptorsInLocality.map(a => ({
      id: uid(),
      acceptorId: a.id,
      donationId: newDonation.id,
      title: '🍽️ New food available!',
      message: `${d.donorName} donated ${d.quantity} of ${d.foodType} in ${d.donorLocality}. Serves ${d.serves} people.`,
      read: false,
      createdAt: new Date().toISOString(),
    }));
    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs]);
    }
  };

  const claimDonation = (id: string) => {
    if (!user) return;
    setDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'claimed' as const, claimedBy: user.id } : d));
  };

  const deleteDonation = (id: string) => {
    setDonations(prev => prev.filter(d => d.id !== id));
    showToast('success', 'Donation removed');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    if (!user) return;
    setNotifications(prev => prev.filter(n => n.acceptorId !== user.id));
  };

  const ctx: AppContextType = {
    theme, toggleTheme, user, setUser,
    donations, addDonation, claimDonation, deleteDonation,
    notifications, markNotificationRead, clearNotifications,
    showToast,
  };

  return (
    <AppContext.Provider value={ctx}>
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #176B45;
          box-shadow: 0 0 0 3px rgba(23, 107, 69, 0.15);
        }
        .form-input::placeholder { color: var(--text-muted); }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
        *:focus-visible { outline: 2px solid #176B45; outline-offset: 2px; border-radius: 4px; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 3px; }
      `}</style>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {!user ? (
        <AuthPage />
      ) : (
        <div className="min-h-screen bg-[var(--bg-primary)] transition-theme">
          <Header />
          <main className="max-w-7xl mx-auto p-4 lg:p-6">
            {user.role === 'donor' ? <DonorDashboard /> : <AcceptorDashboard />}
          </main>
        </div>
      )}
    </AppContext.Provider>
  );
}
