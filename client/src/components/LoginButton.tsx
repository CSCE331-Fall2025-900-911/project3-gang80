import { useState, useEffect } from "react";
import { makeApiCall } from "../globals";

function LoginButton() {
  const [initialized, setInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem("id_token"));

  // Centralized cleanup function for both explicit sign-outs and failed authentication
  function cleanupAuthState() {
    localStorage.removeItem("id_token");
    localStorage.removeItem("user_role");
    window.dispatchEvent(new Event('storage_changed'));
    setIsLoggedIn(false);
    
    // Reset Google Sign-In state to allow re-initialization
    setInitialized(false);
  }

  // Callback executed when user signs in successfully
  async function handleCredentialResponse(response: any) {
    const idToken = response.credential; // Google ID token (JWT)
    console.log("Received ID Token:", idToken);

    // Store token temporarily
    localStorage.setItem("id_token", idToken);
    window.dispatchEvent(new Event('storage_changed'));

    try {
      // Call backend /api/db/login route to verify and set user role
      const loginResponse = await makeApiCall("/api/db/login", "POST", {}) as { user_role?: string; user_id?: number; message?: string } | undefined;
      
      if (loginResponse && loginResponse.user_role) {
        localStorage.setItem("user_role", loginResponse.user_role);
        console.log("User role set to:", loginResponse.user_role);
        window.dispatchEvent(new Event('storage_changed'));
        setIsLoggedIn(true);
      } else {
        // Backend call failed or returned invalid data - cleanup
        console.error("Login failed: Invalid response from backend");
        cleanupAuthState();
        alert("Authentication failed. Please try again.");
      }
    } catch (error) {
      // Backend call threw an error - cleanup
      console.error("Login error:", error);
      cleanupAuthState();
      alert("Authentication failed. Please try again.");
    }
  }

  function handleSignOut() {
    cleanupAuthState();
  }

  function handleClick() {
    if (!window.google) {
      console.error("Google API not loaded. Make sure the script is included.");
      return;
    }

    if (!initialized) {
      /* global google */
      google.accounts.id.initialize({
        client_id: "1090847452683-mc60dh5mdhlj90i1qathlqovdc3bhj2d.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });

      setInitialized(true);
    }

    // Prompt the Google One Tap or show the sign-in popup
    google.accounts.id.prompt();
  }

  // Keep isLoggedIn state in sync if other tabs/windows modify localStorage
  useEffect(() => {
    const onStorageChanged = () => {
      const hasToken = !!localStorage.getItem('id_token');
      setIsLoggedIn(hasToken);
      
      // Reset initialized state if logged out to allow fresh sign-in
      if (!hasToken) {
        setInitialized(false);
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'id_token' || e.key === 'user_role') {
        onStorageChanged();
      }
    };

    // Listen to both standard storage events (cross-tab) and custom events (same-tab)
    window.addEventListener('storage', onStorage);
    window.addEventListener('storage_changed', onStorageChanged);
    
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('storage_changed', onStorageChanged);
    };
  }, []);

  return (
    <button
      onClick={isLoggedIn ? handleSignOut : handleClick}
      style={{
        padding: "10px 20px",
        fontSize: "16px",
        cursor: "pointer",
        borderRadius: "5px",
        backgroundColor: "#4285F4",
        color: "white",
        border: "none",
      }}
    >
      {isLoggedIn ? 'Sign Out' : 'Sign in with Google'}
    </button>
  );
}

export default LoginButton;
