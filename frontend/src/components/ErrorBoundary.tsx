import { Component, type ErrorInfo, type ReactNode } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // React swallows the original exception once it reaches an error boundary,
    // so report it explicitly to guarantee RUM gets a real Error (message + stack).
    datadogRum.addError(error, { react: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error">
          <p>Something went wrong loading this page.</p>
          <Link to="/">&larr; Back to store</Link>
        </div>
      );
    }
    return this.props.children;
  }
}
