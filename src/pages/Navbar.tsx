import React, { useState } from "react";
import { auth } from "../db/firebase";
import "../style/NavBar.scss";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    // You may also redirect using React Router:
    // navigate("/login");
  };

  const toggleMenu = () => {
  console.log(menuOpen); // Check if the state is changing
  setMenuOpen(!menuOpen);
};

  return (
    <nav className="nav">
      <a href="/" className="nav-logo">
        Secure Link
      </a>

  <div className={`hamburger ${menuOpen ? "open" : ""}`} onClick={toggleMenu}>
    <span className="bar"></span>
    <span className="bar"></span>
    <span className="bar"></span>
  </div>


      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li><a href="/home" onClick={() => setMenuOpen(false)}>Home</a></li>
        <li><a href="/profile" onClick={() => setMenuOpen(false)}>Profile</a></li>
        <li><a href="/#" onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
