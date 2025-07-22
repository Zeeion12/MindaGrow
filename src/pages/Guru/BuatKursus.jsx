// src/pages/Guru/BuatKursus.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { courseAPI, moduleAPI, getErrorMessage } from '../../service/api';
import Header from '../../components/layout/layoutParts/Header';
import { 
  RiArrowGoBackLine, 
  RiCheckboxCircleLine, 
  RiErrorWarningLine,
  RiDeleteBinLine,
  RiAddLine,
  RiUploadLine,
  RiFileTextLine
} from 'react-icons/ri';

const BuatKursus = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: '',
    level: 'beginner',
    estimated_duration: '',
    price: '',
    banner_image: null,
    is_featured: false,
    is_published: false
  });

  // Modules state
  const [modules, setModules] = useState([
    {
      id: Date.now(),
      title: '',
      description: '',
      order_index: 1,
      file: null,
      file_url: '',
      lessons: [
        {
          id: Date.now() + 1,
          title: '',
          content: '',
          order_index: 1,
          duration: ''
        }
      ]
    }
  ]);

  const [submitStatus, setSubmitStatus] = useState({
    success: false,
    error: null,
    message: ''
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

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

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle title change with auto slug generation
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  // Handle banner image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (jpg, png, gif).');
      return;
    }

    setFormData(prev => ({
      ...prev,
      banner_image: file
    }));

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      banner_image: null
    }));
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Module handlers
  const handleModuleChange = (moduleIndex, field, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex][field] = value;
    setModules(updatedModules);
  };

  const handleModuleFileChange = (moduleIndex, file) => {
    if (!file) return;

    // Check file type - only allow PDF
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (fileExtension !== '.pdf') {
      alert('File materi harus berupa PDF');
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    const updatedModules = [...modules];
    updatedModules[moduleIndex].file = file;
    setModules(updatedModules);
  };

  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: '',
      description: '',
      order_index: modules.length + 1,
      file: null,
      file_url: '',
      lessons: [
        {
          id: Date.now() + 1,
          title: '',
          content: '',
          order_index: 1,
          duration: ''
        }
      ]
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (moduleIndex) => {
    if (modules.length === 1) {
      alert('Minimal harus ada satu module');
      return;
    }
    const updatedModules = modules.filter((_, index) => index !== moduleIndex);
    setModules(updatedModules);
  };

  // Lesson handlers
  const handleLessonChange = (moduleIndex, lessonIndex, field, value) => {
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons[lessonIndex][field] = value;
    setModules(updatedModules);
  };

  const addLesson = (moduleIndex) => {
    const updatedModules = [...modules];
    const newLesson = {
      id: Date.now(),
      title: '',
      content: '',
      order_index: updatedModules[moduleIndex].lessons.length + 1,
      duration: ''
    };
    updatedModules[moduleIndex].lessons.push(newLesson);
    setModules(updatedModules);
  };

  const removeLesson = (moduleIndex, lessonIndex) => {
    const updatedModules = [...modules];
    if (updatedModules[moduleIndex].lessons.length === 1) {
      alert('Minimal harus ada satu lesson per module');
      return;
    }
    updatedModules[moduleIndex].lessons.splice(lessonIndex, 1);
    setModules(updatedModules);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) errors.title = 'Judul kursus harus diisi';
    if (!formData.slug.trim()) errors.slug = 'Slug harus diisi';
    if (!formData.description.trim()) errors.description = 'Deskripsi kursus harus diisi';
    if (!formData.short_description.trim()) errors.short_description = 'Deskripsi singkat harus diisi';
    if (!formData.category_id) errors.category_id = 'Kategori harus dipilih';
    if (!formData.estimated_duration || formData.estimated_duration <= 0) {
      errors.estimated_duration = 'Estimasi durasi harus diisi dan lebih dari 0';
    }

    // Validate modules
    modules.forEach((module, moduleIndex) => {
      if (!module.title.trim()) {
        errors[`module_${moduleIndex}_title`] = `Judul module ${moduleIndex + 1} harus diisi`;
      }
      
      // Validate module file
      if (!module.file) {
        errors[`module_${moduleIndex}_file`] = `File PDF untuk module ${moduleIndex + 1} harus diupload`;
      }
      
      // Validate lessons
      module.lessons.forEach((lesson, lessonIndex) => {
        if (!lesson.title.trim()) {
          errors[`lesson_${moduleIndex}_${lessonIndex}_title`] = `Judul lesson ${lessonIndex + 1} di module ${moduleIndex + 1} harus diisi`;
        }
      });
    });

    return errors;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ success: false, error: null });

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      setSubmitStatus({ success: false, error: errorMessage });
      return;
    }

    try {
      setLoading(true);

      // Prepare FormData - SIMPLE VERSION
      const courseData = new FormData();

      // Add basic course data ONLY
      courseData.append('title', formData.title.trim());
      courseData.append('description', formData.description.trim());
      courseData.append('category_id', formData.category_id);
      courseData.append('level', formData.level);
      courseData.append('price', formData.price || 0);

      // Add banner image if exists
      if (formData.banner_image) {
        courseData.append('banner_image', formData.banner_image);
        console.log('🖼️ Banner image added:', formData.banner_image.name);
      }

      // DEBUG: Log FormData contents
      console.log('📋 FormData contents:');
      for (let [key, value] of courseData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }

      // Call API with simplified data
      console.log('🚀 Calling API...');
      const response = await courseAPI.createCourse(courseData);

      console.log('✅ API Response:', response.data);

      if (response.data.success) {
        setSubmitStatus({
          success: true,
          error: null,
          message: 'Kursus berhasil dibuat!'
        });

        // Redirect after success
        setTimeout(() => {
          navigate('/kelas-diajar');
        }, 2000);
      } else {
        setSubmitStatus({
          success: false,
          error: response.data.message || 'Gagal membuat kursus'
        });
      }

    } catch (error) {
      console.error('❌ Error creating course:', error);
      
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header title="Buat Kursus Baru" />

      <div className="container mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buat Kursus Baru</h1>
            <button
              onClick={() => navigate('/dashboard/guru')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center hover:bg-gray-200"
            >
              <RiArrowGoBackLine className="mr-2" />
              Kembali
            </button>
          </div>

          {/* Success Message */}
          {submitStatus.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
              <RiCheckboxCircleLine className="text-green-500 mt-1 mr-2 flex-shrink-0" size={20} />
              <div>
                <p className="text-green-700 font-medium">Kursus berhasil dibuat!</p>
                <p className="text-green-600 text-sm">
                  {formData.is_published
                    ? 'Kursus Anda telah dipublikasi dan tersedia untuk siswa.'
                    : 'Kursus Anda disimpan sebagai draft. Anda dapat mengeditnya nanti sebelum dipublikasikan.'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
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
                    placeholder="Contoh: Matematika Dasar Kelas 5"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="matematika-dasar-kelas-5"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">URL ramah SEO (otomatis diisi dari judul)</p>
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
                    <option value="">Pilih kategori</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                    Level Kesulitan <span className="text-red-500">*</span>
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
                  <input
                    type="number"
                    id="estimated_duration"
                    name="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="120"
                    min="1"
                    required
                  />
                </div>

                {/* Harga */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Harga (IDR)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0 (Gratis)"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan atau isi 0 untuk kursus gratis</p>
                </div>

                {/* Deskripsi Singkat */}
                <div className="col-span-2">
                  <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Singkat <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Deskripsi singkat yang menarik tentang kursus ini..."
                    required
                  />
                </div>

                {/* Deskripsi Lengkap */}
                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi Lengkap <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Jelaskan secara detail tentang kursus ini, apa yang akan dipelajari siswa, dan manfaat yang akan didapat..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Gambar Banner */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Gambar Banner
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Gambar Banner (Opsional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {!imagePreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 transition-colors"
                    >
                      <RiUploadLine size={48} className="text-gray-400 mb-2" />
                      <span className="text-gray-500">Klik untuk upload gambar</span>
                      <span className="text-xs text-gray-400 mt-1">Format: JPG, PNG, GIF (Max: 5MB)</span>
                    </button>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modules & Materi */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Modules & Materi
              </h2>
              
              {modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-300 rounded-lg p-6 mb-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Module {moduleIndex + 1}</h3>
                    {modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModule(moduleIndex)}
                        className="text-red-600 hover:text-red-700 flex items-center"
                      >
                        <RiDeleteBinLine className="mr-1" />
                        Hapus Module
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 mb-6">
                    {/* Module Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Module <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contoh: Pengenalan Biologi"
                        required
                      />
                    </div>
                    
                    {/* Module Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi Module
                      </label>
                      <textarea
                        value={module.description}
                        onChange={(e) => handleModuleChange(moduleIndex, 'description', e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Deskripsi singkat tentang module ini..."
                      />
                    </div>
                    
                    {/* Module File */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        File Materi PDF <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleModuleFileChange(moduleIndex, e.target.files[0])}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {module.file && (
                        <div className="flex items-center mt-2 text-sm text-green-600">
                          <RiFileTextLine className="mr-1" />
                          File dipilih: {module.file.name}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Wajib upload file PDF untuk setiap modul. File ini akan ditampilkan sebagai materi pembelajaran.
                      </p>
                    </div>
                  </div>

                  {/* Lessons */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-800">Lessons</h4>
                      <button
                        type="button"
                        onClick={() => addLesson(moduleIndex)}
                        className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                      >
                        <RiAddLine className="mr-1" />
                        Tambah Lesson
                      </button>
                    </div>

                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="border border-gray-200 rounded-lg p-4 mb-4 last:mb-0">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-700">Lesson {lessonIndex + 1}</h5>
                          {module.lessons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLesson(moduleIndex, lessonIndex)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Lesson Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Judul Lesson <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'title', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Contoh: Sel dan Organelnya"
                              required
                            />
                          </div>

                          {/* Lesson Duration */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Durasi (menit)
                            </label>
                            <input
                              type="number"
                              value={lesson.duration}
                              onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'duration', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="30"
                              min="1"
                            />
                          </div>

                          {/* Lesson Content */}
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Konten Lesson
                            </label>
                            <textarea
                              value={lesson.content}
                              onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, 'content', e.target.value)}
                              rows={4}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Deskripsi atau konten lesson ini..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addModule}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <RiAddLine className="mr-2" />
                Tambah Module Baru
              </button>
            </div>

            {/* Pengaturan Publikasi */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
                Pengaturan Publikasi
              </h2>

              <div className="space-y-4">
                {/* Featured Course */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                    Jadikan kursus unggulan (akan ditampilkan di beranda)
                  </label>
                </div>

                {/* Publish Course */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
                    Publikasikan kursus (siswa dapat mendaftar)
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Catatan Publikasi
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Jika tidak dicentang, kursus akan disimpan sebagai draft</li>
                          <li>Anda masih dapat mengedit kursus setelah dipublikasi</li>
                          <li>Kursus yang dipublikasi akan langsung tersedia untuk siswa</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/kelas-diajar')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Batal
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Membuat...' : 'Buat Kursus'}
              </button>
            </div>
          </form>
        </div>

        {/* Panduan Upload File */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <RiFileTextLine className="text-gray-600" size={20} />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                Panduan Upload File Materi
              </h3>
              <div className="mt-2 text-sm text-gray-600">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Format yang didukung:</strong> PDF saja</li>
                  <li><strong>Ukuran maksimal:</strong> 10MB per file</li>
                  <li><strong>Wajib:</strong> Setiap modul harus memiliki file PDF materi</li>
                  <li><strong>Penamaan file:</strong> Gunakan nama yang deskriptif, contoh: "Modul_1_Pengenalan_Biologi.pdf"</li>
                  <li><strong>Konten file:</strong> Pastikan PDF berisi materi pembelajaran yang lengkap dan mudah dibaca</li>
                  <li><strong>Kualitas:</strong> Gunakan PDF dengan resolusi yang baik dan teks yang dapat dibaca</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Structure */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Preview Struktur Kursus</h3>
          <div className="space-y-3">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-l-4 border-blue-500 pl-4">
                <div className="font-medium text-gray-800">
                  Module {moduleIndex + 1}: {module.title || 'Belum ada judul'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {module.description || 'Belum ada deskripsi'}
                </div>
                <div className="ml-4 mt-2 space-y-1">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <div key={lesson.id} className="text-sm text-gray-700">
                      • Lesson {lessonIndex + 1}: {lesson.title || 'Belum ada judul'}
                      {lesson.duration && (
                        <span className="text-gray-500"> ({lesson.duration} menit)</span>
                      )}
                    </div>
                  ))}
                </div>
                {module.file && (
                  <div className="text-xs text-green-600 mt-1 flex items-center">
                    <RiFileTextLine className="mr-1" />
                    File materi: {module.file.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuatKursus;