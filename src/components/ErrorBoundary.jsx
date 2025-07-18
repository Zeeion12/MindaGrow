// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            🚫 Something went wrong
          </h2>
          <details className="text-sm text-red-600">
            <summary className="cursor-pointer font-medium mb-2">
              Click for error details
            </summary>
            <div className="bg-red-100 p-3 rounded border mt-2">
              <pre className="whitespace-pre-wrap text-xs">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          </details>
          <button 
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;