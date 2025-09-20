import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const AdminMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    restaurant: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    ingredients: [],
    allergens: [],
    preparationTime: '',
    calories: '',
    isAvailable: true,
    isFeatured: false
  });

  const categories = [
    'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Pizza', 'Burgers', 
    'Pasta', 'Salads', 'Soups', 'Sandwiches', 'Chinese', 'Indian', 'Mexican', 'Other'
  ];

  const allergenOptions = [
    'Nuts', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Shellfish', 'Fish'
  ];

  useEffect(() => {
    Promise.all([fetchMenuItems(), fetchRestaurants()]);
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.menuItems.getAll();
      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await api.restaurants.getAll();
      setRestaurants(response.data.restaurants || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const menuItemData = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime) || 0,
        calories: parseInt(formData.calories) || 0,
        ingredients: formData.ingredients.filter(i => i.trim() !== ''),
        allergens: formData.allergens.filter(a => a.trim() !== '')
      };

      if (editingMenuItem) {
        await api.menuItems.update(editingMenuItem._id, menuItemData);
      } else {
        await api.menuItems.create(menuItemData);
      }
      
      await fetchMenuItems();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      setError('Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      await api.menuItems.delete(id);
      await fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      setError('Failed to delete menu item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      restaurant: '',
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isSpicy: false,
      ingredients: [],
      allergens: [],
      preparationTime: '',
      calories: '',
      isAvailable: true,
      isFeatured: false
    });
    setEditingMenuItem(null);
  };

  const openEditModal = (menuItem) => {
    setEditingMenuItem(menuItem);
    setFormData({
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      category: menuItem.category,
      restaurant: menuItem.restaurant._id,
      isVegetarian: menuItem.isVegetarian,
      isVegan: menuItem.isVegan,
      isGlutenFree: menuItem.isGlutenFree,
      isSpicy: menuItem.isSpicy,
      ingredients: menuItem.ingredients || [],
      allergens: menuItem.allergens || [],
      preparationTime: menuItem.preparationTime,
      calories: menuItem.calories,
      isAvailable: menuItem.isAvailable,
      isFeatured: menuItem.isFeatured
    });
    setShowModal(true);
  };

  const handleIngredientsChange = (ingredients) => {
    const newIngredients = ingredients.split(',').map(i => i.trim());
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleAllergenToggle = (allergen) => {
    const newAllergens = formData.allergens.includes(allergen)
      ? formData.allergens.filter(a => a !== allergen)
      : [...formData.allergens, allergen];
    setFormData({ ...formData, allergens: newAllergens });
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRestaurant = !selectedRestaurant || item.restaurant._id === selectedRestaurant;
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesRestaurant && matchesCategory;
  });

  if (loading && menuItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Menu Items</h1>
              <p className="text-gray-600 mt-2">Add, edit, and manage menu items across restaurants</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add Menu Item</span>
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((menuItem) => (
            <div key={menuItem._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={menuItem.image || '/api/placeholder/400/200'}
                  alt={menuItem.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{menuItem.name}</h3>
                  <span className="text-lg font-bold text-primary-600">${menuItem.price}</span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{menuItem.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">{menuItem.category}</span>
                  <span className="text-xs">{menuItem.restaurant.name}</span>
                </div>

                {/* Dietary indicators */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {menuItem.isVegetarian && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Vegetarian</span>
                  )}
                  {menuItem.isVegan && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Vegan</span>
                  )}
                  {menuItem.isSpicy && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Spicy</span>
                  )}
                  {menuItem.isFeatured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Featured</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${menuItem.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {menuItem.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(menuItem)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(menuItem._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMenuItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items found</h3>
            <p className="text-gray-600">Add your first menu item to get started.</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Restaurant
                      </label>
                      <select
                        value={formData.restaurant}
                        onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select Restaurant</option>
                        {restaurants.map(restaurant => (
                          <option key={restaurant._id} value={restaurant._id}>
                            {restaurant.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prep Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.preparationTime}
                        onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredients (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.ingredients.join(', ')}
                      onChange={(e) => handleIngredientsChange(e.target.value)}
                      placeholder="Tomatoes, Cheese, Basil"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Dietary options */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isVegetarian}
                        onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isVegan}
                        onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Vegan</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isSpicy}
                        onChange={(e) => setFormData({ ...formData, isSpicy: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Spicy</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Featured</span>
                    </label>
                  </div>

                  {/* Allergens */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergens
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {allergenOptions.map(allergen => (
                        <label key={allergen} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.allergens.includes(allergen)}
                            onChange={() => handleAllergenToggle(allergen)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{allergen}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingMenuItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMenuItems;