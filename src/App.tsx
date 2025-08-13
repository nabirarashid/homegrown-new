import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Mapping from "./pages/Mapping";
import Recommendations from "./pages/Recommendations";
import Footer from "./components/Footer";
import SustainableShoppingPage from "./pages/Sustainable";
import Header from "./components/Header";
import Scroll from "./pages/Scroll";
import SearchResults from "./pages/SearchResults";
import BusinessRequestsManager from "./pages/BusinessRequestsManager";

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
          element={<BusinessRequestsManager />}
        />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
