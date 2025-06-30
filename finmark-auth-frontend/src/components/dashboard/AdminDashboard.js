import React from 'react';
import { ShoppingCart, Package, User, Settings, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = ({ user, stats }) => {
  const totalOrders = stats?.orders?.totalOrders || 0;
  const totalRevenue = stats?.orders?.totalRevenue || 0;
  const totalProducts = Array.isArray(stats?.products) ? stats.products.length : 0;
  const totalUsers = Array.isArray(stats?.users) ? stats.users.length : 0;
  const recentUsers = Array.isArray(stats?.users) ? stats.users.slice(0, 5) : [];
  const recentOrders = Array.isArray(stats?.orders?.recentOrders) ? stats.orders.recentOrders.slice(0, 5) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, Admin {user?.firstName}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <a href="/orders" className="bg-white rounded-lg shadow p-6 flex items-center hover:bg-blue-50 transition">
          <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-6 w-6 text-blue-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Orders</p><p className="text-2xl font-bold text-gray-900">{totalOrders}</p></div>
        </a>
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="p-2 bg-green-100 rounded-lg"><svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M7 20V4h6a5 5 0 1 1 0 10H7m0 0h10M7 9h10' /></svg></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Revenue</p><p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p></div>
        </div>
        <a href="/products" className="bg-white rounded-lg shadow p-6 flex items-center hover:bg-purple-50 transition">
          <div className="p-2 bg-purple-100 rounded-lg"><Package className="h-6 w-6 text-purple-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Products</p><p className="text-2xl font-bold text-gray-900">{totalProducts}</p></div>
        </a>
        <a href="/users" className="bg-white rounded-lg shadow p-6 flex items-center hover:bg-orange-50 transition">
          <div className="p-2 bg-orange-100 rounded-lg"><User className="h-6 w-6 text-orange-600" /></div>
          <div className="ml-4"><p className="text-sm font-medium text-gray-600">Total Users</p><p className="text-2xl font-bold text-gray-900">{totalUsers}</p></div>
        </a>
      </div>
      <div className="flex space-x-4 mb-8">
        <Link to="/products?add=1" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"><Plus className="h-5 w-5 mr-2" />Add Product</Link>
        <Link to="/users?add=1" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"><Plus className="h-5 w-5 mr-2" />Add User</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <ul>
            {recentUsers.map(u => (
              <li key={u._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span>{u.firstName} {u.lastName} <span className="text-xs text-gray-500">({u.role})</span></span>
                <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {recentUsers.length === 0 && <li className="text-gray-500">No recent users.</li>}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <ul>
            {recentOrders.map(o => (
              <li key={o._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <span>Order #{o.orderNumber} <span className="text-xs text-gray-500">by {o.customerName || o.customer || 'N/A'}</span></span>
                <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
            {recentOrders.length === 0 && <li className="text-gray-500">No recent orders.</li>}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-green-500 rounded-full"></span><span className="text-sm text-gray-700">API Gateway</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-green-500 rounded-full"></span><span className="text-sm text-gray-700">Database</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 bg-green-500 rounded-full"></span><span className="text-sm text-gray-700">Authentication</span></div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 