import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Orders = () => {
  const { user: authUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        let res;
        if (authUser && (authUser.role === 'admin' || authUser.role === 'manager')) {
          res = await axios.get('/api/orders/all');
        } else {
          res = await axios.get('/api/orders');
        }
        setOrders(res.data.data.orders || []);
      } catch (err) {
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    if (authUser) fetchOrders();
  }, [authUser]);

  const closeModal = () => setSelectedOrder(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
      </div>
      {loading ? (
        <div className="text-center py-10">Loading orders...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No orders found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customerInfo ? (
                      <>
                        {order.customerInfo.firstName} {order.customerInfo.lastName}
                        <br />
                        <span className="text-xs text-gray-500">{order.customerInfo.email}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{order.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{order.orderTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Order Confirmation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={closeModal}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">Order Confirmation</h2>
            <div className="mb-2 text-sm text-gray-700"><b>Order #:</b> {selectedOrder.orderNumber}</div>
            <div className="mb-2 text-sm text-gray-700"><b>Customer:</b> {selectedOrder.customerInfo ? `${selectedOrder.customerInfo.firstName} ${selectedOrder.customerInfo.lastName} (${selectedOrder.customerInfo.email})` : 'N/A'}</div>
            <div className="mb-2 text-sm text-gray-700"><b>Status:</b> {selectedOrder.status}</div>
            <div className="mb-2 text-sm text-gray-700"><b>Total:</b> ₱{selectedOrder.orderTotal.toFixed(2)}</div>
            <div className="mb-2 text-sm text-gray-700"><b>Created:</b> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            <div className="mb-2 text-sm text-gray-700"><b>Items:</b></div>
            <ul className="mb-4">
              {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                <li key={idx} className="ml-4 list-disc">
                  {item.productName} x {item.quantity} @ ₱{item.unitPrice.toFixed(2)} = ₱{item.totalPrice.toFixed(2)}
                </li>
              ))}
            </ul>
            <button
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders; 