from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
import os
import re
import random

app = Flask(__name__)
CORS(app)

# Menentukan path absolut ke file dataset
current_dir = os.path.dirname(os.path.abspath(__file__))
data_dir = os.path.join(current_dir, 'dataChatBot')
siswa_path = os.path.join(data_dir, 'data_siswa.csv')
kuis_path = os.path.join(data_dir, 'nilai_kuis.csv')
tugas_path = os.path.join(data_dir, 'nilai_tugas.csv')

# Load datasets
try:
    siswa_data = pd.read_csv(siswa_path)
    kuis_data = pd.read_csv(kuis_path)
    tugas_data = pd.read_csv(tugas_path)
    print(f"Dataset siswa: {len(siswa_data)} siswa, kuis: {len(kuis_data)} siswa, tugas: {len(tugas_data)}")
    
    # Merge datasets on 'Id' and 'NIS'
    dataset = siswa_data.merge(kuis_data, on=['Id', 'Nama Lengkap', 'NIS'], how='left')
    dataset = dataset.merge(tugas_data, on=['Id', 'Nama Lengkap', 'NIS'], how='left')
    print(f"Dataset gabungan berhasil dimuat. Jumlah data: {len(dataset)}")
except Exception as e:
    print(f"Error saat memuat dataset: {e}")
    dataset = pd.DataFrame({
        'Id': range(1, 31),
        'Nama Lengkap': [f'Siswa {i}' for i in range(1, 31)],
        'NIS': [f'202301{i:02d}' for i in range(1, 31)],
        'MTK_Quiz': np.random.uniform(50, 100, 30),
        'MTK_Tugas': np.random.uniform(50, 100, 30),
        'BINDO_Quiz': np.random.uniform(50, 100, 30),
        'BINDO_Tugas': np.random.uniform(50, 100, 30),
        'BING_Quiz': np.random.uniform(50, 100, 30),
        'BING_Tugas': np.random.uniform(50, 100, 30),
        'IPA_Quiz': np.random.uniform(50, 100, 30),
        'IPA_Tugas': np.random.uniform(50, 100, 30),
        'IPS_Quiz': np.random.uniform(50, 100, 30),
        'IPS_Tugas': np.random.uniform(50, 100, 30),
        'PKN_Quiz': np.random.uniform(50, 100, 30),
        'PKN_Tugas': np.random.uniform(50, 100, 30),
        'Seni_Quiz': np.random.uniform(50, 100, 30),
        'Seni_Tugas': np.random.uniform(50, 100, 30),
    })
    print("Dataset dummy dibuat karena file asli tidak ditemukan.")

# Preprocessing data
def preprocess_data():
    numeric_columns = [
        'MTK_Quiz', 'MTK_Tugas', 'BINDO_Quiz', 'BINDO_Tugas',
        'BING_Quiz', 'BING_Tugas', 'IPA_Quiz', 'IPA_Tugas',
        'IPS_Quiz', 'IPS_Tugas', 'PKN_Quiz', 'PKN_Tugas',
        'Seni_Quiz', 'Seni_Tugas'
    ]
    for col in numeric_columns:
        if col in dataset.columns:
            dataset[col] = pd.to_numeric(dataset[col], errors='coerce')
    # Pastikan NIS bertipe string dan di-strip
    if 'NIS' in dataset.columns:
        dataset['NIS'] = dataset['NIS'].astype(str).str.strip()
    return dataset.dropna()

# Fungsi untuk menganalisis dataset
def analyze_dataset():
    data = preprocess_data()
    subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
    stats = {
        "jumlah_siswa": len(data),
        "rata_rata_skor_kuis": {subject: data[f"{subject}_Quiz"].mean() for subject in subjects},
        "rata_rata_skor_tugas": {subject: data[f"{subject}_Tugas"].mean() for subject in subjects},
        "korelasi_kuis_tugas": {subject: data[f"{subject}_Quiz"].corr(data[f"{subject}_Tugas"]) for subject in subjects}
    }
    return stats

analysis_results = analyze_dataset()

# ROOT ROUTE - Add this to handle the 404 error
@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': '🐍 Flask Backend - RoGrow Chatbot Service',
        'endpoints': {
            '/api/test': 'Test connection',
            '/api/dataset/query': 'Query dataset (POST)',
            '/api/student/<nis>/analysis': 'Analyze student (GET)'
        }
    })

