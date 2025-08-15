import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

import Home from "./pages/Home";
import Mapping from "./pages/Mapping";
import Recommendations from "./pages/Recommendations";
import Footer from "./components/Footer";
import SustainableShoppingPage from "./pages/Sustainable";
import Header from "./components/Header";
import Scroll from "./pages/Scroll";
import SearchResults from "./pages/SearchResults";
import BusinessRequestsManager from "./pages/BusinessRequestsManager";

// Protected route component for admin access
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [user] = useAuthState(auth);

  // Only render if user is admin, otherwise redirect to home
  if (user?.email === "nabira.per1701@gmail.com") {
    return <>{children}</>;
  }

  // Redirect non-admin users to home page
  window.location.href = "/";
  return null;
};

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mapping" element={<Mapping />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/sustainable" element={<SustainableShoppingPage />} />
        <Route path="/scroll" element={<Scroll />} />
        <Route path="/search-results" element={<SearchResults />} />
        <Route
          path="/admin/business-requests"
          element={
            <AdminRoute>
              <BusinessRequestsManager />
            </AdminRoute>
          }
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
