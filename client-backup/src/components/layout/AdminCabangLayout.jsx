import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useCabang } from "../../features/cabang/hooks/useCabang";

const AdminCabangLayout = () => {
  const { selectedCabang, isGlobalView } = useCabang();
  
  useEffect(() => {
    console.log('AdminCabangLayout rendered with:', {
      selectedCabang,
      isGlobalView
    });
  }, [selectedCabang, isGlobalView]);
  
  return (
    <div className="flex h-screen bg-blue-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Header />
        <Outlet /> {/* This renders the child route components */}
      </div>
    </div>
  );
};

export default AdminCabangLayout;
