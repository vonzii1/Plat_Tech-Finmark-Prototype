import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Trash2, Plus, X, Edit2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useLocation, useNavigate } from 'react-router-dom';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user',
  phone: '',
  profilePicture: '',
  street: '',
  barangay: '',
  city: '',
  province: '',
  zipCode: '',
  country: 'Philippines',
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(initialForm);
  const [editUserId, setEditUserId] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal if ?add=1 is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add')) {
      setShowModal(true);
    }
  }, [location.search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data.users);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await axios.post('/api/register', form);
      setUsers([res.data.data.user, ...users]);
      setShowModal(false);
      setForm(initialForm);
      navigate('/users'); // Remove ?add=1 from URL
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        (err.response?.data?.errors ? err.response.data.errors[0].message : 'Failed to add user')
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/users'); // Remove ?add=1 from URL
  };

  const openEditModal = (user) => {
    setEditUserId(user._id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      profilePicture: user.profilePicture || '',
      ...(user.role === 'user' ? {
        phone: user.phone || '',
        street: user.address?.street || '',
        barangay: user.address?.barangay || '',
        city: user.address?.city || '',
        province: user.address?.province || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || 'Philippines',
      } : {})
    });
    setEditError(null);
    setEditModal(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setEditError('Profile picture must be less than 5MB');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setEditError('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(f => ({ ...f, profilePicture: reader.result }));
        setEditError(null);
      };
      reader.onerror = () => {
        setEditError('Failed to read the image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const updateData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
        ...(editForm.role === 'user' ? {
          profilePicture: editForm.profilePicture,
          phone: editForm.phone,
          address: {
            street: editForm.street,
            barangay: editForm.barangay,
            city: editForm.city,
            province: editForm.province,
            zipCode: editForm.zipCode,
            country: editForm.country,
          },
        } : {})
      };
      const res = await axios.put(`/api/users/${editUserId}`, updateData);
      setUsers(users.map(u => u._id === editUserId ? res.data.user : u));
      setEditModal(false);
      setEditUserId(null);
    } catch (err) {
      setEditError(
        err.response?.data?.message ||
        (err.response?.data?.errors ? err.response.data.errors[0].message : 'Failed to update user')
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditModal(false);
    setEditUserId(null);
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center"><User className="mr-2" />Users</h1>
        <button
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => setShowModal(true)}
        >
          <Plus className="h-5 w-5 mr-2" />Add User
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.isActive ? 'Active' : 'Inactive'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    className="text-blue-600 hover:text-blue-900 mr-2"
                    onClick={() => openEditModal(user)}
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    onClick={() => handleDelete(user._id)}
                    disabled={deleting === user._id}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="5" className="text-center py-8 text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={handleCloseModal}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={formLoading}
              >
                {formLoading ? 'Adding...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Edit User Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={handleCloseEditModal}
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              {editForm.role === 'user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <div className="flex items-center space-x-4">
                    {editForm.profilePicture ? (
                      <img src={editForm.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-400 border-2 border-gray-300">?</div>
                    )}
                    <label className="bg-white rounded-full p-2 shadow cursor-pointer border border-gray-200 hover:bg-blue-600 hover:text-white transition-colors">
                      <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                      <span className="text-xs">Upload</span>
                    </label>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" name="email" value={editForm.email} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" required />
              </div>
              {editForm.role === 'user' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" name="phone" value={editForm.phone} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. +639171234567" pattern="^(\+?63|0)9\d{9}$" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input type="text" name="street" value={editForm.street} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 123 Main St, Apartment 4B" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                    <input type="text" name="barangay" value={editForm.barangay} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Brgy. San Isidro" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/Municipality</label>
                    <input type="text" name="city" value={editForm.city} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Quezon City" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                    <input type="text" name="province" value={editForm.province} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Metro Manila" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input type="text" name="zipCode" value={editForm.zipCode} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2" placeholder="e.g. 1100" pattern="^[0-9]{4}$" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" name="country" value={editForm.country} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2 bg-gray-100" readOnly />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select name="role" value={editForm.role} onChange={handleEditFormChange} className="w-full border rounded-lg px-3 py-2">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Staff</option>
                </select>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <button type="submit" disabled={editLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={handleCloseEditModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                {editError && <span className="text-red-600 text-sm ml-2">{editError}</span>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users; 