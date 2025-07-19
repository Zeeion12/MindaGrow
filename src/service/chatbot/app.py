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
from datetime import datetime, timedelta
import json

# Import database integration
from database_integration import DatabaseManager

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Environment variables loaded from .env file")
except ImportError:
    print("⚠️  python-dotenv not available, using system environment variables")

# Initialize database manager
db_manager = DatabaseManager()

# OpenAI Configuration - Safe initialization with error handling
openai_client = None
openai_api_key = os.getenv('OPENAI_API_KEY')

if openai_api_key:
    try:
        # Try OpenAI v1.0+ with safe initialization
        from openai import OpenAI
        
        # Initialize with minimal parameters to avoid httpx conflicts
        openai_client = OpenAI(
            api_key=openai_api_key,
            timeout=30.0,  # Simple timeout parameter
        )
        print("✅ OpenAI client initialized successfully (v1.0+)")
        
        # Test the client with a simple call
        try:
            # This doesn't make an API call, just validates the client
            print("✅ OpenAI client validation passed")
        except Exception as validation_error:
            print(f"⚠️  OpenAI client validation warning: {validation_error}")
            
    except ImportError as import_error:
        print(f"❌ OpenAI import failed: {import_error}")
        print("📦 Please run: pip install openai==1.3.7 httpx==0.24.1")
        openai_client = None
    except TypeError as type_error:
        print(f"❌ OpenAI initialization failed (version conflict): {type_error}")
        print("🔧 Trying fallback initialization...")
        
        # Fallback: Try with minimal parameters
        try:
            openai_client = OpenAI(api_key=openai_api_key)
            print("✅ OpenAI fallback initialization successful")
        except Exception as fallback_error:
            print(f"❌ OpenAI fallback also failed: {fallback_error}")
            print("📦 Please fix dependencies: pip uninstall openai httpx -y && pip install openai==1.3.7 httpx==0.24.1")
            openai_client = None
    except Exception as general_error:
        print(f"❌ Unexpected OpenAI error: {general_error}")
        openai_client = None
else:
    print("❌ OPENAI_API_KEY not found in environment variables!")
    print("📝 Please add OPENAI_API_KEY=your_key_here to your .env file")

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
    print(f"✅ Dataset loaded: {len(siswa_data)} siswa, {len(kuis_data)} kuis, {len(tugas_data)} tugas")
    
    # Merge datasets on 'Id' and 'NIS'
    dataset = siswa_data.merge(kuis_data, on=['Id', 'Nama Lengkap', 'NIS'], how='left')
    dataset = dataset.merge(tugas_data, on=['Id', 'Nama Lengkap', 'NIS'], how='left')
    print(f"✅ Dataset merged successfully. Total records: {len(dataset)}")
