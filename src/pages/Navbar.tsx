import { auth } from "../db/firebase"; // Ensure firebase auth is correctly linked
import "../style/NavBar.scss"; // Ensure this is correctly linked

const Navbar = () => {
  const handleLogout = () => {
    auth.signOut();
    // Optionally, redirect user after logout (use history or navigate for that)
  };

  return (
    <nav className="nav">
      <a href="/" className="nav-logo">
        Secure Link
      </a>
      <ul className="nav-links">
        <li><a href="/home">Home</a></li>
        <li><a href="/profile">Profile</a></li>
        <li><a href="/#" onClick={handleLogout}>Logout</a></li>
      </ul>
    </nav>
  );
};

export default Navbar;
