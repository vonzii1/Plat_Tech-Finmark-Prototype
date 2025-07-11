import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Camera } from 'lucide-react';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', street: '', barangay: '', city: '', province: '', zipCode: '', country: 'Philippines', profilePicture: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/auth/profile');
        setUser(res.data.data.user);
        console.log('Fetched user profile:', res.data.data.user);
        setForm({
          firstName: res.data.data.user.firstName || '',
          lastName: res.data.data.user.lastName || '',
          email: res.data.data.user.email || '',
          phone: res.data.data.user.phone || '',
          street: res.data.data.user.address?.street || '',
          barangay: res.data.data.user.address?.barangay || '',
          city: res.data.data.user.address?.city || '',
          province: res.data.data.user.address?.province || '',
          zipCode: res.data.data.user.address?.zipCode || '',
          country: res.data.data.user.address?.country || 'Philippines',
          profilePicture: res.data.data.user.profilePicture || ''
        });
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const res = await axios.get('/api/orders');
        setRecentOrders(res.data.data.orders || []);
      } catch (err) {
        setOrdersError('Failed to load recent orders.');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchProfile();
    fetchOrders();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Profile picture must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, profilePicture: reader.result }));
        setError(null); // Clear any previous errors
      };
      reader.onerror = () => {
        setError('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    setValidationErrors([]);
    try {
      const profileData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        address: {
          street: form.street,
          barangay: form.barangay,
          city: form.city,
          province: form.province,
          zipCode: form.zipCode,
          country: form.country
        },
        profilePicture: form.profilePicture
      };
      const response = await axios.put('/api/auth/profile', profileData);
      setSuccess('Profile updated successfully!');
      // Update the user state with the new profile data
      if (response.data.data && response.data.data.user) {
        setUser(response.data.data.user);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.message || 
                          'Failed to update profile.';
      setError(errorMessage);
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Profile</h1>
      {loading ? (
        <div className="text-center py-10">Loading profile...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {authUser?.role === 'user' && (
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative group">
                {form.profilePicture ? (
                  <img src={form.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400 border-2 border-gray-300 shadow">?</div>
                )}
                <label htmlFor="profilePicUpload" className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer border border-gray-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Camera className="h-5 w-5 text-gray-500 group-hover:text-white" />
                  <input id="profilePicUpload" type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                <p className="text-xs text-gray-500">Click the camera to upload</p>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input type="text" name="firstName" value={form.firstName} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input type="text" name="lastName" value={form.lastName} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          {authUser?.role === 'user' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. +639171234567" pattern="^(\+?63|0)9\d{9}$" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input type="text" name="street" value={form.street} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. 123 Main St, Apartment 4B" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <input type="text" name="barangay" value={form.barangay} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. Brgy. San Isidro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. Quezon City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <input type="text" name="province" value={form.province} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. Metro Manila" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input type="text" name="zipCode" value={form.zipCode} onChange={handleChange} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. 1100" pattern="^[0-9]{4}$" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" name="country" value={form.country} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 bg-gray-100" readOnly />
              </div>
            </>
          )}
          <div className="flex items-center space-x-4">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
            {success && <span className="text-green-600 text-sm">{success}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
            {validationErrors.length > 0 && (
              <ul className="text-red-500 text-sm list-disc ml-5 mt-2">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err.field ? `${err.field}: ` : ''}{err.message}</li>
                ))}
              </ul>
            )}
          </div>
        </form>
      )}
      {authUser?.role === 'user' && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
          {ordersLoading ? (
            <div>Loading recent orders...</div>
          ) : ordersError ? (
            <div className="text-red-500">{ordersError}</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-gray-500">No recent orders.</div>
          ) : (
            <ul>
              {recentOrders.slice(0, 5).map(order => (
                <li key={order._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span>Order #{order.orderNumber || order._id}</span>
                  <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs text-blue-600 font-bold">{order.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile; 