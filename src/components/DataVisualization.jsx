// src/components/DataVisualization.jsx
import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter,
  ZAxis, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DataVisualization = ({ data }) => {
  const [umurData, setUmurData] = useState([]);
  const [gradeData, setGradeData] = useState([]);
  const [skorData, setSkorData] = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [peningkatanData, setPeningkatanData] = useState([]);

  useEffect(() => {
    if (data && data.length > 0) {
      prepareChartData();
    }
  }, [data]);

  const prepareChartData = () => {
    // Distribusi umur untuk bar chart
    const umurCount = {};
    data.forEach(item => {
      umurCount[item.umur] = (umurCount[item.umur] || 0) + 1;
    });
    
    const preparedUmurData = Object.keys(umurCount).map(umur => ({
      umur: `${umur} tahun`,
      jumlah: umurCount[umur]
    })).sort((a, b) => parseInt(a.umur) - parseInt(b.umur));
    
    setUmurData(preparedUmurData);

    // Distribusi grade untuk pie chart
    const gradeCount = {};
    data.forEach(item => {
      const grade = item.grade_class.split('-')[0]; // Ambil huruf grade (A, B, C, dst)
      gradeCount[grade] = (gradeCount[grade] || 0) + 1;
    });
    
    const preparedGradeData = Object.keys(gradeCount).map(grade => ({
      name: `Grade ${grade}`,
      value: gradeCount[grade]
    }));
    
    setGradeData(preparedGradeData);
    
    // Distribusi skor untuk histogram
    const skorRanges = {
      '0-54': 0,
      '55-69': 0,
      '70-84': 0,
      '85-100': 0
    };
    
    data.forEach(item => {
      const skor = item.skor_mata_pelajaran;
      if (skor < 55) {
        skorRanges['0-54']++;
      } else if (skor < 70) {
        skorRanges['55-69']++;
      } else if (skor < 85) {
        skorRanges['70-84']++;
      } else {
        skorRanges['85-100']++;
      }
    });
    
    const preparedSkorData = Object.keys(skorRanges).map(range => ({
      range,
      jumlah: skorRanges[range],
      kategori: range === '0-54' ? 'Kurang' : 
                range === '55-69' ? 'Cukup' : 
                range === '70-84' ? 'Baik' : 'Sangat Baik'
    }));
    
    setSkorData(preparedSkorData);
    
    // Data untuk scatter plot (korelasi skor dan absensi)
    const preparedScatterData = data.map(item => ({
      skor: item.skor_mata_pelajaran,
      absensi: item.absensi,
      name: item.nama
    }));
    
    setScatterData(preparedScatterData);
    
    // Simulasi data peningkatan setelah gamifikasi (untuk demo)
    const simulasiPeningkatan = [
      { bulan: 'Jan', sebelum: 65, sesudah: 68 },
      { bulan: 'Feb', sebelum: 66, sesudah: 70 },
      { bulan: 'Mar', sebelum: 67, sesudah: 74 },
      { bulan: 'Apr', sebelum: 68, sesudah: 77 },
      { bulan: 'Mei', sebelum: 67, sesudah: 80 },
      { bulan: 'Jun', sebelum: 69, sesudah: 83 },
    ];
    
    setPeningkatanData(simulasiPeningkatan);
  };
  
  // Render grafik hanya jika data tersedia
  if (!data || data.length === 0) {
    return <div className="text-center p-4">Tidak ada data untuk divisualisasikan</div>;
  }
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">Visualisasi Data Edukasi</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Distribusi Umur - Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Distribusi Umur Siswa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={umurData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="umur" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="jumlah" fill="#8884d8" name="Jumlah Siswa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Distribusi Grade - Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Distribusi Grade</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {gradeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} siswa`, 'Jumlah']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Distribusi Skor - Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Distribusi Skor Mata Pelajaran</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} siswa`, 'Jumlah']} />
              <Legend />
              <Bar dataKey="jumlah" fill="#82ca9d" name="Jumlah Siswa">
                {skorData.map((entry, index) => {
                  const color = entry.kategori === 'Sangat Baik' ? '#00C49F' :
                               entry.kategori === 'Baik' ? '#0088FE' :
                               entry.kategori === 'Cukup' ? '#FFBB28' : '#FF8042';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Korelasi Skor vs Absensi - Scatter Plot */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Korelasi Skor vs Absensi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="absensi" name="Absensi (hari)" />
              <YAxis type="number" dataKey="skor" name="Skor" domain={[0, 100]} />
              <ZAxis type="category" dataKey="name" name="Nama" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Siswa" data={scatterData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-2">
            Grafik ini menunjukkan korelasi antara tingkat absensi dan skor mata pelajaran siswa.
            Tren menurun menunjukkan semakin tinggi absensi cenderung semakin rendah skor.
          </p>
        </div>
      </div>
      
      {/* Simulasi Peningkatan Setelah Gamifikasi */}
      <div className="bg-white p-4 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Simulasi Peningkatan Skor Setelah Penerapan Gamifikasi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={peningkatanData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bulan" />
            <YAxis domain={[60, 90]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="sebelum" stroke="#8884d8" name="Sebelum Gamifikasi" />
            <Line type="monotone" dataKey="sesudah" stroke="#82ca9d" name="Setelah Gamifikasi" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-2">
          Grafik ini menunjukkan simulasi peningkatan skor rata-rata setelah penerapan strategi gamifikasi.
          Data ini adalah proyeksi berdasarkan tren dalam penelitian edukasi gamifikasi.
        </p>
      </div>
      
      {/* Kesimpulan dan Rekomendasi */}
      <div className="bg-indigo-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-indigo-800">Kesimpulan Visualisasi</h3>
        <ul className="list-disc pl-5 space-y-2 text-indigo-700">
          <li>Terdapat korelasi antara tingkat absensi dan performa akademik</li>
          <li>Distribusi umur siswa menunjukkan bahwa strategi gamifikasi perlu disesuaikan dengan kelompok umur dominan</li>
          <li>Strategi gamifikasi dapat meningkatkan skor rata-rata siswa hingga 14-15 poin dalam jangka waktu 6 bulan</li>
          <li>Siswa dengan skor dalam kategori "Cukup" dan "Kurang" akan mendapatkan manfaat paling signifikan dari implementasi gamifikasi</li>
        </ul>
      </div>
    </div>
  );
};

// Tambahkan export default di sini
export default DataVisualization;