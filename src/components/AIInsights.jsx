import { useState } from 'react';
import {
    FiCpu,  // Ganti FiBrain dengan FiCpu (icon CPU untuk AI)
    FiTrendingUp,
    FiTrendingDown,
    FiAlertTriangle,
    FiCheckCircle,
    FiArrowRight,
    FiLoader,
    FiX
} from 'react-icons/fi';

const AIInsights = ({ insights, loading, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <FiLoader className="size-5 text-purple-600 animate-spin" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-purple-800">AI sedang menganalisis...</h3>
                        <p className="text-sm text-purple-600">Membuat insights dari data pembelajaran Anda</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!insights) {
        return null;
    }

    const getStatusConfig = (status) => {
        const configs = {
            excellent: {
                color: 'emerald',
                icon: FiCheckCircle,
                bgClass: 'from-emerald-50 to-green-50',
                borderClass: 'border-emerald-200',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                textColor: 'text-emerald-800'
            },
            good: {
                color: 'blue',
                icon: FiTrendingUp,
                bgClass: 'from-blue-50 to-indigo-50',
                borderClass: 'border-blue-200',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                textColor: 'text-blue-800'
            },
            needs_improvement: {
                color: 'orange',
                icon: FiTrendingDown,
                bgClass: 'from-orange-50 to-amber-50',
                borderClass: 'border-orange-200',
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                textColor: 'text-orange-800'
            },
            concerning: {
                color: 'red',
                icon: FiAlertTriangle,
                bgClass: 'from-red-50 to-pink-50',
                borderClass: 'border-red-200',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
                textColor: 'text-red-800'
            }
        };
        return configs[status] || configs.good;
    };

    const statusConfig = getStatusConfig(insights.status);
    const StatusIcon = statusConfig.icon;

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'text-red-600 bg-red-50 border-red-200',
            medium: 'text-orange-600 bg-orange-50 border-orange-200',
            low: 'text-blue-600 bg-blue-50 border-blue-200'
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div className={`bg-gradient-to-r ${statusConfig.bgClass} rounded-xl p-4 border ${statusConfig.borderClass} relative`}>
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FiX className="size-4" />
                </button>
            )}

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className={`${statusConfig.iconBg} p-2 rounded-lg flex-shrink-0`}>
                    <FiCpu className={`size-5 ${statusConfig.iconColor}`} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${statusConfig.textColor}`}>AI Learning Insights</h3>
                        <StatusIcon className={`size-4 ${statusConfig.iconColor}`} />
                    </div>
                    <p className={`text-sm ${statusConfig.textColor} opacity-90`}>
                        {insights.summary}
                    </p>
                </div>
            </div>

            {/* Trends */}
            {insights.trends && (
                <div className="mb-3 p-3 bg-white/50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Tren Pembelajaran</h4>
                    <p className="text-sm text-gray-600">{insights.trends.description}</p>
                </div>
            )}

            {/* Quick Insights */}
            {insights.insights && insights.insights.length > 0 && (
                <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
                    <div className="space-y-1">
                        {insights.insights.slice(0, isExpanded ? undefined : 2).map((insight, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                                <div className="size-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                                <span className="text-gray-700">{insight}</span>
                            </div>
                        ))}
                    </div>
                    {insights.insights.length > 2 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-sm text-purple-600 hover:text-purple-700 mt-2 font-medium"
                        >
                            {isExpanded ? 'Lihat lebih sedikit' : `Lihat ${insights.insights.length - 2} insights lainnya`}
                        </button>
                    )}
                </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Rekomendasi</h4>
                    <div className="space-y-2">
                        {insights.recommendations.slice(0, isExpanded ? undefined : 1).map((rec, index) => (
                            <div key={index} className={`p-2 rounded-lg border text-sm ${getPriorityColor(rec.priority)}`}>
                                <div className="flex items-start gap-2">
                                    <FiArrowRight className="size-3 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">{rec.title}</p>
                                        <p className="text-xs opacity-90 mt-1">{rec.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {insights.recommendations.length > 1 && !isExpanded && (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="text-sm text-purple-600 hover:text-purple-700 mt-2 font-medium"
                        >
                            Lihat semua rekomendasi
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIInsights;