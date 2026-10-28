import { useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import UserPortal from "@/pages/UserPortal";
import AdminPortal from "@/pages/AdminPortal";
import { ThemeProvider } from "@/lib/theme";
import { apiClient } from "@/api/client";

// HashRouter is used so the app works when served as static files (GitHub
// Pages has no SPA fallback, so a BrowserRouter URL like /admin/explorer
// would 404 on refresh).
export default function App() {
  useEffect(() => {
    // Managed hosts sleep when idle and take a while to wake. Pinging the
    // health endpoint on load means the server is usually ready by the time
    // the visitor reaches the login form.
    apiClient.warmUp();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user/*" element={<UserPortal />} />
          <Route path="/admin/*" element={<AdminPortal />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
