import { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Settings, 
  Sun, Moon, Bell, Search, Menu, X, Leaf, ChevronRight,
  AlertTriangle, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight,
  Truck, Clock, MapPin, Users, BarChart3, Apple
} from 'lucide-react';

// Theme Context
const ThemeContext = createContext<{ theme: string; toggleTheme: () => void }>({
  theme: 'light',
  toggleTheme: () => {}
});

function useTheme() {
  return useContext(ThemeContext);
}

// Types
type Page = 'dashboard' | 'inventory' | 'orders' | 'analytics';

interface StatCard {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  unit: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  supplier: string;
  lastUpdated: string;
}

interface Order {
  id: string;
  customer: string;
  items: number;
  total: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

// Mock Data
const inventoryData: InventoryItem[] = [
  { id: 1, name: 'Organic Tomatoes', category: 'Vegetables', stock: 245, unit: 'kg', status: 'in-stock', supplier: 'Green Valley Farm', lastUpdated: '2 hours ago' },
  { id: 2, name: 'Fresh Basil', category: 'Herbs', stock: 12, unit: 'bunches', status: 'low-stock', supplier: 'Herb Garden Co.', lastUpdated: '1 hour ago' },
  { id: 3, name: 'Avocados', category: 'Fruits', stock: 0, unit: 'kg', status: 'out-of-stock', supplier: 'Tropical Imports', lastUpdated: '30 min ago' },
  { id: 4, name: 'Wild Salmon', category: 'Seafood', stock: 89, unit: 'kg', status: 'in-stock', supplier: 'Pacific Catch', lastUpdated: '4 hours ago' },
  { id: 5, name: 'Free-Range Eggs', category: 'Dairy & Eggs', stock: 8, unit: 'trays', status: 'low-stock', supplier: 'Sunny Meadow', lastUpdated: '45 min ago' },
  { id: 6, name: 'Quinoa', category: 'Grains', stock: 156, unit: 'kg', status: 'in-stock', supplier: 'Andean Grains', lastUpdated: '1 day ago' },
  { id: 7, name: 'Greek Yogurt', category: 'Dairy & Eggs', stock: 42, unit: 'tubs', status: 'in-stock', supplier: 'Mediterranean Dairy', lastUpdated: '3 hours ago' },
  { id: 8, name: 'Truffle Oil', category: 'Oils & Vinegars', stock: 0, unit: 'bottles', status: 'out-of-stock', supplier: 'Italian Imports', lastUpdated: '2 days ago' },
];

const ordersData: Order[] = [
  { id: 'ORD-7291', customer: 'The Green Kitchen', items: 12, total: '$1,240.00', status: 'delivered', date: 'Today, 2:30 PM' },
  { id: 'ORD-7290', customer: 'Sunrise Café', items: 8, total: '$856.00', status: 'shipped', date: 'Today, 11:15 AM' },
  { id: 'ORD-7289', customer: 'Harvest Table', items: 24, total: '$2,180.00', status: 'processing', date: 'Today, 9:00 AM' },
  { id: 'ORD-7288', customer: 'Urban Bistro', items: 6, total: '$445.00', status: 'pending', date: 'Yesterday, 4:20 PM' },
  { id: 'ORD-7287', customer: 'Root & Branch', items: 15, total: '$1,650.00', status: 'delivered', date: 'Yesterday, 1:45 PM' },
  { id: 'ORD-7286', customer: 'The Garden Plate', items: 10, total: '$920.00', status: 'delivered', date: 'Yesterday, 10:30 AM' },
];

// Components
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    'in-stock': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
    'low-stock': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    'out-of-stock': { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
    'pending': { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    'processing': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
    'shipped': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
    'delivered': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  };
  const c = config[status] || config['pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

function Toast({ type, message, onClose }: { type: 'success' | 'error' | 'warning'; message: string; onClose: () => void }) {
  const config = {
    success: { bg: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800', icon: <CheckCircle2 className="w-5 h-5 text-green-600" />, text: 'text-green-800 dark:text-green-200' },
    error: { bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800', icon: <XCircle className="w-5 h-5 text-red-600" />, text: 'text-red-800 dark:text-red-200' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, text: 'text-amber-800 dark:text-amber-200' },
  };
  const c = config[type];
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${c.bg} animate-slide-in`}>
      {c.icon}
      <span className={`text-sm font-medium ${c.text}`}>{message}</span>
      <button onClick={onClose} className="ml-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors" aria-label="Close notification">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Sidebar({ currentPage, onNavigate, isOpen, onClose }: { currentPage: Page; onNavigate: (page: Page) => void; isOpen: boolean; onClose: () => void }) {
  const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { page: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
    { page: 'orders', label: 'Orders', icon: <ShoppingCart className="w-5 h-5" /> },
    { page: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border-color)]">
            <div className="w-9 h-9 rounded-xl bg-forest flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">FreshFlow</h1>
              <p className="text-xs text-[var(--text-muted)]">Supply Chain</p>
            </div>
            <button className="lg:hidden ml-auto p-1" onClick={onClose} aria-label="Close sidebar">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.page}
                onClick={() => { onNavigate(item.page); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentPage === item.page
                    ? 'bg-forest text-white shadow-md shadow-forest/20'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                }`}
              >
                {item.icon}
                {item.label}
                {item.page === 'orders' && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${currentPage === item.page ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'}`}>
                    3
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="px-3 py-4 border-t border-[var(--border-color)]">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)] transition-all duration-200">
              <Settings className="w-5 h-5" />
              Settings
            </button>
            <div className="mt-4 mx-3 p-4 rounded-xl bg-cream dark:bg-forest/10 border border-cream-dark dark:border-forest/20">
              <div className="flex items-center gap-2 mb-2">
                <Apple className="w-4 h-4 text-forest" />
                <span className="text-xs font-semibold text-forest dark:text-forest-light">Pro Plan</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Unlimited inventory tracking</p>
              <div className="w-full h-1.5 rounded-full bg-forest/20">
                <div className="h-full w-3/4 rounded-full bg-forest" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
      <div className="flex items-center gap-4 px-4 lg:px-6 py-3">
        <button 
          className="lg:hidden p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors" 
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-[var(--text-primary)]" />
        </button>

        {/* Search */}
        <div className={`flex-1 max-w-md relative transition-all duration-200 ${searchFocused ? 'max-w-lg' : ''}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search inventory, orders..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-all"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-[var(--text-secondary)]" /> : <Sun className="w-5 h-5 text-[var(--text-secondary)]" />}
          </button>

          {/* Notifications */}
          <button className="relative p-2.5 rounded-xl hover:bg-[var(--hover-bg)] transition-colors" aria-label="Notifications">
            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* Avatar */}
          <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-[var(--border-color)]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest to-forest-light flex items-center justify-center text-white text-sm font-semibold">
              JD
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-[var(--text-primary)]">Jane Doe</p>
              <p className="text-xs text-[var(--text-muted)]">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const stats: StatCard[] = [
    { title: 'Total Revenue', value: '$48,290', change: 12.5, icon: <TrendingUp className="w-5 h-5" /> },
    { title: 'Active Orders', value: '24', change: -3.2, icon: <ShoppingCart className="w-5 h-5" /> },
    { title: 'Items in Stock', value: '1,847', change: 8.1, icon: <Package className="w-5 h-5" /> },
    { title: 'Suppliers', value: '32', change: 2.4, icon: <Truck className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)]">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
            <Skeleton className="h-5 w-40 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
            <Skeleton className="h-5 w-32 mb-4" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-3 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest to-forest-light p-6 lg:p-8 text-white">
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">Good morning, Jane 👋</h2>
          <p className="text-white/80 text-sm lg:text-base max-w-lg">
            You have 3 pending orders and 2 low-stock alerts. Your supply chain is running smoothly today.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button className="px-4 py-2 bg-white text-forest rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors">
              View Orders
            </button>
            <button className="px-4 py-2 bg-white/15 text-white rounded-xl text-sm font-semibold hover:bg-white/25 transition-colors backdrop-blur-sm">
              Check Alerts
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 lg:opacity-30">
          <img 
            src="https://image.qwenlm.ai/generated-images/7b3b3a72-0979-4e47-a7f1-b22a518cdc5a/_result.png" 
            alt="" 
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="white" />
            <circle cx="150" cy="50" r="40" fill="white" />
            <circle cx="50" cy="150" r="30" fill="white" />
          </svg>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">{stat.title}</span>
              <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest">
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <div className="flex items-center gap-1 mt-2">
              {stat.change > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${stat.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {Math.abs(stat.change)}%
              </span>
              <span className="text-xs text-[var(--text-muted)]">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Revenue Overview</h3>
              <p className="text-sm text-[var(--text-muted)]">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-forest" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-light/40" />
                Orders
              </span>
            </div>
          </div>
          {/* Simple bar chart */}
          <div className="flex items-end gap-3 h-48 px-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const heights = [65, 80, 55, 90, 75, 95, 70];
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <div 
                      className="w-full max-w-[40px] rounded-t-lg bg-forest transition-all duration-500 hover:bg-forest-light cursor-pointer"
                      style={{ height: `${heights[i]}%`, transitionDelay: `${i * 50}ms` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { icon: <Truck className="w-4 h-4" />, text: 'Shipment arrived', time: '2 min ago', color: 'text-forest bg-forest/10' },
              { icon: <Package className="w-4 h-4" />, text: 'New order #7291', time: '15 min ago', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
              { icon: <AlertTriangle className="w-4 h-4" />, text: 'Low stock: Basil', time: '1 hour ago', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
              { icon: <Users className="w-4 h-4" />, text: 'New supplier added', time: '3 hours ago', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
              { icon: <CheckCircle2 className="w-4 h-4" />, text: 'Order #7285 delivered', time: '5 hours ago', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.text}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions - Food Section */}
      <div className="bg-cream dark:bg-cream/5 rounded-2xl p-6 border border-cream-dark dark:border-forest/20">
        <div className="flex items-center gap-2 mb-4">
          <Apple className="w-5 h-5 text-forest" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Fresh Arrivals Today</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Organic Tomatoes', qty: '245 kg', emoji: '🍅' },
            { name: 'Fresh Salmon', qty: '89 kg', emoji: '🐟' },
            { name: 'Avocados', qty: '156 kg', emoji: '🥑' },
            { name: 'Greek Yogurt', qty: '42 tubs', emoji: '🥛' },
          ].map((item, i) => (
            <div key={i} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] hover:shadow-md transition-all duration-200 cursor-pointer">
              <span className="text-3xl mb-2 block">{item.emoji}</span>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{item.qty}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventoryPage() {
  const [filter, setFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [showToast, setShowToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const filtered = filter === 'all' ? inventoryData : inventoryData.filter(item => item.status === filter);

  const handleRestock = (name: string) => {
    setShowToast({ type: 'success', message: `Restock request sent for ${name}` });
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      {showToast && <Toast type={showToast.type} message={showToast.message} onClose={() => setShowToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Inventory</h2>
          <p className="text-sm text-[var(--text-muted)]">Manage your stock levels and suppliers</p>
        </div>
        <button 
          className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors shadow-md shadow-forest/20"
          onClick={() => setShowToast({ type: 'success', message: 'New item added successfully!' })}
        >
          + Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-forest text-white shadow-md shadow-forest/20'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-forest/30 hover:text-forest'
            }`}
          >
            {f === 'all' ? 'All Items' : f.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Item</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Stock</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden xl:table-cell">Updated</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{item.name}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-sm text-[var(--text-secondary)]">{item.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[var(--text-primary)]">{item.stock} {item.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-[var(--text-secondary)]">{item.supplier}</span>
                  </td>
                  <td className="px-6 py-4 hidden xl:table-cell">
                    <span className="text-sm text-[var(--text-muted)]">{item.lastUpdated}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRestock(item.name)}
                      className="text-sm text-forest hover:text-forest-dark font-medium hover:underline"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="w-12 h-12 text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">No items found</p>
            <p className="text-sm text-[var(--text-muted)]">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">In Stock</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">5 items</p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">2 items</p>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm text-[var(--text-secondary)]">Out of Stock</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">2 items</p>
        </div>
      </div>
    </div>
  );
}

function OrdersPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>('all');
  const filtered = filter === 'all' ? ordersData : ordersData.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Orders</h2>
          <p className="text-sm text-[var(--text-muted)]">Track and manage customer orders</p>
        </div>
        <button className="px-4 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold hover:bg-forest-dark transition-colors shadow-md shadow-forest/20">
          + New Order
        </button>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { status: 'pending', label: 'Pending', count: 1, color: 'border-amber-400' },
          { status: 'processing', label: 'Processing', count: 1, color: 'border-blue-400' },
          { status: 'shipped', label: 'Shipped', count: 1, color: 'border-purple-400' },
          { status: 'delivered', label: 'Delivered', count: 3, color: 'border-green-400' },
        ].map(s => (
          <button
            key={s.status}
            onClick={() => setFilter(filter === s.status ? 'all' : s.status as any)}
            className={`bg-[var(--bg-card)] rounded-xl p-4 border-l-4 ${s.color} border border-[var(--border-color)] hover:shadow-md transition-all text-left ${filter === s.status ? 'ring-2 ring-forest/30' : ''}`}
          >
            <p className="text-xs text-[var(--text-muted)] mb-1">{s.label}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{s.count}</p>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)] hover:shadow-lg hover:shadow-[var(--shadow-color)] transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-forest/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-forest" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">{order.id}</h4>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{order.customer}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="hidden md:flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Clock className="w-3.5 h-3.5" />
                  {order.date}
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-[var(--text-muted)]">
                  <Package className="w-3.5 h-3.5" />
                  {order.items} items
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{order.total}</span>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-[var(--bg-card)] rounded-2xl p-16 border border-[var(--border-color)] flex flex-col items-center">
          <ShoppingCart className="w-16 h-16 text-[var(--text-muted)] mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No orders found</h3>
          <p className="text-sm text-[var(--text-muted)]">Try changing the filter or create a new order</p>
        </div>
      )}
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h2>
        <p className="text-sm text-[var(--text-muted)]">Insights and performance metrics</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Order Value', value: '$892', trend: '+5.2%', up: true },
          { label: 'Fulfillment Rate', value: '96.8%', trend: '+1.3%', up: true },
          { label: 'Delivery Time', value: '2.4 days', trend: '-0.3 days', up: true },
          { label: 'Return Rate', value: '1.2%', trend: '+0.4%', up: false },
        ].map((m, i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-muted)] mb-2">{m.label}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{m.value}</p>
            <span className={`text-xs font-medium ${m.up ? 'text-green-600' : 'text-red-500'}`}>{m.trend}</span>
          </div>
        ))}
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply Chain Flow */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Supply Chain Flow</h3>
          <div className="space-y-4">
            {[
              { label: 'Farm → Warehouse', value: 92, color: 'bg-forest' },
              { label: 'Warehouse → Distribution', value: 87, color: 'bg-forest-light' },
              { label: 'Distribution → Retail', value: 95, color: 'bg-green-500' },
              { label: 'On-Time Delivery', value: 96.8, color: 'bg-emerald-500' },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="font-medium text-[var(--text-primary)]">{item.value}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--border-color)]">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Top Products</h3>
          <div className="space-y-4">
            {[
              { name: 'Organic Tomatoes', sales: '$12,400', units: '2,340 kg' },
              { name: 'Wild Salmon', sales: '$9,800', units: '890 kg' },
              { name: 'Free-Range Eggs', sales: '$7,200', units: '1,200 trays' },
              { name: 'Quinoa', sales: '$5,600', units: '780 kg' },
              { name: 'Greek Yogurt', sales: '$4,900', units: '960 tubs' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border-color)] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-forest/10 flex items-center justify-center text-xs font-bold text-forest">{i + 1}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{p.sales}</p>
                  <p className="text-xs text-[var(--text-muted)]">{p.units}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Delivery Regions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { region: 'North District', orders: 142, status: 'On track' },
            { region: 'Central Hub', orders: 238, status: 'High volume' },
            { region: 'South Region', orders: 96, status: 'On track' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--hover-bg)] border border-[var(--border-color)]">
              <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-forest" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{r.region}</p>
                <p className="text-xs text-[var(--text-muted)]">{r.orders} orders • {r.status}</p>
              </div>
              <BarChart3 className="w-4 h-4 text-[var(--text-muted)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [theme, setTheme] = useState('light');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'inventory': return <InventoryPage />;
      case 'orders': return <OrdersPage />;
      case 'analytics': return <AnalyticsPage />;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="flex h-screen bg-[var(--bg-primary)] transition-theme overflow-hidden">
        <Sidebar 
          currentPage={currentPage} 
          onNavigate={setCurrentPage} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
