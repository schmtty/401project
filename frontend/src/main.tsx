import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply base theme before React mounts to avoid flash
document.documentElement.classList.add("theme-light");

createRoot(document.getElementById("root")!).render(<App />);
