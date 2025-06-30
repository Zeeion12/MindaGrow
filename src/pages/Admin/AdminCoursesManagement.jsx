import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminCourseManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'edit'
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, course: null });
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

  // Form data untuk create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    instructor_id: '',
    level: 'beginner',
    duration: 60,
    price: 0,
    thumbnail: null,
    status: 'active'
  });

  // Load data saat component mount
  useEffect(() => {
    loadCourses();
    loadCategories();
    loadTeachers();
  }, [currentPage, searchTerm, filterCategory]);

  const loadCourses = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    let url = `/api/courses?page=${currentPage}&limit=10`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (filterCategory) url += `&category=${filterCategory}`;

    const response = await fetch(`http://localhost:5000${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // DEBUG: Log data untuk melihat apakah status ada
      console.log('Courses data received:', data.data);
      console.log('First course status:', data.data[0]?.status);
      
      setCourses(data.data);
      setTotalPages(data.pagination.totalPages);
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  } finally {
    setLoading(false);
  }
};

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/courses/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const teacherUsers = data.users.filter(user => user.role === 'guru');
        setTeachers(teacherUsers);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('level', formData.level);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('status', formData.status);
      
      if (formData.instructor_id) {
        formDataToSend.append('instructor_id', formData.instructor_id);
      }
      
      if (formData.thumbnail && formData.thumbnail instanceof File) {
        formDataToSend.append('banner_image', formData.thumbnail);
      }

      const url = activeTab === 'edit' 
        ? `http://localhost:5000/api/courses/${selectedCourse.id}`
        : 'http://localhost:5000/api/courses';
      
      const method = activeTab === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const message = activeTab === 'edit' ? 'Kursus berhasil diperbarui!' : 'Kursus berhasil dibuat!';
        setSuccessModal({
          isOpen: true,
          message: message
        });
        resetForm();
        setActiveTab('list');
        loadCourses();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error saving course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category_id: course.category_id,
      instructor_id: course.instructor_id,
      level: course.level,
      duration: course.duration,
      price: course.price,
      thumbnail: null,
      status: course.status
    });
    setActiveTab('edit');
  };

  const handleDeleteClick = (course) => {
    setDeleteModal({
      isOpen: true,
      course: course
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/courses/${deleteModal.course.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDeleteModal({ isOpen: false, course: null });
        setSuccessModal({
          isOpen: true,
          message: `Kursus "${deleteModal.course.title}" berhasil dihapus!`
        });
        loadCourses();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error deleting course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Network error while deleting course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, course: null });
  };

  const handleSuccessClose = () => {
    setSuccessModal({ isOpen: false, message: '' });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category_id: '',
      instructor_id: '',
      level: 'beginner',
      duration: 60,
      price: 0,
      thumbnail: null,
      status: 'active'
    });
    setSelectedCourse(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        e.target.value = '';
        return;
      }
      
      setFormData(prev => ({ ...prev, thumbnail: file }));
    }
  };

  const DeleteModal = ({ isOpen, onClose, onConfirm, course, loading }) => {
    const [confirmText, setConfirmText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    if (!isOpen) return null;

    const handleConfirm = () => {
      if (confirmText.toLowerCase() === 'delete') {
        onConfirm();
      }
    };

    const handleInputChange = (e) => {
      setConfirmText(e.target.value);
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-out scale-95 hover:scale-100"></div>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 animate-modal-enter">
          {/* Danger Icon */}
          <div className="flex items-center justify-center pt-8 pb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          <div className="px-6 pb-6">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Hapus Kursus</h3>
            <p className="text-gray-600 text-center mb-4">Anda yakin ingin menghapus kursus ini? Tindakan ini tidak dapat dibatalkan.</p>

            {/* Course Info */}
            {course && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-red-500">
                <div className="flex items-start space-x-3">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-12 h-9 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-9 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{course.title}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{course.category_name}</span>
                      <span>•</span>
                      <span>{course.duration} menit</span>
                    </div>
                    {course.enrolled_count > 0 && (
                      <p className="text-xs text-red-600 mt-1">⚠️ {course.enrolled_count} siswa terdaftar di kursus ini</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ketik <span className="font-bold text-red-600">DELETE</span> untuk mengonfirmasi:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                  confirmText.toLowerCase() === 'delete' ? 'border-red-500 bg-red-50' : 
                  confirmText ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
                }`}
                placeholder="Ketik DELETE di sini..."
              />
              
              {/* Real-time feedback */}
              <div className="mt-2 h-5">
                {isTyping && confirmText && (
                  <div className="flex items-center space-x-2">
                    {confirmText.toLowerCase() === 'delete' ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-green-600">Konfirmasi diterima</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-yellow-500 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-yellow-600">Ketik "DELETE" untuk melanjutkan</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirmText.toLowerCase() !== 'delete' || loading}
                className={`flex-1 px-4 py-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                  confirmText.toLowerCase() === 'delete' && !loading
                    ? 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Hapus Kursus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SuccessModal = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-out scale-95 hover:scale-100"></div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all duration-300 animate-modal-enter">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Berhasil!</h3>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={onClose}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Kursus Admin</h1>
            <p className="text-gray-600 mt-2">Kelola semua kursus di platform MindaGrow</p>
          </div>
          
          {activeTab === 'list' && (
            <button
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + Buat Kursus Baru
            </button>
          )}

          {(activeTab === 'create' || activeTab === 'edit') && (
            <button
              onClick={() => {
                resetForm();
                setActiveTab('list');
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ← Kembali ke Daftar
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-lg shadow-sm">
          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari kursus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="lg:w-64">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No courses found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Thumbnail</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Instructor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Enrollments</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{course.title}</p>
                            <p className="text-sm text-gray-500">{course.duration} minutes</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{course.category_name}</td>
                        <td className="py-3 px-4 text-gray-600">{course.instructor_name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                            course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {course.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{course.enrolled_count || 0}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (course.status || 'active') === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {course.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(course)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(course)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(activeTab === 'create' || activeTab === 'edit') && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {activeTab === 'edit' ? 'Edit Kursus' : 'Buat Kursus Baru'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Kursus *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Guru
                </label>
                <select
                  value={formData.instructor_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Admin (Default)</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.nama_lengkap} ({teacher.identifier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tingkat Kesulitan *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="beginner">Pemula</option>
                  <option value="intermediate">Menengah</option>
                  <option value="advanced">Lanjutan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimasi Durasi (menit) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Harga (Rupiah)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Kursus
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">Max 5MB, format: JPG, PNG, GIF</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Kursus *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Deskripsi lengkap yang akan ditampilkan pada kartu kursus"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Menyimpan...' : (activeTab === 'edit' ? 'Update Kursus' : 'Buat Kursus')}
              </button>
            </div>
          </form>
        </div>
      )}

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        course={deleteModal.course}
        loading={loading}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={handleSuccessClose}
        message={successModal.message}
      />
    </div>
  );
};

export default AdminCourseManagement;