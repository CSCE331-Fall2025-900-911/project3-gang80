import { useEffect } from "react";
import LoginButton from "../components/LoginButton";
import logo from "../assets/sharetea_logo.png";
import "../css/LoginPage.css";

export default function LoginPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-container">
          <img 
            src={logo} 
            alt="Sharetea Logo" 
            className="login-logo"
          />
        </div>
        <h1 className="login-title">Welcome to Sharetea</h1>
        <p className="login-subtitle">Please log in to continue</p>
        <div className="login-button-container">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}