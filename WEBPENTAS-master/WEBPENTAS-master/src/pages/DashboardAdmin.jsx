import { Routes, Route } from "react-router-dom";
import { FaUsers, FaBuilding, FaTachometerAlt } from "react-icons/fa";
import UserManagement from "./dashboard/UserManagement";
import FacilityManagement from "./dashboard/FacilityManagement";
import DashboardHome from "./dashboard/DashboardHome";
import { DashboardLayout } from "../components/DashboardLayout";

const MENU = [
  { to: "", label: "Dashboard", icon: FaTachometerAlt, end: true },
  { to: "users", label: "Manajemen Users", icon: FaUsers },
  { to: "facilities", label: "Manajemen Fasilitas", icon: FaBuilding },
];

export function DashboardAdmin() {
  return (
    <DashboardLayout title="Dashboard Admin" items={MENU}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="facilities" element={<FacilityManagement />} />
      </Routes>
    </DashboardLayout>
  );
}
