import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/Checkout.css";
import { useContrastMode } from "../contexts/ContrastModeContext";
import { useMagnifyMode } from "../contexts/MagnifyModeContext";
import { useMagnifier } from "../hooks/useMagnifier";
import { MagnifierLens } from "../components/MagnifierLens";
import { useTranslation } from "../contexts/TranslationContext";
import { makeApiCall } from "../globals";


export default function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { highContrast } = useContrastMode();
  const { magnifyMode, useLens } = useMagnifyMode();
  const { lensPos, lensText, lensImageSrc, lensImageAlt, handleMouseMove } = useMagnifier();
  const { language, translate, t } = useTranslation();
  const [translatedStatics, setTranslatedStatics] = useState<Record<string, string>>({});
  const [translatedNames, setTranslatedNames] = useState<Record<number, string>>({});

  const orderType = (location.state as { orderType: string })?.orderType || "unknown";

  interface CartItem {
    id?: number;
    name: string;
    price: number;
    quantity: number;
    toppings?: Array<{ id: number; name: string; price: number }>;
  }

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [userRewards, setUserRewards] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [rewardsError, setRewardsError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    setCartItems(saved ? JSON.parse(saved) : []);
  }, []);

  // Fetch user rewards if logged in
  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      setUserId(null);
      setUserRewards(null);
      return;
    }
    
    const uid = Number(storedUserId);
    if (Number.isNaN(uid)) {
      setUserId(null);
      setUserRewards(null);
      return;
    }
    
    setUserId(uid);
    setLoadingRewards(true);
    
    async function fetchUserRewards() {
      try {
        const data = await makeApiCall('/api/db/users', 'GET', null) as { users: any[] };
        const users = data?.users || [];
        const user = users.find(u => u.id === uid);
        if (user) {
          setUserRewards(Number(user.rewards) || 0);
          setRewardsError(null);
        } else {
          setUserRewards(null);
          setRewardsError('User not found');
        }
      } catch (e) {
        console.error('Failed to fetch rewards:', e);
        setUserRewards(null);
        setRewardsError('Failed to load rewards');
      } finally {
        setLoadingRewards(false);
      }
    }
    
    fetchUserRewards();
  }, []);

  // Translate static labels and item names when language changes
  useEffect(() => {
    let mounted = true;
    async function run() {
      if (language === 'en') {
        setTranslatedStatics({});
        setTranslatedNames({});
        return;
      }
      try {
        const names = cartItems.map(ci => ci.name);
        const staticTexts = [
          'Checkout','Order type:', 'Order Summary', 'Subtotal:', 'Tax:', 'Total:', 'Select Payment Method', '--Select--', 'Credit Card', 'Cash', 'Back to Cart', 'Confirm Order'
        ];
        const promises: Promise<string>[] = [];
        names.forEach(n => promises.push(translate(n)));
        staticTexts.forEach(s => promises.push(translate(s)));
        const results = await Promise.all(promises);
        if (!mounted) return;
        const nameMap: Record<number, string> = {};
  cartItems.forEach((_ci, idx) => { nameMap[idx] = results[idx]; });
        const staticsMap: Record<string, string> = {};
        staticTexts.forEach((s, i) => { staticsMap[s] = results[names.length + i]; });
        setTranslatedNames(nameMap);
        setTranslatedStatics(staticsMap);
      } catch (err) {
        console.error('Checkout translation error', err);
      }
    }
    run();
    return () => { mounted = false; };
  }, [language, cartItems]);


  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;
  const requiredPearls = Math.ceil(total);

  const handlePaymentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
    // Clear error when changing payment method
    setRewardsError(null);
  };

  const handleConfirmOrder = async () => {
    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    // Validate Pearl Rewards payment
    if (paymentMethod === "Pearls") {
      if (userRewards === null) {
        alert("Unable to verify rewards balance. Please try again.");
        return;
      }
      if (userRewards < requiredPearls) {
        const shortage = requiredPearls - userRewards;
        alert(`Insufficient pearls. You need ${requiredPearls} pearls but only have ${userRewards}. You are ${shortage} pearls short.`);
        return;
      }
    }

    // Build order payload for Flask backend
    const orderData = {
      customer_id: userId, // include customer ID if using Pearl Rewards
      total_price: total,
      pearls_earned: Math.floor(total / 10),
      pearls_redeemed: paymentMethod === "Pearls" ? requiredPearls : undefined,
      payment_method: paymentMethod,
      order_type: orderType, // dine-in / takeout
      employee_id: 1, // default employee
      items: cartItems.map((item) => ({
        menu_item_id: item.id || null, // you may need to ensure ID exists
        quantity: item.quantity,
      })),
    };

    try {
      const data = await makeApiCall('/api/db/orders/create', 'POST', orderData);

      if (!data) {
        alert("There was an error processing your order. Please try again.");
        return;
      }

      console.log("Order confirmed!", data);

      localStorage.removeItem("cartItems");
      setCartItems([]);

      alert(`Order confirmed! Payment method: ${paymentMethod}`);
      navigate("/kiosk/confirmation", {});
    } catch (err) {
      console.error("Fetch error:", err);
      alert("There was an error processing your order. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/kiosk/cart", {
      state: { orderType: orderType, cartItems: cartItems },
    });
  };

  return (
    <div className={`checkout-page ${highContrast ? "high-contrast" : ""} ${magnifyMode ? 'magnify' : ''}`} onMouseMove={(e) => handleMouseMove(e, magnifyMode)}>
      <h1>{translatedStatics['Checkout'] ?? t('Checkout')}</h1>
      <p>{(translatedStatics['Order type:'] ?? t('Order type:'))} {orderType}</p>

      <div className="checkout-summary">
        <h2>{translatedStatics['Order Summary'] ?? t('Order Summary')}</h2>
        <ul>
          {cartItems.map((item, index) => (
            <li key={index}>
              {(translatedNames[index] ?? item.name)} 
              {item.toppings && item.toppings.length > 0 && (
                <> + {item.toppings.map(t => t.name).join(", ")}</>
              )}
              {" - $"}
              {item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
        <h3>{translatedStatics['Subtotal:'] ?? t('Subtotal:')} ${subtotal.toFixed(2)}</h3>
        <h3>{translatedStatics['Tax:'] ?? t('Tax:')} ${tax.toFixed(2)}</h3>
        <h2>{translatedStatics['Total:'] ?? t('Total:')} ${total.toFixed(2)}</h2>
      </div>

      <div className="payment-section">
        <h2>{translatedStatics['Select Payment Method'] ?? t('Select Payment Method')}</h2>
        {userId && userRewards !== null && (
          <div className="rewards-info" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              <strong>Your Pearl Rewards:</strong> {userRewards} pearls
              {paymentMethod === "Pearls" && (
                <span style={{ marginLeft: '0.5rem', color: userRewards >= requiredPearls ? '#059669' : '#dc2626' }}>
                  ({userRewards >= requiredPearls ? 'Sufficient' : `Need ${requiredPearls - userRewards} more`})
                </span>
              )}
            </p>
          </div>
        )}
        {loadingRewards && <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>Loading rewards...</p>}
        {rewardsError && !loadingRewards && (
          <div className="error-message" style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b' }}>
            <strong>Error:</strong> {rewardsError}
          </div>
        )}
        <select value={paymentMethod} onChange={handlePaymentChange}>
          <option value="">{translatedStatics['--Select--'] ?? t('--Select--')}</option>
          <option value="Credit Card">{translatedStatics['Credit Card'] ?? t('Credit Card')}</option>
          <option value="Cash">{translatedStatics['Cash'] ?? t('Cash')}</option>
          {userId && userRewards !== null && (
            <option value="Pearls">Pearls ({userRewards} available)</option>
          )}
        </select>
        {paymentMethod === "Pearls" && userRewards !== null && userRewards >= requiredPearls && (
          <div className="pearls-deduction-notice" style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#ecfdf5', border: '1px solid #86efac', borderRadius: '0.5rem', color: '#065f46' }}>
            <p style={{ margin: 0, fontSize: '0.95rem' }}>
              <strong>Note:</strong> {requiredPearls} pearls will be deducted from your account when you confirm this order.
            </p>
          </div>
        )}
        {paymentMethod === "Pearls" && userRewards !== null && userRewards < requiredPearls && (
          <div className="error-message" style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#991b1b' }}>
            <strong>Insufficient Pearls:</strong> You need {requiredPearls} pearls to complete this order, but you only have {userRewards}. Please select a different payment method.
          </div>
        )}
      </div>

      <div className="checkout-actions">
        <button className="back-btn" onClick={handleBack}>
          {translatedStatics['Back to Cart'] ?? t('Back to Cart')}
        </button>
        <button className="confirm-btn" onClick={handleConfirmOrder}>
          {translatedStatics['Confirm Order'] ?? t('Confirm Order')}
        </button>
      </div>
      <MagnifierLens 
        lensPos={lensPos}
        lensText={lensText}
        lensImageSrc={lensImageSrc}
        lensImageAlt={lensImageAlt}
        magnifyMode={magnifyMode}
        useLens={useLens}
      />
    </div>
  );
}
