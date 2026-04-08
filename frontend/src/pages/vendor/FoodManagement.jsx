import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, ImageIcon, Filter, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const CATEGORIES = ['Meals', 'Snacks', 'Beverages', 'Desserts', 'Other'];

export default function FoodManagement({ user }) {
  const [foods, setFoods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    quantity: '',
    originalPrice: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  
  const [editingId, setEditingId] = useState(null);

  const vendorHeaders = {
    "x-user-role": "vendor",
    "x-user-id": user?._id || "",
  };

  const fetchFoods = async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const res = await api.get('/api/foods', {
        params: { vendorId: user._id },
        headers: vendorHeaders
      });
      setFoods(res.data || []);
    } catch (error) {
      console.error("Failed to fetch foods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [user?._id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: CATEGORIES[0],
      quantity: '',
      originalPrice: ''
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (food) => {
    setEditingId(food._id);
    setFormData({
      name: food.name,
      description: food.description || '',
      price: food.price,
      category: food.category || CATEGORIES[0],
      quantity: food.quantity || 0,
      originalPrice: food.originalPrice || ''
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("price", Number(formData.price) || 0);
    payload.append("category", formData.category);
    payload.append("quantity", Number(formData.quantity) || 0);
    if (formData.originalPrice) {
      payload.append("originalPrice", Number(formData.originalPrice));
    }
    
    if (imageFile) {
      payload.append("image", imageFile);
    }

    try {
      if (editingId) {
        const res = await api.put(`/api/foods/${editingId}`, payload, {
          headers: { ...vendorHeaders, "Content-Type": "multipart/form-data" }
        });
        setFoods(prev => prev.map(f => f._id === editingId ? res.data : f));
      } else {
        const res = await api.post('/api/foods/create', payload, {
          headers: { ...vendorHeaders, "Content-Type": "multipart/form-data" }
        });
        setFoods(prev => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save food API request:", error);
      alert(error.response?.data?.message || "Failed to save food logic");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this food item?')) {
      try {
        await api.delete(`/api/foods/${id}`, { headers: vendorHeaders });
        setFoods(prev => prev.filter(f => f._id !== id));
      } catch (error) {
        console.error("Failed to delete food:", error);
        alert("Failed to delete the food item.");
      }
    }
  };

  const isOutOfStock = (food) => Number(food.quantity || 0) <= 0;
  const isLowStock = (food) => Number(food.quantity || 0) > 0 && Number(food.quantity || 0) <= 5;

  const filteredFoods = foods.filter((food) => {
    const matchesSearch =
      food.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' ? true : (food.category || 'Other') === categoryFilter;
    let matchesStock = true;
    if (stockFilter === 'InStock') matchesStock = Number(food.quantity || 0) > 0;
    if (stockFilter === 'LowStock') matchesStock = isLowStock(food);
    if (stockFilter === 'OutOfStock') matchesStock = isOutOfStock(food);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalItems = foods.length;
  const inStockItems = foods.filter((f) => Number(f.quantity || 0) > 0).length;
  const lowStockItems = foods.filter((f) => isLowStock(f)).length;
  const stockValue = foods.reduce((sum, f) => sum + Number(f.price || 0) * Number(f.quantity || 0), 0);

  const categoryStats = CATEGORIES.map((category) => {
    const count = foods.filter((f) => (f.category || 'Other') === category).length;
    return { category, count };
  });
  const maxCategoryCount = Math.max(1, ...categoryStats.map((s) => s.count));
  const lowStockList = foods
    .filter((f) => isLowStock(f) || isOutOfStock(f))
    .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto font-sans text-slate-900 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Food Menu Management</h1>
          <p className="text-slate-500 text-sm mt-1">Add items, monitor stock, and track quick menu insights.</p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </button>
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Items</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalItems}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">In Stock</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{inStockItems}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Low Stock</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{lowStockItems}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
          <p className="text-xs text-sky-700 font-semibold uppercase tracking-wide">Stock Value</p>
          <p className="mt-2 text-2xl font-bold text-sky-700">Rs. {stockValue.toFixed(0)}</p>
        </div>
      </section>

      {/* Search + Filter */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Stock States</option>
              <option value="InStock">In Stock</option>
              <option value="LowStock">Low Stock</option>
              <option value="OutOfStock">Out of Stock</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">Showing {filteredFoods.length} item(s)</p>
      </section>

      {/* Reports / Charts */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Category Distribution</h3>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {categoryStats.map((stat) => (
              <div key={stat.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{stat.category}</span>
                  <span className="text-slate-500">{stat.count} item(s)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${(stat.count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Low Stock Alerts</h3>
          <div className="space-y-2">
            {lowStockList.length === 0 ? (
              <p className="text-sm text-emerald-600 font-medium">No low stock alerts</p>
            ) : (
              lowStockList.map((f) => (
                <div key={f._id} className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between">
                  <span className="text-sm text-slate-700 truncate mr-2">{f.name}</span>
                  <span className="text-xs font-semibold text-amber-700">Qty {Number(f.quantity || 0)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Grid Display */}
      {isLoading ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">Loading food items...</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 font-medium">No food items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
          <AnimatePresence>
            {filteredFoods.map(food => (
              <motion.div 
                key={food._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col group w-full max-w-[300px]"
              >
                {/* Image Placeholder */}
                <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200/60 relative border-b border-slate-100 flex items-center justify-center overflow-hidden">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                      <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-xs uppercase tracking-wider font-semibold">No Image</span>
                    </div>
                  )}
                  {food.promotionPercentage > 0 && (
                     <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                       {food.promotionPercentage}% OFF
                     </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                    {food.category}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate pr-2" title={food.name}>
                      {food.name}
                    </h3>
                    <div className="flex flex-col items-end">
                      <div className="font-extrabold text-amber-600 whitespace-nowrap text-sm">
                        Rs. {food.price.toFixed(2)}
                      </div>
                      {food.originalPrice > food.price && (
                        <div className="text-xs text-slate-400 line-through">
                          Rs. {food.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-xs line-clamp-2 mb-3 min-h-[34px]">
                    {food.description || "No description provided."}
                  </p>
                  
                  <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div className={`text-[11px] font-medium px-2 py-1 rounded-md ${
                      isOutOfStock(food)
                        ? "bg-rose-50 text-rose-700"
                        : isLowStock(food)
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}>
                      Qty: <span className="text-slate-800">{food.quantity}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(food)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Item"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(food._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Edit Food Item' : 'Add New Food Item'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="food-form" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Food Name *</label>
                      <input 
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Spicy Chicken Rice"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                      <textarea 
                        name="description"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Short tasty description..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Current Selling Price (Rs.) *</label>
                      <input 
                        type="number"
                        name="price"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Original Price (Rs.) - Optional</label>
                      <input 
                        type="number"
                        name="originalPrice"
                        min="0"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={handleInputChange}
                        placeholder="0.00 (Leaves blank if no promo)"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Category *</label>
                      <select 
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity Available *</label>
                      <input 
                        type="number"
                        name="quantity"
                        required
                        min="0"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Image Upload</label>
                      <input 
                        type="file"
                        accept="image/*"
                        name="image"
                        onChange={(e) => setImageFile(e.target.files[0])}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="food-form"
                  className="px-5 py-2 rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
