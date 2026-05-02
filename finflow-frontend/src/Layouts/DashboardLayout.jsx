import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, LogOut, Menu, Moon, Sun } from 'lucide-react';
import Sidebar from '../Components/Sidebar';
import NotificationDropdown from '../Components/NotificationDropdown';
import ProfileDropdown from '../Components/ProfileDropdown';
import { logout } from '../store/authSlice';
import './DashboardLayout.css';

const titleFromPath = (pathname) => {
  const leaf = pathname.split('/').filter(Boolean).at(-1) || 'dashboard';
  return leaf.replace(/-/g, ' ');
};

/**
 * DASHBOARD LAYOUT:
 * The primary structural wrapper for all protected pages.
 * Ensures the Sidebar and Top-Nav remain persistent during internal navigation.
 */
const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('finflow_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finflow_theme', theme);
  }, [theme]);

  useEffect(() => {
    const onResize = () => setOpen(window.innerWidth >= 1000);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const signOut = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <div className="workspace-shell">
      <Sidebar isOpen={open} toggleSidebar={() => setOpen((value) => !value)} />
      <div className="workspace-main">
        <header className="workspace-topbar">
          <div className="topbar-left">
            <button className="icon-button" onClick={() => setOpen((value) => !value)} title="Toggle navigation">
              <Menu size={18} />
            </button>
            <div>
              <span>{userRole === 'ADMIN' ? 'Operations' : 'Applicant'} workspace</span>
              <strong>{titleFromPath(location.pathname)}</strong>
            </div>
          </div>
          <div className="topbar-actions">
            <button className={`icon-button ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <NotificationDropdown />
            
            <div className="h-8 w-[1px] bg-line mx-1" />
            
            <ProfileDropdown />
          </div>
        </header>
        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
