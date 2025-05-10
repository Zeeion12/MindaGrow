import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/layoutParts/Header';
import { 
  RiFileDownloadLine, 
  RiPrinterLine, 
  RiShareLine,
  RiCalendarLine,
  RiMedalLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiEqualizerLine,
  RiLineChartLine,
  RiPieChartLine,
  RiBookOpenLine,
  RiTimeLine,
  RiFilterLine,
  RiGraduationCapLine,
  RiGroupLine
} from 'react-icons/ri';

const LaporanPerkembanganPage = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('semester');
  const [loading, setLoading] = useState(true);
  
  // Fake chart data
  const academicProgressData = [
    { month: 'Jan', score: 75 },
    { month: 'Feb', score: 78 },
    { month: 'Mar', score: 74 },
    { month: 'Apr', score: 82 },
    { month: 'Mei', score: 85 }
  ];
  
  const subjectPerformanceData = [
    { subject: 'Matematika', score: 85, average: 75 },
    { subject: 'IPA', score: 78, average: 72 },
    { subject: 'B. Indonesia', score: 90, average: 80 },
    { subject: 'B. Inggris', score: 82, average: 77 },
    { subject: 'IPS', score: 75, average: 74 }
  ];
  
  const skillsData = [
    { skill: 'Pemecahan Masalah', level: 80 },
    { skill: 'Kreativitas', level: 85 },
    { skill: 'Komunikasi', level: 70 },
    { skill: 'Kerja Tim', level: 90 },
    { skill: 'Kemandirian', level: 75 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Dummy data untuk anak
        const dummyChildren = [
          { id: 1, name: 'Muhamad Dimas', class: '5A', school: 'SD Negeri 1 Surakarta', image: '/api/placeholder/50/50' },
          { id: 2, name: 'Aisyah Putri', class: '3B', school: 'SD Negeri 1 Surakarta', image: '/api/placeholder/50/50' }
        ];
        
        setChildren(dummyChildren);
        
        // Set anak pertama sebagai default
        if (dummyChildren.length > 0) {
          setSelectedChild(dummyChildren[0]);
          
          // Dummy reports data
          const dummyReports = [
            {
              id: 1,
              title: 'Laporan Semester 2 (2024/2025)',
              period: 'Januari - Mei 2025',
              type: 'semester',
              createdAt: '10 Mei 2025',
              summary: {
                overallGrade: 'A',
                averageScore: 85,
                improvement: '+5%',
                ranking: '5 dari 32',
                attendance: '95%',
              },
              academicPerformance: {
                subjects: [
                  { name: 'Matematika', score: 85, grade: 'A', teacherComment: 'Dimas menunjukkan kemampuan yang sangat baik dalam aljabar dan perhitungan. Perlu lebih teliti dalam soal cerita.' },
                  { name: 'IPA', score: 78, grade: 'B+', teacherComment: 'Pemahaman konsep baik, namun perlu lebih aktif dalam praktikum.' },
                  { name: 'Bahasa Indonesia', score: 90, grade: 'A', teacherComment: 'Kemampuan menulis dan berbicara sangat baik. Terampil dalam menyusun cerita.' },
                  { name: 'Bahasa Inggris', score: 82, grade: 'A-', teacherComment: 'Kosakata dan grammar baik. Perlu peningkatan dalam speaking.' },
                  { name: 'IPS', score: 75, grade: 'B', teacherComment: 'Pemahaman materi cukup baik, namun perlu lebih banyak membaca untuk memperkaya wawasan.' },
                ]
              },
              personalDevelopment: {
                attitude: 'Sangat Baik',
                behavior: 'Baik',
                socialization: 'Baik',
                skills: [
                  { name: 'Pemecahan Masalah', level: 'Sangat Baik' },
                  { name: 'Kreativitas', level: 'Sangat Baik' },
                  { name: 'Komunikasi', level: 'Baik' },
                  { name: 'Kerja Tim', level: 'Sangat Baik' },
                  { name: 'Kemandirian', level: 'Baik' }
                ]
              },
              teacherNotes: 'Dimas adalah siswa yang rajin dan aktif di kelas. Ia menunjukkan semangat belajar yang tinggi dan mampu bekerja sama dengan baik dalam kelompok. Dimas perlu lebih percaya diri dalam menyampaikan pendapat di depan kelas.',
              principalNotes: 'Kami senang melihat perkembangan Dimas semester ini. Teruslah semangat dan pertahankan prestasimu.',
              recommendations: 'Dimas direkomendasikan untuk mengikuti ekstrakurikuler matematika untuk mengasah kemampuannya lebih jauh.'
            },
            {
              id: 2,
              title: 'Laporan Semester 1 (2024/2025)',
              period: 'Agustus - Desember 2024',
              type: 'semester',
              createdAt: '20 Desember 2024',
              summary: {
                overallGrade: 'B+',
                averageScore: 80,
                improvement: '+2%',
                ranking: '8 dari 32',
                attendance: '92%',
              },
              academicPerformance: {
                subjects: [
                  { name: 'Matematika', score: 80, grade: 'B+', teacherComment: 'Dimas menunjukkan pemahaman yang baik, namun perlu lebih teliti dalam perhitungan.' },
                  { name: 'IPA', score: 75, grade: 'B', teacherComment: 'Pemahaman konsep cukup, namun perlu lebih aktif dalam diskusi kelas.' },
                  { name: 'Bahasa Indonesia', score: 85, grade: 'A-', teacherComment: 'Kemampuan menulis baik, perlu peningkatan dalam presentasi.' },
                  { name: 'Bahasa Inggris', score: 78, grade: 'B+', teacherComment: 'Kosakata baik, perlu peningkatan dalam grammar.' },
                  { name: 'IPS', score: 72, grade: 'B-', teacherComment: 'Cukup baik, namun perlu lebih fokus dalam memahami kronologi sejarah.' },
                ]
              },
              personalDevelopment: {
                attitude: 'Baik',
                behavior: 'Baik',
                socialization: 'Cukup',
                skills: [
                  { name: 'Pemecahan Masalah', level: 'Baik' },
                  { name: 'Kreativitas', level: 'Baik' },
                  { name: 'Komunikasi', level: 'Cukup' },
                  { name: 'Kerja Tim', level: 'Baik' },
                  { name: 'Kemandirian', level: 'Cukup' }
                ]
              },
              teacherNotes: 'Dimas adalah siswa yang baik dan memiliki potensi. Ia perlu lebih aktif dalam kegiatan kelas dan mengembangkan kepercayaan dirinya.',
              principalNotes: 'Dimas menunjukkan potensi yang baik. Kami harap ia terus meningkatkan kemampuannya di semester berikutnya.',
              recommendations: 'Dimas sebaiknya lebih banyak berlatih berbicara di depan umum untuk meningkatkan kepercayaan dirinya.'
            },
            {
              id: 3,
              title: 'Laporan Bulanan (April 2025)',
              period: 'April 2025',
              type: 'monthly',
              createdAt: '30 April 2025',
              summary: {
                averageScore: 84,
                improvement: '+3%',
                attendance: '96%',
              },
              academicPerformance: {
                subjects: [
                  { name: 'Matematika', score: 83, teacherComment: 'Kemajuan yang baik dalam materi persamaan kuadrat.' },
                  { name: 'IPA', score: 78, teacherComment: 'Aktif dalam praktikum sistem reproduksi.' },
                  { name: 'Bahasa Indonesia', score: 88, teacherComment: 'Tulisan puisi yang sangat kreatif.' },
                  { name: 'Bahasa Inggris', score: 81, teacherComment: 'Peningkatan dalam keterampilan berbicara.' },
                  { name: 'IPS', score: 74, teacherComment: 'Perlu lebih fokus pada materi sejarah kemerdekaan.' },
                ]
              },
              monthlyHighlights: [
                'Meraih nilai tertinggi dalam ujian matematika',
                'Aktif dalam diskusi kelompok IPA',
                'Menyelesaikan semua tugas tepat waktu'
              ],
              teacherNotes: 'Dimas menunjukkan peningkatan yang konsisten bulan ini, terutama dalam matematika dan bahasa Indonesia.'
            },
            {
              id: 4,
              title: 'Laporan Bulanan (Maret 2025)',
              period: 'Maret 2025',
              type: 'monthly',
              createdAt: '31 Maret 2025',
              summary: {
                averageScore: 81,
                improvement: '+1%',
                attendance: '94%',
              },
              academicPerformance: {
                subjects: [
                  { name: 'Matematika', score: 80, teacherComment: 'Perlu lebih teliti dalam materi geometri.' },
                  { name: 'IPA', score: 77, teacherComment: 'Pemahaman yang baik tentang sistem pernapasan.' },
                  { name: 'Bahasa Indonesia', score: 86, teacherComment: 'Karangan deskriptif yang detail dan baik.' },
                  { name: 'Bahasa Inggris', score: 79, teacherComment: 'Grammar yang baik dalam tulisan.' },
                  { name: 'IPS', score: 73, teacherComment: 'Perlu lebih memahami konsep geografi.' },
                ]
              },
              monthlyHighlights: [
                'Presentasi yang baik dalam pelajaran Bahasa Indonesia',
                'Menyelesaikan proyek IPA dengan hasil yang memuaskan',
                'Aktif dalam diskusi kelompok'
              ],
              teacherNotes: 'Dimas bekerja dengan baik bulan ini, namun perlu sedikit lebih fokus pada mata pelajaran IPS.'
            }
          ];
          
          setReports(dummyReports);
          setSelectedReport(dummyReports[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    // In a real implementation, we would reload reports for this child
  };

  const handleReportSelect = (report) => {
    setSelectedReport(report);
  };

  const handlePeriodChange = (period) => {
    setReportPeriod(period);
    // Filter reports based on period
    const filteredReports = reports.filter(report => report.type === period);
    if (filteredReports.length > 0) {
      setSelectedReport(filteredReports[0]);
    } else {
      setSelectedReport(null);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const filteredReports = reports.filter(report => report.type === reportPeriod);

  return (
    <div className="bg-gray-50 min-h-screen ml-20">
      <Header title="Laporan Perkembangan" />
      
      <div className="px-6 py-4">
        {/* Pilihan Anak */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Anak Saya</h2>
          <div className="flex space-x-4">
            {children.map(child => (
              <div 
                key={child.id}
                onClick={() => handleChildSelect(child)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all
                  ${selectedChild?.id === child.id 
                    ? 'bg-blue-100 ring-2 ring-blue-500' 
                    : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
                  <img src={child.image} alt={child.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-medium">{child.name}</p>
                  <p className="text-xs text-gray-500">Kelas {child.class}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedChild && (
          <>
            {/* Filter Period */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex items-center">
                <RiFilterLine className="text-gray-500 mr-2" />
                <span className="text-gray-700 mr-4">Jenis Laporan:</span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handlePeriodChange('semester')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      reportPeriod === 'semester' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Semester
                  </button>
                  <button 
                    onClick={() => handlePeriodChange('monthly')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      reportPeriod === 'monthly' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Bulanan
                  </button>
                </div>
              </div>
            </div>

            {/* Reports List and Detail */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold">Daftar Laporan</h2>
                  </div>
                  
                  <div className="p-4">
                    {filteredReports.length > 0 ? (
                      <div className="space-y-3">
                        {filteredReports.map(report => (
                          <div 
                            key={report.id}
                            onClick={() => handleReportSelect(report)}
                            className={`p-3 rounded-lg cursor-pointer transition-all
                              ${selectedReport?.id === report.id 
                                ? 'bg-blue-50 ring-1 ring-blue-500' 
                                : 'bg-gray-50 hover:bg-gray-100'}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{report.title}</h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <RiCalendarLine className="mr-1" />
                                  <span>{report.period}</span>
                                </div>
                              </div>
                              {report.type === 'semester' && report.summary.overallGrade && (
                                <div className={`font-bold text-lg ${getGradeColor(report.summary.overallGrade)}`}>
                                  {report.summary.overallGrade}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        Tidak ada laporan untuk periode ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Report Detail */}
              <div className="md:col-span-2">
                {selectedReport ? (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-lg font-semibold">{selectedReport.title}</h2>
                      <div className="flex space-x-2">
                        <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">
                          <RiPrinterLine />
                        </button>
                        <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">
                          <RiFileDownloadLine />
                        </button>
                        <button className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">
                          <RiShareLine />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* Header Info */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <RiCalendarLine className="mr-1" />
                          <span>Periode: {selectedReport.period}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Dibuat pada: {selectedReport.createdAt}
                        </div>
                      </div>
                      
                      {/* Summary Box */}
                      <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <h3 className="font-semibold text-blue-700 mb-3">Ringkasan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {selectedReport.summary.overallGrade && (
                            <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                              <span className="text-sm text-gray-500 mb-1">Nilai Keseluruhan</span>
                              <span className={`text-2xl font-bold ${getGradeColor(selectedReport.summary.overallGrade)}`}>
                                {selectedReport.summary.overallGrade}
                              </span>
                            </div>
                          )}
                          
                          <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                            <span className="text-sm text-gray-500 mb-1">Rata-rata Nilai</span>
                            <span className={`text-2xl font-bold ${getScoreColor(selectedReport.summary.averageScore)}`}>
                              {selectedReport.summary.averageScore}
                            </span>
                          </div>
                          
                          {selectedReport.summary.improvement && (
                            <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                              <span className="text-sm text-gray-500 mb-1">Peningkatan</span>
                              <span className="text-2xl font-bold text-green-600 flex items-center">
                                <RiArrowUpLine className="mr-1" />
                                {selectedReport.summary.improvement}
                              </span>
                            </div>
                          )}
                          
                          {selectedReport.summary.ranking && (
                            <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                              <span className="text-sm text-gray-500 mb-1">Peringkat</span>
                              <span className="text-2xl font-bold text-blue-600">
                                {selectedReport.summary.ranking}
                              </span>
                            </div>
                          )}
                          
                          <div className="bg-white p-3 rounded-lg shadow-sm flex flex-col items-center">
                            <span className="text-sm text-gray-500 mb-1">Kehadiran</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {selectedReport.summary.attendance}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Visualisasi Grafik */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                          <RiLineChartLine className="mr-2" />
                          Visualisasi Perkembangan
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Academic Progress Chart */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Perkembangan Akademik</h4>
                            <div className="h-48 flex items-end justify-between">
                              {academicProgressData.map((item, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div 
                                    className="w-10 bg-blue-500 rounded-t-md" 
                                    style={{ height: `${item.score}%` }}
                                  ></div>
                                  <span className="text-xs mt-1">{item.month}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Subject Performance Chart */}
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Performa Mata Pelajaran</h4>
                            <div className="h-48 flex items-end justify-between">
                              {subjectPerformanceData.map((item, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div className="relative w-12">
                                    <div 
                                      className="w-5 absolute left-0 bottom-0 bg-blue-500 rounded-t-md" 
                                      style={{ height: `${item.score}%` }}
                                    ></div>
                                    <div 
                                      className="w-5 absolute right-0 bottom-0 bg-gray-300 rounded-t-md" 
                                      style={{ height: `${item.average}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs mt-1">{item.subject.substring(0, 3)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-center mt-2">
                              <div className="flex items-center mr-4">
                                <div className="w-3 h-3 bg-blue-500 mr-1"></div>
                                <span className="text-xs">Rata-rata Kelas</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Skills Radar Chart (Simplified visualization) */}
                        {selectedReport.type === 'semester' && (
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm font-medium text-gray-600 mb-3">Perkembangan Keterampilan</h4>
                            <div className="flex justify-between items-center h-40">
                              {skillsData.map((skill, index) => (
                                <div key={index} className="flex flex-col items-center">
                                  <div className="w-full h-4 bg-gray-200 rounded-full mb-1 relative">
                                    <div 
                                      className="h-4 bg-green-500 rounded-full absolute left-0 top-0" 
                                      style={{ width: `${skill.level}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-center">{skill.skill}</div>
                                  <div className="text-xs font-medium mt-1">{skill.level}%</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Academic Performance */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                          <RiBookOpenLine className="mr-2" />
                          Performa Akademik
                        </h3>
                        
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Mata Pelajaran
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Nilai
                                </th>
                                {selectedReport.type === 'semester' && (
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grade
                                  </th>
                                )}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Komentar Guru
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedReport.academicPerformance.subjects.map((subject, index) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {subject.name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <span className={`font-bold ${getScoreColor(subject.score)}`}>
                                      {subject.score}
                                    </span>
                                  </td>
                                  {selectedReport.type === 'semester' && (
                                    <td className="px-4 py-3 text-sm text-center">
                                      <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                                        {subject.grade}
                                      </span>
                                    </td>
                                  )}
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {subject.teacherComment}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Personal Development (if semester report) */}
                      {selectedReport.type === 'semester' && selectedReport.personalDevelopment && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                            <RiGroupLine className="mr-2" />
                            Perkembangan Personal
                          </h3>
                          
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm text-gray-500 mb-1">Sikap</p>
                                <p className="font-medium">{selectedReport.personalDevelopment.attitude}</p>
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm text-gray-500 mb-1">Perilaku</p>
                                <p className="font-medium">{selectedReport.personalDevelopment.behavior}</p>
                              </div>
                              
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-sm text-gray-500 mb-1">Sosialisasi</p>
                                <p className="font-medium">{selectedReport.personalDevelopment.socialization}</p>
                              </div>
                            </div>
                            
                            <h4 className="font-medium text-gray-700 mb-2">Keterampilan</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {selectedReport.personalDevelopment.skills.map((skill, index) => (
                                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                  <span className="text-sm">{skill.name}</span>
                                  <span className="text-sm font-medium">{skill.level}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Monthly Highlights (if monthly report) */}
                      {selectedReport.type === 'monthly' && selectedReport.monthlyHighlights && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                            <RiMedalLine className="mr-2" />
                            Pencapaian Bulan Ini
                          </h3>
                          
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <ul className="space-y-2">
                              {selectedReport.monthlyHighlights.map((highlight, index) => (
                                <li key={index} className="flex items-start">
                                  <div className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">
                                    <RiCheckDoubleLine className="text-green-600" size={16} />
                                  </div>
                                  <span className="text-gray-700">{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {/* Teacher Notes */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                          <RiGraduationCapLine className="mr-2" />
                          Catatan Guru
                        </h3>
                        
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-gray-700">{selectedReport.teacherNotes}</p>
                        </div>
                      </div>
                      
                      {/* Principal Notes (if semester report) */}
                      {selectedReport.type === 'semester' && selectedReport.principalNotes && (
                        <div className="mb-6">
                          <h3 className="font-semibold text-gray-700 mb-3">Catatan Kepala Sekolah</h3>
                          
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-gray-700">{selectedReport.principalNotes}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Recommendations (if semester report) */}
                      {selectedReport.type === 'semester' && selectedReport.recommendations && (
                        <div>
                          <h3 className="font-semibold text-gray-700 mb-3">Rekomendasi</h3>
                          
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-gray-700">{selectedReport.recommendations}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center h-full flex flex-col items-center justify-center">
                    <RiFileChartLine size={64} className="text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-2">Pilih laporan untuk melihat detail</p>
                    <p className="text-gray-400">
                      {filteredReports.length === 0 
                        ? `Tidak ada laporan ${reportPeriod === 'semester' ? 'semester' : 'bulanan'} yang tersedia.` 
                        : 'Silakan pilih salah satu laporan dari daftar di sebelah kiri.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LaporanPerkembanganPage;