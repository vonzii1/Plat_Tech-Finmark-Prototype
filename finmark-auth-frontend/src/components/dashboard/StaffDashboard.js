import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';

const StaffDashboard = ({ user }) => (
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
  </div>
);

export default StaffDashboard; 