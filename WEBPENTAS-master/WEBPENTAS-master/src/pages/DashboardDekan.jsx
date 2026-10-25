import { Routes, Route } from "react-router-dom";
import { FaTachometerAlt, FaClipboardList, FaFileSignature, FaBuilding, FaHistory } from "react-icons/fa";
import { DashboardLayout } from "../components/DashboardLayout";
import FacilityManagement from "./dashboard/FacilityManagement";
import { BerandaDekan } from "./dekan/BerandaDekan";
import { DaftarPeminjaman } from "./dekan/DaftarPeminjaman";
import { DetailPeminjaman } from "./dekan/DetailPeminjaman";
import { DaftarPerizinan } from "./dekan/DaftarPerizinan";
import { DetailPerizinan } from "./dekan/DetailPerizinan";
import { RiwayatAktivitas } from "./dekan/RiwayatAktivitas";

const MENU = [
  { to: "", label: "Ringkasan", icon: FaTachometerAlt, end: true },
  { to: "izin-kegiatan", label: "Izin kegiatan", icon: FaFileSignature },
  { to: "peminjaman", label: "Peminjaman", icon: FaClipboardList },
  { to: "fasilitas", label: "Fasilitas", icon: FaBuilding },
  { to: "riwayat", label: "Riwayat", icon: FaHistory },
];

export function DashboardDekan() {
  return (
    <DashboardLayout title="Dekan" items={MENU}>
      <Routes>
        <Route index element={<BerandaDekan />} />
        <Route path="peminjaman" element={<DaftarPeminjaman />} />
        <Route path="peminjaman/:id" element={<DetailPeminjaman />} />
        <Route path="izin-kegiatan" element={<DaftarPerizinan />} />
        <Route path="izin-kegiatan/:id" element={<DetailPerizinan />} />
        <Route path="fasilitas" element={<FacilityManagement />} />
        <Route path="riwayat" element={<RiwayatAktivitas />} />
      </Routes>
    </DashboardLayout>
  );
}
