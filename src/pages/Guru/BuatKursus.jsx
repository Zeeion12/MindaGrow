import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/layoutParts/Header';
import { 
  RiSaveLine, 
  RiImageAddLine, 
  RiDeleteBin6Line, 
  RiFileList3Line,
  RiCloseCircleLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiTimeLine,
  RiArrowGoBackLine,
  RiDraftLine,
  RiEyeLine
} from 'react-icons/ri';

const BuatKursusPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // State untuk data form
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    banner_image: null,
    category_id: '',
    level: 'Pemula',
    is_featured: false,
    is_published: false,
    estimated_duration: '',
  });
  
  // State untuk preview image
  const [imagePreview, setImagePreview] = useState(null);
  
  // State untuk loading
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ success: false, error: null });
  
  // State untuk daftar kategori (akan diambil dari API)
  const [categories, setCategories] = useState([]);
  
  // Effect untuk mengambil daftar kategori
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Implementasi sebenarnya akan memanggil API
        // const response = await axios.get('/api/categories');
        // setCategories(response.data);
        
        // Untuk demo, gunakan data dummy
        setCategories([
          { id: 1, name: 'Matematika' },
          { id: 2, name: 'Bahasa Indonesia' },
          { id: 3, name: 'IPA' },
          { id: 4, name: 'IPS' },
          { id: 5, name: 'Bahasa Inggris' },
          { id: 6, name: 'Seni Budaya' },
          { id: 7, name: 'Pendidikan Karakter' },
          { id: 8, name: 'Komputer & Teknologi' }
        ]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fungsi untuk mengupdate slug otomatis dari judul
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Hapus karakter khusus
      .replace(/\s+/g, '-') // Ganti spasi dengan dash
      .replace(/-+/g, '-') // Hindari multiple dash berurutan
      .trim(); // Hapus whitespace di awal dan akhir
  };
  
  // Handler saat title berubah, generate slug
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    const newSlug = generateSlug(newTitle);
    
    setFormData({
      ...formData,
      title: newTitle,
      slug: newSlug
    });
  };
  
  // Handler untuk input field
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Untuk checkbox, gunakan checked sebagai value
    const inputValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: inputValue
    });
  };
  
  // Handler untuk upload gambar
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (jpg, png, gif).');
      return;
    }
    
    // Set file to state
    setFormData({
      ...formData,
      banner_image: file
    });
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handler untuk menghapus gambar
  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      banner_image: null
    });
    setImagePreview(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Validasi form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title) errors.title = 'Judul kursus harus diisi';
    if (!formData.slug) errors.slug = 'Slug harus diisi';
    if (!formData.description) errors.description = 'Deskripsi kursus harus diisi';
    if (!formData.short_description) errors.short_description = 'Deskripsi singkat harus diisi';
    if (!formData.category_id) errors.category_id = 'Kategori harus dipilih';
    if (!formData.estimated_duration) errors.estimated_duration = 'Estimasi durasi harus diisi';
    
    return errors;
  };
  
  // Handler submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset status
    setSubmitStatus({ success: false, error: null });
    
    // Validasi form
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      // Ada error
      const errorMessage = Object.values(errors).join('\n');
      setSubmitStatus({ success: false, error: errorMessage });
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare form data for submission (including file)
      const courseData = new FormData();
      
      // Tambahkan semua field ke FormData
      Object.entries(formData).forEach(([key, value]) => {
        // Skip banner_image karena akan ditangani secara terpisah
        if (key !== 'banner_image') {
          courseData.append(key, value);
        }
      });
      
      // Tambahkan teacher_id dari user yang login
      courseData.append('teacher_id', user.id);
      
      // Tambahkan file jika ada
      if (formData.banner_image) {
        courseData.append('banner_image', formData.banner_image);
      }
      
      // Dalam implementasi sebenarnya, panggil API untuk membuat kursus
      // const response = await axios.post('/api/courses', courseData);
      
      // Simulasi delay untuk demo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulasi respon sukses
      setSubmitStatus({ 
        success: true, 
        error: null,
        message: 'Kursus berhasil dibuat!'
      });
      
      // Redirect setelah sukses (dalam implementasi sebenarnya)
      // navigate(`/kelas-diajar/${response.data.id}`);
      
      // Untuk demo, clear form setelah beberapa detik
      setTimeout(() => {
        if (formData.is_published) {
          navigate('/kelas-diajar');
        } else {
          // Reset form
          setFormData({
            title: '',
            slug: '',
            description: '',
            short_description: '',
            banner_image: null,
            category_id: '',
            level: 'Pemula',
            is_featured: false,
            is_published: false,
            estimated_duration: '',
          });
          setImagePreview(null);
          setSubmitStatus({ success: false, error: null });
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error creating course:', error);
      setSubmitStatus({ 
        success: false, 
        error: 'Gagal membuat kursus. Silakan coba lagi.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen ml-20">
      <Header title="Buat Kursus Baru" />
      
      <div className="container mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Buat Kursus Baru</h1>
            <button 
              onClick={() => navigate('/kelas-diajar')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center"
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
                  {formData.is_published 
                    ? 'Kursus Anda telah dipublikasi dan tersedia untuk siswa.' 
                    : 'Kursus Anda disimpan sebagai draft. Anda dapat mengeditnya nanti sebelum dipublikasikan.'}
                </p>
              </div>
            </div>
          )}
          
          {submitStatus.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <RiErrorWarningLine className="text-red-500 mt-1 mr-2 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-700 font-medium">Gagal membuat kursus</p>
                <p className="text-red-600 text-sm">{submitStatus.error}</p>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Slug akan digunakan sebagai bagian dari URL kursus
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
                    <option value="Pemula">Pemula</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Lanjutan">Lanjutan</option>
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
                  <p className="text-xs text-gray-500 mt-1">
                    Total durasi perkiraan untuk menyelesaikan kursus ini
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
                onClick={() => navigate('/kelas-diajar')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Batal
              </button>
              
              {!formData.is_published && (
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 flex items-center"
                  disabled={loading}
                >
                  <RiDraftLine className="mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan Draft'}
                </button>
              )}
              
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
                    {loading ? 'Membuat...' : 'Buat Kursus'}
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

export default BuatKursusPage;