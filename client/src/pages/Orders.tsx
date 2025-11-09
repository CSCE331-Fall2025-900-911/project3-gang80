import { useLocation } from "react-router-dom";

export default function Orders() {
  const location = useLocation();
  const orderType = (location.state as { orderType: string })?.orderType || "unknown";

  return (
    <div style={{ paddingLeft: "250px", height: "100vh" }}>
      <h1>Orders Page</h1>
      <p>Order type: {orderType}</p>
    </div>
  );
}
