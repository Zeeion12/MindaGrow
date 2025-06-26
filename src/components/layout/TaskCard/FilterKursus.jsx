// src/components/layout/TaskCard/FilterKursus.jsx - CLEAN VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { courseAPI } from '../../../service/api';

const FilterKursus = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    ...initialFilters
  });
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFiltersChange = useCallback((newFilters) => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(newFilters);
    }
  }, [onFiltersChange]);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await courseAPI.getCategories();
        
        if (response.data.success) {
          setCategories(response.data.data || []);
        } else {
          console.error('Categories fetch failed:', response.data.message);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle filter changes with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleFiltersChange(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, handleFiltersChange]);

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
      level: ''
    });
  };

  const levels = [
    { value: 'beginner', label: 'Pemula' },
    { value: 'intermediate', label: 'Menengah' },
    { value: 'advanced', label: 'Lanjutan' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Kursus</h3>
      
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cari Kursus
          </label>
          <input
            type="text"
            placeholder="Masukkan kata kunci..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Semua Kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.course_count ? `(${category.course_count})` : ''}
                </option>
              ))}
            </select>
            {loading && (
              <p className="text-xs text-gray-500 mt-1">Memuat kategori...</p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Level</option>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Reset Filter
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterKursus;