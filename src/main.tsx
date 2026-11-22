import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/saira/300.css';
import '@fontsource/saira/400.css';
import '@fontsource/saira/500.css';
import '@fontsource/saira/600.css';
import '@fontsource/saira/700.css';
import '@fontsource/saira/800.css';
import './styles.css';
import { useGame } from './store';
import { Setup } from './ui/Setup';
import { Peneira } from './ui/Peneira';
import { Shell } from './ui/Shell';

function App() {
  const s = useGame();
  if (!s) return <Setup />;
  if (s.fase === 'peneira') return <Peneira />;
  return <Shell />;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(() => {});