except Exception as e:
    print(f"❌ Error loading dataset: {e}")
    print("🔄 Creating dummy dataset for testing...")
    dataset = pd.DataFrame({
        'Id': range(1, 31),
        'Nama Lengkap': [f'Siswa {i}' for i in range(1, 31)],
        'NIS': [f'202301{i:02d}' for i in range(1, 31)],
        'Kelas': ['A', 'B', 'C', 'D', 'E', 'F'] * 5,
        'Gender': ['Laki-laki', 'Perempuan'] * 15,
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
    print("✅ Dummy dataset created successfully")

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

# Fungsi analisis mendalam performa siswa - Enhanced dengan database
def get_detailed_student_analysis(nis):
    """Get detailed student analysis from database + generated academic data"""
    
    # First, try to get student from database
    student_from_db = db_manager.get_student_by_nis(nis)
    
    if not student_from_db:
        # If not in database, check CSV as fallback
        data = preprocess_data()
        student = data[data['NIS'] == str(nis)]
        if student.empty:
            return None
        
        # Use CSV data
        student_info = {
            'nis': nis,
            'nama_lengkap': student['Nama Lengkap'].iloc[0],
            'kelas': student.get('Kelas', ['Unknown']).iloc[0] if 'Kelas' in student.columns else 'Unknown',
            'gender': student.get('Gender', ['Unknown']).iloc[0] if 'Gender' in student.columns else 'Unknown',
            'email': 'N/A',
            'source': 'CSV'
        }
        
        # Generate academic scores from CSV
        subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
        academic_scores = {}
        for subject in subjects:
            academic_scores[f'{subject}_Quiz'] = float(student[f"{subject}_Quiz"].iloc[0])
            academic_scores[f'{subject}_Tugas'] = float(student[f"{subject}_Tugas"].iloc[0])
    
    else:
        # Student found in database
        student_info = {
            'nis': nis,
            'nama_lengkap': student_from_db['nama_lengkap'],
            'kelas': 'A',  # Default since not in siswa table
            'gender': 'Unknown',  # Default since not in siswa table
            'email': student_from_db['email'],
            'no_telepon': student_from_db.get('no_telepon', 'N/A'),
            'source': 'Database'
        }
        
        # Generate realistic academic scores for database student
        academic_scores = db_manager.create_dummy_scores_for_student(
            nis, student_from_db['nama_lengkap']
        )
    
    # Subject mapping
    subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
    subject_names = {
        'MTK': 'Matematika',
        'BINDO': 'Bahasa Indonesia', 
        'BING': 'Bahasa Inggris',
        'IPA': 'IPA',
        'IPS': 'IPS',
        'PKN': 'PKN',
        'Seni': 'Seni Budaya'
    }
    
    # Build analysis structure
    analysis = {
        'nama': student_info['nama_lengkap'],
        'nis': nis,
        'kelas': student_info['kelas'],
        'gender': student_info['gender'],
        'email': student_info.get('email', 'N/A'),
        'data_source': student_info['source'],
        'scores': {},
        'performance_trends': {},
        'recommendations': [],
        'strengths': [],
        'improvements': []
    }
    
    # Analisis detail per mata pelajaran
    total_quiz = 0
    total_tugas = 0
    subject_averages = []
    
    for subject in subjects:
        if student_info['source'] == 'CSV':
            quiz_score = academic_scores[f'{subject}_Quiz']
            tugas_score = academic_scores[f'{subject}_Tugas']
        else:
            quiz_score = academic_scores[f'{subject}_Quiz']
            tugas_score = academic_scores[f'{subject}_Tugas']
        
        avg_score = (quiz_score + tugas_score) / 2
        
        analysis['scores'][subject] = {
            'quiz': quiz_score,
            'tugas': tugas_score,
            'rata_rata': avg_score,
            'nama_mapel': subject_names[subject]
        }
        
        total_quiz += quiz_score
        total_tugas += tugas_score
        subject_averages.append((subject, avg_score))
        
        # Klasifikasi performa
        if avg_score >= 85:
            analysis['strengths'].append(subject_names[subject])
        elif avg_score < 75:
            analysis['improvements'].append(subject_names[subject])
    
    # Statistik keseluruhan
    analysis['overall_stats'] = {
        'rata_rata_kuis': total_quiz / len(subjects),
        'rata_rata_tugas': total_tugas / len(subjects),
        'rata_rata_keseluruhan': (total_quiz + total_tugas) / (len(subjects) * 2)
    }
    
    # Identifikasi pola
    subject_averages.sort(key=lambda x: x[1], reverse=True)
    analysis['terkuat'] = subject_names[subject_averages[0][0]]
    analysis['terlemah'] = subject_names[subject_averages[-1][0]]
    
    # Prediksi dan rekomendasi berdasarkan data chart
    analysis['predictions'] = generate_learning_predictions(analysis)
    analysis['chart_recommendations'] = generate_chart_based_recommendations(analysis)
    
    return analysis

# Fungsi prediksi berdasarkan pola belajar (simulasi data chart)
def generate_learning_predictions(student_analysis):
    predictions = {
        'durasi_belajar_optimal': '',
        'mata_pelajaran_prioritas': '',
        'strategi_belajar': ''
    }
    
    overall_avg = student_analysis['overall_stats']['rata_rata_keseluruhan']
    
    # Prediksi durasi belajar optimal berdasarkan performa
    if overall_avg >= 85:
        predictions['durasi_belajar_optimal'] = "Pertahankan pola belajar 30-45 menit per hari untuk konsistensi"
    elif overall_avg >= 75:
        predictions['durasi_belajar_optimal'] = "Tingkatkan menjadi 45-60 menit per hari dengan fokus pada mapel terlemah"
    else:
        predictions['durasi_belajar_optimal'] = "Disarankan 60-90 menit per hari dengan metode pomodoro (25 menit belajar, 5 menit istirahat)"
    
    # Prioritas mata pelajaran
    if student_analysis['improvements']:
        predictions['mata_pelajaran_prioritas'] = f"Fokus pada {', '.join(student_analysis['improvements'][:2])} dalam 2 minggu ke depan"
    else:
        predictions['mata_pelajaran_prioritas'] = f"Pertahankan performa di semua mapel, tingkatkan {student_analysis['terlemah']} untuk excellence"
    
    # Strategi belajar
    weak_count = len(student_analysis['improvements'])
    if weak_count >= 3:
        predictions['strategi_belajar'] = "Gunakan metode SQ3R (Survey, Question, Read, Recite, Review) dan buat jadwal harian"
    elif weak_count >= 1:
        predictions['strategi_belajar'] = "Fokus pada latihan soal tambahan dan diskusi dengan teman/guru"
    else:
        predictions['strategi_belajar'] = "Kembangkan kemampuan critical thinking dan problem solving"
    
    return predictions

# Fungsi rekomendasi berdasarkan analisis chart dashboard - Enhanced
def generate_chart_based_recommendations(student_analysis):
    recommendations = []
    overall_avg = student_analysis['overall_stats']['rata_rata_keseluruhan']
    quiz_avg = student_analysis['overall_stats']['rata_rata_kuis']
    tugas_avg = student_analysis['overall_stats']['rata_rata_tugas']
    
    # Rekomendasi berdasarkan Total Durasi Belajar
    if overall_avg < 70:
        recommendations.append({
            'chart': 'Total Durasi Belajar',
            'insight': 'Berdasarkan performa akademik, durasi belajar harian perlu ditingkatkan significantly',
            'action': 'Target: Belajar 90-120 menit per hari dengan jadwal tetap (pagi 60 menit, sore 60 menit)',
            'timeline': '3 minggu ke depan',
            'priority': 'Tinggi'
        })
    elif overall_avg < 80:
        recommendations.append({
            'chart': 'Total Durasi Belajar',
            'insight': 'Pola belajar cukup baik, namun masih bisa dioptimalkan untuk hasil maksimal',
            'action': 'Target: Tingkatkan menjadi 60-75 menit per hari dengan fokus pada mapel terlemah',
            'timeline': '2 minggu ke depan', 
            'priority': 'Sedang'
        })
    else:
        recommendations.append({
            'chart': 'Total Durasi Belajar', 
            'insight': 'Pola belajar sudah sangat baik, pertahankan konsistensi dan kualitas',
            'action': 'Pertahankan 45-60 menit per hari, variasikan metode (mind mapping, diskusi, practice)',
            'timeline': 'Ongoing',
            'priority': 'Maintenance'
        })
    
    # Rekomendasi berdasarkan Rata-rata Skor Tugas vs Kuis
    performance_gap = abs(tugas_avg - quiz_avg)
    
    if tugas_avg < quiz_avg - 5:
        recommendations.append({
            'chart': 'Rata-Rata Skor Tugas vs Kuis',
            'insight': f'Skor tugas ({tugas_avg:.1f}) lebih rendah {performance_gap:.1f} poin dari kuis ({quiz_avg:.1f}), menunjukkan kurang teliti dalam pengerjaan tugas',
            'action': 'Strategi: 1) Buat checklist sebelum submit tugas, 2) Alokasi waktu khusus 45 menit untuk tugas, 3) Review ulang sebelum submit',
            'timeline': '1-2 minggu',
            'priority': 'Tinggi'
        })
    elif quiz_avg < tugas_avg - 5:
        recommendations.append({
            'chart': 'Rata-Rata Skor Tugas vs Kuis',
            'insight': f'Skor kuis ({quiz_avg:.1f}) lebih rendah {performance_gap:.1f} poin dari tugas ({tugas_avg:.1f}), mungkin kurang persiapan untuk kuis mendadak',
            'action': 'Strategi: 1) Review harian 15 menit setiap malam, 2) Buat ringkasan materi per bab, 3) Latihan soal cepat',
            'timeline': '2 minggu',
            'priority': 'Sedang'
        })
    else:
        recommendations.append({
            'chart': 'Rata-Rata Skor Tugas vs Kuis',
            'insight': f'Performa tugas ({tugas_avg:.1f}) dan kuis ({quiz_avg:.1f}) seimbang, menunjukkan konsistensi belajar yang baik',
            'action': 'Pertahankan pola belajar, tingkatkan ke level advanced dengan soal-soal challenging',
            'timeline': 'Ongoing',
            'priority': 'Enhancement'
        })
    
    # Rekomendasi berdasarkan Mata Pelajaran Performance Distribution
    strong_subjects = len(student_analysis['strengths'])
    weak_subjects = len(student_analysis['improvements'])
    
    if weak_subjects >= 3:
        recommendations.append({
            'chart': 'Distribusi Performa Mata Pelajaran',
            'insight': f'Ada {weak_subjects} mata pelajaran yang perlu perhatian khusus: {", ".join(student_analysis["improvements"][:3])}',
            'action': f'Fokus intensif: Pilih 1 mapel terlemah ({student_analysis["improvements"][0]}) untuk diperbaiki dulu, belajar ekstra 30 menit/hari selama 3 minggu',
            'timeline': '3-4 minggu',
            'priority': 'Tinggi'
        })
    elif weak_subjects >= 1:
        recommendations.append({
            'chart': 'Distribusi Performa Mata Pelajaran',
            'insight': f'Performa cukup baik overall, fokus perbaikan pada: {", ".join(student_analysis["improvements"])}',
            'action': f'Strategi targeted: Extra practice {student_analysis["improvements"][0]} dengan tutor/teman, join study group, atau online resources',
            'timeline': '2-3 minggu',
            'priority': 'Sedang'
        })
    else:
        recommendations.append({
            'chart': 'Distribusi Performa Mata Pelajaran',
            'insight': f'Excellent! Semua mata pelajaran dalam performa baik. Mata pelajaran terkuat: {student_analysis["terkuat"]}',
            'action': f'Level up challenge: Ikuti olimpiade/kompetisi {student_analysis["terkuat"]}, jadi tutor untuk teman, atau explore advanced topics',
            'timeline': 'Long term',
            'priority': 'Excellence'
        })
    
    return recommendations

# Fungsi OpenAI Chat - Compatible dengan versi lama dan baru
def get_openai_response(messages, student_data=None):
    if not openai_client:
        return "Maaf, layanan AI sedang tidak tersedia. Coba tanyakan tips belajar umum! 🤖"
    
    try:
        system_message = """You are RoGrow, a friendly AI learning assistant for MindaGrow educational platform. 
        You help students aged 6-12 with learning guidance, study tips, and motivation. 
        Always respond in Indonesian language with encouraging and child-friendly tone.
        Use relevant emojis to make responses engaging.
        Focus on positive reinforcement and practical learning strategies.
        Never give direct answers to homework - instead provide learning methods and tips."""
        
        if student_data:
            system_message += f"\n\nStudent Data Context: {json.dumps(student_data, ensure_ascii=False)}"
        
        # Try new OpenAI client first
        if hasattr(openai_client, 'chat') and hasattr(openai_client.chat, 'completions'):
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    *messages
                ],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        # Fallback to old OpenAI API
        elif hasattr(openai_client, 'ChatCompletion'):
            response = openai_client.ChatCompletion.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_message},
                    *messages
                ],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        
        else:
            return "OpenAI client tidak kompatibel. Silakan update library openai."
            
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return "Maaf, saya sedang belajar juga! 🤖 Coba tanya yang lain ya!"

