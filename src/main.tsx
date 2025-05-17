
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/index.ts'  // Make sure the i18n configuration is loaded

createRoot(document.getElementById("root")!).render(<App />);
