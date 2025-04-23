// src/components/DataAnalyzer.jsx
import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const DataAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);

  // Reset state ketika file baru dipilih
  useEffect(() => {
    if (file) {
      setData([]);
      setStats(null);
      setRecommendations([]);
      setError(null);
      parseCSV(file);
    }
  }, [file]);

  // Parse file CSV menggunakan Papa Parse
  const parseCSV = (file) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function(results) {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setLoading(false);
          return;
        }
        
        const parsedData = results.data;
        setData(parsedData);
        
        // Validasi kolom yang diharapkan
        const expectedColumns = ['id', 'nama', 'skor_mata_pelajaran', 'nama_orang_tua', 'absensi', 'umur', 'grade_class'];
        const missingColumns = expectedColumns.filter(col => !results.meta.fields.includes(col));
        
        if (missingColumns.length > 0) {
          setError(`Kolom yang diperlukan tidak ditemukan: ${missingColumns.join(', ')}`);
          setLoading(false);
          return;
        }
        
        // Analisis data
        const dataStats = calculateBasicStats(parsedData);
        setStats(dataStats);
        
        // Generate rekomendasi
        const dataRecommendations = generateRecommendations(dataStats);
        setRecommendations(dataRecommendations);
        
        setLoading(false);
      },
      error: function(error) {
        setError(`Error parsing CSV: ${error}`);
        setLoading(false);
      }
    });
  };

  // Hitung statistik dasar
  const calculateBasicStats = (data) => {
    const stats = {
      totalSiswa: data.length,
      skorRataRata: 0,
      absensiRataRata: 0,
      distribusiUmur: {},
      distribusiGrade: {},
      distribusiSkor: {
        sangat_baik: 0, // 85-100
        baik: 0, // 70-84
        cukup: 0, // 55-69
        kurang: 0, // <55
      },
    };
    
    // Filter data yang valid
    const validData = data.filter(item => 
      typeof item.skor_mata_pelajaran === 'number' && 
      typeof item.absensi === 'number' && 
      typeof item.umur === 'number' && 
      typeof item.grade_class === 'string'
    );
    
    if (validData.length === 0) {
      return null;
    }
    
    stats.totalSiswa = validData.length;
    
    // Hitung rata-rata dan distribusi
    let totalSkor = 0;
    let totalAbsensi = 0;
    
    for (const siswa of validData) {
      totalSkor += siswa.skor_mata_pelajaran;
      totalAbsensi += siswa.absensi;
      
      // Distribusi umur
      stats.distribusiUmur[siswa.umur] = (stats.distribusiUmur[siswa.umur] || 0) + 1;
      
      // Distribusi grade
      const grade = siswa.grade_class.split('-')[0]; // Ambil huruf grade (A, B, C, dst)
      stats.distribusiGrade[grade] = (stats.distribusiGrade[grade] || 0) + 1;
      
      // Distribusi skor
      if (siswa.skor_mata_pelajaran >= 85) {
        stats.distribusiSkor.sangat_baik++;
      } else if (siswa.skor_mata_pelajaran >= 70) {
        stats.distribusiSkor.baik++;
      } else if (siswa.skor_mata_pelajaran >= 55) {
        stats.distribusiSkor.cukup++;
      } else {
        stats.distribusiSkor.kurang++;
      }
    }
    
    stats.skorRataRata = totalSkor / validData.length;
    stats.absensiRataRata = totalAbsensi / validData.length;
    
    // Hitung korelasi antara skor dan absensi
    const korelasi = calculateCorrelation(
      validData.map(d => d.skor_mata_pelajaran),
      validData.map(d => d.absensi)
    );
    
    stats.korelasiSkorAbsensi = korelasi;
    
    return stats;
  };

  // Fungsi untuk menghitung korelasi Pearson
  const calculateCorrelation = (x, y) => {
    const n = x.length;
    
    if (n < 2) return 0;
    
    // Hitung rata-rata array
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    // Hitung kovariansi dan standar deviasi
    let cov = 0;
    let xVar = 0;
    let yVar = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      cov += xDiff * yDiff;
      xVar += xDiff * xDiff;
      yVar += yDiff * yDiff;
    }
    
    // Hindari pembagian dengan nol
    if (xVar === 0 || yVar === 0) return 0;
    
    // Korelasi Pearson
    const correlation = cov / (Math.sqrt(xVar) * Math.sqrt(yVar));
    return correlation;
  };

  // Generate rekomendasi berdasarkan analisis
  const generateRecommendations = (stats) => {
    if (!stats) return [];
    
    const recommendations = [];
    
    // Rekomendasi berdasarkan korelasi skor dan absensi
    if (stats.korelasiSkorAbsensi < -0.3) {
      recommendations.push(
        "Ada korelasi negatif yang signifikan antara absensi dan skor mata pelajaran. Pertimbangkan program untuk meningkatkan kehadiran siswa dengan menggunakan elemen gamifikasi seperti poin kehadiran dan hadiah virtual."
      );
    }
    
    // Rekomendasi berdasarkan skor rata-rata
    if (stats.skorRataRata < 70) {
      recommendations.push(
        "Skor rata-rata di bawah 70. Implementasikan metode pembelajaran berbasis permainan yang meningkatkan pemahaman konsep dan membuat materi lebih menarik."
      );
    } else if (stats.skorRataRata >= 85) {
      recommendations.push(
        "Skor rata-rata sangat baik. Kembangkan level pembelajaran yang lebih menantang dengan sistem reward untuk mempertahankan motivasi siswa berprestasi."
      );
    }
    
    // Rekomendasi berdasarkan absensi
    if (stats.absensiRataRata > 5) {
      recommendations.push(
        "Tingkat absensi cukup tinggi. Tambahkan fitur 'streak' kehadiran dan leaderboard untuk mendorong kompetisi sehat dalam kehadiran."
      );
    }
    
    // Rekomendasi berdasarkan distribusi umur
    const umurDominan = Object.entries(stats.distribusiUmur)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (umurDominan) {
      recommendations.push(
        `Kelompok umur dominan adalah ${umurDominan[0]} tahun (${Math.round(umurDominan[1] / stats.totalSiswa * 100)}%). Sesuaikan desain UI dan level kesulitan game untuk kelompok umur ini.`
      );
    }
    
    // Rekomendasi khusus untuk gamifikasi
    recommendations.push(
      "Terapkan sistem progresif dengan badge, avatar, dan item koleksi virtual yang dapat diakses setelah menyelesaikan target pembelajaran."
    );
    
    if (stats.distribusiSkor.kurang > stats.totalSiswa * 0.2) {
      recommendations.push(
        "Lebih dari 20% siswa memiliki skor kurang. Implementasikan sistem 'quest' berjenjang yang memungkinkan siswa membangun pengetahuan secara bertahap dengan rewards instant."
      );
    }
    
    // Rekomendasi untuk keterlibatan orang tua
    recommendations.push(
      "Tambahkan fitur monitoring untuk orang tua dengan notifikasi pencapaian dan laporan kemajuan real-time untuk meningkatkan keterlibatan keluarga."
    );
    
    return recommendations;
  };

  // Handle file input change
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      setError("Please select a valid CSV file");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Analisis Dataset Edukasi</h2>
      
      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Upload file CSV dataset:</label>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
        />
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center my-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Results Section */}
      {stats && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-3">Hasil Analisis</h3>
          
          {/* Basic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Statistik Dasar</h4>
              <ul className="space-y-1">
                <li>Total Siswa: <span className="font-medium">{stats.totalSiswa}</span></li>
                <li>Skor Rata-rata: <span className="font-medium">{stats.skorRataRata.toFixed(2)}</span></li>
                <li>Absensi Rata-rata: <span className="font-medium">{stats.absensiRataRata.toFixed(2)} hari</span></li>
                <li>Korelasi Skor-Absensi: <span className="font-medium">{stats.korelasiSkorAbsensi.toFixed(2)}</span></li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Distribusi Skor</h4>
              <ul className="space-y-1">
                <li>Sangat Baik (85-100): <span className="font-medium">{stats.distribusiSkor.sangat_baik} siswa ({(stats.distribusiSkor.sangat_baik / stats.totalSiswa * 100).toFixed(1)}%)</span></li>
                <li>Baik (70-84): <span className="font-medium">{stats.distribusiSkor.baik} siswa ({(stats.distribusiSkor.baik / stats.totalSiswa * 100).toFixed(1)}%)</span></li>
                <li>Cukup (55-69): <span className="font-medium">{stats.distribusiSkor.cukup} siswa ({(stats.distribusiSkor.cukup / stats.totalSiswa * 100).toFixed(1)}%)</span></li>
                <li>Kurang (&lt;55): <span className="font-medium">{stats.distribusiSkor.kurang} siswa ({(stats.distribusiSkor.kurang / stats.totalSiswa * 100).toFixed(1)}%)</span></li>
              </ul>
            </div>
          </div>
          
          {/* Distributions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Distribusi Umur</h4>
              <ul className="space-y-1">
                {Object.keys(stats.distribusiUmur).sort().map(umur => (
                  <li key={umur}>
                    {umur} tahun: <span className="font-medium">{stats.distribusiUmur[umur]} siswa ({(stats.distribusiUmur[umur] / stats.totalSiswa * 100).toFixed(1)}%)</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Distribusi Grade</h4>
              <ul className="space-y-1">
                {Object.keys(stats.distribusiGrade).sort().map(grade => (
                  <li key={grade}>
                    Grade {grade}: <span className="font-medium">{stats.distribusiGrade[grade]} siswa ({(stats.distribusiGrade[grade] / stats.totalSiswa * 100).toFixed(1)}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-3">Rekomendasi Gamifikasi</h3>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <ul className="list-disc pl-5 space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="text-indigo-800">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Preview Data Table */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3">Preview Data (5 baris pertama)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).map(header => (
                      <th key={header} className="border border-gray-200 px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
                          {value !== null ? value.toString() : 'N/A'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAnalyzer;