import React, { useEffect } from 'react';
import AppRouter from './Routing/AppRouter';

function App() {
  /**
   * UNIVERSAL THEME SYNC:
   * Synchronizes the UI theme (Light/Dark) with the user's browser storage.
   * Ensures the theme persists across sessions and page refreshes.
   */
  useEffect(() => {
    const savedTheme = localStorage.getItem('finflow_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <div className="app-container">
      <AppRouter />
    </div>
  );
}

export default App;
