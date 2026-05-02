import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { store } from './store'
import { ToastProvider } from './Components/Toast.jsx'

console.log('Store created:', store);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Global State Provider (Redux) */}
    <Provider store={store}>
      {/* Global Notification Context */}
      <ToastProvider>
        {/* URL Navigation & Browser History Sync */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </Provider>
  </React.StrictMode>,
)
