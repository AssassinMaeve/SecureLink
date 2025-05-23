import { useState, useEffect } from "react";
import { auth } from "../db/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";
import { db } from "../db/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "../style/AuthForm.scss";

const AuthForm = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");  // Phone number state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true); // To handle loading state

  const navigate = useNavigate(); // Initialize useNavigate

  // Monitor auth state to check if the user is authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);  // Log user auth state
      if (user) {
        setIsEmailVerified(user.emailVerified);
        setLoading(false); // Set loading to false after checking auth state

        // Redirect to HomePage if the email is verified
        if (user.emailVerified) {
          console.log("User email is verified, navigating to /home.");
          navigate("/home");
        }
      } else {
        setLoading(false); // Set loading to false if user is not authenticated
        console.log("User is not authenticated.");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Attempting signup with email:", email);
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification link
      console.log("Sending email verification to:", user.email);
      await sendEmailVerification(user);
      alert("A verification email has been sent to your email address.");

      // Store user details including phone number in Firestore
      console.log("Storing user details in Firestore:", { username, email, phone });
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        phone,  // Storing phone number
      });

      console.log("User successfully signed up.");
    } catch (err: any) {
      console.error("Error during signup:", err);
      setError(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      console.log("Attempting login with email:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔄 Reload the user to get the latest emailVerified status
      console.log("Reloading user to get the latest emailVerified status.");
      await user.reload();

      if (!user.emailVerified) {
        console.log("User email is not verified.");
        setError("Please verify your email before logging in.");
        return;
      }

      console.log("Login successful, navigating to /home.");
      navigate("/home");
      alert("Login successful!");
    } catch (err: any) {
      console.error("Error during login:", err);
      setError(err.message);
    }
  };

  if (loading) {
    console.log("Loading user auth state...");
    return <div>Loading...</div>; // You can show a loading spinner or message while the state is being checked
  }

  return (
    <div className="main">
      <input
        type="checkbox"
        id="chk"
        checked={isSignup}
        onChange={() => setIsSignup(!isSignup)}
        aria-hidden="true"
      />

      <div className="signup">
        {/* Only show email verification message AFTER signup, not during signup process */}
        {!isSignup && isEmailVerified && (
          <p>We've sent you an email verification link. Please verify your email before logging in.</p>
        )}

        <form onSubmit={handleSignup}>
          <label htmlFor="chk" aria-hidden="true">Sign Up</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <div className="login">
        <form onSubmit={handleLogin}>
          <label htmlFor="chk" aria-hidden="true">Login</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
