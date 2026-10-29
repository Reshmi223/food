import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import {
  Sun, Moon, Leaf, Heart, HeartHandshake, MapPin, Clock, Phone,
  User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  CheckCircle2, XCircle, AlertTriangle, Bell, BellRing,
  Package, Calendar, Users, Home, LogOut, Search, Filter,
  Utensils, Truck, X, Menu, ChevronRight, Sparkles
} from 'lucide-react';

// ==================== TYPES ====================
type Role = 'donor' | 'acceptor' | null;
type Page = 'login' | 'donor-dashboard' | 'acceptor-dashboard';

interface UserAccount {
  id: string;
  role: 'donor' | 'acceptor';
  name: string;
  email: string;
  phone: string;
  address: string;
  locality: string;
  password: string;
}

interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone: string;
  donorAddress: string;
  locality: string;
  foodType: string;
  quantity: string;
  servings: number;
  preparationDate: string;
  expiryTime: string;
  foodCondition: 'fresh' | 'packed' | 'cooked';
  specialNotes: string;
  status: 'available' | 'claimed' | 'picked-up' | 'expired';
  claimedBy?: string;
  claimedByName?: string;
  createdAt: string;
  image?: string;
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'new-food' | 'claimed' | 'picked-up' | 'expired';
  read: boolean;
  createdAt: string;
}