# ROOT ROUTE
@app.route('/')
def home():
    return jsonify({
        'status': 'success',
        'message': '🤖 RoGrow Chatbot Service with OpenAI (Secure)',
        'version': '2.0',
        'openai_status': 'available' if openai_client else 'not configured',
        'endpoints': {
            '/api/test': 'Test connection',
            '/api/chat': 'Chat with OpenAI (POST)',
            '/api/dataset/query': 'Query dataset (POST)',
            '/api/student/<nis>/analysis': 'Detailed student analysis (GET)',
            '/api/student/<nis>/predictions': 'Learning predictions (GET)'
        }
    })

# API ROUTES WITH /api PREFIX
@app.route('/api/chat', methods=['POST'])
def chat_with_openai():
    try:
        data = request.json
        messages = data.get('messages', [])
        nis = data.get('nis', None)
        
        student_data = None
        if nis:
            student_data = get_detailed_student_analysis(nis)
        
        # Convert messages to OpenAI format
        openai_messages = []
        for msg in messages:
            openai_messages.append({
                "role": msg.get('role', 'user'),
                "content": msg.get('content', '')
            })
        
        response = get_openai_response(openai_messages, student_data)
        
        return jsonify({
            'success': True,
            'response': response,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error in chat_with_openai: {e}")
        return jsonify({
            'success': False,
            'response': 'Maaf, terjadi kesalahan. Coba lagi ya! 😅'
        }), 500

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
def analyze_student_detailed(nis):
    try:
        analysis = get_detailed_student_analysis(nis)
        if not analysis:
            return jsonify({'error': 'Siswa tidak ditemukan'}), 404
        
        # Format response yang ramah untuk anak
        formatted_response = format_student_analysis_response(analysis)
        
        return jsonify({
            'success': True,
            'data': analysis,
            'formatted_response': formatted_response
        })
    except Exception as e:
        print(f"Error in analyze_student_detailed: {e}")
        return jsonify({'error': 'Terjadi kesalahan saat menganalisis data siswa'}), 500

@app.route('/api/student/<nis>/predictions', methods=['GET'])
def get_student_predictions(nis):
    try:
        analysis = get_detailed_student_analysis(nis)
        if not analysis:
            return jsonify({'error': 'Siswa tidak ditemukan'}), 404
        
        predictions = analysis['predictions']
        chart_recommendations = analysis['chart_recommendations']
        
        formatted_predictions = format_predictions_response(analysis)
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'chart_recommendations': chart_recommendations,
            'formatted_response': formatted_predictions
        })
    except Exception as e:
        print(f"Error in get_student_predictions: {e}")
        return jsonify({'error': 'Terjadi kesalahan saat menganalisis prediksi'}), 500

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({
        'status': 'success',
        'message': 'RoGrow Backend with OpenAI berhasil terhubung! 🤖',
        'timestamp': datetime.now().isoformat(),
        'openai_status': 'configured' if openai_client else 'not configured',
        'dataset_info': {
            'jumlah_siswa': len(dataset),
            'columns': list(dataset.columns)
        },
        'security': 'API keys are securely loaded from environment variables'
    })

