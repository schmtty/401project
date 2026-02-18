import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme before React mounts to avoid flash
const saved = localStorage.getItem('area-book-theme') as string | null;
const valid = ['light', 'dark', 'pastel', 'comfort', 'sunset'];
if (saved && valid.includes(saved)) {
  document.documentElement.classList.add(`theme-${saved}`);
} else {
  document.documentElement.classList.add('theme-light');
}

createRoot(document.getElementById("root")!).render(<App />);