// ==================== CONTEXT ====================
interface AppContextType {
  theme: string;
  toggleTheme: () => void;
  currentUser: UserAccount | null;
  setCurrentUser: (user: UserAccount | null) => void;
  donations: FoodDonation[];
  setDonations: React.Dispatch<React.SetStateAction<FoodDonation[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  users: UserAccount[];
  addDonation: (d: Omit<FoodDonation, 'id' | 'createdAt' | 'status'>) => void;
  claimDonation: (donationId: string) => void;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
}

const AppContext = createContext<AppContextType>({} as AppContextType);
function useApp() { return useContext(AppContext); }

// ==================== HELPERS ====================
const genId = () => Math.random().toString(36).slice(2, 11);

const FOOD_EMOJIS: Record<string, string> = {
  'Rice & Curry': '🍛', 'Bread & Vegetables': '🥖', 'Fruits': '🍎',
  'Salad': '🥗', 'Baked Goods': '🥐', 'Soup': '🍲',
  'Sandwiches': '🥪', 'Pasta': '🍝', 'Other': '🍽️'
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ==================== TOAST ====================
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
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm animate-[slideIn_0.3s_ease] ${c.bg}`}>
      {c.icon}
      <span className={`text-sm font-medium ${c.text}`}>{message}</span>
      <button onClick={onClose} className="ml-1 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Close">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ==================== LOGIN PAGE ====================
function LoginPage() {
  const { setCurrentUser, users } = useApp();
  const [role, setRole] = useState<Role>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', locality: '', password: ''
  });

  const handleLogin = () => {
    const user = users.find(u => u.email === form.email && u.password === form.password && u.role === role);
    if (user) {
      setCurrentUser(user);
      setToast({ type: 'success', message: `Welcome back, ${user.name}!` });
    } else {
      setToast({ type: 'error', message: 'Invalid email or password' });
    }
  };

  const handleRegister = () => {
    if (!form.name || !form.email || !form.phone || !form.address || !form.locality || !form.password) {
      setToast({ type: 'error', message: 'Please fill in all fields' });
      return;
    }
    if (users.find(u => u.email === form.email)) {
      setToast({ type: 'error', message: 'Email already registered' });
      return;
    }
    const newUser: UserAccount = {
      id: genId(),
      role: role!,
      ...form,
    };
    setCurrentUser(newUser);
    setToast({ type: 'success', message: 'Account created successfully!' });
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 transition-theme">
        <div className="w-full max-w-md">
          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden mb-6 shadow-lg">
            <img
              src="https://image.qwenlm.ai/generated-images/b1042c90-754d-43f4-9803-4f19542c1174/_result.png"
              alt="Hands sharing food"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-bold text-white">ShareMeal</h1>
              <p className="text-white/90 text-sm">Share food, share love. No one goes hungry.</p>
            </div>
          </div>

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-forest mb-3 shadow-lg shadow-forest/20">
              <HeartHandshake className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">How would you like to help?</h2>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <button
              onClick={() => setRole('donor')}
              className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 text-left hover:border-forest hover:shadow-lg hover:shadow-forest/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-forest/10 flex items-center justify-center group-hover:bg-forest group-hover:text-white transition-colors">
                  <Heart className="w-7 h-7 text-forest group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">I'm a Donor</h3>
                  <p className="text-sm text-[var(--text-muted)]">I have food to share with those in need</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-forest transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setRole('acceptor')}
              className="w-full bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl p-6 text-left hover:border-forest hover:shadow-lg hover:shadow-forest/10 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-cream dark:bg-forest/10 flex items-center justify-center group-hover:bg-forest group-hover:text-white transition-colors">
                  <Users className="w-7 h-7 text-forest group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">I'm an Acceptor</h3>
                  <p className="text-sm text-[var(--text-muted)]">I need food or want to collect donations</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-forest transition-colors" />
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-muted)] mt-8">
            Together we can reduce food waste and feed the hungry 🌱
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 transition-theme">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => { setRole(null); setIsRegister(false); setForm({ name: '', email: '', phone: '', address: '', locality: '', password: '' }); }}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-forest mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to role selection
        </button>

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 lg:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${role === 'donor' ? 'bg-forest/10' : 'bg-cream dark:bg-forest/10'}`}>
              {role === 'donor' ? <Heart className="w-6 h-6 text-forest" /> : <Users className="w-6 h-6 text-forest" />}
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {role === 'donor' ? 'Food Donor' : 'Food Acceptor'} {isRegister ? 'Registration' : 'Login'}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Address</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Street address"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Locality / Area</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={form.locality}
                      onChange={e => setForm({ ...form, locality: e.target.value })}
                      placeholder="e.g., Downtown, North Side, Sector 5"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">We'll notify you when food is available in your area</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={isRegister ? handleRegister : handleLogin}
              className="w-full py-3 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors shadow-md shadow-forest/20 mt-2"
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-forest hover:text-forest-dark font-medium transition-colors"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== DONOR DASHBOARD ====================
function DonorDashboard() {
  const { currentUser, donations, setDonations, setCurrentUser, addNotification, users } = useApp();
  const [tab, setTab] = useState<'donate' | 'history'>('donate');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const [form, setForm] = useState({
    foodType: 'Rice & Curry',
    quantity: '',
    servings: '',
    preparationDate: '',
    expiryTime: '',
    foodCondition: 'fresh' as 'fresh' | 'packed' | 'cooked',
    specialNotes: '',
  });

  const myDonations = donations.filter(d => d.donorId === currentUser?.id);

  const handleDonate = () => {
    if (!form.quantity || !form.servings || !form.preparationDate || !form.expiryTime) {
      setToast({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    const newDonation: Omit<FoodDonation, 'id' | 'createdAt' | 'status'> = {
      donorId: currentUser!.id,
      donorName: currentUser!.name,
      donorPhone: currentUser!.phone,
      donorAddress: currentUser!.address,
      locality: currentUser!.locality,
      ...form,
      servings: parseInt(form.servings),
    };

    // Add donation
    const donation: FoodDonation = {
      ...newDonation,
      id: genId(),
      createdAt: new Date().toISOString(),
      status: 'available',
    };
    setDonations(prev => [donation, ...prev]);

    // Notify acceptors in the same locality
    const acceptorsInArea = users.filter(u => u.role === 'acceptor' && u.locality.toLowerCase() === currentUser!.locality.toLowerCase());
    acceptorsInArea.forEach(acceptor => {
      addNotification({
        userId: acceptor.id,
        title: '🍽️ Food Available Nearby!',
        message: `${form.quantity} of ${form.foodType} is available in ${currentUser!.locality}. ${form.servings} servings.`,
        type: 'new-food',
      });
    });

    setForm({ foodType: 'Rice & Curry', quantity: '', servings: '', preparationDate: '', expiryTime: '', foodCondition: 'fresh', specialNotes: '' });
    setToast({ type: 'success', message: 'Food donation listed successfully!' });
    setTab('history');
  };

  const myNotifications = useApp().notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-theme">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">ShareMeal</h1>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block">Donor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2.5 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-[var(--border-color)]">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {myNotifications.length === 0 ? (
                      <p className="p-4 text-sm text-[var(--text-muted)] text-center">No notifications yet</p>
                    ) : (
                      myNotifications.slice(0, 5).map(n => (
                        <div key={n.id} className={`p-3 border-b border-[var(--border-color)] last:border-0 ${!n.read ? 'bg-forest/5' : ''}`}>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.message}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[var(--border-color)]">
              <div className="w-8 h-8 rounded-lg bg-forest/10 flex items-center justify-center text-forest text-sm font-bold">
                {currentUser?.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{currentUser?.name}</span>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('donate')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'donate' ? 'bg-forest text-white shadow-md shadow-forest/20' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-forest/30'}`}
          >
            <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Donate Food</span>
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'history' ? 'bg-forest text-white shadow-md shadow-forest/20' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-forest/30'}`}
          >
            <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> My Donations</span>
          </button>
        </div>

        {tab === 'donate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donation Form */}
            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Donate Food</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Fill in the details about the food you'd like to share</p>

              <div className="space-y-5">
                {/* Food Type */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Food Type *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {Object.entries(FOOD_EMOJIS).map(([type, emoji]) => (
                      <button
                        key={type}
                        onClick={() => setForm({ ...form, foodType: type })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${form.foodType === type ? 'border-forest bg-forest/5 shadow-sm' : 'border-[var(--border-color)] hover:border-forest/30'}`}
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-[10px] font-medium text-[var(--text-secondary)] leading-tight">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & Servings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Quantity *</label>
                    <input
                      type="text"
                      value={form.quantity}
                      onChange={e => setForm({ ...form, quantity: e.target.value })}
                      placeholder="e.g., 2 kg, 5 plates"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Number of Servings *</label>
                    <input
                      type="number"
                      value={form.servings}
                      onChange={e => setForm({ ...form, servings: e.target.value })}
                      placeholder="e.g., 10"
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Preparation Date *</label>
                    <input
                      type="date"
                      value={form.preparationDate}
                      onChange={e => setForm({ ...form, preparationDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Best Before / Expiry *</label>
                    <input
                      type="time"
                      value={form.expiryTime}
                      onChange={e => setForm({ ...form, expiryTime: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                    />
                  </div>
                </div>

                {/* Food Condition */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Food Condition</label>
                  <div className="flex gap-3">
                    {(['fresh', 'packed', 'cooked'] as const).map(cond => (
                      <button
                        key={cond}
                        onClick={() => setForm({ ...form, foodCondition: cond })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all capitalize ${form.foodCondition === cond ? 'border-forest bg-forest/5 text-forest' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-forest/30'}`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Notes */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Special Notes</label>
                  <textarea
                    value={form.specialNotes}
                    onChange={e => setForm({ ...form, specialNotes: e.target.value })}
                    placeholder="Any allergies, dietary info, pickup instructions..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all resize-none"
                  />
                </div>

                {/* Pickup Info */}
                <div className="bg-cream dark:bg-forest/5 rounded-xl p-4 border border-cream-dark dark:border-forest/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-forest" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Pickup Location</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{currentUser?.address}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Locality: {currentUser?.locality}</p>
                </div>

                <button
                  onClick={handleDonate}
                  className="w-full py-3 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors shadow-md shadow-forest/20 flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4" /> List Food for Donation
                </button>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Your Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">Total Donations</span>
                    <span className="text-lg font-bold text-forest">{myDonations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">People Fed</span>
                    <span className="text-lg font-bold text-forest">{myDonations.reduce((sum, d) => sum + d.servings, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-muted)]">Available Now</span>
                    <span className="text-lg font-bold text-forest">{myDonations.filter(d => d.status === 'available').length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-cream dark:bg-forest/5 rounded-2xl p-5 border border-cream-dark dark:border-forest/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-forest" />
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Guidelines</h3>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> Food should be fresh and hygienic</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> Pack food properly in containers</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> Mention any allergens clearly</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" /> Set accurate expiry times</li>
                  <li className="flex items-start gap-2"><XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" /> No spoiled or expired food</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Donation History */
          <div className="space-y-4">
            {myDonations.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-16 text-center">
                <Package className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No donations yet</h3>
                <p className="text-sm text-[var(--text-muted)]">Start by listing food for donation</p>
                <button onClick={() => setTab('donate')} className="mt-4 px-5 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors">
                  Donate Now
                </button>
              </div>
            ) : (
              myDonations.map(d => (
                <div key={d.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cream dark:bg-forest/10 flex items-center justify-center text-2xl">
                        {FOOD_EMOJIS[d.foodType] || '🍽️'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{d.foodType}</h4>
                        <p className="text-xs text-[var(--text-muted)]">{d.quantity} • {d.servings} servings</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Listed {timeAgo(d.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={d.status} />
                      {d.claimedByName && (
                        <span className="text-xs text-[var(--text-muted)]">Claimed by {d.claimedByName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ==================== ACCEPTOR DASHBOARD ====================
function AcceptorDashboard() {
  const { currentUser, donations, setDonations, setCurrentUser, notifications, setNotifications, addNotification } = useApp();
  const [tab, setTab] = useState<'available' | 'my-claims'>('available');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocality, setFilterLocality] = useState('all');

  const myClaims = donations.filter(d => d.claimedBy === currentUser?.id);
  const myNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  // Available donations (not claimed, not expired)
  const availableDonations = donations.filter(d => d.status === 'available');

  // Filter by locality and search
  const filteredDonations = availableDonations.filter(d => {
    const matchesSearch = !searchQuery || d.foodType.toLowerCase().includes(searchQuery.toLowerCase()) || d.donorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocality = filterLocality === 'all' || d.locality.toLowerCase() === filterLocality.toLowerCase();
    return matchesSearch && matchesLocality;
  });

  // Get unique localities
  const localities = [...new Set(availableDonations.map(d => d.locality))];

  const handleClaim = (donation: FoodDonation) => {
    setDonations(prev => prev.map(d =>
      d.id === donation.id ? { ...d, status: 'claimed' as const, claimedBy: currentUser!.id, claimedByName: currentUser!.name } : d
    ));
    // Notify donor
    addNotification({
      userId: donation.donorId,
      title: '✅ Donation Claimed!',
      message: `${currentUser!.name} has claimed your ${donation.foodType} donation.`,
      type: 'claimed',
    });
    setToast({ type: 'success', message: `You claimed ${donation.foodType}! Contact the donor to arrange pickup.` });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => n.userId === currentUser?.id ? { ...n, read: true } : n));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-theme">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-card)]/90 backdrop-blur-xl border-b border-[var(--border-color)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">ShareMeal</h1>
              <p className="text-xs text-[var(--text-muted)] hidden sm:block">Acceptor Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
                className="relative p-2.5 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
                aria-label="Notifications"
              >
                {unreadCount > 0 ? <BellRing className="w-5 h-5 text-forest" /> : <Bell className="w-5 h-5 text-[var(--text-secondary)]" />}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs text-forest font-medium">{unreadCount} new</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {myNotifications.length === 0 ? (
                      <p className="p-6 text-sm text-[var(--text-muted)] text-center">No notifications yet. We'll alert you when food is available nearby!</p>
                    ) : (
                      myNotifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`p-3 border-b border-[var(--border-color)] last:border-0 ${!n.read ? 'bg-forest/5' : ''}`}>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{n.message}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[var(--border-color)]">
              <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-forest text-sm font-bold">
                {currentUser?.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">{currentUser?.name}</span>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-muted)] hover:text-red-500 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Notification Banner for new food */}
        {myNotifications.filter(n => n.type === 'new-food' && !n.read).length > 0 && tab === 'available' && (
          <div className="mb-6 bg-cream dark:bg-forest/10 border border-cream-dark dark:border-forest/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-forest" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                🎉 New food available in your area!
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {myNotifications.filter(n => n.type === 'new-food' && !n.read).length} new donation(s) listed nearby
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('available')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'available' ? 'bg-forest text-white shadow-md shadow-forest/20' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-forest/30'}`}
          >
            <span className="flex items-center gap-2"><Utensils className="w-4 h-4" /> Available Food</span>
          </button>
          <button
            onClick={() => setTab('my-claims')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'my-claims' ? 'bg-forest text-white shadow-md shadow-forest/20' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-forest/30'}`}
          >
            <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> My Claims</span>
            {myClaims.length > 0 && (
              <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${tab === 'my-claims' ? 'bg-white/20' : 'bg-forest/10 text-forest'}`}>{myClaims.length}</span>
            )}
          </button>
        </div>

        {tab === 'available' ? (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search food type or donor..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <select
                  value={filterLocality}
                  onChange={e => setFilterLocality(e.target.value)}
                  className="pl-10 pr-8 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All Localities</option>
                  {localities.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Available Donations Grid */}
            {filteredDonations.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-16 text-center">
                <Utensils className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No food available</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {searchQuery || filterLocality !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Check back soon — donors will list food in your area!'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDonations.map(d => (
                  <div key={d.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-cream dark:bg-forest/10 flex items-center justify-center text-3xl flex-shrink-0">
                        {FOOD_EMOJIS[d.foodType] || '🍽️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-semibold text-[var(--text-primary)]">{d.foodType}</h4>
                          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{timeAgo(d.createdAt)}</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">{d.quantity} • {d.servings} servings</p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
                          <MapPin className="w-3 h-3" />
                          {d.locality}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[var(--text-muted)]">
                          <User className="w-3 h-3" />
                          {d.donorName}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-forest/10 text-forest font-medium capitalize">{d.foodCondition}</span>
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Before {d.expiryTime}
                          </span>
                        </div>
                        {d.specialNotes && (
                          <p className="text-xs text-[var(--text-muted)] mt-2 italic">"{d.specialNotes}"</p>
                        )}
                        <button
                          onClick={() => handleClaim(d)}
                          className="mt-4 w-full py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors flex items-center justify-center gap-2"
                        >
                          <Heart className="w-4 h-4" /> Claim This Food
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* My Claims */
          <div className="space-y-4">
            {myClaims.length === 0 ? (
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-16 text-center">
                <Heart className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No claims yet</h3>
                <p className="text-sm text-[var(--text-muted)]">Browse available food donations and claim what you need</p>
                <button onClick={() => setTab('available')} className="mt-4 px-5 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors">
                  Browse Food
                </button>
              </div>
            ) : (
              myClaims.map(d => (
                <div key={d.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cream dark:bg-forest/10 flex items-center justify-center text-2xl">
                        {FOOD_EMOJIS[d.foodType] || '🍽️'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">{d.foodType}</h4>
                        <p className="text-xs text-[var(--text-muted)]">{d.quantity} • {d.servings} servings</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <User className="w-3 h-3" /> {d.donorName}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {d.donorPhone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <MapPin className="w-3 h-3" />
                      <span>Pickup: {d.donorAddress}, {d.locality}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ==================== STATUS BADGE ====================
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    'available': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
    'claimed': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    'picked-up': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
    'expired': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  };
  const c = config[status] || config['available'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [theme, setTheme] = useState('light');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('sharemeal-users');
    return saved ? JSON.parse(saved) : [];
  });
  const [donations, setDonations] = useState<FoodDonation[]>(() => {
    const saved = localStorage.getItem('sharemeal-donations');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('sharemeal-notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist data
  useEffect(() => { localStorage.setItem('sharemeal-users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('sharemeal-donations', JSON.stringify(donations)); }, [donations]);
  useEffect(() => { localStorage.setItem('sharemeal-notifications', JSON.stringify(notifications)); }, [notifications]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // When a new user registers, save them
  const handleSetCurrentUser = useCallback((user: UserAccount | null) => {
    if (user && !users.find(u => u.id === user.id)) {
      setUsers(prev => [...prev, user]);
    }
    setCurrentUser(user);
  }, [users]);

  const addDonation = useCallback((d: Omit<FoodDonation, 'id' | 'createdAt' | 'status'>) => {
    const donation: FoodDonation = { ...d, id: genId(), createdAt: new Date().toISOString(), status: 'available' };
    setDonations(prev => [donation, ...prev]);
  }, []);

  const claimDonation = useCallback((donationId: string) => {
    if (!currentUser) return;
    setDonations(prev => prev.map(d =>
      d.id === donationId ? { ...d, status: 'claimed' as const, claimedBy: currentUser.id, claimedByName: currentUser.name } : d
    ));
  }, [currentUser]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const notification: Notification = { ...n, id: genId(), createdAt: new Date().toISOString(), read: false };
    setNotifications(prev => [notification, ...prev]);
  }, []);

  const contextValue: AppContextType = {
    theme, toggleTheme,
    currentUser, setCurrentUser: handleSetCurrentUser,
    donations, setDonations,
    notifications, setNotifications,
    users,
    addDonation, claimDonation, addNotification,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[var(--bg-primary)] transition-theme">
        {/* Theme Toggle - Floating */}
        {!currentUser && (
          <button
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[var(--text-secondary)]" /> : <Sun className="w-5 h-5 text-[var(--text-secondary)]" />}
          </button>
        )}

        {/* Route */}
        {!currentUser ? (
          <LoginPage />
        ) : currentUser.role === 'donor' ? (
          <DonorDashboard />
        ) : (
          <AcceptorDashboard />
        )}
      </div>
    </AppContext.Provider>
  );
}
