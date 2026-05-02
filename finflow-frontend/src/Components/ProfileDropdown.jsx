import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Settings, User, Globe, Shield } from 'lucide-react';
import { logout } from '../store/authSlice';
import '../Pages/DashboardFocus.css';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, userRole } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleProfileClick = () => {
    navigate(userRole === 'ADMIN' ? '/admin/settings' : '/applicant/settings');
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button className="vip-profile-btn" onClick={() => setIsOpen(!isOpen)}>
        <div className="vip-avatar">
          {user ? user.charAt(0).toUpperCase() : 'V'}
        </div>
        <div className="vip-profile-info">
          <span className="name">{user || 'FinFlow VIP'}</span>
          <span className="role">{userRole === 'ADMIN' ? 'Operations' : 'Applicant'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="vip-dropdown-menu">
          <div className="vip-dropdown-header">
            <span className="name">{user}</span>
            <span className="role">{userRole === 'ADMIN' ? 'System Administrator' : 'Official Applicant'}</span>
          </div>

          <div className="vip-dropdown-list">
            <button className="vip-dropdown-item" onClick={handleProfileClick}>
              <User size={16} /> Profile Settings
            </button>

            {userRole === 'ADMIN' && (
              <button className="vip-dropdown-item" onClick={() => navigate('/admin/users')}>
                <Shield size={16} /> Operational Panel
              </button>
            )}
          </div>

          <div className="vip-dropdown-footer">
            <button className="vip-dropdown-item danger" onClick={handleLogout}>
              <LogOut size={16} /> Terminate Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
