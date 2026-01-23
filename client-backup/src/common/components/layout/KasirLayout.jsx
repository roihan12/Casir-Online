// KasirLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const KasirLayout = () => {
  return (
    <div className="flex h-screen bg-green-100">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Header />
        <Outlet /> {/* This renders the child route components */}
      </div>
    </div>
  );
};

export default KasirLayout;
