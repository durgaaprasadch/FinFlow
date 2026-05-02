import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { applicationService } from '../api';
import { unwrap } from '../utils/format';
import { BarChart3, Bell, FileText, FolderOpen, History, Landmark, LayoutDashboard, Settings, ShieldCheck, UploadCloud, Users } from 'lucide-react';
import './Sidebar.css';

const applicantNav = [
  ['Dashboard', '/applicant/dashboard', LayoutDashboard],
  ['New application', '/applicant/apply', FileText],
  ['Applications', '/applicant/applications', FolderOpen],
  ['Documents', '/applicant/documents', UploadCloud],
  ['Timeline', '/applicant/history', History],
  ['Settings', '/applicant/settings', Settings],
];

const adminNav = [
  ['Overview', '/admin/dashboard', LayoutDashboard],
  ['Applications', '/admin/applications', FileText],
  ['Users', '/admin/users', Users],
  ['Fraud audit', '/admin/fraud-detection', ShieldCheck],
  ['Analytics', '/admin/analytics', BarChart3],
  ['Settings', '/admin/settings', Settings],
];

const Sidebar = ({ isOpen }) => {
  const { userRole } = useSelector((state) => state.auth);
  const [activeStatus, setActiveStatus] = React.useState(null);

  React.useEffect(() => {
    if (userRole === 'APPLICANT') {
      applicationService.getStatus().then(res => {
        const data = unwrap(res);
        setActiveStatus(data?.status || 'NONE');
      }).catch(() => setActiveStatus('NONE'));
    }
  }, [userRole]);

  const items = userRole === 'ADMIN' ? adminNav : applicantNav;

  const isRestricted = (label) => {
    if (label !== 'New application') return false;
    
    // Statuses that allow starting/continuing an application
    const allowed = [
      'NONE', 
      'DRAFT', 
      'PERSONAL_DETAILS_ADDED', 
      'EMPLOYMENT_DETAILS_ADDED', 
      'LOAN_DETAILS_ADDED', 
      'DOCUMENTS_COMPLETED',
      'APPROVED',
      'REJECTED'
    ];

    if (!activeStatus || allowed.includes(activeStatus)) {
      return false;
    }
    return true;
  };

  return (
    <aside className={`workspace-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <NavLink to="/" className="sidebar-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Landmark size={22} />
        {isOpen && <span>FinFlow</span>}
      </NavLink>
      <nav className="sidebar-nav">
        {items.map(([label, path, Icon]) => {
          const restricted = isRestricted(label);
          const tooltip = restricted 
            ? "You have an active application in review. Please wait for a decision before starting a new one." 
            : label;

          return (
            <NavLink 
              key={path} 
              to={restricted ? '#' : path} 
              className={({ isActive }) => `sidebar-link ${isActive && !restricted ? 'active' : ''} ${restricted ? 'disabled' : ''}`} 
              title={tooltip}
              onClick={(e) => restricted && e.preventDefault()}
            >
              <Icon size={19} />
              {isOpen && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
