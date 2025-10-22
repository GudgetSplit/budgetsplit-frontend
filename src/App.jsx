// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Groups from "./pages/Groups.jsx";
import GroupDetail from "./pages/GroupDetail.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Reminders from "./pages/Reminders.jsx";
import Upgrade from "./pages/Upgrade.jsx";
import UpgradeCallback from "./pages/UpgradeCallback.jsx";




export default function App() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset" element={<ResetPassword />} />
      <Route path="/upgrade/callback" element={<UpgradeCallback />} />

      {/* Premium & Reminder routes */}
      <Route path="/upgrade" element={<Upgrade />} />
      <Route path="/groups/:id/reminders" element={<Reminders />} />

      {/* Protected routes */}
      <Route
        path="/groups"
        element={isLoggedIn ? <Groups /> : <Navigate to="/login" />}
      />
      <Route
        path="/groups/:id"
        element={isLoggedIn ? <GroupDetail /> : <Navigate to="/login" />}
      />

      {/* Default redirect */}
      <Route
        path="*"
        element={<Navigate to={isLoggedIn ? "/groups" : "/login"} />}
      />
    </Routes>
  );
}