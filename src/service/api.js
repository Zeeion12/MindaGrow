const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fungsi untuk mengirim pesan ke Groq API
export async function sendMessageToGroq(messages) {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling Groq API:', error);
        throw error;
    }
}

// Fungsi untuk mengecek apakah pertanyaan terkait dataset
export function isDatasetQuestion(question) {
    const datasetKeywords = [
        'dataset',
        'data',
        'statistik',
        'analisis',
        'grafik',
        'chart',
        'visualisasi'
    ];

    return datasetKeywords.some(keyword =>
        question.toLowerCase().includes(keyword.toLowerCase())
    );
}

// Fungsi untuk query dataset (memerlukan backend Python)
export async function queryDataset(question) {
    try {
        const response = await fetch('http://localhost:5000/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error('Backend Python error');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error querying dataset:', error);
        throw error;
    }
}