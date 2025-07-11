# src/service/chatbot/database_integration.py

import os
import psycopg2
import pandas as pd
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'mindagrow'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'manut123'),
                port=os.getenv('DB_PORT', '5432')
            )
            print("✅ Database connection established")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            self.connection = None
    
    def get_student_by_nis(self, nis):
        """Get student data by NIS from database"""
        if not self.connection:
            return None
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                SELECT s.nis, s.nama_lengkap, s.no_telepon, s.nik_orangtua,
                       u.email, u.created_at
                FROM siswa s
                JOIN users u ON s.user_id = u.id
                WHERE s.nis = %s
                """
                cursor.execute(query, (nis,))
                result = cursor.fetchone()
                
                if result:
                    return dict(result)
                return None
        except Exception as e:
            print(f"❌ Error fetching student: {e}")
            return None
    
    def get_all_students(self):
        """Get all students from database"""
        if not self.connection:
            return []
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                query = """
                SELECT s.nis, s.nama_lengkap, s.no_telepon, s.nik_orangtua,
                       u.email, u.created_at
                FROM siswa s
                JOIN users u ON s.user_id = u.id
                ORDER BY s.nis
                """
                cursor.execute(query)
                results = cursor.fetchall()
                
                return [dict(row) for row in results]
        except Exception as e:
            print(f"❌ Error fetching students: {e}")
            return []
    
    def create_dummy_scores_for_student(self, nis, nama_lengkap):
        """Create dummy academic scores for a student"""
        import random
        
        subjects = ['MTK', 'BINDO', 'BING', 'IPA', 'IPS', 'PKN', 'Seni']
        student_scores = {
            'nis': nis,
            'nama_lengkap': nama_lengkap,
            'kelas': 'A',  # Default class
            'gender': 'Unknown'
        }
        
        # Generate random but realistic scores
        for subject in subjects:
            # Generate scores with some correlation (good students tend to be good across subjects)
            base_performance = random.uniform(70, 95)
            quiz_variation = random.uniform(-10, 10)
            tugas_variation = random.uniform(-10, 10)
            
            quiz_score = max(50, min(100, base_performance + quiz_variation))
            tugas_score = max(50, min(100, base_performance + tugas_variation))
            
            student_scores[f'{subject}_Quiz'] = round(quiz_score, 1)
            student_scores[f'{subject}_Tugas'] = round(tugas_score, 1)
        
        return student_scores
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("📌 Database connection closed")