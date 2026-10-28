import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import UserPortal from "@/pages/UserPortal";
import AdminPortal from "@/pages/AdminPortal";
import { ThemeProvider } from "@/lib/theme";

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