# API ROUTES WITH /api PREFIX
@app.route('/api/dataset/query', methods=['POST'])
def query_dataset():
    try:
        data = request.json
        question = data.get('question', '').lower()
        
        processed_data = preprocess_data()
        response = get_answer_for_question(question, processed_data)
        
        return jsonify({'answer': response})
    except Exception as e:
        print(f"Error in query_dataset: {e}")
        return jsonify({'answer': 'Maaf, terjadi kesalahan saat memproses pertanyaan Anda. 😅'}), 500

@app.route('/api/student/<nis>/analysis', methods=['GET'])
def analyze_student(nis):
    try:
        data = preprocess_data()
        student = data[data['NIS'] == str(nis)]
        if student.empty:
            return jsonify({'error': 'Siswa tidak ditemukan'}), 404
        
        subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
        analysis = {
            'nama': student['Nama Lengkap'].iloc[0],
            'nis': nis,
            'rata_rata_kuis': {subject: float(student[f"{subject}_Quiz"].iloc[0]) for subject in subjects},
            'rata_rata_tugas': {subject: float(student[f"{subject}_Tugas"].iloc[0]) for subject in subjects}
        }
        
        # Hitung mata pelajaran terlemah dan terkuat
        avg_scores = []
        for subject in subjects:
            quiz_score = student[f"{subject}_Quiz"].iloc[0]
            tugas_score = student[f"{subject}_Tugas"].iloc[0]
            avg_score = (quiz_score + tugas_score) / 2
            avg_scores.append((subject, avg_score))
        
        weakest = min(avg_scores, key=lambda x: x[1])[0]
        strongest = max(avg_scores, key=lambda x: x[1])[0]
        
        analysis['mata_pelajaran_terlemah'] = weakest
        analysis['mata_pelajaran_terkuat'] = strongest
        analysis['rekomendasi'] = f"Halo {analysis['nama']}! 🌱 Kamu hebat di {strongest}! Untuk {weakest}, coba latihan lebih sering ya. Ingat, belajar sedikit tapi rutin lebih baik!"
        
        return jsonify(analysis)
    except Exception as e:
        print(f"Error in analyze_student: {e}")
        return jsonify({'error': 'Terjadi kesalahan saat menganalisis data siswa'}), 500

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        'status': 'success',
        'message': 'Backend Python berhasil terhubung!',
        'timestamp': pd.Timestamp.now().isoformat(),
        'dataset_info': {
            'jumlah_siswa': len(dataset),
            'columns': list(dataset.columns)
        }
    })

