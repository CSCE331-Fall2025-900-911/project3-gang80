// client/src/globals.ts
// Global variables for the React frontend

// Switch this based on the environment in use, testing vs production
export const API_URL = "http://127.0.0.1:5000";
//export const API_URL = "https://project3-gang80.onrender.com";

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
      const resp = await fetch(`${API_URL}${path}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": storedToken ? `Bearer ${storedToken}` : "",
        },
        body: JSON.stringify(request_data),
      });
      if (resp.status === 401){
        //Invalid login token reset/delete current auth
        localStorage.removeItem("id_token");
        localStorage.removeItem("user_role");
      }
      if (!resp.ok) {
        console.error("Request failed:", resp.status);
      }
      else {
        response_data = await resp.json();
        console.log("Backend ", path, " response: ", response_data);
        return response_data;
      }
    } catch (err) {
      console.error("Error calling backend login:", err);
    }
}