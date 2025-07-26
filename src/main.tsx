import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Remix icon CSS
const remixIconLink = document.createElement('link');
remixIconLink.rel = 'stylesheet';
remixIconLink.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
document.head.appendChild(remixIconLink);

// Add Inter font
const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
document.head.appendChild(fontLink);

// Add title
const titleElement = document.createElement('title');
titleElement.textContent = 'ReferralPro - Earn Through Referrals';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
