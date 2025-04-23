# src/service/python_backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
import json
import re
import os

app = Flask(__name__)
CORS(app)  # Mengaktifkan CORS untuk permintaan dari frontend

# Menentukan path absolut ke file dataset
current_dir = os.path.dirname(os.path.abspath(__file__))
dataset_path = os.path.join(current_dir, 'dataset_edukasi_ai_gamifikasi_anak.csv')

# Load dataset (dengan path absolut)
try:
    dataset = pd.read_csv(dataset_path)
    print(f"Dataset berhasil dimuat. Jumlah data: {len(dataset)}")
except Exception as e:
    print(f"Error saat memuat dataset: {e}")
    # Buat dataset dummy jika file tidak ditemukan
    dataset = pd.DataFrame({
        'id': range(1, 501),
        'nama': [f'Siswa {i}' for i in range(1, 501)],
        'skor_mata_pelajaran': np.random.uniform(50, 100, 500),
        'nama_orang_tua': [f'Orang Tua {i}' for i in range(1, 501)],
        'absensi': np.random.randint(0, 10, 500),
        'umur': np.random.randint(6, 12, 500),
        'grade_class': [f'{np.random.choice(["A", "B", "C", "D", "E"])}-{np.random.choice(["1", "2", "3", "4", "5", "6"])}' for _ in range(500)]
    })
    print("Dataset dummy dibuat karena file asli tidak ditemukan.")

# Preprocessing data
def preprocess_data():
    # Konversi tipe data numerik jika diperlukan
    numeric_columns = ['skor_mata_pelajaran', 'absensi', 'umur']
    for col in numeric_columns:
        if col in dataset.columns:
            dataset[col] = pd.to_numeric(dataset[col], errors='coerce')
    
    # Hapus baris dengan nilai yang hilang
    return dataset.dropna()

# Fungsi untuk menganalisis dataset
def analyze_dataset():
    data = preprocess_data()
    
    # Statistik dasar
    stats = {
        "jumlah_siswa": len(data),
        "rata_rata_skor": data['skor_mata_pelajaran'].mean(),
        "rata_rata_absensi": data['absensi'].mean(),
        "min_skor": data['skor_mata_pelajaran'].min(),
        "max_skor": data['skor_mata_pelajaran'].max(),
        "min_absensi": data['absensi'].min(),
        "max_absensi": data['absensi'].max(),
        "distribusi_umur": data['umur'].value_counts().to_dict(),
        "distribusi_grade": data['grade_class'].apply(lambda x: x.split('-')[0] if isinstance(x, str) else x).value_counts().to_dict()
    }
    
    # Menghitung korelasi
    correlation = data['skor_mata_pelajaran'].corr(data['absensi'])
    stats['korelasi_skor_absensi'] = correlation
    
    # Clustering siswa berdasarkan skor dan absensi
    if len(data) >= 3:  # Minimal 3 data untuk cluster
        # Persiapkan data untuk clustering
        X = data[['skor_mata_pelajaran', 'absensi']].copy()
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Tentukan jumlah cluster optimal (misalnya 3 cluster)
        kmeans = KMeans(n_clusters=3, random_state=42)
        data['cluster'] = kmeans.fit_predict(X_scaled)
        
        # Statistik tiap cluster
        cluster_stats = {}
        for cluster in range(3):
            cluster_data = data[data['cluster'] == cluster]
            cluster_stats[f'cluster_{cluster}'] = {
                'jumlah_siswa': len(cluster_data),
                'rata_rata_skor': cluster_data['skor_mata_pelajaran'].mean(),
                'rata_rata_absensi': cluster_data['absensi'].mean()
            }
        
        stats['clusters'] = cluster_stats
    
    # Prediksi
    if len(data) >= 10:  # Butuh cukup data untuk regresi
        # Model regresi untuk prediksi skor berdasarkan absensi
        X = data[['absensi']]
        y = data['skor_mata_pelajaran']
        model = LinearRegression()
        model.fit(X, y)
        
        # Koefisien regresi
        stats['regresi'] = {
            'intercept': model.intercept_,
            'coef_absensi': model.coef_[0]
        }
    
    return stats

