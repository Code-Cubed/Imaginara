import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LeftBar from "./components/leftBar/leftBar";   // Your LeftBar component
import TopBar from "./components/topBar/topBar";     // Your TopBar component


const App = () => {
  return (
    <BrowserRouter>
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#fafafa" }}>
        {/* Sidebar */}
        <LeftBar />

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* TopBar */}
          <TopBar />

          {/* Page Content */}
          
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
