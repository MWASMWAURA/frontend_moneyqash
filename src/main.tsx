import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set title
document.title = "ReferralPro - Earn Through Referrals";

// Preload critical resources with non-blocking approach
const loadExternalResources = () => {
  // Load Remix icons with preload for better performance
  const remixIconLink = document.createElement("link");
  remixIconLink.rel = "preload";
  remixIconLink.as = "style";
  remixIconLink.href =
    "https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css";
  remixIconLink.onload = () => {
    remixIconLink.rel = "stylesheet";
  };
  document.head.appendChild(remixIconLink);

  // Load Inter font with font-display swap for better performance
  const fontLink = document.createElement("link");
  fontLink.rel = "preload";
  fontLink.as = "style";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
  fontLink.onload = () => {
    fontLink.rel = "stylesheet";
  };
  document.head.appendChild(fontLink);
};

// Load external resources after initial render
setTimeout(loadExternalResources, 0);

// Register service worker for caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
