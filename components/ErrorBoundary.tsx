import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 text-4xl mb-6">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h1 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">Xatolik yuz berdi</h1>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 max-w-md w-full overflow-auto max-h-[200px]">
            <p className="text-red-400 text-xs font-mono text-left whitespace-pre-wrap">
              {this.state.error?.toString()}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
