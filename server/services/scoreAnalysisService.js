const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateScoreInsights = async (scoreData, userProfile) => {
    try {
        const prompt = `
Analisis data nilai tugas siswa berikut dan berikan insights untuk decision making:

Data Nilai per Mata Pelajaran:
${scoreData.map(item =>
            `${item.subject_name}: Rata-rata ${item.average_score}, Total ${item.total_assignments} tugas, Nilai: [${item.all_scores?.join(', ') || 'N/A'}]`
        ).join('\n')}

Profil User:
- Role: ${userProfile.role}
- Total mata pelajaran: ${scoreData.length}

Berikan analisis dalam format JSON dengan struktur:
{
  "status": "excellent|good|needs_improvement|concerning",
  "summary": "ringkasan singkat performa akademik",
  "insights": [
    "insight 1 tentang mata pelajaran terbaik/terburuk",
    "insight 2 tentang konsistensi nilai", 
    "insight 3 tentang pola nilai"
  ],
  "recommendations": [
    {
      "title": "Judul rekomendasi",
      "description": "Detail rekomendasi",
      "priority": "high|medium|low",
      "subject": "mata pelajaran terkait (jika ada)"
    }
  ],
  "academic_analysis": {
    "strongest_subject": "mata pelajaran dengan nilai tertinggi",
    "weakest_subject": "mata pelajaran yang perlu perbaikan",
    "overall_performance": "deskripsi performa keseluruhan",
    "consistency_level": "tinggi|sedang|rendah"
  }
}

Fokus pada:
1. Identifikasi mata pelajaran yang paling kuat dan yang perlu diperbaiki
2. Analisis konsistensi nilai di setiap mata pelajaran
3. Rekomendasi spesifik untuk meningkatkan nilai yang rendah
4. Strategi mempertahankan performa yang sudah baik
5. Tips belajar yang actionable

Jawab dalam Bahasa Indonesia yang mudah dipahami.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Anda adalah AI education consultant yang ahli menganalisis nilai akademik siswa dan memberikan rekomendasi untuk meningkatkan performa belajar."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1200,
            temperature: 0.7,
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error generating score insights:', error);
        throw new Error('Failed to generate score insights');
    }
};

module.exports = {
    generateScoreInsights
};