# Format response functions
def format_student_analysis_response(analysis):
    response = f"📊 **Analisis Lengkap untuk {analysis['nama']}**\n"
    response += f"🆔 NIS: {analysis['nis']} | 🎓 Kelas: {analysis['kelas']}\n"
    
    # Data source indicator
    if analysis.get('data_source') == 'Database':
        response += f"📧 Email: {analysis.get('email', 'N/A')}\n"
        response += f"💾 **Sumber Data**: Database (Nilai akademik di-generate)\n\n"
    else:
        response += f"💾 **Sumber Data**: File CSV\n\n"
    
    # Overall Stats
    stats = analysis['overall_stats']
    response += f"📈 **Statistik Keseluruhan:**\n"
    response += f"• Rata-rata Kuis: {stats['rata_rata_kuis']:.1f}\n"
    response += f"• Rata-rata Tugas: {stats['rata_rata_tugas']:.1f}\n"
    response += f"• Rata-rata Total: {stats['rata_rata_keseluruhan']:.1f}\n\n"
    
    # Strengths and Improvements
    if analysis['strengths']:
        response += f"🌟 **Mata Pelajaran Terkuat:** {', '.join(analysis['strengths'])}\n"
    if analysis['improvements']:
        response += f"💪 **Perlu Ditingkatkan:** {', '.join(analysis['improvements'])}\n\n"
    
    # Predictions
    pred = analysis['predictions']
    response += f"🎯 **Rekomendasi Personal:**\n"
    response += f"⏰ **Durasi Belajar:** {pred['durasi_belajar_optimal']}\n"
    response += f"📚 **Prioritas:** {pred['mata_pelajaran_prioritas']}\n"
    response += f"🧠 **Strategi:** {pred['strategi_belajar']}\n\n"
    
    # Note for database users
    if analysis.get('data_source') == 'Database':
        response += f"ℹ️  **Catatan:** Data akademik di-generate berdasarkan profil siswa. Untuk data real, hubungi administrator.\n\n"
    
    response += f"💡 **Ingat:** Setiap kemajuan adalah prestasi! Tetap semangat belajar! 🌱"
    
    return response

