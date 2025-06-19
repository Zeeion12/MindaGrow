import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import Header from '../../components/layout/layoutParts/Header';
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBin6Line,
  RiEyeLine,
  RiTimeLine,
  RiUserLine,
  RiFileList3Line,
  RiFilter2Line,
  RiSearchLine,
  RiBook2Line,
  RiDraftLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri';

const ManajemenKelas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State untuk daftar kursus
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk filter dan pencarian
  const [filters, setFilters] = useState({
    status: 'all',    // all, published, draft
    category: 'all',
    level: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // State untuk konfirmasi hapus
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    courseId: null,
    courseName: ''
  });

  // State untuk kategori (akan diambil dari API)
  const [categories, setCategories] = useState([]);

  // Effect untuk fetch data kursus dan kategori
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Simulasi panggilan API untuk mendapatkan kursus yang dibuat oleh guru
        // const response = await axios.get(`/api/teachers/${user.id}/courses`);
        // setCourses(response.data);

        // Untuk demo, gunakan data dummy
        const dummyCourses = [
          {
            id: 1,
            title: 'Matematika Dasar Kelas 5',
            slug: 'matematika-dasar-kelas-5',
            short_description: 'Kursus ini membahas konsep dasar matematika untuk siswa kelas 5 SD, termasuk pecahan, desimal, dan geometri.',
            banner_image: '/api/placeholder/600/200',
            category_id: 1,
            category_name: 'Matematika',
            level: 'Pemula',
            is_featured: true,
            is_published: true,
            total_modules: 8,
            total_lessons: 24,
            total_students: 45,
            estimated_duration: 960, // 16 jam
            created_at: '2025-02-15T08:00:00Z',
            updated_at: '2025-04-10T14:30:00Z'
          },
          {
            id: 2,
            title: 'Pengenalan Sains untuk Kelas 3',
            slug: 'pengenalan-sains-kelas-3',
            short_description: 'Kursus interaktif untuk memperkenalkan konsep-konsep sains dasar yang menyenangkan untuk anak kelas 3 SD.',
            banner_image: '/api/placeholder/600/200',
            category_id: 3,
            category_name: 'IPA',
            level: 'Pemula',
            is_featured: false,
            is_published: true,
            total_modules: 6,
            total_lessons: 18,
            total_students: 32,
            estimated_duration: 720, // 12 jam
            created_at: '2025-03-05T10:15:00Z',
            updated_at: '2025-04-28T11:45:00Z'
          },
          {
            id: 3,
            title: 'Bahasa Inggris Dasar',
            slug: 'bahasa-inggris-dasar',
            short_description: 'Pelajari dasar-dasar bahasa Inggris dengan cara yang menyenangkan. Cocok untuk siswa SD kelas 4-6.',
            banner_image: '/api/placeholder/600/200',
            category_id: 5,
            category_name: 'Bahasa Inggris',
            level: 'Pemula',
            is_featured: false,
            is_published: true,
            total_modules: 10,
            total_lessons: 30,
            total_students: 28,
            estimated_duration: 1200, // 20 jam
            created_at: '2025-03-12T09:30:00Z',
            updated_at: '2025-05-02T15:20:00Z'
          },
          {
            id: 4,
            title: 'Matematika Lanjutan: Aljabar',
            slug: 'matematika-lanjutan-aljabar',
            short_description: 'Pengenalan aljabar untuk siswa kelas 6 SD. Kursus ini mempersiapkan siswa untuk materi matematika tingkat SMP.',
            banner_image: '/api/placeholder/600/200',
            category_id: 1,
            category_name: 'Matematika',
            level: 'Lanjutan',
            is_featured: true,
            is_published: false,
            total_modules: 5,
            total_lessons: 15,
            total_students: 0,
            estimated_duration: 900, // 15 jam
            created_at: '2025-05-01T13:45:00Z',
            updated_at: '2025-05-01T13:45:00Z'
          },
          {
            id: 5,
            title: 'Belajar Menulis Kreatif',
            slug: 'belajar-menulis-kreatif',
            short_description: 'Kursus menulis kreatif untuk siswa kelas 4-6 SD. Siswa akan belajar menulis cerita pendek dan puisi.',
            banner_image: '/api/placeholder/600/200',
            category_id: 2,
            category_name: 'Bahasa Indonesia',
            level: 'Menengah',
            is_featured: false,
            is_published: false,
            total_modules: 4,
            total_lessons: 12,
            total_students: 0,
            estimated_duration: 480, // 8 jam
            created_at: '2025-05-03T10:00:00Z',
            updated_at: '2025-05-03T10:00:00Z'
          }
        ];

        setCourses(dummyCourses);
        setFilteredCourses(dummyCourses);

        // Dummy data untuk kategori
        const dummyCategories = [
          { id: 1, name: 'Matematika' },
          { id: 2, name: 'Bahasa Indonesia' },
          { id: 3, name: 'IPA' },
          { id: 4, name: 'IPS' },
          { id: 5, name: 'Bahasa Inggris' },
          { id: 6, name: 'Seni Budaya' },
          { id: 7, name: 'Pendidikan Karakter' },
          { id: 8, name: 'Komputer & Teknologi' }
        ];

        setCategories(dummyCategories);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  // Effect untuk filter dan sort kursus
  useEffect(() => {
    let result = [...courses];

    // Filter berdasarkan status publikasi
    if (filters.status !== 'all') {
      const isPublished = filters.status === 'published';
      result = result.filter(course => course.is_published === isPublished);
    }

    // Filter berdasarkan kategori
    if (filters.category !== 'all') {
      result = result.filter(course => course.category_id === parseInt(filters.category));
    }

    // Filter berdasarkan level
    if (filters.level !== 'all') {
      result = result.filter(course => course.level === filters.level);
    }

    // Filter berdasarkan pencarian
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.short_description.toLowerCase().includes(term)
      );
    }

    // Sort hasil
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'a-z':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'z-a':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'most-students':
        result.sort((a, b) => b.total_students - a.total_students);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredCourses(result);
  }, [courses, filters, searchTerm, sortBy]);

  // Handler untuk perubahan filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Handler untuk perubahan pencarian
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handler untuk perubahan sorting
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Handler untuk konfirmasi hapus
  const confirmDelete = (courseId, courseName) => {
    setDeleteModal({
      show: true,
      courseId,
      courseName
    });
  };

  // Handler untuk hapus kursus
  const deleteCourse = async () => {
    try {
      // Implementasi sebenarnya akan memanggil API
      // await axios.delete(`/api/courses/${deleteModal.courseId}`);

      // Untuk demo, hapus dari state
      setCourses(courses.filter(course => course.id !== deleteModal.courseId));

      // Tutup modal
      setDeleteModal({
        show: false,
        courseId: null,
        courseName: ''
      });

    } catch (error) {
      console.error('Error deleting course:', error);
      // Tampilkan error
    }
  };

  // Fungsi untuk format durasi
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes} menit`;
    } else if (remainingMinutes === 0) {
      return `${hours} jam`;
    } else {
      return `${hours} jam ${remainingMinutes} menit`;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="container mx-auto px-6 py-4">
        {/* Header dan Tombol Tambah */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Kelas</h1>
            <p className="text-gray-600">Kelola kursus yang Anda buat</p>
          </div>

          <button
            onClick={() => navigate('/buat-kursus')}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700"
          >
            <RiAddLine className="mr-2" />
            Buat Kursus Baru
          </button>
        </div>

        {/* Filter dan Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 md:w-80 items-center bg-gray-100 px-3 py-2 rounded-md">
              <RiSearchLine className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Cari kursus..."
                className="bg-transparent w-full outline-none text-gray-700"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-2">
                <RiFilter2Line className="text-gray-500" />
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="bg-gray-100 border-0 rounded-md p-2 outline-none text-gray-700"
                >
                  <option value="all">Semua Status</option>
                  <option value="published">Terpublikasi</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="bg-gray-100 border-0 rounded-md p-2 outline-none text-gray-700"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  name="level"
                  value={filters.level}
                  onChange={handleFilterChange}
                  className="bg-gray-100 border-0 rounded-md p-2 outline-none text-gray-700"
                >
                  <option value="all">Semua Level</option>
                  <option value="Pemula">Pemula</option>
                  <option value="Menengah">Menengah</option>
                  <option value="Lanjutan">Lanjutan</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="bg-gray-100 border-0 rounded-md p-2 outline-none text-gray-700"
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="a-z">A-Z</option>
                  <option value="z-a">Z-A</option>
                  <option value="most-students">Terbanyak Siswa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Kursus */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat daftar kursus...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gray-100">
              <RiBook2Line size={40} className="text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-800">Tidak ada kursus ditemukan</h3>
            <p className="mt-2 text-gray-600">
              {searchTerm
                ? `Tidak ada kursus yang cocok dengan pencarian "${searchTerm}"`
                : `Anda belum memiliki kursus yang ${filters.status !== 'all' ? filters.status === 'published' ? 'terpublikasi' : 'dalam draft' : 'dibuat'}.`}
            </p>
            <button
              onClick={() => navigate('/buat-kursus')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md inline-flex items-center hover:bg-blue-700"
            >
              <RiAddLine className="mr-2" />
              Buat Kursus Baru
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="md:flex">
                  {/* Banner Image */}
                  <div className="md:w-1/4 h-48 md:h-auto relative">
                    <img
                      src={course.banner_image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    {course.is_featured && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-blue-800 text-xs font-bold px-2 py-1 rounded-md">
                        Unggulan
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="md:w-3/4 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md mr-2">
                            {course.category_name}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                            {course.level}
                          </span>
                          {course.is_published ? (
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md flex items-center">
                              <RiCheckboxCircleLine className="mr-1" />
                              Terpublikasi
                            </span>
                          ) : (
                            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md flex items-center">
                              <RiDraftLine className="mr-1" />
                              Draft
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                          {course.title}
                        </h2>

                        <p className="text-gray-600 mb-4">
                          {course.short_description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center">
                            <RiFileList3Line className="text-gray-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Modul</p>
                              <p className="font-medium">{course.total_modules}</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <RiBook2Line className="text-gray-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Pelajaran</p>
                              <p className="font-medium">{course.total_lessons}</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <RiTimeLine className="text-gray-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Durasi</p>
                              <p className="font-medium">{formatDuration(course.estimated_duration)}</p>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <RiUserLine className="text-gray-500 mr-2" />
                            <div>
                              <p className="text-xs text-gray-500">Siswa</p>
                              <p className="font-medium">{course.total_students}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-2 md:mb-0">
                        Dibuat: {new Date(course.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {course.updated_at !== course.created_at &&
                          ` • Diperbarui: ${new Date(course.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          to={`/kursus/${course.slug}/preview`}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                        >
                          <RiEyeLine className="mr-1" />
                          Preview
                        </Link>

                        <Link
                          to={`/kursus/${course.id}/edit`}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                        >
                          <RiEditLine className="mr-1" />
                          Edit
                        </Link>

                        <button
                          onClick={() => confirmDelete(course.id, course.title)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center"
                        >
                          <RiDeleteBin6Line className="mr-1" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus kursus <span className="font-medium">"{deleteModal.courseName}"</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ show: false, courseId: null, courseName: '' })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Batal
              </button>

              <button
                onClick={deleteCourse}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManajemenKelas;