const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateParentInsights = async (childData, activitiesData, performanceData) => {
    try {
        const prompt = `
Analisis data pembelajaran anak berikut dan berikan insights untuk decision making orangtua:

Data Anak:
- Nama: ${childData.nama_lengkap}
- NIS: ${childData.nis}
- Total Kelas Diikuti: ${performanceData.totalClasses || 0}
- Status Aktif: ${performanceData.activeClasses || 0} kelas

Data Aktivitas Terbaru (7 hari terakhir):
${activitiesData.map(activity =>
            `- ${activity.course}: ${activity.description}${activity.score ? ` (Nilai: ${activity.score}/100)` : ''}${activity.status === 'submitted' ? ' - Menunggu Penilaian' : ''}`
        ).join('\n')}

Data Performa:
- Rata-rata Nilai: ${performanceData.averageScore || 'Belum ada'}
- Total Tugas Diselesaikan: ${performanceData.completedAssignments || 0}
- Tugas Menunggu Penilaian: ${performanceData.pendingAssignments || 0}
- Konsistensi Pengumpulan: ${performanceData.submissionRate || 0}%

Berikan analisis dalam format JSON dengan struktur:
{
  "overall_status": "excellent|good|needs_attention|concerning",
  "summary": "ringkasan singkat kondisi pembelajaran anak",
  "key_insights": [
    "insight utama 1 tentang performa akademik",
    "insight utama 2 tentang kebiasaan belajar", 
    "insight utama 3 tentang area yang perlu perhatian"
  ],
  "parent_recommendations": [
    {
      "category": "academic_support|motivation|communication|schedule",
      "title": "Judul rekomendasi untuk orangtua",
      "description": "Detail aksi yang bisa dilakukan orangtua",
      "priority": "high|medium|low",
      "timeline": "immediate|this_week|ongoing"
    }
  ],
  "child_strengths": [
    "kekuatan 1",
    "kekuatan 2"
  ],
  "areas_for_improvement": [
    {
      "area": "nama area yang perlu diperbaiki",
      "suggestion": "saran spesifik",
      "parent_role": "bagaimana orangtua bisa membantu"
    }
  ],
  "academic_trends": {
    "direction": "improving|stable|declining|inconsistent",
    "description": "penjelasan tren akademik",
    "prediction": "prediksi performa ke depan"
  },
  "communication_tips": [
    "tip komunikasi 1 dengan anak",
    "tip komunikasi 2 dengan guru"
  ]
}

Fokus pada:
1. Identifikasi pola performa akademik anak
2. Rekomendasi konkret untuk orangtua dalam mendukung pembelajaran
3. Area yang memerlukan perhatian khusus orangtua
4. Tips komunikasi efektif dengan anak dan guru
5. Strategi motivasi dan dukungan akademik
6. Warning signs yang perlu diwaspadai orangtua

Berikan perspektif dari sudut pandang orangtua yang ingin membantu anak sukses akademik.
Jawab dalam Bahasa Indonesia yang mudah dipahami dan actionable.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Anda adalah AI education consultant yang ahli memberikan insights dan rekomendasi kepada orangtua untuk mendukung pembelajaran anak. Fokus pada memberikan advice yang praktis dan dapat diterapkan oleh orangtua."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error generating parent insights:', error);
        throw new Error('Failed to generate parent insights');
    }
};

// Fallback function untuk generate simple insights jika OpenAI gagal
const generateSimpleParentInsights = (childData, activitiesData, performanceData) => {
    const completedActivities = activitiesData.filter(a => a.status === 'graded').length;
    const pendingActivities = activitiesData.filter(a => a.status === 'submitted').length;
    const averageScore = performanceData.averageScore || 0;

    let status = 'good';
    let insights = [];
    let recommendations = [];

    // Analisis status keseluruhan
    if (averageScore >= 85 && completedActivities > 0) {
        status = 'excellent';
        insights.push(`${childData.nama_lengkap} menunjukkan performa akademik yang sangat baik`);
    } else if (averageScore >= 75) {
        status = 'good';
        insights.push(`${childData.nama_lengkap} memiliki performa akademik yang baik`);
    } else if (averageScore >= 60) {
        status = 'needs_attention';
        insights.push(`Performa ${childData.nama_lengkap} perlu perhatian lebih`);
    } else {
        status = 'concerning';
        insights.push(`Performa akademik ${childData.nama_lengkap} memerlukan intervensi segera`);
    }

    // Analisis aktivitas
    if (pendingActivities > 0) {
        insights.push(`Ada ${pendingActivities} tugas yang sedang menunggu penilaian dari guru`);
    }

    if (completedActivities === 0) {
        insights.push('Belum ada tugas yang telah dinilai, pantau terus perkembangan anak');
        recommendations.push({
            category: 'communication',
            title: 'Komunikasi dengan Guru',
            description: 'Hubungi guru untuk mengetahui progress dan tugas yang perlu dikerjakan anak',
            priority: 'high',
            timeline: 'this_week'
        });
    }

    // Rekomendasi berdasarkan nilai
    if (averageScore < 75) {
        recommendations.push({
            category: 'academic_support',
            title: 'Berikan Dukungan Belajar Tambahan',
            description: 'Dampingi anak saat belajar dan pastikan mereka memahami materi',
            priority: 'high',
            timeline: 'ongoing'
        });
    }

    // Rekomendasi motivasi
    recommendations.push({
        category: 'motivation',
        title: 'Berikan Apresiasi',
        description: 'Berikan pujian atas usaha anak, bukan hanya pada hasil',
        priority: 'medium',
        timeline: 'ongoing'
    });

    return {
        overall_status: status,
        summary: `${childData.nama_lengkap} telah menyelesaikan ${completedActivities} tugas dengan rata-rata nilai ${averageScore.toFixed(1)}`,
        key_insights: insights,
        parent_recommendations: recommendations,
        child_strengths: completedActivities > 0 ? ['Konsisten mengumpulkan tugas', 'Aktif dalam pembelajaran'] : ['Masih dalam tahap adaptasi'],
        areas_for_improvement: averageScore < 75 ? [
            {
                area: 'Pemahaman Materi',
                suggestion: 'Perlukan review materi lebih mendalam',
                parent_role: 'Dampingi saat belajar dan jelaskan materi yang sulit'
            }
        ] : [],
        academic_trends: {
            direction: completedActivities > 0 ? 'stable' : 'needs_assessment',
            description: `Berdasarkan ${completedActivities} tugas yang telah dinilai`,
            prediction: 'Perlu waktu lebih untuk menilai tren yang akurat'
        },
        communication_tips: [
            'Tanyakan tentang kesulitan yang dihadapi anak dalam belajar',
            'Komunikasikan dengan guru tentang progress anak secara berkala'
        ]
    };
};

module.exports = {
    generateParentInsights,
    generateSimpleParentInsights
};