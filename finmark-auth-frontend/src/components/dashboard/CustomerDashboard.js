import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = ({ user }) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderModal, setOrderModal] = useState({ open: false, product: null });
  const [orderQty, setOrderQty] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [orderError, setOrderError] = useState('');
  const [orderFieldErrors, setOrderFieldErrors] = useState({});
  const [lastOrderPayload, setLastOrderPayload] = useState(null);
  const [lastOrderResponse, setLastOrderResponse] = useState(null);
  const [lastOrderError, setLastOrderError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/products');
        setProducts(res.data.data.products || []);
      } catch (err) {
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const openOrderModal = (product) => {
    setOrderModal({ open: true, product });
    setOrderQty(1);
    setOrderSuccess('');
    setOrderError('');
    setOrderFieldErrors({});
  };

  const closeOrderModal = () => {
    setOrderModal({ open: false, product: null });
    setOrderQty(1);
    setOrderSuccess('');
    setOrderError('');
    setOrderFieldErrors({});
    // If order was successful, redirect to orders page
    if (orderSuccess) {
      navigate('/orders');
    }
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setOrderLoading(true);
    setOrderSuccess('');
    setOrderError('');
    setOrderFieldErrors({});
    let timeoutId;
    try {
      if (!authUser || !authUser.email) {
        setOrderError('You must be logged in to place an order.');
        toast.error('You must be logged in to place an order.');
        setOrderLoading(false);
        return;
      }
      const product = orderModal.product;
      const items = [
        {
          productId: product.productId,
          productName: product.name,
          quantity: orderQty,
          unitPrice: product.price,
          totalPrice: orderQty * product.price
        }
      ];
      const customerInfo = {
        firstName: authUser?.firstName || '',
        lastName: authUser?.lastName || '',
        email: authUser?.email || '',
        phone: '+639171234567'
      };
      const payload = { customerInfo, items, shippingAddress: {
        street: '123 Test St',
        barangay: 'Sample Barangay',
        city: 'Test City',
        province: 'Test Province',
        zipCode: '12345',
        country: 'Philippines'
      }};
      console.log('Order payload:', payload);
      // Timeout for hanging requests
      timeoutId = setTimeout(() => {
        setOrderError('Request timed out. Please try again.');
        setOrderLoading(false);
      }, 10000);
      const response = await axios.post('/api/orders', payload);
      clearTimeout(timeoutId);
      setOrderSuccess('Order placed successfully!');
      toast.success('Order placed successfully!');
      setTimeout(() => {
        closeOrderModal();
        navigate('/orders');
      }, 1000);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Order error (full):', err);
      if (err.response) {
        // Backend responded with error
        setOrderError(`Error ${err.response.status}: ${err.response.data.message || 'Failed to place order.'}`);
        toast.error(err.response.data.message || 'Failed to place order.');
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          const fieldErrors = {};
          err.response.data.errors.forEach(errorObj => {
            if (errorObj.field && errorObj.message) {
              fieldErrors[errorObj.field] = errorObj.message;
            }
          });
          setOrderFieldErrors(fieldErrors);
        }
      } else if (err.request) {
        // Request made but no response
        setOrderError('No response from server. Please check your connection.');
        toast.error('No response from server. Please check your connection.');
      } else {
        // Something else
        setOrderError('Unexpected error: ' + err.message);
        toast.error('Unexpected error: ' + err.message);
      }
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {user?.firstName}!</h1>
      <div className="bg-white rounded-lg shadow p-6 flex items-center mb-8">
      <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-6 w-6 text-blue-600" /></div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">Your Orders</p>
        <a href="/orders" className="text-blue-600 hover:underline">View Orders</a>
      </div>
    </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Available Products</h2>
        {loading ? (
          <div>Loading products...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-gray-500">No products available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product._id || product.productId} className="border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-40 object-cover rounded mb-3 shadow-sm border" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-3">No Image</div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">Category: {product.category}</p>
                  <p className="text-sm text-gray-600 mb-1">Price: <span className="font-bold">₱{Number(product.price).toFixed(2)}</span></p>
                  <p className="text-sm text-gray-600 mb-1">Stock: {product.stockQuantity}</p>
                </div>
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
                  onClick={() => openOrderModal(product)}
                  disabled={product.stockQuantity < 1}
                >
                  {product.stockQuantity < 1 ? 'Out of Stock' : 'Order'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Order Modal */}
      {orderModal.open && orderModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={closeOrderModal}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Order {orderModal.product.name}</h3>
            <form onSubmit={handleOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={orderModal.product.stockQuantity}
                  value={orderQty}
                  onChange={e => setOrderQty(Number(e.target.value))}
                  className="w-full border rounded-md px-3 py-2"
                  required
                  disabled={!!orderSuccess}
                />
                <p className="text-xs text-gray-500 mt-1">Available: {orderModal.product.stockQuantity}</p>
                {orderFieldErrors['items.0.quantity'] && <div className="text-red-500 text-sm mt-1">{orderFieldErrors['items.0.quantity']}</div>}
              </div>
              {orderSuccess && (
                <div className="text-green-600 text-sm mb-2">{orderSuccess}</div>
              )}
              {orderError && (
                <div className="text-red-500 text-sm mb-2">{orderError}</div>
              )}
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                disabled={orderLoading || !!orderSuccess}
              >
                {orderLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}
  </div>
);
};

export default CustomerDashboard; 