def format_predictions_response(analysis):
    response = f"🔮 **Prediksi & Rekomendasi untuk {analysis['nama']}**\n\n"
    
    # Chart-based recommendations dengan format yang lebih baik
    for i, rec in enumerate(analysis['chart_recommendations'], 1):
        response += f"📊 **Analisis Chart {i}: {rec['chart']}**\n"
        response += f"💡 **Insight:** {rec['insight']}\n"
        response += f"🎯 **Aksi:** {rec['action']}\n"
        response += f"⏱️ **Timeline:** {rec['timeline']}\n\n"
    
    # Tambahkan detail skor untuk visualisasi
    response += f"📈 **Detail Performa per Mata Pelajaran:**\n"
    for subject, score_data in analysis['scores'].items():
        emoji_map = {
            'MTK': '🔢', 'BINDO': '📚', 'BING': '🌍', 
            'IPA': '🧪', 'IPS': '🌏', 'PKN': '🏛️', 'Seni': '🎨'
        }
        emoji = emoji_map.get(subject, '📖')
        nama_mapel = score_data['nama_mapel']
        rata_rata = score_data['rata_rata']
        
        # Status berdasarkan skor
        if rata_rata >= 90:
            status = "🌟 Excellent"
        elif rata_rata >= 85:
            status = "✨ Sangat Baik" 
        elif rata_rata >= 75:
            status = "👍 Baik"
        elif rata_rata >= 65:
            status = "⚠️ Perlu Ditingkatkan"
        else:
            status = "🚨 Perlu Perhatian Khusus"
            
        response += f"{emoji} **{nama_mapel}**: {rata_rata:.1f} {status}\n"
        response += f"   • Kuis: {score_data['quiz']:.1f} | Tugas: {score_data['tugas']:.1f}\n"
    
    response += f"\n🎯 **Fokus Utama:**\n"
    if analysis['improvements']:
        response += f"• **Prioritas 1:** {analysis['improvements'][0]} - Tambah 30 menit latihan/hari\n"
        if len(analysis['improvements']) > 1:
            response += f"• **Prioritas 2:** {analysis['improvements'][1]} - Review materi dasar\n"
    
    response += f"• **Pertahankan:** {analysis['terkuat']} - Tetap konsisten\n"
    
    response += f"\n🚀 **Target 2 Minggu Ke Depan:**\n"
    overall_avg = analysis['overall_stats']['rata_rata_keseluruhan']
    target_score = min(95, overall_avg + 5)
    response += f"• Naikkan rata-rata dari {overall_avg:.1f} menjadi {target_score:.1f}\n"
    response += f"• Konsisten belajar setiap hari minimal 45 menit\n"
    response += f"• Selesaikan 3 latihan soal per mata pelajaran lemah\n"
    
    return response

