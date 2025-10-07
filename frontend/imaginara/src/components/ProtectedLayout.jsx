import React from "react";
import LeftBar from "./leftBar/LeftBar"; // correct path

const ProtectedLayout = ({ children, onLogout }) => {
  return (
    <div className="flex min-h-screen">
      <LeftBar onLogout={onLogout} />
      <div className="flex-1">{children}</div>
    </div>
  );
};

export default ProtectedLayout;
