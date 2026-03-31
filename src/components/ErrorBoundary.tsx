import React from "react";
import { Result, Button } from "antd";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Aqar Admin Error]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.error?.message || "An unexpected error occurred"}
          extra={
            <Button
              type="primary"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/dashboard";
              }}
            >
              Back to Dashboard
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
