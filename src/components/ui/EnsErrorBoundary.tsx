import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * EnsErrorBoundary is a specialized error boundary that only catches ENS-related errors
 * and silently continues without showing an error UI
 */
export class EnsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Only intercept ENS-related errors
    if (error.message.includes('ENS') || 
        error.stack?.includes('getEnsName') || 
        error.stack?.includes('getEnsAvatar') ||
        error.message.includes('ContractFunctionExecutionError')) {
      return { hasError: true };
    }
    
    // Let other errors propagate to parent error boundaries
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (error.message.includes('ENS') || 
        error.stack?.includes('getEnsName') || 
        error.stack?.includes('getEnsAvatar') ||
        error.message.includes('ContractFunctionExecutionError')) {
      console.warn('ENS resolution error suppressed:', error.message);
    } else {
      // Re-throw other errors
      throw error;
    }
  }

  render() {
    if (this.state.hasError) {
      // Instead of showing an error, just render the children
      // This effectively "swallows" the ENS errors and continues
      return this.props.children;
    }

    return this.props.children;
  }
} 