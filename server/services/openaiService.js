const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateLearningInsights = async (learningData, userProfile) => {
    try {
        const prompt = `
Analisis data durasi belajar siswa berikut dan berikan insights untuk decision making:

Data Belajar (per bulan):
${learningData.map(item => `${item.month}: ${item.duration} menit total, rata-rata ${item.average} menit/hari`).join('\n')}

Profil User:
- Role: ${userProfile.role}
- Total durasi tahun ini: ${learningData.reduce((total, item) => total + item.duration, 0)} menit

Berikan analisis dalam format JSON dengan struktur:
{
  "status": "excellent|good|needs_improvement|concerning",
  "summary": "ringkasan singkat kondisi belajar",
  "insights": [
    "insight 1",
    "insight 2", 
    "insight 3"
  ],
  "recommendations": [
    {
      "title": "Judul rekomendasi",
      "description": "Detail rekomendasi",
      "priority": "high|medium|low"
    }
  ],
  "trends": {
    "direction": "increasing|decreasing|stable|irregular",
    "description": "penjelasan tren"
  }
}

Fokus pada:
1. Konsistensi belajar
2. Tren peningkatan/penurunan
3. Bulan dengan performa terbaik/terburuk
4. Rekomendasi actionable untuk meningkatkan hasil belajar
5. Peringatan jika ada pola yang mengkhawatirkan

Jawab dalam Bahasa Indonesia yang mudah dipahami.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Anda adalah AI education consultant yang ahli menganalisis data belajar siswa dan memberikan insights yang actionable."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.7,
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Error generating insights:', error);
        throw new Error('Failed to generate learning insights');
    }
};

module.exports = {
    generateLearningInsights
};