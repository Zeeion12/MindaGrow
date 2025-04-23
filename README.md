# MindaGrow - Aplikasi Edukasi AI dengan Gamifikasi

Aplikasi chatbot AI yang terintegrasi dengan analisis data edukasi untuk memberikan rekomendasi strategi gamifikasi berdasarkan dataset siswa.

## Fitur Utama

- Chatbot AI berbasis Groq LLM API untuk menjawab pertanyaan umum
- Analisis dataset edukasi menggunakan algoritma machine learning di backend Python
- Deteksi otomatis pertanyaan terkait dataset dan pengalihan ke backend analitik
- Visualisasi data untuk memahami pola dan tren
- Rekomendasi strategi gamifikasi berdasarkan karakteristik siswa

## Struktur Proyek

```
MindaGrow/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── DataAnalyzer.jsx
│   │   └── DataVisualization.jsx
│   ├── service/
│   │   ├── api.js
│   │   └── python_backend/
│   │       ├── app.py
│   │       ├── requirements.txt
│   │       └── dataset_edukasi_ai_gamifikasi_anak.csv
│   ├── App.jsx
│   ├── Chatbot.jsx
│   ├── dataset_edukasi_ai_gamifikasi_anak.csv
│   ├── index.css
│   ├── main.jsx
│   └── Navibar.jsx
├── .env
├── .gitignore
├── postcss.config.js
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Teknologi yang Digunakan

- **Frontend**: React, Vite, Tailwind CSS
- **AI**: Groq LLM API
- **Backend Analitik**: Python, Flask, pandas, scikit-learn
- **Visualisasi**: Recharts

## Cara Setup

### Frontend (React)

1. Clone repository
```bash
git clone <repository-url>
cd MindaGrow
```

2. Install dependensi
```bash
npm install
```

3. Buat file `.env` dan tambahkan API key Groq
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

4. Jalankan aplikasi frontend
```bash
npm run dev
```

### Backend Python

1. Masuk ke direktori backend
```bash
cd src/service/python_backend
```

2. Setup virtual environment (opsional tapi direkomendasikan)
```bash
python -m venv venv
source venv/bin/activate  # Linux/MacOS
venv\Scripts\activate  # Windows
```

3. Install dependensi Python
```bash
pip install -r requirements.txt
```

4. Jalankan server backend
```bash
python app.py
```

## Penggunaan

1. Buka browser dan akses `http://localhost:3000`
2. Mulai berinteraksi dengan chatbot
3. Untuk pertanyaan umum, chatbot akan menggunakan Groq API
4. Untuk pertanyaan terkait dataset (contoh: "berapa jumlah siswa"), chatbot akan secara otomatis menggunakan backend Python

## Contoh Pertanyaan yang Didukung

### Pertanyaan Dataset
- "Berapa jumlah siswa dalam dataset?"
- "Berapa rata-rata skor mata pelajaran?"
- "Bagaimana distribusi umur siswa?"
- "Apa korelasi antara absensi dan skor?"
- "Siapa siswa dengan skor tertinggi?"
- "Berikan rekomendasi strategi gamifikasi"
- "Prediksi skor dengan absensi 3 hari"

### Pertanyaan Umum
- Semua pertanyaan umum akan dijawab oleh model Groq LLM

## Catatan

- Pastikan backend Python berjalan saat Anda ingin mengakses fitur analisis dataset
- Dataset yang digunakan adalah `dataset_edukasi_ai_gamifikasi_anak.csv` yang berisi data 500 siswa
- Aplikasi secara otomatis mendeteksi apakah pertanyaan terkait dengan dataset

## License

MIT