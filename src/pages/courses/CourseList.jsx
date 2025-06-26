// src/pages/courses/CourseList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../../components/layout/TaskCard/CardKursus';
import CourseFilter from '../../components/layout/TaskCard/FilterKursus';
import { courseAPI } from '../../../server/services/api';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  useEffect(() => {
    fetchCourses();
  }, [filters, pagination.currentPage]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
        ...filters
      };

      const response = await courseAPI.getAllCourses(params);
      
      if (response.data.success) {
        setCourses(response.data.data);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pages = [];
    const { currentPage, totalPages } = pagination;
    
    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 mx-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 rounded-md ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 mx-1 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Next
        </button>
      );
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={fetchCourses}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Semua Kursus
          </h1>
          <p className="text-gray-600">
            Temukan kursus yang sesuai dengan minat dan kebutuhan Anda
          </p>
        </div>

        {/* Filters */}
        <CourseFilter
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Results Info */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-gray-600">
            Menampilkan {courses.length} dari {pagination.totalItems} kursus
          </div>
          <div className="text-sm text-gray-500">
            Halaman {pagination.currentPage} dari {pagination.totalPages}
          </div>
        </div>

        {/* Course Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              Tidak ada kursus yang ditemukan
            </div>
            <button
              onClick={() => setFilters({ search: '', category: '', level: '' })}
              className="text-blue-600 hover:text-blue-700"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center">
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;