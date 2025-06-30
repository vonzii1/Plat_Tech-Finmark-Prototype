import React from 'react';
import { ShoppingCart } from 'lucide-react';

const CustomerDashboard = ({ user }) => (
  <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {user?.firstName}!</h1>
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="h-6 w-6 text-blue-600" /></div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">Your Orders</p>
        <a href="/orders" className="text-blue-600 hover:underline">View Orders</a>
      </div>
    </div>
  </div>
);

export default CustomerDashboard; 