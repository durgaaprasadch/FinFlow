import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-layout-box">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;

