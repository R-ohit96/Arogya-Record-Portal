import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Crash logged by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
    // Reset local payload in case of severe corruption
    localStorage.clear();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#ffebee', color: '#c62828', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong (Application Crashed)</h2>
          <p>We caught an error. Local storage data has been cleared to prevent loop crashes.</p>
          <pre style={{ background: '#fff', padding: '1rem', overflowX: 'auto', border: '1px solid #ffcdd2' }}>
            {this.state.error?.toString()}
            <br />
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => window.location.href = '/'} style={{ padding: '0.5rem 1rem', background: '#c62828', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '1rem' }}>
            Restart Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
