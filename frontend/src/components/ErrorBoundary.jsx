import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full text-center border border-slate-100 animate-in zoom-in duration-300">
            
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <AlertTriangle size={48} strokeWidth={1.5} />
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">System Malfunction</h1>
            
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              We encountered an unexpected error. This has been logged for our engineering team.
            </p>

            {/* Technical Details (Optional - Good for Dev/Admin) */}
            <div className="bg-slate-50 p-4 rounded-xl mb-8 text-left border border-slate-100 overflow-auto max-h-32">
                <p className="text-xs font-mono text-slate-400 break-all">
                    {this.state.error && this.state.error.toString()}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-200"
              >
                <RotateCcw size={16} /> Reload App
              </button>
              
              <button 
                onClick={this.handleHome}
                className="flex items-center justify-center gap-2 bg-white text-slate-600 border-2 border-slate-100 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all"
              >
                <Home size={16} /> Dashboard
              </button>
            </div>

            <div className="mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Error Code: 500_CLIENT_CRASH
            </div>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;