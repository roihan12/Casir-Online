import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useCabang } from "../../features/cabang/hooks/useCabang";

const SuperAdminLayout = () => {
  const { selectedCabang, isGlobalView } = useCabang();
  
  useEffect(() => {
    console.log('SuperAdminLayout rendered with:', {
      selectedCabang,
      isGlobalView
    });
  }, [selectedCabang, isGlobalView]);
  
  return (
    <div className="flex h-screen bg-indigo-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Header />
        <Outlet />{" "}
        {/* Penting: Gunakan Outlet di sini untuk menampilkan konten anak */}
      </div>
    </div>
  );
};

export default SuperAdminLayout;