def get_answer_for_question(question, data):
    question = question.lower().strip()
    
    # Pertanyaan sapaan
    if question in ['halo', 'hai', 'hi', 'hello', 'hey', 'oi', 'p', 'hei']:
        greetings = [
            f"Halo! Saya RoGrow, AI chatbot untuk Mindagrow. Saya bisa membantu dengan data {len(data)} siswa atau tips belajar. Apa yang ingin Anda ketahui?",
            f"Hai! Saya siap menganalisis data dari {len(data)} siswa. Tanyakan apa saja!",
            f"Halo! Coba tanyakan jumlah siswa, rata-rata skor mata pelajaran, atau tips belajar efektif."
        ]
        return random.choice(greetings)
    
    # Pertanyaan tentang jumlah siswa (lebih fleksibel)
    if (
        re.search(r'berapa (jumlah|banyak|total) siswa', question)
        or 'jumlah siswa' in question
        or 'total siswa' in question
        or 'banyak siswa' in question
    ):
        return f"Terdapat {len(data)} siswa dalam dataset kami."
    
    # Pertanyaan tentang mata pelajaran
    if 'mata pelajaran' in question or 'mapel' in question:
        subjects = ['MTK (Matematika)', 'BINDO (Bahasa Indonesia)', 'BING (Bahasa Inggris)', 
                   'IPA (Ilmu Pengetahuan Alam)', 'IPS (Ilmu Pengetahuan Sosial)', 
                   'PKN (Pendidikan Kewarganegaraan)', 'Seni']
        return f"Mata pelajaran yang tersedia: {', '.join(subjects)}"
    
    # Pertanyaan tentang rata-rata skor - ENHANCED HANDLING
    if 'rata-rata' in question or 'rata rata' in question:
        subjects_mapping = {
            'mtk': 'MTK', 'matematika': 'MTK',
            'bindo': 'BINDO', 'bahasa indonesia': 'BINDO',
            'bing': 'BING', 'bahasa inggris': 'BING',
            'ipa': 'IPA', 'ilmu pengetahuan alam': 'IPA',
            'ips': 'IPS', 'ilmu pengetahuan sosial': 'IPS',
            'pkn': 'PKN', 'pendidikan kewarganegaraan': 'PKN',
            'seni': 'Seni'
        }
        
        # Cek apakah ada mata pelajaran dan jenis nilai spesifik dalam query
        detected_subject = None
        detected_type = None
        
        # Deteksi mata pelajaran
        for key, subject in subjects_mapping.items():
            if key in question:
                detected_subject = subject
                break
        
        # Deteksi jenis nilai
        if 'quiz' in question or 'kuis' in question:
            detected_type = 'Quiz'
        elif 'tugas' in question:
            detected_type = 'Tugas'
        
        # Jika ada mata pelajaran dan jenis nilai spesifik (dari flow frontend)
        if detected_subject and detected_type:
            column_name = f"{detected_subject}_{detected_type}"
            if column_name in data.columns:
                avg_score = data[column_name].mean()
                subject_name_mapping = {
                    'MTK': 'Matematika',
                    'BINDO': 'Bahasa Indonesia', 
                    'BING': 'Bahasa Inggris',
                    'IPA': 'IPA',
                    'IPS': 'IPS', 
                    'PKN': 'PKN',
                    'Seni': 'Seni'
                }
                type_name = 'Kuis' if detected_type == 'Quiz' else 'Tugas'
                subject_full_name = subject_name_mapping.get(detected_subject, detected_subject)
                
                return f"📊 **Rata-rata {type_name} {subject_full_name}** (dari {len(data)} siswa): **{avg_score:.1f}**\n\n✨ Ini adalah rata-rata dari seluruh siswa di kelas. Nilai ini bisa menjadi benchmark untuk melihat performa kelas secara keseluruhan!"
        
        # Jika hanya ada mata pelajaran tanpa jenis nilai spesifik
        elif detected_subject:
            quiz_col = f"{detected_subject}_Quiz"
            tugas_col = f"{detected_subject}_Tugas"
            if quiz_col in data.columns and tugas_col in data.columns:
                avg_quiz = data[quiz_col].mean()
                avg_tugas = data[tugas_col].mean()
                subject_name_mapping = {
                    'MTK': 'Matematika',
                    'BINDO': 'Bahasa Indonesia',
                    'BING': 'Bahasa Inggris', 
                    'IPA': 'IPA',
                    'IPS': 'IPS',
                    'PKN': 'PKN',
                    'Seni': 'Seni'
                }
                subject_full_name = subject_name_mapping.get(detected_subject, detected_subject)
                return f"📊 **Rata-rata {subject_full_name}** (dari {len(data)} siswa):\n\n🎯 **Kuis**: {avg_quiz:.1f}\n📝 **Tugas**: {avg_tugas:.1f}\n\n💡 **Insight**: {'Kuis' if avg_quiz > avg_tugas else 'Tugas'} memiliki rata-rata lebih tinggi!"
        
        # Jika tidak ada mata pelajaran spesifik, tampilkan semua atau minta klarifikasi
        if 'semua' in question or 'keseluruhan' in question:
            result = "📊 **Rata-rata Semua Mata Pelajaran** (dari " + str(len(data)) + " siswa):\n\n"
            for subject in ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']:
                quiz_col = f"{subject}_Quiz"
                tugas_col = f"{subject}_Tugas"
                if quiz_col in data.columns and tugas_col in data.columns:
                    avg_quiz = data[quiz_col].mean()
                    avg_tugas = data[tugas_col].mean()
                    subject_name_mapping = {
                        'MTK': 'Matematika',
                        'BINDO': 'Bahasa Indonesia',
                        'BING': 'Bahasa Inggris',
                        'IPA': 'IPA', 
                        'IPS': 'IPS',
                        'PKN': 'PKN',
                        'Seni': 'Seni'
                    }
                    subject_name = subject_name_mapping.get(subject, subject)
                    result += f"📚 **{subject_name}**: Kuis {avg_quiz:.1f} | Tugas {avg_tugas:.1f}\n"
            result += "\n🎯 **Tips**: Bandingkan nilai personal Anda dengan rata-rata ini untuk mengetahui area yang perlu ditingkatkan!"
            return result
        
        # Default response jika tidak ada spesifikasi
        return "📊 Ingin melihat rata-rata nilai mata pelajaran apa?\n\nPilihan:\n• Matematika (MTK)\n• Bahasa Indonesia (BINDO)\n• Bahasa Inggris (BING)\n• IPA\n• IPS\n• PKN\n• Seni\n\nContoh: 'rata-rata MTK Quiz' atau 'rata-rata IPA Tugas'"
    
    # Tips belajar
    if 'tips' in question or ('belajar' in question and any(word in question for word in ['efektif', 'baik', 'bagus', 'sukses'])):
        tips_categories = {
            'umum': [
                "🌟 Belajar sedikit setiap hari lebih baik daripada belajar banyak sekaligus!",
                "👥 Ajak teman untuk belajar bersama, itu bisa membuatmu lebih semangat!",
                "📝 Latih soal-soal untuk mata pelajaran yang sulit, latihan membuat sempurna!",
                "🎯 Buat target kecil setiap hari, misalnya 'hari ini saya akan belajar 15 menit'",
                "🎵 Coba gunakan lagu atau gambar untuk mengingat pelajaran yang sulit!"
            ],
            'matematika': [
                "🔢 Untuk matematika: Latih soal dari yang mudah ke yang sulit",
                "✏️ Tulis rumus-rumus penting di kertas kecil untuk dibaca ulang",
                "🧮 Gunakan benda di sekitar untuk memahami konsep hitungan"
            ]
        }
        
        # Cek apakah ada mata pelajaran spesifik
        if 'matematika' in question or 'mtk' in question:
            return "\n".join(tips_categories['matematika'])
        
        # Tips umum
        return "\n".join(random.sample(tips_categories['umum'], 3))
    
    # Pertanyaan tentang skor tertinggi/terendah
    if 'tertinggi' in question or 'terbaik' in question:
        subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
        highest_scores = {}
        for subject in subjects:
            quiz_col = f"{subject}_Quiz"
            tugas_col = f"{subject}_Tugas"
            if quiz_col in data.columns and tugas_col in data.columns:
                avg_score = (data[quiz_col].mean() + data[tugas_col].mean()) / 2
                highest_scores[subject] = avg_score
        
        if highest_scores:
            best_subject = max(highest_scores, key=highest_scores.get)
            subject_name_mapping = {
                'MTK': 'Matematika',
                'BINDO': 'Bahasa Indonesia', 
                'BING': 'Bahasa Inggris',
                'IPA': 'IPA',
                'IPS': 'IPS',
                'PKN': 'PKN', 
                'Seni': 'Seni'
            }
            best_subject_name = subject_name_mapping.get(best_subject, best_subject)
            return f"🏆 **Mata pelajaran dengan rata-rata tertinggi**: {best_subject_name} ({highest_scores[best_subject]:.1f})\n\n✨ Kelas ini paling unggul di {best_subject_name}!"
    
    if 'terendah' in question or 'tersulit' in question:
        subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
        lowest_scores = {}
        for subject in subjects:
            quiz_col = f"{subject}_Quiz"
            tugas_col = f"{subject}_Tugas"
            if quiz_col in data.columns and tugas_col in data.columns:
                avg_score = (data[quiz_col].mean() + data[tugas_col].mean()) / 2
                lowest_scores[subject] = avg_score
        
        if lowest_scores:
            worst_subject = min(lowest_scores, key=lowest_scores.get)
            subject_name_mapping = {
                'MTK': 'Matematika',
                'BINDO': 'Bahasa Indonesia',
                'BING': 'Bahasa Inggris', 
                'IPA': 'IPA',
                'IPS': 'IPS',
                'PKN': 'PKN',
                'Seni': 'Seni'
            }
            worst_subject_name = subject_name_mapping.get(worst_subject, worst_subject)
            return f"📉 **Mata pelajaran yang perlu lebih banyak latihan**: {worst_subject_name} ({lowest_scores[worst_subject]:.1f})\n\n💪 Kelas perlu fokus lebih di {worst_subject_name}. Yuk semangat belajar!"
    
    return "Maaf, saya belum mengerti pertanyaan itu. Coba tanyakan tentang:\n• Jumlah siswa\n• Rata-rata nilai mata pelajaran\n• Tips belajar\n• Mata pelajaran tertinggi/terendah 😊"

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint tidak ditemukan'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Terjadi kesalahan server'}), 500

if __name__ == '__main__':
    print("Memulai server Flask di port 5001...")
    print("🐍 Flask Backend - Chatbot Service")
    print("🔗 URL: http://localhost:5001")
    print("🔗 API Test: http://localhost:5001/api/test")
    app.run(debug=True, port=5001, host='0.0.0.0')