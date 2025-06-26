import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { courseAPI } from '../../../../server/services/api';

const CourseFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    sort: 'newest',
    ...initialFilters
  });
  
  const [categories, setCategories] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const fetchCategories = async () => {
    try {
      const response = await courseAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      level: '',
      sort: 'newest'
    });
  };

  const hasActiveFilters = filters.category || filters.level || filters.search;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Cari kursus..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Semua Kategori</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.course_count})
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tingkat
          </label>
          <select
            value={filters.level}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Semua Tingkat</option>
            <option value="beginner">Pemula</option>
            <option value="intermediate">Menengah</option>
            <option value="advanced">Lanjutan</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Urutkan
          </label>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="newest">Terbaru</option>
            <option value="popular">Terpopuler</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="price_low">Harga Terendah</option>
            <option value="price_high">Harga Tertinggi</option>
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter & Urutkan
          {hasActiveFilters && (
            <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
              {Object.values(filters).filter(v => v && v !== 'newest').length}
            </span>
          )}
        </button>

        {/* Mobile Filters Dropdown */}
        {showMobileFilters && (
          <div className="mt-4 space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.course_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Semua Tingkat</option>
                <option value="beginner">Pemula</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Lanjutan</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="newest">Terbaru</option>
                <option value="popular">Terpopuler</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="price_low">Harga Terendah</option>
                <option value="price_high">Harga Tertinggi</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-1" />
                Reset Semua Filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseFilters;