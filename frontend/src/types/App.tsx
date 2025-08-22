import "./App.css";
import PageRoutes from "../types/PageRoutes";

// 🚀 Import the automatic expiration service
// This ensures expired posts are automatically managed when the app starts
import "../utils/expirationService";

import ErrorBoundary from "../components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <PageRoutes />
    </ErrorBoundary>
  );
}

export default App;
