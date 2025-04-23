# MindaGrow AI Chatbot

Aplikasi chatbot AI sederhana dengan menggunakan React, Vite, dan Groq API.

## Fitur

- Antarmuka chat yang responsif dan modern
- Integrasi dengan Groq API untuk respons AI yang cerdas
- Mode fallback untuk berfungsi tanpa API
- Mendukung format teks multi-baris
- Indikator loading saat menunggu respons

## Pengaturan

### Persyaratan

- Node.js (versi terbaru direkomendasikan)
- npm atau yarn
- Groq API key

### Langkah Instalasi

1. Clone repository
```bash
git clone <repository-url>
cd MindaGrow
```

2. Install dependensi
```bash
npm install
# atau
yarn
```

3. Salin file `.env.example` ke `.env` (atau buat file `.env` baru)
```bash
cp .env.example .env
# atau buat manual
```

4. Edit file `.env` dan tambahkan Groq API key Anda
```
VITE_GROQ_API_KEY=your_groq_api_key_here
```

5. Jalankan aplikasi dalam mode pengembangan
```bash
npm run dev
# atau
yarn dev
```

6. Buka browser dan akses `http://localhost:3000`

## Penggunaan

- Ketik pesan di kotak input dan tekan Enter atau klik tombol Kirim
- Toggle API di pojok kanan atas untuk beralih antara mode API dan mode lokal
- Pesan dan jawaban akan muncul di area obrolan

## Penyesuaian

### Mengubah Model AI

Buka file `src/services/api.js` dan ubah parameter `model` dalam fungsi `sendMessageToGroq`:

```javascript
body: JSON.stringify({
  model: 'llama3-8b-8192', // Ubah ke model lain yang didukung Groq
  // ...
})
```

### Menambahkan Respons Lokal

Buka file `src/Chatbot.jsx` dan tambahkan entri ke objek `botResponses`:

```javascript
const botResponses = {
  "kata_kunci": "Respons untuk kata kunci ini",
  // ...
};
```

## Lisensi

MIT