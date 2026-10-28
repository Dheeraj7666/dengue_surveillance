import { HashRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import UserPortal from "@/pages/UserPortal";
import AdminPortal from "@/pages/AdminPortal";
import { ThemeProvider } from "@/lib/theme";

// HashRouter is used so the app works when served as static files (GitHub
// Pages has no SPA fallback, so a BrowserRouter URL like /admin/explorer
// would 404 on refresh).
export default function App() {
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
