'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, Home, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center bg-white rounded-[3rem] border border-dashed border-red-100 shadow-sm">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 h-20 w-20 rounded-[2rem] bg-red-50 flex items-center justify-center text-red-600 shadow-inner"
          >
            <AlertCircle className="h-10 w-10" />
          </motion.div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-500 max-w-md font-medium mb-8 leading-relaxed">
            We encountered an unexpected error while loading this section. Our system has been notified.
          </p>

          {this.state.error && (
            <div className="mb-8 p-4 rounded-xl bg-slate-50 border font-mono text-[10px] text-slate-400 uppercase tracking-widest max-w-xs truncate">
              Error Code: {this.state.error.name || 'INTERNAL_V_ERR'}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={this.handleReset}
              className="rounded-xl font-bold h-12 px-8 bg-slate-900 hover:bg-slate-800"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button 
                variant="outline"
                className="w-full sm:w-auto rounded-xl font-bold h-12 px-8 border-slate-200"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return <React.Fragment>{this.props.children}</React.Fragment>;
  }
}
