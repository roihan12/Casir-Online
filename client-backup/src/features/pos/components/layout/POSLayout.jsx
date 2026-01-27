import React from "react";
import { Outlet } from "react-router-dom";

const POSLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default POSLayout;