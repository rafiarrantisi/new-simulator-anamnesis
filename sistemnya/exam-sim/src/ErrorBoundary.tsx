// Pelindung crash per-station (plan §2.2: ErrorBoundary per station agar
// satu crash—mis. WebGL gagal—tak menjatuhkan seluruh exam, plan §3.3).
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}
interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(_e: Error, _info: ErrorInfo): void {
    /* sengaja diam — fallback yang ditampilkan (plan §3.3) */
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
