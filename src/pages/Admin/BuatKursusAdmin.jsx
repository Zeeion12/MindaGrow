// src/pages/admin/BuatKursusAdmin.jsx - Admin version with teacher selection
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseAPI, adminAPI } from '../../service/api';
import Header from '../../components/layout/layoutParts/Header';
import {
  RiSaveLine,
  RiImageAddLine,
  RiDeleteBin6Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiArrowGoBackLine,
  RiDraftLine,
  RiEyeLine,
  RiUserLine
} from 'react-icons/ri';

const BuatKursusAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form data with teacher selection for admin
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    banner_image: null,
    category_id: '',
    teacher_id: '', // Admin can select teacher
    level: 'beginner',
    is_featured: false,
    is_published: false,
    estimated_duration: '',
    price: 0,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, error: null });
  
  // Data lists
  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch categories and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);

        // Fetch categories and teachers in parallel
        const [categoriesResponse, teachersResponse] = await Promise.all([
          courseAPI.getCategories(),
          adminAPI.getUsers() // Get all users, filter teachers on frontend
        ]);

        // Set categories
        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data || []);
        }

        // Filter and set teachers
        if (teachersResponse.data.success) {
          const allUsers = teachersResponse.data.data || [];
          const teacherUsers = allUsers.filter(user => 
            user.role === 'guru' || user.role === 'admin'
          );
          setTeachers(teacherUsers);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setSubmitStatus({
          success: false,
          error: 'Gagal memuat data kategori dan guru. Silakan refresh halaman.'
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const newSlug = generateSlug(newTitle);

    setFormData({
      ...formData,
      title: newTitle,
      slug: newSlug
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    setFormData({
      ...formData,
      [name]: inputValue
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (jpg, png, gif).');
      return;
    }

    setFormData({ ...formData, banner_image: file });

    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, banner_image: null });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Judul kursus harus diisi';
    if (!formData.slug.trim()) errors.slug = 'Slug harus diisi';
    if (!formData.description.trim()) errors.description = 'Deskripsi kursus harus diisi';
    if (!formData.short_description.trim()) errors.short_description = 'Deskripsi singkat harus diisi';
    if (!formData.category_id) errors.category_id = 'Kategori harus dipilih';
    if (!formData.teacher_id) errors.teacher_id = 'Guru harus dipilih';
    if (!formData.estimated_duration || formData.estimated_duration <= 0) {
      errors.estimated_duration = 'Estimasi durasi harus diisi dan lebih dari 0';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ success: false, error: null });

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      setSubmitStatus({ success: false, error: errorMessage });
      return;
    }

    try {
      setLoading(true);

      const courseData = new FormData();
      courseData.append('title', formData.title.trim());
      courseData.append('slug', formData.slug.trim());
      courseData.append('description', formData.description.trim());
      courseData.append('short_description', formData.short_description.trim());
      courseData.append('category_id', formData.category_id);
      courseData.append('teacher_id', formData.teacher_id); // Admin specifies teacher
      courseData.append('level', formData.level);
      courseData.append('estimated_duration', formData.estimated_duration);
      courseData.append('price', formData.price || 0);
      courseData.append('is_featured', formData.is_featured);
      courseData.append('is_published', formData.is_published);

      if (formData.banner_image) {
        courseData.append('banner_image', formData.banner_image);
      }

      const response = await courseAPI.createCourse(courseData);

      if (response.data.success) {
        setSubmitStatus({
          success: true,
          error: null,
          message: 'Kursus berhasil dibuat!'
        });

        setTimeout(() => {
          navigate('/admin/kursus');
        }, 2000);

      } else {
        setSubmitStatus({
          success: false,
          error: response.data.message || 'Gagal membuat kursus'
        });
      }

    } catch (error) {
      console.error('Error creating course:', error);
      
      let errorMessage = 'Gagal membuat kursus. Silakan coba lagi.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        errorMessage = validationErrors.join('\n');
      }

      setSubmitStatus({
        success: false,
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const levelOptions = [
    { value: 'beginner', label: 'Pemula' },
    { value: 'intermediate', label: 'Menengah' },
    { value: 'advanced', label: 'Lanjutan' }
  ];

  if (dataLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header title="Buat Kursus Baru" />
        <div className="container mx-auto px-6 py-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Memuat data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header title="Buat Kursus Baru (Admin)" />

      <div className="container mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buat Kursus Baru</h1>
            <button
              onClick={() => navigate('/admin/kursus')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center hover:bg-gray-200"
            >
              <RiArrowGoBackLine className="mr-2" />
              Kembali
            </button>
          </div>

          {submitStatus.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <RiCheckboxCircleLine className="text-green-500 mt-1 mr-2 flex-shrink-0" size={20} />
              <div>
                <p className="text-green-700 font-medium">Kursus berhasil dibuat!</p>
                <p className="text-green-600 text-sm">
                  Kursus telah dibuat dan akan diarahkan ke halaman manajemen kursus.
                </p>
              </div>
            </div>
          )}

          {submitStatus.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <RiErrorWarningLine className="text-red-500 mt-1 mr-2 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-700 font-medium">Gagal membuat kursus</p>
                <pre className="text-red-600 text-sm whitespace-pre-wrap">{submitStatus.error}</pre>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Informasi Dasar */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Informasi Dasar
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Judul Kursus */}
                <div className="col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Kursus <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="matematika-dasar-kelas-5"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Slug akan digunakan sebagai bagian dari URL kursus
                  </p>
                </div>

                {/* Pilih Guru - ADMIN ONLY */}
                <div>
                  <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Guru <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    value={formData.teacher_id}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Guru</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email}) - {teacher.role}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    <RiUserLine className="inline mr-1" />
                    Guru yang akan mengajar kursus ini
                  </p>
                </div>

                {/* Kategori */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Kesulitan */}
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                    Tingkat Kesulitan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {levelOptions.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estimasi Durasi */}
                <div>
                  <label htmlFor="estimated_duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimasi Durasi (menit) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="estimated_duration"
                      name="estimated_duration"
                      value={formData.estimated_duration}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Contoh: 120"
                      min="1"
                      required
                    />
                    <RiTimeLine className="ml-2 text-gray-500" />
                  </div>
                </div>

                {/* Harga */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Harga (Rupiah)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0 untuk gratis"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Kosongkan atau isi 0 untuk kursus gratis
                  </p>
                </div>
              </div>
            </div>

            {/* Deskripsi Kursus */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Deskripsi Kursus
              </h2>

              <div className="space-y-6">
                {/* Deskripsi Singkat */}
                <div>
                  <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Singkat <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-1">(Maks. 500 karakter)</span>
                  </label>
                  <textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Deskripsi singkat yang akan ditampilkan pada kartu kursus"
                    rows="2"
                    maxLength="500"
                    required
                  ></textarea>
                  <p className="text-xs text-right text-gray-500 mt-1">
                    {formData.short_description.length}/500 karakter
                  </p>
                </div>

                {/* Deskripsi Lengkap */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jelaskan secara detail tentang kursus ini, termasuk tujuan pembelajaran, manfaat, dan apa yang akan dipelajari siswa"
                    rows="6"
                    required
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Banner / Gambar */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Banner Kursus
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <p className="text-sm text-gray-700 mb-2">
                    Upload gambar banner kursus
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Format: JPG, PNG, atau GIF (maks. 5MB)
                    <br />
                    Ukuran yang direkomendasikan: 1200×600 pixel
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-md border border-blue-200 hover:bg-blue-100 flex items-center justify-center"
                  >
                    <RiImageAddLine className="mr-2" />
                    {formData.banner_image ? 'Ganti Gambar' : 'Upload Gambar'}
                  </button>
                </div>

                <div className="md:col-span-2">
                  {imagePreview ? (
                    <div className="relative border border-gray-200 rounded-md overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview Banner"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <RiDeleteBin6Line />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-300 border-dashed rounded-md h-48 flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <RiImageAddLine className="mx-auto text-gray-400" size={32} />
                        <p className="text-gray-500 mt-2">Belum ada gambar</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pengaturan Publikasi */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Pengaturan Publikasi
              </h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                    Tampilkan sebagai kursus unggulan
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                    Publikasikan kursus setelah dibuat (jika tidak dicentang, kursus akan disimpan sebagai draft)
                  </label>
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/admin/kursus')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                Batal
              </button>

              <button
                type="submit"
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center
                  ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {formData.is_published ? (
                  <>
                    <RiEyeLine className="mr-2" />
                    {loading ? 'Membuat...' : 'Buat & Publikasikan'}
                  </>
                ) : (
                  <>
                    <RiSaveLine className="mr-2" />
                    {loading ? 'Membuat...' : 'Simpan sebagai Draft'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BuatKursusAdmin;