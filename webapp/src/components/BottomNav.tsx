import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();
  const items = useCart((state) => state.items);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path: string) => location.pathname === path;

  if (['/checkout', '/payment/', '/product/', '/admin'].some(p => location.pathname.startsWith(p) && p !== '/')) return null;

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
        <span>Каталог</span>
      </Link>

      <Link to="/cart" className={`nav-item ${isActive('/cart') ? 'active' : ''}`}>
        <div className="nav-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
          {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
        </div>
        <span>Корзина</span>
      </Link>

      <Link to="/history" className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
        <span>Профиль</span>
      </Link>

      <Link to="/support" className={`nav-item ${isActive('/support') ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        <span>Поддержка</span>
      </Link>
    </nav>
  );
}