import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { dbService } from "./services/database";
import { Capacitor } from '@capacitor/core';

console.log("main.tsx loaded");
console.log(Capacitor.getPlatform());

async function initializeApp() {
  try {
    if (Capacitor.getPlatform() === 'web') {
      console.log('platform is web');
      const { JeepSqlite } = await import('jeep-sqlite/dist/components/jeep-sqlite');
      customElements.define('jeep-sqlite', JeepSqlite);
      
      if (!document.querySelector('jeep-sqlite')) {
        const jeepSqliteEl = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepSqliteEl);
      }
      
      await customElements.whenDefined('jeep-sqlite');
      const jeepSqliteEl = document.querySelector('jeep-sqlite') as any;

      if (jeepSqliteEl && typeof jeepSqliteEl.initWebStore === 'function') {
        await jeepSqliteEl.initWebStore();
      } else {
        console.warn("jeep-sqlite element found, but initWebStore is not a function.");
      }
    }

    // Initialize the database for all platforms
    await dbService.initialize();
    console.log('Database initialized successfully');

    // Render the app
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Failed to initialize app", err);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `<h1>Fatal Error: Could not initialize database.</h1><p>${err instanceof Error ? err.message : String(err)}</p>`;
    }
  }
}

// Initialize the app after DOM is loaded
window.addEventListener('DOMContentLoaded', initializeApp);
