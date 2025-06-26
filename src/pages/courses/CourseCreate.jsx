// src/pages/courses/CourseCreate.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';

const CourseCreate = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    level: 'beginner',
    price: 0,
    duration: 60,
    thumbnail: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if user is authorized
    if (!user || !['guru', 'admin'].includes(user.role)) {
      navigate('/');
      return;
    }

    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await courseAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Judul kursus wajib diisi';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi kursus wajib diisi';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Deskripsi minimal 50 karakter';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Kategori wajib dipilih';
    }

    if (formData.duration < 30) {
      newErrors.duration = 'Durasi minimal 30 menit';
    }

    if (formData.price < 0) {
      newErrors.price = 'Harga tidak boleh negatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await courseAPI.createCourse(formData);

      if (response.data.success) {
        alert('Kursus berhasil dibuat!');
        navigate(`/courses/${response.data.data.id}`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Gagal membuat kursus');
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    { value: 'beginner', label: 'Pemula' },
    { value: 'intermediate', label: 'Menengah' },
    { value: 'advanced', label: 'Lanjutan' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            ← Kembali
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Buat Kursus Baru</h1>
          <p className="text-gray-600 mt-2">
            Bagikan pengetahuan Anda dengan membuat kursus yang menarik
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Kursus *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Masukkan judul kursus yang menarik"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Kursus *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Jelaskan secara detail tentang kursus ini, apa yang akan dipelajari siswa, dan manfaat yang akan didapat..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.description.length}/50 karakter minimum
              </div>
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>
                )}
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level Kesulitan
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {levels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi (menit)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="30"
                  max="1440"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="text-sm text-gray-500 mt-1">
                  Estimasi waktu total untuk menyelesaikan kursus
                </div>
                {errors.duration && (
                  <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga (IDR)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="text-sm text-gray-500 mt-1">
                  Masukkan 0 untuk kursus gratis
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Thumbnail (Opsional)
              </label>
              <input
                type="url"
                name="thumbnail"
                value={formData.thumbnail}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm text-gray-500 mt-1">
                URL gambar yang akan digunakan sebagai thumbnail kursus
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Membuat...' : 'Buat Kursus'}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-600">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tips Membuat Kursus yang Baik
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Gunakan judul yang jelas dan menarik</li>
                  <li>Jelaskan dengan detail apa yang akan dipelajari</li>
                  <li>Pilih kategori dan level yang sesuai</li>
                  <li>Tentukan durasi yang realistis</li>
                  <li>Gunakan gambar thumbnail yang menarik</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCreate;