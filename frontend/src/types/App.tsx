import "./App.css";
import PageRoutes from "../types/PageRoutes";

// 🚀 Import the automatic expiration service
// This ensures expired posts are automatically managed when the app starts
import "../utils/expirationService";

import ErrorBoundary from "../components/ErrorBoundary";
import { SoundUtils } from "../utils/soundUtils";
import { useEffect } from "react";

function App() {
  // Initialize audio system on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      SoundUtils.markUserInteraction();
      // Remove listeners after first interaction to avoid memory leaks
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Add event listeners for user interactions
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    // Cleanup function
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  return (
    <ErrorBoundary>
      <PageRoutes />
    </ErrorBoundary>
  );
}

export default App;
