import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-lg w-full bg-card border border-border rounded-lg p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
            </div>
            <p className="text-muted-foreground mb-4">
              The app crashed unexpectedly. The error details are shown below.
            </p>
            <pre className="bg-muted text-xs p-3 rounded overflow-auto max-h-60 mb-4 text-foreground">
              {this.state.error.name}: {this.state.error.message}
              {this.state.error.stack ? `\n\n${this.state.error.stack}` : ""}
            </pre>
            <Button onClick={this.handleReload} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
