import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Agent UI Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, border: '1px solid #FCA5A5', background: '#FEF2F2', borderRadius: 8, color: '#991B1B', margin: 10 }}>
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Agent Interface Error</h3>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>We encountered an error rendering the agent outputs. Please refresh the page or clear your history.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, background: 'white', border: '1px solid #FCA5A5', padding: '6px 12px', borderRadius: 4, cursor: 'pointer', color: '#991B1B' }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
