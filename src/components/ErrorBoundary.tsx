import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as new (props: Props) => any) {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    const state = (this as any).state as State;
    if (state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                अपेक्षित त्रुटी आढळली (Application Error)
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                ॲप्लिकेशन सुरू करताना काही अडचण आली आहे. कृपया पृष्ठ पुन्हा लोड करा किंवा कॅश डेटा साफ करा.
              </p>
            </div>

            {state.error && (
              <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto max-h-36">
                <p className="font-bold text-rose-400 mb-1">Error Details:</p>
                <p>{state.error.toString()}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                पृष्ठ रीलोड करा (Reload)
              </button>

              <button
                onClick={this.handleResetStorage}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                कॅश रीसेट करा (Reset)
              </button>
            </div>

            <div className="pt-2 text-xs text-slate-500">
              आरोग्य उपकेंद्र रेकॉर्ड कीपिंग सिस्टीम
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
