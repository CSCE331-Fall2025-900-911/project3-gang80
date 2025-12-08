import React, { useEffect, useState } from 'react';
import { API_URL } from '../globals';

type Order = {
  id: number;
  timestamp: string | null;
  total_price: number | null;
  customer_id?: number | null;
  employee_id?: number | null;
  payment_method?: string | null;
  voided?: boolean;
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/db/orders`);
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      const json = await res.json();
      const list: Order[] = (json.orders || []).map((o: any) => ({
        id: o.id,
        timestamp: o.timestamp || null,
        total_price: o.total_price != null ? Number(o.total_price) : null,
        customer_id: o.customer_id,
        employee_id: o.employee_id,
        payment_method: o.payment_method,
        voided: !!o.voided,
      }));

      // keep all orders for search, slice happens in filtered results
      setOrders(list);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = orders
    .filter(o => {
      if (!query) return true;
      // search by id substring
      return String(o.id).includes(query.trim());
    })
    .slice(0, 10); // show only 10 most recent that match search

  async function voidOrder(id: number) {
    // Optimistic UI: mark as voiding locally
    setOrders(prev => prev.map(o => o.id === id ? { ...o, voided: true } : o));

    try {
      const res = await fetch(`${API_URL}/api/db/orders/${id}/void`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        // If the request failed, revert the UI and show error
        setOrders(prev => prev.map(o => o.id === id ? { ...o, voided: false } : o));
        const errBody = await res.json().catch(() => ({}));
        setError(errBody.error || `Failed to void order (${res.status})`);
        return;
      }

      // Success — order is now voided, refresh to get fresh data
      await fetchOrders();
    } catch (e: any) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, voided: false } : o));
      setError(e.message || String(e));
    }
  }

  return (
    <div className="recent-orders" style={{
      backgroundColor: '#f0f0f0',
      borderRadius: '8px',
      padding: '1rem',
    }}>
      <h1>Past Orders:</h1>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <input
          aria-label="Search orders by ID"
          placeholder="Search order id..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ padding: '0.4rem', flex: '0 0 200px' }}
        />
        <button onClick={() => setQuery('')}>Clear</button>
        <button onClick={fetchOrders}>Refresh</button>
      </div>

      {loading && <div>Loading orders...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && filtered.length === 0 && (
        <div>No recent orders found.</div>
      )}

      {filtered.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.25rem' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '0.25rem' }}>Timestamp</th>
              <th style={{ textAlign: 'left', padding: '0.25rem' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '0.25rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} style={{ opacity: o.voided ? 0.5 : 1 }}>
                <td style={{ padding: '0.25rem' }}>{o.id}</td>
                <td style={{ padding: '0.25rem' }}>{o.timestamp ? new Date(o.timestamp).toLocaleString() : '—'}</td>
                <td style={{ padding: '0.25rem' }}>${o.total_price != null ? o.total_price.toFixed(2) : '0.00'}</td>
                <td style={{ padding: '0.25rem' }}>
                  <button 
                    onClick={() => voidOrder(o.id)} 
                    disabled={!!o.voided}
                    style={{
                      backgroundColor: '#ff4444',
                      color: 'white',
                      border: '2px solid #cc0000',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '4px',
                      cursor: o.voided ? 'default' : 'pointer',
                      opacity: 1,
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!o.voided) {
                        e.currentTarget.style.opacity = '0.7';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    {o.voided ? 'Voided' : 'Void'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
