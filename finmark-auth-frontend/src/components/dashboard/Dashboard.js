import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Calendar,
  User
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import CustomerDashboard from './CustomerDashboard';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersResponse, productsResponse, usersResponse] = await Promise.all([
          axios.get('/api/orders/stats'),
          axios.get('/api/products'),
          axios.get('/api/users')
        ]);

        setStats({
          orders: ordersResponse.data.data,
          products: productsResponse.data.data,
          users: usersResponse.data.users
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'user': return 'Customer';
      case 'admin': return 'Admin';
      case 'manager': return 'Staff';
      default: return 'Customer';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!user) return null;
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} stats={stats} />;
    case 'manager':
      return <StaffDashboard user={user} />;
    case 'user':
    default:
      return <CustomerDashboard user={user} />;
  }
};

export default Dashboard; 