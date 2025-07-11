import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import axios from 'axios';
import { useEffect, useState } from 'react';

const orderStatusOptions = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
];

const StaffDashboard = ({ user }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState({});
  const [statusError, setStatusError] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await axios.get('/api/orders/all?limit=5');
        setRecentOrders(res.data.data.orders || []);
      } catch (err) {
        setOrdersError('Failed to load recent orders.');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleStatusChange = (orderId, newStatus) => {
    setRecentOrders(orders => orders.map(o =>
      o._id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setStatusUpdating(s => ({ ...s, [orderId]: true }));
    setStatusError(e => ({ ...e, [orderId]: '' }));
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      setRecentOrders(orders => orders.map(o =>
        o._id === orderId ? { ...o, status: newStatus } : o
      ));
    } catch (err) {
      setStatusError(e => ({ ...e, [orderId]: err.response?.data?.message || 'Failed to update status' }));
    } finally {
      setStatusUpdating(s => ({ ...s, [orderId]: false }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, Staff {user?.firstName}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-6 w-6 text-blue-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Manage Orders</p><a href="/orders" className="text-blue-600 hover:underline">Go to Orders</a></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg"><Package className="h-6 w-6 text-purple-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Manage Products</p><a href="/products" className="text-blue-600 hover:underline">Go to Products</a></div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customer Orders</h3>
        {ordersLoading ? (
          <div>Loading recent orders...</div>
        ) : ordersError ? (
          <div className="text-red-500">{ordersError}</div>
        ) : recentOrders.length === 0 ? (
          <div className="text-gray-500">No recent orders.</div>
        ) : (
          <ul>
            {recentOrders.map(order => {
              const currentStatusIdx = orderStatusOptions.indexOf(order.status);
              const nextStatusOptions = orderStatusOptions.slice(currentStatusIdx + 1);
              return (
                <li key={order._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span>Order #{order.orderNumber || order._id} <span className="text-xs text-gray-500">by {order.userId?.firstName} {order.userId?.lastName}</span></span>
                  <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs text-blue-600 font-bold mr-2">{order.status}</span>
                  {nextStatusOptions.length > 0 && (
                    <>
                      <select
                        className="border rounded px-2 py-1 text-xs mr-2"
                        value=""
                        onChange={e => updateOrderStatus(order._id, e.target.value)}
                        disabled={statusUpdating[order._id]}
                      >
                        <option value="">Change Status</option>
                        {nextStatusOptions.map(status => (
                          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                      </select>
                      {statusError[order._id] && <span className="text-red-500 text-xs ml-2">{statusError[order._id]}</span>}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard; 