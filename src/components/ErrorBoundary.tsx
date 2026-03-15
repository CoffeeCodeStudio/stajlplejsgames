import React from "react";
import { Link } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
          <p className="text-lg font-semibold text-destructive">Något gick fel 😥</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.state.error?.message || "Ett oväntat fel inträffade."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-primary hover:underline"
          >
            Försök igen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
