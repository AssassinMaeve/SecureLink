import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthForm from "./pages/AuthForm";
import HomePage from "./pages/HomePage"; // Create this component
import ProfilePage from "./pages/ProfilePage"; // Create this component

function App() {
  
  return (
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
  );
}

export default App;
