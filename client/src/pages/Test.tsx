import * as React from "react";
import Popup from "../components/Popup";

function Test() {
    const [showPopup, setShowPopup] = React.useState(false);

    return (
    <div style={{ padding: "2rem" }}>
      <h1>Popup Test Page</h1>
      <button type="button" onClick={() => setShowPopup(true)}>
        Popup
      </button>

      {showPopup && (
        <Popup onClose={() => setShowPopup(false)}
        title="Honey Pearl Milk Tea" />
      )}
    </div>
    
  );
}

export default Test;