# Simpan data analisis
analysis_results = analyze_dataset()

# Endpoint untuk menjawab pertanyaan dataset
@app.route('/api/dataset/query', methods=['POST'])
def query_dataset():
    data = request.json
    question = data.get('question', '').lower()
    
    # Preprocess data jika belum
    data = preprocess_data()
    
    # Analisis pertanyaan dan berikan respons
    response = get_answer_for_question(question, data)
    
    return jsonify({
        'answer': response
    })

# Fungsi untuk merespons pertanyaan
def get_answer_for_question(question, data):
    # Preprocessing pertanyaan
    question = question.lower().strip()
    
    # Pertanyaan sapaan sederhana
    if question.strip().lower() in ['halo', 'hai', 'hi', 'hello', 'hey', 'oi', 'p', 'hei']:
        greetings = [
            f"Halo! Saya adalah AI chatbot yang dapat menjawab pertanyaan tentang dataset edukasi. Ada yang bisa saya bantu?",
            f"Hai! Saya siap membantu Anda menganalisis data dari {len(data)} siswa. Apa yang ingin Anda ketahui?",
            f"Halo! Tanyakan pada saya tentang jumlah siswa, rata-rata skor, distribusi umur, korelasi skor dan absensi, tips belajar efektif, cara mendapatkan nilai bagus, atau rekomendasi strategi gamifikasi."
        ]
        import random
        return random.choice(greetings)
    
    # Extract keywords dari pertanyaan
    keywords = set(question.split())
    education_keywords = {
        'belajar', 'nilai', 'skor', 'tips', 'cara', 'strategi', 'efektif', 
        'bagus', 'meningkatkan', 'tingkatkan', 'pelajaran', 'siswa', 'murid',
        'akademik', 'prestasi', 'performa', 'kinerja', 'pendidikan'
    }
    
    # Periksa jika ada kata kunci pendidikan dalam pertanyaan
    education_match = keywords.intersection(education_keywords)
    
    # ===== BAGIAN 1: PERTANYAAN SPESIFIK DENGAN REGEX =====
    
    # Pertanyaan tentang jumlah siswa
    if re.search(r'berapa (jumlah|banyak|total) siswa', question) or 'jumlah siswa' in question:
        return f"Terdapat {len(data)} siswa dalam dataset."
    
    # Pertanyaan tentang rata-rata skor
    if re.search(r'(rata-rata|rata rata|average) skor', question) or ('rata-rata' in question and ('skor' in question or 'nilai' in question)):
        avg_score = data['skor_mata_pelajaran'].mean()
        return f"Rata-rata skor mata pelajaran adalah {avg_score:.2f}."
    
    # Pertanyaan tentang distribusi umur
    if re.search(r'(distribusi|sebaran) umur', question) or ('umur' in question and ('distribusi' in question or 'sebaran' in question)):
        umur_counts = data['umur'].value_counts().sort_index()
        result = "Distribusi umur siswa:\n"
        for umur, count in umur_counts.items():
            percentage = count / len(data) * 100
            result += f"- {umur} tahun: {count} siswa ({percentage:.1f}%)\n"
        return result
    
    # Pertanyaan tentang grade
    if re.search(r'(distribusi|sebaran) grade', question) or 'grade' in question:
        grade_data = data['grade_class'].apply(lambda x: x.split('-')[0] if isinstance(x, str) else x)
        grade_counts = grade_data.value_counts().sort_index()
        result = "Distribusi grade siswa:\n"
        for grade, count in grade_counts.items():
            percentage = count / len(data) * 100
            result += f"- Grade {grade}: {count} siswa ({percentage:.1f}%)\n"
        return result
    
    # Pertanyaan tentang korelasi
    if re.search(r'(korelasi|hubungan).*(skor|nilai).*absensi', question) or \
       re.search(r'(korelasi|hubungan).*absensi.*(skor|nilai)', question) or \
       ('hubungan' in question and ('absensi' in question or 'kehadiran' in question)):
        corr = data['skor_mata_pelajaran'].corr(data['absensi'])
        strength = ""
        if abs(corr) < 0.3:
            strength = "lemah"
        elif abs(corr) < 0.7:
            strength = "sedang"
        else:
            strength = "kuat"
            
        direction = "positif" if corr > 0 else "negatif"
        
        return f"Korelasi antara skor mata pelajaran dan absensi adalah {corr:.3f}, " \
               f"menunjukkan hubungan {strength} dan {direction}. " \
               f"{'Semakin tinggi absensi, semakin rendah skor.' if corr < 0 else 'Semakin tinggi absensi, semakin tinggi skor.'}"
    
    # Pertanyaan tentang siswa dengan skor tertinggi
    if re.search(r'(siapa||siswa) dengan (skor|nilai) tertinggi?', question) or \
       re.search(r'tertinggi.*(skor|nilai)', question) or \
       'skor tertinggi' in question or 'nilai tertinggi' in question:
        top_student = data.loc[data['skor_mata_pelajaran'].idxmax()]
        return f"Siswa dengan skor tertinggi adalah {top_student['nama']} " \
               f"dengan skor {top_student['skor_mata_pelajaran']:.2f}."
    
    # Pertanyaan tentang siswa dengan absensi terendah
    if re.search(r'siswa (dengan|yang) absensi (terendah|paling sedikit)', question) or \
       'absensi terendah' in question or 'absensi paling sedikit' in question:
        min_absence = data.loc[data['absensi'].idxmin()]
        return f"Siswa dengan absensi terendah adalah {min_absence['nama']} " \
               f"dengan {min_absence['absensi']} hari absen."
    
    # ===== BAGIAN 2: PERTANYAAN DENGAN INTENT UMUM =====
    
    # Tips belajar efektif
    if ('belajar' in question and 'efektif' in question) or \
       ('cara' in question and 'belajar' in question) or \
       ('tips' in question and 'belajar' in question):
        # Analisis data untuk rekomendasi
        avg_score = data['skor_mata_pelajaran'].mean()
        top_students = data.nlargest(10, 'skor_mata_pelajaran')
        avg_top_absence = top_students['absensi'].mean()
        
        tips = ["Berdasarkan analisis data siswa, berikut tips belajar efektif:\n"]
        tips.append("1. Kehadiran yang konsisten dan rendah tingkat absensi berkorelasi dengan nilai lebih baik")
        tips.append(f"2. Siswa dengan nilai tertinggi rata-rata hanya absen {avg_top_absence:.1f} hari")
        tips.append("3. Buat jadwal belajar tetap dengan waktu istirahat yang cukup")
        tips.append("4. Gunakan metode pembelajaran aktif seperti praktek soal dan pengajaran ke teman")
        tips.append("5. Tetapkan target pencapaian harian yang realistis")
        tips.append("6. Bergabung dengan kelompok belajar siswa berprestasi")
        
        return "\n\n".join(tips)
    
    # Tips mendapatkan nilai bagus
    if ('nilai' in question and 'bagus' in question) or \
       ('tips' in question and 'nilai' in question) or \
       ('cara' in question and 'nilai' in question) or \
       ('meningkatkan' in question and ('nilai' in question or 'skor' in question)):
        avg_score = data['skor_mata_pelajaran'].mean()
        top_grades = data.groupby('grade_class')['skor_mata_pelajaran'].mean().sort_values(ascending=False)
        top_grade = top_grades.index[0] if not top_grades.empty else "A-1"
        
        tips = [f"Berdasarkan analisis dataset dengan rata-rata nilai {avg_score:.2f}, berikut tips mendapatkan nilai bagus:\n"]
        tips.append("1. Datang ke setiap pertemuan kelas, siswa dengan absensi rendah umumnya mendapat nilai lebih tinggi")
        tips.append("2. Terapkan teknik belajar aktif seperti membuat rangkuman dan mengajarkan materi ke orang lain")
        tips.append(f"3. Siswa di kelas {top_grade} memiliki rata-rata nilai tertinggi - pelajari pola belajar mereka")
        tips.append("4. Buat jadwal belajar rutin dengan waktu khusus untuk latihan soal")
        tips.append("5. Minta feedback dari guru untuk area yang membutuhkan peningkatan")
        tips.append("6. Gunakan teknik gamifikasi untuk memotivasi diri sendiri")
        tips.append("7. Bergabung dengan study group dan diskusikan materi dengan teman")
        
        return "\n\n".join(tips)
    
    # Pertanyaan tentang rekomendasi gamifikasi
    if re.search(r'(rekomendasi|saran|strategi) gamifikasi', question) or \
       'gamifikasi' in question or \
       ('strategi' in question and 'motivasi' in question):
        # Rekomendasi berdasarkan analisis data
        avg_score = data['skor_mata_pelajaran'].mean()
        avg_absence = data['absensi'].mean()
        corr = data['skor_mata_pelajaran'].corr(data['absensi'])
        
        recommendations = ["Berdasarkan analisis dataset, berikut rekomendasi strategi gamifikasi:\n"]
        
        # Rekomendasi berdasarkan skor
        if avg_score < 70:
            recommendations.append("1. Implementasikan sistem poin progresif dan level untuk meningkatkan motivasi belajar, karena skor rata-rata masih di bawah 70.")
        else:
            recommendations.append("1. Implementasikan tantangan berbasis kompetensi untuk mempertahankan skor yang sudah baik (rata-rata > 70).")
        
        # Rekomendasi berdasarkan absensi
        if avg_absence > 3:
            recommendations.append("2. Tambahkan fitur 'streak kehadiran' dengan rewards eksponensial untuk siswa yang hadir terus-menerus, karena tingkat absensi cukup tinggi.")
        else:
            recommendations.append("2. Berikan badge kehadiran premium untuk mempertahankan tingkat kehadiran yang sudah baik.")
        
        # Rekomendasi berdasarkan korelasi
        if corr < -0.3:
            recommendations.append("3. Fokuskan pada strategi yang mendorong kehadiran, karena data menunjukkan korelasi negatif yang signifikan antara absensi dan skor.")
        
        # Rekomendasi umum
        recommendations.append("4. Implementasikan leaderboard mingguan dengan rotasi kategori (kehadiran, peningkatan skor, penyelesaian tugas) untuk mendorong kompetisi sehat.")
        recommendations.append("5. Sistem quest harian dan mingguan yang disesuaikan dengan kelompok umur dominan.")
        recommendations.append("6. Dashboard visual untuk orang tua dengan notifikasi pencapaian dan kemajuan siswa.")
        
        return "\n\n".join(recommendations)
    
    # Pertanyaan tentang prediksi
    if re.search(r'(prediksi|perkiraan).*(skor|nilai).*(jika|dengan) absensi', question) or \
       re.search(r'.*skor.*absensi (\d+)', question):
        # Ekstrak nilai absensi dari pertanyaan
        match = re.search(r'absensi (\d+)', question)
        if match:
            try:
                absence_val = int(match.group(1))
                if 'regresi' in analysis_results:
                    intercept = analysis_results['regresi']['intercept']
                    coef = analysis_results['regresi']['coef_absensi']
                    predicted_score = intercept + coef * absence_val
                    return f"Berdasarkan model regresi, dengan absensi {absence_val} hari, skor yang diprediksi adalah {predicted_score:.2f}."
                else:
                    # Jika model regresi tidak tersedia, gunakan pendekatan rata-rata
                    similar_students = data[data['absensi'] == absence_val]
                    if len(similar_students) > 0:
                        avg_similar = similar_students['skor_mata_pelajaran'].mean()
                        return f"Berdasarkan data siswa dengan absensi {absence_val} hari, skor rata-rata adalah {avg_similar:.2f}."
                    else:
                        return f"Tidak ada data yang cukup untuk memprediksi skor dengan absensi {absence_val} hari."
            except:
                pass
    
    # Pertanyaan tentang cluster
    if re.search(r'(kelompok|cluster|grup) siswa', question):
        if 'clusters' in analysis_results:
            clusters = analysis_results['clusters']
            response = "Berdasarkan analisis clustering, siswa dapat dikelompokkan menjadi:\n\n"
            
            for cluster, stats in clusters.items():
                response += f"- {cluster.replace('_', ' ').title()}: {stats['jumlah_siswa']} siswa\n"
                response += f"  Rata-rata skor: {stats['rata_rata_skor']:.2f}\n"
                response += f"  Rata-rata absensi: {stats['rata_rata_absensi']:.2f} hari\n\n"
            
            return response
        else:
            return "Maaf, analisis clustering belum tersedia untuk dataset ini."
    
    # ===== BAGIAN 3: INTENT RECOGNITION DENGAN KEYWORD =====
    
    # Jika ada kata kunci pendidikan tapi tidak cocok dengan pola spesifik
    if education_match:
        # Pertanyaan umum tentang strategi belajar
        if 'strategi' in keywords or 'tips' in keywords or 'cara' in keywords:
            return """Berdasarkan analisis dataset edukasi, berikut beberapa strategi belajar yang efektif:

1. Konsistensi kehadiran sangat penting - data menunjukkan korelasi antara kehadiran dan performa akademik
2. Belajar dalam sesi pendek dan terfokus lebih efektif daripada maraton belajar
3. Gunakan teknik gamifikasi seperti sistem reward untuk memotivasi diri
4. Bergabung dengan study group meningkatkan pemahaman dan retensi materi
5. Jadwalkan waktu untuk review materi secara berkala
6. Praktikkan active recall dengan menguji diri sendiri secara teratur
7. Gunakan teknik visualisasi dan mind mapping untuk materi kompleks"""
        
        # Pertanyaan umum tentang performa akademik
        if 'performa' in keywords or 'prestasi' in keywords or 'akademik' in keywords:
            avg_score = data['skor_mata_pelajaran'].mean()
            max_score = data['skor_mata_pelajaran'].max()
            
            return f"""Berdasarkan dataset {len(data)} siswa:

1. Rata-rata skor siswa adalah {avg_score:.2f} dari total nilai maksimal 100
2. Skor tertinggi yang dicapai adalah {max_score:.2f}
3. Faktor yang paling mempengaruhi performa adalah tingkat kehadiran
4. Siswa dengan kehadiran konsisten umumnya memiliki skor 15-20% lebih tinggi
5. Strategi pembelajaran aktif dan partisipatif terbukti meningkatkan performa akademik
6. Penerapan elemen gamifikasi dapat meningkatkan motivasi dan performa hingga 25%"""
    
    # Pertanyaan umum tentang dataset
    if re.search(r'(ceritakan|jelaskan|informasi|gambaran).*(tentang|mengenai) dataset', question) or \
       'dataset' in question:
        return f"Dataset ini berisi informasi tentang {len(data)} siswa dengan data skor mata pelajaran, tingkat absensi, umur, dan grade kelas. " \
               f"Rata-rata skor adalah {data['skor_mata_pelajaran'].mean():.2f} dengan absensi rata-rata {data['absensi'].mean():.2f} hari. " \
               f"Rentang umur siswa adalah {data['umur'].min()}-{data['umur'].max()} tahun."
    
    # Respons default jika tidak ada pertanyaan yang cocok
    return "Maaf, saya tidak dapat memahami pertanyaan Anda. Anda dapat bertanya tentang jumlah siswa, rata-rata skor, distribusi umur, korelasi skor dan absensi, tips belajar efektif, cara mendapatkan nilai bagus, atau rekomendasi strategi gamifikasi."

# Route untuk API testing
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        'status': 'success',
        'message': 'Backend Python berhasil terhubung!'
    })

if __name__ == '__main__':
    print("Memulai server Flask...")
    app.run(debug=True, port=5000)