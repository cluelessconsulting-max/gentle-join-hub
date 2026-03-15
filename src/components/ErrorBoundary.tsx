import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center px-6">
            <h1 className="font-display text-[42px] font-light text-foreground mb-2">Offlist</h1>
            <div className="h-px w-12 mx-auto bg-accent my-6" />
            <p className="text-[14px] text-foreground tracking-wide mb-2">Something went wrong.</p>
            <p className="text-[12px] text-warm-grey tracking-wide mb-8">Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-8 py-3 text-[11px] tracking-wide-lg uppercase border-none cursor-pointer transition-all hover:bg-accent font-body font-light"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
