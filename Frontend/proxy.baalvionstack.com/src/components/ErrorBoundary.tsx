import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            {this.state.error && (
              <pre className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button onClick={this.handleReset} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" /> Try Again
              </Button>
              <Button onClick={() => window.location.href = "/"} variant="ghost">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
