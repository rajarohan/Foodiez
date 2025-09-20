import React from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const adminCards = [
    {
      title: 'Restaurants',
      description: 'Manage restaurant listings and information',
      icon: BuildingStorefrontIcon,
      href: '/admin/restaurants',
      color: 'bg-blue-500'
    },
    {
      title: 'Menu Items',
      description: 'Add and edit menu items across restaurants',
      icon: Squares2X2Icon,
      href: '/admin/menu-items',
      color: 'bg-green-500'
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      icon: ClipboardDocumentListIcon,
      href: '/admin/orders',
      color: 'bg-orange-500'
    },
    {
      title: 'Analytics',
      description: 'View sales and performance analytics',
      icon: ChartBarIcon,
      href: '/admin/analytics',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your restaurants and orders from here.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Restaurants</h3>
            <p className="text-3xl font-bold text-primary-600">12</p>
            <p className="text-sm text-gray-600 mt-1">+2 this week</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Items</h3>
            <p className="text-3xl font-bold text-green-600">148</p>
            <p className="text-sm text-gray-600 mt-1">+15 this week</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-orange-600">1,247</p>
            <p className="text-sm text-gray-600 mt-1">+89 this week</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue</h3>
            <p className="text-3xl font-bold text-purple-600">$32,450</p>
            <p className="text-sm text-gray-600 mt-1">+12% this week</p>
          </div>
        </div>

        {/* Admin Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.href}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">New restaurant "Pizza Palace" was added</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">15 new orders received</span>
                  <span className="text-xs text-gray-400">4 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Menu updated for "Burger King"</span>
                  <span className="text-xs text-gray-400">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;