import React, { useState, useEffect } from 'react';
import {
    RiBrainLine,
    RiStarLine,
    RiAlarmWarningLine,
    RiLightbulbLine,
    RiParentLine,
    RiArrowUpLine,
    RiArrowDownLine,
    RiCheckboxCircleLine,
    RiTimeLine,
    RiBookOpenLine,
    RiHeartLine,
    RiChat3Line,
    RiRefreshLine
} from 'react-icons/ri';

const ParentInsightsPanel = ({ childId, onClose }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchInsights();
    }, [childId]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/analytics/parent-insights/${childId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch insights');
            }

            const data = await response.json();
            setInsights(data.data);
        } catch (error) {
            console.error('Error fetching insights:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-green-600 bg-green-100';
            case 'good': return 'text-blue-600 bg-blue-100';
            case 'needs_attention': return 'text-yellow-600 bg-yellow-100';
            case 'concerning': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'excellent': return <RiStarLine />;
            case 'good': return <RiCheckboxCircleLine />;
            case 'needs_attention': return <RiAlarmWarningLine />;
            case 'concerning': return <RiAlarmWarningLine />;
            default: return <RiBrainLine />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'border-l-red-500 bg-red-50';
            case 'medium': return 'border-l-yellow-500 bg-yellow-50';
            case 'low': return 'border-l-green-500 bg-green-50';
            default: return 'border-l-gray-500 bg-gray-50';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'academic_support': return <RiBookOpenLine className="text-blue-600" />;
            case 'motivation': return <RiHeartLine className="text-pink-600" />;
            case 'communication': return <RiChat3Line className="text-green-600" />;
            case 'schedule': return <RiTimeLine className="text-purple-600" />;
            default: return <RiLightbulbLine className="text-yellow-600" />;
        }
    };

    const getTrendIcon = (direction) => {
        switch (direction) {
            case 'improving': return <RiArrowUpLine className="text-green-600" />;
            case 'declining': return <RiArrowDownLine className="text-red-600" />;
            default: return <RiTimeLine className="text-gray-600" />;
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-lg">Menganalisis data pembelajaran...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <RiAlarmWarningLine size={48} className="mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Gagal Memuat Insights</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={fetchInsights}
                                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
                            >
                                <RiRefreshLine className="mr-2" />
                                Coba Lagi
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center mb-2">
                                <RiBrainLine size={24} className="mr-2" />
                                <h2 className="text-xl font-bold">AI Insights untuk {insights?.childData?.nama_lengkap}</h2>
                            </div>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(insights?.insights?.overall_status)}`}>
                                {getStatusIcon(insights?.insights?.overall_status)}
                                <span className="ml-1 capitalize">{insights?.insights?.overall_status?.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <p className="mt-3 text-blue-100">{insights?.insights?.summary}</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'overview', label: 'Ringkasan', icon: RiBrainLine },
                            { id: 'recommendations', label: 'Rekomendasi', icon: RiLightbulbLine },
                            { id: 'trends', label: 'Tren & Analisis', icon: RiArrowUpLine },
                            { id: 'communication', label: 'Tips Komunikasi', icon: RiChat3Line }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center py-4 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Key Insights */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <RiStarLine className="mr-2 text-yellow-500" />
                                    Insights Utama
                                </h3>
                                <div className="space-y-3">
                                    {insights?.insights?.key_insights?.map((insight, index) => (
                                        <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                                            <p className="text-gray-800">{insight}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strengths and Areas for Improvement */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center text-green-600">
                                        <RiCheckboxCircleLine className="mr-2" />
                                        Kekuatan Anak
                                    </h3>
                                    <div className="space-y-2">
                                        {insights?.insights?.child_strengths?.map((strength, index) => (
                                            <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                                <p className="text-green-800 font-medium">{strength}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Areas for Improvement */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center text-orange-600">
                                        <RiAlarmWarningLine className="mr-2" />
                                        Area yang Perlu Diperbaiki
                                    </h3>
                                    <div className="space-y-3">
                                        {insights?.insights?.areas_for_improvement?.map((area, index) => (
                                            <div key={index} className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                                <h4 className="font-semibold text-orange-800 mb-2">{area.area}</h4>
                                                <p className="text-orange-700 text-sm mb-2">{area.suggestion}</p>
                                                <div className="bg-orange-100 p-2 rounded text-xs">
                                                    <strong>Peran Orangtua:</strong> {area.parent_role}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recommendations' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <RiLightbulbLine className="mr-2 text-yellow-500" />
                                Rekomendasi untuk Orangtua
                            </h3>
                            {insights?.insights?.parent_recommendations?.map((rec, index) => (
                                <div key={index} className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(rec.priority)}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center">
                                            {getCategoryIcon(rec.category)}
                                            <h4 className="font-semibold ml-2">{rec.title}</h4>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {rec.priority === 'high' ? 'Prioritas Tinggi' :
                                                    rec.priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                                {rec.timeline === 'immediate' ? 'Segera' :
                                                    rec.timeline === 'this_week' ? 'Minggu Ini' : 'Berkelanjutan'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-700">{rec.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'trends' && (
                        <div className="space-y-6">
                            {/* Academic Trends */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    {getTrendIcon(insights?.insights?.academic_trends?.direction)}
                                    <span className="ml-2">Tren Akademik</span>
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex items-center mb-3">
                                        <span className="text-sm font-medium text-gray-600">Status Tren:</span>
                                        <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                                            {insights?.insights?.academic_trends?.direction?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 mb-3">{insights?.insights?.academic_trends?.description}</p>
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                                        <p className="text-sm text-blue-800">
                                            <strong>Prediksi:</strong> {insights?.insights?.academic_trends?.prediction}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Data Visualization */}
                            {insights?.performanceData && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Data Performa</h3>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {insights.performanceData.average_score || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Rata-rata Nilai</div>
                                        </div>
                                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {insights.performanceData.completed_assignments || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Tugas Selesai</div>
                                        </div>
                                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-yellow-600">
                                                {insights.performanceData.pending_assignments || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Menunggu Penilaian</div>
                                        </div>
                                        <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {insights.performanceData.submission_rate || 0}%
                                            </div>
                                            <div className="text-sm text-gray-600">Tingkat Pengumpulan</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recent Scores Trend */}
                            {insights?.trendsData?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Tren Nilai Terbaru</h3>
                                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                                        <div className="flex items-end space-x-2 h-32">
                                            {insights.trendsData.map((score, index) => (
                                                <div key={index} className="flex-1 flex flex-col items-center">
                                                    <div
                                                        className={`w-full rounded-t ${score.score >= 80 ? 'bg-green-500' :
                                                                score.score >= 70 ? 'bg-yellow-500' :
                                                                    score.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ height: `${(score.score / 100) * 100}%` }}
                                                    ></div>
                                                    <div className="text-xs text-gray-600 mt-2 text-center">
                                                        <div className="font-medium">{score.score}</div>
                                                        <div className="truncate max-w-16" title={score.subject}>
                                                            {score.subject}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'communication' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <RiChat3Line className="mr-2 text-green-500" />
                                Tips Komunikasi
                            </h3>

                            <div className="space-y-4">
                                {insights?.insights?.communication_tips?.map((tip, index) => (
                                    <div key={index} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                        <div className="flex items-start">
                                            <RiParentLine className="text-green-600 mt-1 mr-3 flex-shrink-0" />
                                            <p className="text-green-800">{tip}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Additional Communication Guidelines */}
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                    <RiLightbulbLine className="mr-2" />
                                    Panduan Komunikasi Efektif
                                </h4>
                                <div className="space-y-2 text-sm text-blue-700">
                                    <div className="flex items-start">
                                        <span className="font-medium mr-2">•</span>
                                        <span>Dengarkan lebih dulu sebelum memberikan saran</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="font-medium mr-2">•</span>
                                        <span>Fokus pada usaha, bukan hanya hasil</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="font-medium mr-2">•</span>
                                        <span>Buat jadwal rutin untuk membahas pembelajaran</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="font-medium mr-2">•</span>
                                        <span>Koordinasi dengan guru secara berkala</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        <RiBrainLine className="inline mr-1" />
                        Insights dihasilkan dengan AI berdasarkan data pembelajaran terkini
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={fetchInsights}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center text-sm"
                        >
                            <RiRefreshLine className="mr-2" />
                            Perbarui
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentInsightsPanel;