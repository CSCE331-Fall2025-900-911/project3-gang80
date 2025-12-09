// client/src/globals.ts
// Global variables for the React frontend

// Switch this based on the environment in use, testing vs production
//export const API_URL = "http://127.0.0.1:5000";
export const API_URL = "https://project3-gang80.onrender.com";

export async function makeApiCall(path : string, method : string, request_data : any) {
    /**
     * Generic function to make API calls to the backend
     * @param path API endpoint path (e.g., "/api/db/login")
     * @param method HTTP method (e.g., "POST", "GET")
     * @param request_data Data to send in the request body (e.g., {category: "Milk Tea", item_id: 1})
     * @returns Response data from the backend
    */
    try {
      let response_data = {};
      const storedToken = localStorage.getItem("id_token");

      const fetchOptions: RequestInit = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": storedToken ? `Bearer ${storedToken}` : "",
      },
    };

    // Only attach body for non-GET requests
    if (method !== "GET" && request_data !== null) {
      fetchOptions.body = JSON.stringify(request_data);
    }
    
      const resp = await fetch(`${API_URL}${path}`, fetchOptions);
      if (resp.status === 401){
        //Invalid login token reset/delete current auth
        localStorage.removeItem("id_token");
        localStorage.removeItem("user_role");
        window.dispatchEvent(new Event('storage_changed'));
        console.error("Unauthorized: Reset localstorage");
        alert("Session expired or unauthorized. Please log in.");
      }
      if (!resp.ok) {
        console.error("Request failed:", resp.status);
        return null;
      }
      else {
        response_data = await resp.json();
        console.log("Backend", path, " response:", response_data);
        return response_data;
      }
    } catch (err) {
      console.error("Error calling backend:", err);
    }
}