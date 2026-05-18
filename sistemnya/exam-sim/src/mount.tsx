// Public API + Shadow DOM mount (kontrak §3B.4 invarian isolasi #2):
// CSS di-inject ke shadow root → design.css legacy tak masuk, style
// exam-sim tak keluar. App legacy memanggil mountExamSim() via lazy import.
import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import type { ExamSimOptions } from './types';
// Vite: CSS terproses sebagai string (cssCodeSplit:false) → di-inline ke shadow.
import cssText from './styles.css?inline';

export type { ExamSimOptions } from './types';

export function mountExamSim(host: HTMLElement, opts: ExamSimOptions): () => void {
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  mountPoint.className = 'ophtha-exam-root';
  shadow.appendChild(mountPoint);

  const root: Root = createRoot(mountPoint);
  root.render(
    <StrictMode>
      <App opts={opts} />
    </StrictMode>,
  );

  return () => {
    root.unmount();
    shadow.contains(mountPoint) && shadow.removeChild(mountPoint);
    shadow.contains(style) && shadow.removeChild(style);
  };
}

export default mountExamSim;