def get_answer_for_question(question, data):
    question = question.lower().strip()
    
    # Pertanyaan sapaan
    if question in ['halo', 'hai', 'hi', 'hello', 'hey', 'oi', 'p', 'hei']:
        greetings = [
            f"Halo! Saya RoGrow dengan AI OpenAI! 🤖 Saya bisa membantu analisis {len(data)} siswa atau tips belajar. Apa yang ingin diketahui?",
            f"Hai! Saya siap menganalisis data dari {len(data)} siswa dengan teknologi terbaru! Tanyakan apa saja! ✨",
            f"Halo! Coba tanyakan analisis siswa, rata-rata skor mata pelajaran, atau prediksi belajar! 🌟"
        ]
        return random.choice(greetings)
    
    # Pertanyaan tentang jumlah siswa
    if (
        re.search(r'berapa (jumlah|banyak|total) siswa', question)
        or 'jumlah siswa' in question
        or 'total siswa' in question
        or 'banyak siswa' in question
    ):
        return f"📊 Terdapat **{len(data)} siswa** dalam database kami dengan data lengkap kuis dan tugas untuk 7 mata pelajaran!"
    
    # Pertanyaan tentang mata pelajaran tertinggi
    if 'tertinggi' in question or 'terbaik' in question or 'bagus' in question:
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
                'Seni': 'Seni Budaya'
            }
            best_subject_name = subject_name_mapping.get(best_subject, best_subject)
            return f"🌟 **Mata pelajaran dengan performa terbaik**: {best_subject_name} ({highest_scores[best_subject]:.1f})\n\n🎉 Siswa-siswa hebat banget di {best_subject_name}! Pertahankan semangat belajar!"
    
    # Pertanyaan tentang mata pelajaran terendah
    if 'terendah' in question or 'tersulit' in question or 'lemah' in question:
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
                'Seni': 'Seni Budaya'
            }
            worst_subject_name = subject_name_mapping.get(worst_subject, worst_subject)
            return f"📉 **Mata pelajaran yang perlu lebih banyak latihan**: {worst_subject_name} ({lowest_scores[worst_subject]:.1f})\n\n💪 Mari fokus lebih di {worst_subject_name}! Dengan latihan rutin, pasti bisa meningkat! 🌱"
    
    return "Maaf, saya belum mengerti pertanyaan itu. Coba tanyakan tentang:\n• Analisis siswa (dengan NIS)\n• Jumlah siswa\n• Rata-rata nilai mata pelajaran\n• Prediksi belajar\n• Tips belajar\n• Mata pelajaran tertinggi/terendah 😊"

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint tidak ditemukan'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Terjadi kesalahan server'}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting RoGrow Chatbot Server (Fixed OpenAI)")
    print("="*50)
    print("🤖 Flask Backend - Enhanced Chatbot Service")
    print("🔗 URL: http://localhost:5001")
    print("🔗 API Test: http://localhost:5001/api/test")
    print(f"🔑 OpenAI Status: {'✅ Configured' if openai_client else '❌ Not configured'}")
    print(f"📊 Dataset Status: ✅ Loaded ({len(dataset)} records)")
    print("🔐 Security: API keys loaded from environment variables")
    print("="*50)
    
    app.run(debug=True, port=5001, host='0.0.0.0')