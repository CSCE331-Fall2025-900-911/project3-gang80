import { useState } from "react";

function LoginButton() {
  const [initialized, setInitialized] = useState(false);

  // Callback executed when user signs in successfully
  function handleCredentialResponse(response: any) {
    const idToken = response.credential; // Google ID token (JWT)
    console.log("Received ID Token:", idToken);

    // Store token securely
    localStorage.setItem("id_token", idToken);

    // Optionally, redirect or trigger an authenticated API call here
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

  return (
    <button
      onClick={handleClick}
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
      Sign in with Google
    </button>
  );
}

export default LoginButton;
