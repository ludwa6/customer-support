import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set title for the application
document.title = "SerenityFlow Support Portal";

// Set the description meta tag for SEO
const metaDescription = document.createElement("meta");
metaDescription.name = "description";
metaDescription.content = "SerenityFlow customer support portal with AI assistance, documentation, and ticket submission capabilities.";
document.head.appendChild(metaDescription);

// Add Open Graph tags
const ogTitle = document.createElement("meta");
ogTitle.property = "og:title";
ogTitle.content = "SerenityFlow Support Portal";
document.head.appendChild(ogTitle);

const ogDescription = document.createElement("meta");
ogDescription.property = "og:description";
ogDescription.content = "Get help with SerenityFlow through our AI-powered support portal.";
document.head.appendChild(ogDescription);

const ogType = document.createElement("meta");
ogType.property = "og:type";
ogType.content = "website";
document.head.appendChild(ogType);

// Add Inter font links (if not already in HTML)
if (!document.querySelector('link[href*="Inter"]')) {
  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(fontLink);
}

createRoot(document.getElementById("root")!).render(<App />);
