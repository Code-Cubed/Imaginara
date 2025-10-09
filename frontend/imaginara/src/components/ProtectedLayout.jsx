import React from "react";
import LeftBar from "./leftBar/LeftBar";
import TopBar from "./topBar/topBar";

const ProtectedLayout = ({ children, onLogout }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftBar onLogout={onLogout} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
