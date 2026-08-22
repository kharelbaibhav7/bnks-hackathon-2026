import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import DriverActive from "./pages/driver/DriverActive.jsx";
import DriverDashboard from "./pages/driver/DriverDashboard.jsx";
import DriverJobDetail from "./pages/driver/DriverJobDetail.jsx";
import DriverJobs from "./pages/driver/DriverJobs.jsx";
import DriverProfile from "./pages/driver/DriverProfile.jsx";
import FarmerDashboard from "./pages/farmer/FarmerDashboard.jsx";
import FarmerHistory from "./pages/farmer/FarmerHistory.jsx";
import FarmerInventory from "./pages/farmer/FarmerInventory.jsx";
import FarmerOrders from "./pages/farmer/FarmerOrders.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RetailerDashboard from "./pages/retailer/RetailerDashboard.jsx";
import RetailerInventory from "./pages/retailer/RetailerInventory.jsx";
import RetailerOrders from "./pages/retailer/RetailerOrders.jsx";
import RetailerScan from "./pages/retailer/RetailerScan.jsx";
import MessagesPage from "./pages/shared/MessagesPage.jsx";
import OrderDetail from "./pages/shared/OrderDetail.jsx";
import WalletPage from "./pages/shared/WalletPage.jsx";
import { roleHome } from "./utils/format.js";

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth"><div className="card">Loading…</div></div>;
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout role="retailer" />}>
        <Route path="/retailer" element={<RetailerDashboard />} />
        <Route path="/retailer/scan" element={<RetailerScan />} />
        <Route path="/retailer/inventory" element={<RetailerInventory />} />
        <Route path="/retailer/orders" element={<RetailerOrders />} />
        <Route path="/retailer/orders/:id" element={<OrderDetail />} />
        <Route path="/retailer/wallet" element={<WalletPage />} />
        <Route path="/retailer/messages" element={<MessagesPage />} />
      </Route>

      <Route element={<Layout role="farmer" />}>
        <Route path="/farmer" element={<FarmerDashboard />} />
        <Route path="/farmer/inventory" element={<FarmerInventory />} />
        <Route path="/farmer/orders" element={<FarmerOrders />} />
        <Route path="/farmer/orders/:id" element={<OrderDetail />} />
        <Route path="/farmer/history" element={<FarmerHistory />} />
        <Route path="/farmer/wallet" element={<WalletPage />} />
        <Route path="/farmer/messages" element={<MessagesPage />} />
      </Route>

      <Route element={<Layout role="driver" />}>
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/jobs" element={<DriverJobs />} />
        <Route path="/driver/jobs/:id" element={<DriverJobDetail />} />
        <Route path="/driver/active" element={<DriverActive />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route path="/driver/messages" element={<MessagesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
