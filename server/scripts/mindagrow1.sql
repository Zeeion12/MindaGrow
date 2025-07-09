--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: attempt_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attempt_type_enum AS ENUM (
    'login',
    '2fa_verify'
);


--
-- Name: sync_admin_delete_to_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_admin_delete_to_users() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          DELETE FROM users 
          WHERE email = OLD.email AND role = 'admin';
          
          RETURN OLD;
      END;
      $$;


--
-- Name: sync_admin_to_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_admin_to_users() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          INSERT INTO users (
              email, 
              password, 
              role,  
              created_at
          ) VALUES (
              NEW.email,
              NEW.password,
              'admin',
              NEW.created_at
          )
          ON CONFLICT (email) DO NOTHING;
          
          RETURN NEW;
      END;
      $$;


--
-- Name: sync_admin_update_to_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_admin_update_to_users() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
          UPDATE users 
          SET 
              email = NEW.email,
              password = NEW.password,
              nama_lengkap = NEW.nama,
              updated_at = NEW.updated_at
          WHERE email = OLD.email AND role = 'admin';
          
          RETURN NEW;
      END;
      $$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    icon text,
    requirements text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    activity_type character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    details jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: admin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin (
    id integer NOT NULL,
    nama character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password text NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_id_seq OWNED BY public.admin.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    icon text,
    description text,
    color character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    certificate_number character varying(100) NOT NULL,
    issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    certificate_url character varying(500)
);


--
-- Name: certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.certificates_id_seq OWNED BY public.certificates.id;


--
-- Name: class_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_members (
    id integer NOT NULL,
    class_id integer NOT NULL,
    user_id integer NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'active'::character varying
);


--
-- Name: class_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.class_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: class_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.class_members_id_seq OWNED BY public.class_members.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    grade character varying(50) NOT NULL,
    teacher_id integer NOT NULL,
    description text,
    schedule character varying(255),
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: course_ratings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_ratings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: course_ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.course_ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: course_ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.course_ratings_id_seq OWNED BY public.course_ratings.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    thumbnail character varying(500),
    price numeric(10,2) DEFAULT 0,
    level character varying(50) DEFAULT 'beginner'::character varying,
    duration integer DEFAULT 60,
    category_id integer,
    instructor_id integer NOT NULL,
    instructor_role character varying(50) DEFAULT 'guru'::character varying,
    created_by integer,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_instructor_role CHECK (((instructor_role)::text = ANY (ARRAY[('guru'::character varying)::text, ('admin'::character varying)::text]))),
    CONSTRAINT chk_level CHECK (((level)::text = ANY (ARRAY[('beginner'::character varying)::text, ('intermediate'::character varying)::text, ('advanced'::character varying)::text]))),
    CONSTRAINT chk_status CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('deleted'::character varying)::text])))
);


--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'active'::character varying,
    completed_at timestamp without time zone,
    CONSTRAINT chk_enrollment_status CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text])))
);


--
-- Name: enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enrollments_id_seq OWNED BY public.enrollments.id;


--
-- Name: guru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guru (
    id integer NOT NULL,
    user_id integer,
    nuptk character varying(50) NOT NULL,
    nama_lengkap character varying(255) NOT NULL,
    no_telepon character varying(20) NOT NULL
);


--
-- Name: guru_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.guru_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: guru_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.guru_id_seq OWNED BY public.guru.id;


--
-- Name: lesson_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    module_id integer NOT NULL,
    lesson_id integer,
    completed boolean DEFAULT false,
    completion_percentage integer DEFAULT 0,
    time_spent integer DEFAULT 0,
    completed_at timestamp without time zone,
    last_accessed timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_completion_percentage CHECK (((completion_percentage >= 0) AND (completion_percentage <= 100)))
);


--
-- Name: lesson_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lesson_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lesson_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lesson_progress_id_seq OWNED BY public.lesson_progress.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    module_id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    video_url character varying(500),
    duration integer DEFAULT 15,
    order_index integer NOT NULL,
    is_free boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    ip_address inet NOT NULL,
    attempt_type public.attempt_type_enum NOT NULL,
    success boolean DEFAULT false,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.login_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.login_attempts_id_seq OWNED BY public.login_attempts.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    duration integer DEFAULT 30,
    order_index integer NOT NULL,
    video_url character varying(500),
    content text,
    is_free boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: orangtua; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orangtua (
    id integer NOT NULL,
    user_id integer,
    nik character varying(50) NOT NULL,
    nama_lengkap character varying(255) NOT NULL,
    no_telepon character varying(20) NOT NULL
);


--
-- Name: orangtua_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orangtua_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orangtua_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orangtua_id_seq OWNED BY public.orangtua.id;


--
-- Name: siswa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.siswa (
    id integer NOT NULL,
    user_id integer,
    nis character varying(50) NOT NULL,
    nama_lengkap character varying(255) NOT NULL,
    nik_orangtua character varying(50) NOT NULL,
    no_telepon character varying(20) NOT NULL
);


--
-- Name: siswa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.siswa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: siswa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.siswa_id_seq OWNED BY public.siswa.id;


--
-- Name: teacher_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teacher_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    bio text,
    expertise text[],
    education text,
    experience text,
    website character varying(255),
    social_media jsonb,
    total_courses integer DEFAULT 0,
    total_students integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0.0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: teacher_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teacher_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teacher_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teacher_profiles_id_seq OWNED BY public.teacher_profiles.id;


--
-- Name: temp_2fa_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temp_2fa_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    temp_token character varying(255) NOT NULL,
    secret character varying(255),
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: temp_2fa_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.temp_2fa_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: temp_2fa_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.temp_2fa_tokens_id_seq OWNED BY public.temp_2fa_tokens.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id integer NOT NULL,
    achievement_id integer NOT NULL,
    achieved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_token character varying(255) NOT NULL,
    refresh_token character varying(255),
    ip_address inet NOT NULL,
    user_agent text,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: user_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_streaks (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_activity_date date,
    streak_start_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_streaks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_streaks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_streaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_streaks_id_seq OWNED BY public.user_streaks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp with time zone,
    profile_picture text,
    is_2fa_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    backup_codes text,
    last_2fa_verify timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('siswa'::character varying)::text, ('guru'::character varying)::text, ('orangtua'::character varying)::text, ('admin'::character varying)::text])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: admin id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin ALTER COLUMN id SET DEFAULT nextval('public.admin_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: certificates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates ALTER COLUMN id SET DEFAULT nextval('public.certificates_id_seq'::regclass);


--
-- Name: class_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members ALTER COLUMN id SET DEFAULT nextval('public.class_members_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: course_ratings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_ratings ALTER COLUMN id SET DEFAULT nextval('public.course_ratings_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: guru id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru ALTER COLUMN id SET DEFAULT nextval('public.guru_id_seq'::regclass);


--
-- Name: lesson_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress ALTER COLUMN id SET DEFAULT nextval('public.lesson_progress_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: login_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts ALTER COLUMN id SET DEFAULT nextval('public.login_attempts_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: orangtua id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orangtua ALTER COLUMN id SET DEFAULT nextval('public.orangtua_id_seq'::regclass);


--
-- Name: siswa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa ALTER COLUMN id SET DEFAULT nextval('public.siswa_id_seq'::regclass);


--
-- Name: teacher_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_profiles ALTER COLUMN id SET DEFAULT nextval('public.teacher_profiles_id_seq'::regclass);


--
-- Name: temp_2fa_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temp_2fa_tokens ALTER COLUMN id SET DEFAULT nextval('public.temp_2fa_tokens_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: user_streaks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks ALTER COLUMN id SET DEFAULT nextval('public.user_streaks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.admin (id, nama, email, password, role, created_at, updated_at) VALUES (3, 'Admin Utama', 'admin@platform.com', '$2b$10$Xfm.yJfMM9uY07efA8Zf9enI7JONqBVh89EtDe34pdhxuJ33SdHWu', 'admin', '2025-06-18 10:14:51.162478', '2025-06-18 10:14:51.162478');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (1, 'Matematika', 'matematika', NULL, 'Kursus-kursus matematika untuk semua tingkatan', '#3498db', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (2, 'Biologi', 'biologi', NULL, 'Pelajari tentang makhluk hidup dan lingkungannya', '#27ae60', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (3, 'Fisika', 'fisika', NULL, 'Memahami hukum-hukum alam dan fenomena fisika', '#f39c12', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (4, 'Kimia', 'kimia', NULL, 'Eksplorasi dunia molekul dan reaksi kimia', '#e74c3c', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (5, 'Ekonomi', 'ekonomi', NULL, 'Belajar tentang pasar, keuangan, dan ekonomi', '#1abc9c', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (6, 'Geografi', 'geografi', NULL, 'Pelajari tentang bumi dan fenomena geografis', '#9b59b6', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (7, 'Sejarah', 'sejarah', NULL, 'Mendalami peristiwa masa lalu dan implikasinya', '#34495e', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (8, 'Bahasa Indonesia', 'bahasa-indonesia', NULL, 'Tingkatkan kemampuan berbahasa Indonesia', '#e67e22', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (9, 'Bahasa Inggris', 'bahasa-inggris', NULL, 'Kuasai bahasa internasional', '#16a085', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (10, 'Mandarin', 'mandarin', NULL, 'Belajar bahasa Mandarin dengan mudah', '#d35400', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');
INSERT INTO public.categories (id, name, slug, icon, description, color, created_at, updated_at) VALUES (11, 'Arab', 'arab', NULL, 'Pahami bahasa Arab dengan metode terbaik', '#2ecc71', '2025-05-10 18:05:18.985229+07', '2025-05-10 18:05:18.985229+07');


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: class_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (1, 1, 2, '2025-07-08 11:29:11.872816+07', 'active');
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (2, 2, 2, '2025-07-08 11:29:11.872816+07', 'active');
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (3, 3, 2, '2025-07-08 11:29:11.872816+07', 'active');
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (4, 1, 1, '2025-07-08 11:29:11.872816+07', 'active');
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (5, 1, 6, '2025-07-08 11:29:11.872816+07', 'active');
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (6, 1, 12, '2025-07-08 11:29:11.872816+07', 'active');


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (1, 'Bahasa Indonesia', 'Kelas E', 14, 'Kelas Bahasa Indonesia untuk semester Ganjil 2024', 'Senin, Rabu, Jumat', 'active', '2025-07-08 11:29:11.872816+07', '2025-07-08 11:29:11.872816+07');
INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (2, 'Matematika', 'Kelas E', 14, 'Kelas Matematika untuk semester Ganjil 2024', 'Selasa, Kamis', 'active', '2025-07-08 11:29:11.872816+07', '2025-07-08 11:29:11.872816+07');
INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (3, 'IPA', 'Kelas E', 14, 'Kelas IPA untuk semester Ganjil 2024', 'Rabu, Jumat', 'active', '2025-07-08 11:29:11.872816+07', '2025-07-08 11:29:11.872816+07');


--
-- Data for Name: course_ratings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.courses (id, title, description, thumbnail, price, level, duration, category_id, instructor_id, instructor_role, created_by, status, created_at, updated_at) VALUES (2, 'Verb', '00', 'uploads/courses/1750997984650-553835166.jpeg', 0.00, 'beginner', 60, 9, 13, 'guru', 13, 'active', '2025-06-27 11:19:44.698268', '2025-06-27 11:19:44.698268');
INSERT INTO public.courses (id, title, description, thumbnail, price, level, duration, category_id, instructor_id, instructor_role, created_by, status, created_at, updated_at) VALUES (4, 'Bahasa Indonesia Lanjutan', 'Kursus ini dibuat untuk testing', 'uploads/courses/1751080839823-499020885.jpeg', 75000.00, 'advanced', 240, 8, 13, 'guru', 10, 'active', '2025-06-28 10:20:39.866916', '2025-06-28 10:20:39.866916');
INSERT INTO public.courses (id, title, description, thumbnail, price, level, duration, category_id, instructor_id, instructor_role, created_by, status, created_at, updated_at) VALUES (5, 'Bahasa Arab untuk Pemula', 'Kursus ini dibuat untuk testing', 'uploads/courses/1751081307870-259113979.webp', 0.00, 'beginner', 60, 11, 13, 'guru', 10, 'active', '2025-06-28 10:28:27.917121', '2025-06-28 10:28:27.917121');


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: guru; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.guru (id, user_id, nuptk, nama_lengkap, no_telepon) VALUES (1, 5, '23786543', 'Rosmaniah S.Pd', '8946346');
INSERT INTO public.guru (id, user_id, nuptk, nama_lengkap, no_telepon) VALUES (2, 13, '2312356', 'Budi Cahyono S.Kom, M.Kom,', '085321789553');
INSERT INTO public.guru (id, user_id, nuptk, nama_lengkap, no_telepon) VALUES (3, 14, '0012345678', 'Dr. Siti Aminah, M.Pd.', '0895322535389');


--
-- Data for Name: lesson_progress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (1, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 00:48:31.183068');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (2, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 00:55:53.984072');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (3, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 00:56:54.608912');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (4, 'dimasrizky822@gmail.com', '::1', 'login', false, 'Invalid password', '2025-06-20 01:09:50.968446');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (5, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:10:29.420768');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (6, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:11:15.191529');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (7, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:24:34.3591');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (8, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:25:30.714054');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (9, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:25:40.350428');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (10, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:27:32.919016');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (11, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:28:06.577372');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (12, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:28:15.974403');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (13, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:29:22.37486');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (14, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:29:37.198368');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (15, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:31:17.27871');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (16, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:31:28.932547');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (17, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:32:06.57215');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (18, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:39:25.472414');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (19, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-20 01:39:30.826595');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (20, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-20 01:39:33.849584');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (21, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-20 01:39:35.296693');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (22, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-20 01:39:37.572031');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (23, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:39:42.416143');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (24, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:41:01.669066');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (25, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:41:06.038271');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (26, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:43:53.651879');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (27, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 01:44:01.299314');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (28, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:44:08.714626');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (29, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:44:20.847236');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (30, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:44:31.93837');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (31, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 01:45:25.173397');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (32, 'ayu@gmail.com', '::1', 'login', true, NULL, '2025-06-20 11:08:32.599198');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (33, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 11:08:39.303541');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (34, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 11:09:12.135985');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (35, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-20 11:11:25.747313');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (36, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 11:11:33.299868');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (37, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 18:38:09.265681');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (38, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 18:38:35.279695');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (39, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 18:39:57.662042');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (40, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 18:40:05.833753');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (41, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 18:40:15.392429');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (42, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 18:40:20.784212');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (43, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-20 19:54:06.60806');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (44, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-20 19:54:16.054552');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (45, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-20 19:56:47.142087');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (46, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-20 19:58:17.745365');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (47, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-20 19:58:24.552806');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (48, 'ayu@gmail.com', '::1', 'login', true, NULL, '2025-06-20 19:58:34.907401');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (49, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-20 19:59:19.780261');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (50, 'ayu@gmail.com', '::1', 'login', true, NULL, '2025-06-23 07:35:48.047129');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (51, 'ayu@gmail.com', '::1', 'login', true, NULL, '2025-06-23 07:36:47.862501');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (52, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 07:52:56.305201');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (53, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 07:53:13.633753');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (54, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 09:01:32.579269');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (55, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 09:01:45.127085');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (56, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 20:53:07.856106');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (57, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 20:53:25.836909');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (58, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-23 20:54:29.6396');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (59, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 20:54:39.568328');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (60, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 20:54:55.890462');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (61, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 21:18:10.494221');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (62, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 21:18:43.189973');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (63, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 21:24:18.566557');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (64, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 21:24:23.95605');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (65, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 21:26:13.568492');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (66, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-23 21:26:19.93255');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (67, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 21:26:27.430752');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (68, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-23 21:28:31.522087');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (69, 'ayu@gmail.com', '::1', 'login', true, NULL, '2025-06-23 21:28:40.170397');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (70, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 21:28:46.833915');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (71, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 21:28:54.897322');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (72, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-23 21:56:38.471476');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (73, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-23 21:56:47.05896');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (74, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-23 22:01:43.859305');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (75, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-23 22:01:53.44586');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (76, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-23 22:04:29.696798');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (77, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-23 22:04:36.675785');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (78, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-23 22:05:23.359726');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (79, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-23 22:05:35.476575');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (80, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 22:13:24.896071');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (81, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 22:13:42.78498');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (82, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-23 22:14:12.622634');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (83, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-23 22:14:20.757921');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (84, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-23 22:19:31.040614');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (85, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-23 22:19:55.427852');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (86, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-23 22:21:59.239627');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (87, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-23 22:22:15.076764');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (88, '23523254', '::1', 'login', false, 'User not found', '2025-06-24 19:46:53.499548');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (89, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-24 19:47:07.36821');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (90, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:19:49.665775');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (91, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:20:28.251413');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (92, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:20:44.850569');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (93, 'ros@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-24 20:21:11.47991');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (94, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:24:35.385586');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (95, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:25:40.334242');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (96, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:25:48.188017');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (97, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:26:07.910037');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (98, 'admin@platform.com', '::1', 'login', false, 'Invalid password', '2025-06-24 20:26:46.417228');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (99, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-24 20:26:54.178741');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (100, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-24 20:26:59.297135');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (101, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:29:34.821746');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (102, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:40:33.744555');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (103, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:40:56.910282');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (104, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:43:30.77971');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (105, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:44:44.729708');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (106, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-24 20:58:34.495842');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (107, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-25 10:32:29.866783');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (108, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-25 10:32:38.674721');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (109, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-25 10:32:52.620103');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (110, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-25 10:33:09.975209');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (111, 'sakti@gmail.com', '::1', 'login', true, NULL, '2025-06-26 07:47:22.766959');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (112, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 09:23:23.570419');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (113, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 09:23:35.323339');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (114, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:12:30.430174');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (115, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:12:42.921223');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (116, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:21:11.925502');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (117, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:21:22.006836');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (118, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:37:41.308872');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (119, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:37:51.103364');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (120, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:41:58.671657');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (121, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:42:04.685023');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (122, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:44:36.543905');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (123, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:44:45.615567');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (124, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:45:00.412274');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (125, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:45:05.80624');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (126, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:46:28.461068');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (127, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:46:33.729939');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (128, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:48:19.644294');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (129, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:48:25.932786');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (130, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:54:12.62343');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (131, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:54:17.729226');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (132, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:58:03.829958');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (133, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:58:10.322036');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (134, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:58:11.888727');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (135, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:58:40.838537');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (136, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:58:46.172893');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (137, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 19:59:06.551131');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (138, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 19:59:10.518232');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (139, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 20:03:25.289414');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (140, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 20:03:34.483164');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (141, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 20:04:59.736942');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (142, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 20:05:04.400532');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (143, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 20:11:36.008263');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (144, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 20:11:51.32299');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (145, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 20:14:56.350354');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (146, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 20:15:10.559919');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (147, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 20:19:08.174741');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (148, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 20:19:17.993305');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (149, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:07:55.499064');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (150, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 22:08:06.55339');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (151, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:09:44.525679');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (152, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:10:34.579213');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (153, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:11:11.961943');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (154, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:27:53.765112');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (155, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:28:01.141447');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (156, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:28:04.807524');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (157, 'ros@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:39:25.185476');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (158, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:47:21.216964');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (159, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-26 22:49:55.447942');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (160, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-26 22:50:09.597423');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (161, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-27 10:18:39.625281');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (162, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:18:56.836615');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (163, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-27 10:22:14.822195');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (164, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:22:20.966931');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (165, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-27 10:22:27.620132');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (166, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:22:35.598101');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (167, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-27 10:23:43.544421');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (168, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:23:49.026751');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (169, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-27 10:26:10.079197');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (170, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:26:16.652213');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (171, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-27 10:27:40.179767');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (172, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:27:45.57874');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (173, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-27 10:32:22.306768');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (174, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:32:28.084033');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (175, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-27 10:34:06.81744');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (176, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-27 10:34:13.073927');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (177, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-27 11:10:05.367851');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (178, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-27 11:10:17.435433');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (179, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-27 11:13:07.164463');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (180, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-27 11:13:18.475903');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (181, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-27 11:19:11.157345');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (182, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-27 11:19:19.737222');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (183, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-27 11:21:28.780063');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (184, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-27 11:21:35.279802');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (185, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 09:12:15.239201');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (186, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:12:37.735398');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (187, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 09:28:13.480881');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (188, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:28:26.815582');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (189, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 09:33:16.150187');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (190, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:33:27.044768');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (191, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 09:40:08.029469');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (192, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:40:14.02787');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (193, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 09:40:54.901138');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (194, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-28 09:41:01.333239');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (195, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:41:09.860255');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (196, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 09:51:47.539182');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (197, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:51:55.112233');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (198, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 09:52:22.326907');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (199, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 09:52:28.164604');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (200, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:14:25.027326');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (201, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-28 10:14:33.414379');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (202, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:14:39.093668');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (203, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 10:15:02.253817');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (204, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:15:09.922273');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (205, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:15:51.317721');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (206, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-06-28 10:15:58.335995');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (207, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:16:05.619652');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (208, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:18:03.427054');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (209, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:18:09.574254');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (210, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 10:18:36.344753');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (211, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:18:42.936991');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (212, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:21:01.513485');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (213, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:21:07.416004');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (214, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 10:21:33.237273');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (215, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:21:40.301401');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (216, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 10:26:27.803004');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (217, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:26:34.368734');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (218, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:28:48.299633');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (219, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:28:56.861518');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (220, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:32:05.233093');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (221, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:32:10.847059');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (222, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:33:39.109619');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (223, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:33:45.24818');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (224, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 10:35:00.385519');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (225, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:35:07.387314');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (226, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 10:36:09.220063');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (227, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 10:36:14.291458');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (228, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-28 13:32:22.907066');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (229, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-28 13:32:36.805838');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (230, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-28 13:36:14.056271');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (231, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-28 13:36:25.445891');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (232, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 02:32:04.817171');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (233, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 02:32:25.338012');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (234, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 02:36:02.842597');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (235, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 02:36:09.805878');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (236, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 02:37:24.05882');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (237, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 02:37:32.848725');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (238, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 02:41:26.891094');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (239, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 02:41:33.181617');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (240, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 02:57:12.806388');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (241, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 02:57:30.540994');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (242, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:11:21.108328');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (243, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:11:31.475408');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (244, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:14:29.375817');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (245, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:14:35.664229');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (246, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:19:01.639779');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (247, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:19:07.399161');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (248, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:27:59.59885');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (249, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:28:09.666748');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (250, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:30:53.958389');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (251, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:31:00.423613');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (252, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:35:47.38975');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (253, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:35:55.046874');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (254, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:37:29.986192');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (255, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:37:37.930419');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (256, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:38:48.09391');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (257, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:38:54.270487');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (258, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 03:57:47.391659');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (259, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 03:57:54.876419');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (260, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-06-29 11:26:07.642676');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (261, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 11:26:24.378871');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (262, 'admin@platform.com', '::1', 'login', true, NULL, '2025-06-29 11:26:54.381569');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (263, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-06-29 11:27:01.541692');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (264, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 11:27:14.197943');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (265, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 11:27:19.191626');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (266, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-06-29 14:48:34.795146');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (267, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-29 14:48:42.185024');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (268, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-29 21:56:52.251294');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (269, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-06-30 07:56:33.984715');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (270, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-06-30 07:56:48.035611');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (271, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-03 23:15:25.095717');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (272, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-03 23:15:37.148344');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (273, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-05 19:34:30.864974');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (274, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-05 19:34:46.34055');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (275, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-05 20:52:55.608414');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (276, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-05 20:53:17.56241');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (277, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-06 22:09:35.963464');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (278, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-06 22:09:52.484446');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (279, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-06 22:20:07.116883');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (280, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-06 22:20:20.440072');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (281, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-06 22:33:05.051879');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (282, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-06 22:33:12.88601');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (283, 'ros@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-06 23:09:18.571729');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (284, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-06 23:10:53.885633');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (285, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-06 23:25:42.759991');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (286, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-06 23:25:52.600753');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (287, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-06 23:26:21.939314');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (288, 'tio@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-06 23:26:27.043401');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (289, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-06 23:26:30.695007');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (290, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-06 23:33:22.03794');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (291, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-06 23:33:39.190516');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (292, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-06 23:33:44.50679');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (293, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-07 09:33:15.793313');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (294, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-07 09:33:31.997388');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (295, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-07 10:35:42.246766');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (296, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-07 10:35:51.831597');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (297, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-08 09:06:49.640259');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (298, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 09:06:53.302485');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (299, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 09:34:59.436774');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (300, 'tio@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-08 09:35:13.502652');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (301, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 09:35:17.756022');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (302, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-08 09:36:23.106435');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (303, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 09:36:29.335184');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (304, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 10:17:29.084012');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (305, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 10:18:12.329869');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (306, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-08 10:58:25.849155');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (307, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 10:58:40.989314');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (308, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 12:59:13.544619');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (309, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 12:59:27.950796');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (310, 'Siti.Amh123@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-08 13:34:43.220537');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (311, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-08 13:34:54.922607');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (312, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 13:35:06.175902');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (313, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 14:58:28.966216');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (314, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 14:58:42.21089');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (315, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 14:59:09.60887');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (316, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 14:59:16.072495');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (317, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 17:12:25.010338');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (318, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 17:12:42.594906');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (319, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 17:13:31.277632');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (320, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 17:13:37.17326');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (321, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 17:16:03.279785');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (322, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 17:16:10.985542');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (323, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 17:18:39.645518');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (324, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 17:18:48.664984');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (325, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-08 17:26:52.94192');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (326, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 17:27:00.224484');


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: orangtua; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orangtua (id, user_id, nik, nama_lengkap, no_telepon) VALUES (2, 4, '94721234567', 'Ayu Ningsih', '0853224678');
INSERT INTO public.orangtua (id, user_id, nik, nama_lengkap, no_telepon) VALUES (3, 7, '9472000123', 'Suyatno Tejo', '081435472264');


--
-- Data for Name: siswa; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon) VALUES (1, 1, '23523252', 'Muhamad Dimas', '647205080205008', '081256640452');
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon) VALUES (2, 2, '23523201', 'Tio Ananda', '94721234567', '0812345678');
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon) VALUES (3, 6, '23523014', 'Nafis Ilyas Maulana', '9472000123', '08246810');
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon) VALUES (4, 12, '23523264', 'sakti satya nagara', '977853635', '082142484');


--
-- Data for Name: teacher_profiles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: temp_2fa_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (1, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1NzUwOSwiZXhwIjoxNzUwNDQzOTA5fQ.hRjSTO8hvvYlcaNsGFgyVfytEbmNXdNvXjjfWm1Rj20', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:25:09.36', '2025-06-20 01:25:09.363432', '2025-06-20 01:25:09.363432', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (2, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1NzU0MCwiZXhwIjoxNzUwNDQzOTQwfQ.651qe5zzNNd0VqU09B4la-0B6oDCoXVOMsrxfrTBLPE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:25:40.351', '2025-06-20 01:25:40.356191', '2025-06-20 01:25:40.356191', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (3, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1NzY5NSwiZXhwIjoxNzUwNDQ0MDk1fQ.LmUvuzqQ-jvl4ngVRKwAwzarrtesAvid7EaTiGW9gHw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:28:15.978', '2025-06-20 01:28:15.984052', '2025-06-20 01:28:15.984052', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (4, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1Nzc3NywiZXhwIjoxNzUwNDQ0MTc3fQ.s6qWxH3miQT2ZRW-_o0bsuYcRayLtyIbS3rULjorZCw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:29:37.202', '2025-06-20 01:29:37.207724', '2025-06-20 01:29:37.207724', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (5, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1Nzg4OCwiZXhwIjoxNzUwNDQ0Mjg4fQ.zFlo_yyK3dNMytsbVACeylbDNqTghiErw2ufwETbv40', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:31:28.933', '2025-06-20 01:31:28.939754', '2025-06-20 01:31:28.939754', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (6, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1ODM4MiwiZXhwIjoxNzUwNDQ0NzgyfQ.atkOQpkK4QlCpGgWT8SNZs0X0RS-kufzFlMw9opV030', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:39:42.42', '2025-06-20 01:39:42.420694', '2025-06-20 01:39:42.420694', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (7, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1ODQ2NiwiZXhwIjoxNzUwNDQ0ODY2fQ.pxqwTfILY0tCJ-M6Qq7rQhbhJRTEbb_2nQpmM2fV3RY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:41:06.046', '2025-06-20 01:41:06.048579', '2025-06-20 01:41:06.048579', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (8, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM1ODY0MSwiZXhwIjoxNzUwNDQ1MDQxfQ.r7EoCstdWZqh-VIWnF9czSMuu33CaVtW22gf4rtSXJw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:44:01.306', '2025-06-20 01:44:01.309377', '2025-06-20 01:44:01.309377', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (9, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUwMzU4NjUzLCJleHAiOjE3NTA0NDUwNTN9.O9Xi8xzcqPUkr2miqpzB595al5F90s1Vp_JZyCexR0c', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 01:44:13.616', '2025-06-20 01:44:13.618743', '2025-06-20 01:44:13.618743', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (10, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDM5MjU1MiwiZXhwIjoxNzUwNDc4OTUyfQ.dPlyK6HOjNLyDuaZKbMyMOMNdcy5AONDNFzLYNqKDAw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 11:09:12.147', '2025-06-20 11:09:12.148578', '2025-06-20 11:09:12.148578', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (11, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDQxOTUxNSwiZXhwIjoxNzUwNTA1OTE1fQ.0Ie8A3dFjIEXmcp4XJ0t4QR049GMRq001744yjw6M2c', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 18:38:35.304', '2025-06-20 18:38:35.307669', '2025-06-20 18:38:35.307669', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (12, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDQxOTYwNSwiZXhwIjoxNzUwNTA2MDA1fQ.1fwchJi2fMh-KuIviLWJ3U7fa834cL56GM21-6KAS98', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 18:40:05.837', '2025-06-20 18:40:05.839018', '2025-06-20 18:40:05.839018', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (13, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDQxOTYyMCwiZXhwIjoxNzUwNTA2MDIwfQ.kel9_6TZS_UaAjJ9N1TcJ_2xUdLxISpS-fAeeKvov0g', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 18:40:20.788', '2025-06-20 18:40:20.789897', '2025-06-20 18:40:20.789897', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (14, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDQyNDA1NiwiZXhwIjoxNzUwNTEwNDU2fQ.td78dBcnH2zbokQ5nxEuGUHY3-XL_uSUGi2RfhGV4H0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 19:54:16.06', '2025-06-20 19:54:16.068848', '2025-06-20 19:54:16.068848', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (15, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNDI0MjQ3LCJleHAiOjE3NTA1MTA2NDd9.1JAWqOhSphVQ3hZfyfLWV4t_HJZlfP6EFdA460wKSyU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 19:57:27.339', '2025-06-20 19:57:27.341736', '2025-06-20 19:57:27.341736', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (16, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNDI0MzA0LCJleHAiOjE3NTA1MTA3MDR9.L08WS03zWvZjq78Bmu-BoiOc-bLK-tnmHHhNhNLPkGI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 19:58:24.55', '2025-06-20 19:58:24.557781', '2025-06-20 19:58:24.557781', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (17, 4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6Im9yYW5ndHVhIiwiZW1haWwiOiJheXVAZ21haWwuY29tIiwiaWF0IjoxNzUwNDI0MzM0LCJleHAiOjE3NTA1MTA3MzR9.c6S9VkqgYA4A-g3Lrod2iY2TB8iIj2jRI7zlEOdWRqs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 19:58:54.426', '2025-06-20 19:58:54.42692', '2025-06-20 19:58:54.42692', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (18, 5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwicm9sZSI6Imd1cnUiLCJlbWFpbCI6InJvc0BnbWFpbC5jb20iLCJpYXQiOjE3NTA0MjQzNzksImV4cCI6MTc1MDUxMDc3OX0.YKaU562B4HNOYRe81_rdg5Cjc4YpeYok0ZXr4hLyAKM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-21 19:59:39.552', '2025-06-20 19:59:39.553662', '2025-06-20 19:59:39.553662', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (19, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDYzOTk5MywiZXhwIjoxNzUwNzI2MzkzfQ.fSqhJj-MJX5MVkVcc4_jWtzOrRG7tFKSrKlId51OLvM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 07:53:13.647', '2025-06-23 07:53:13.649434', '2025-06-23 07:53:13.649434', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (20, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY0NDEwNSwiZXhwIjoxNzUwNzMwNTA1fQ.aWo1couHI1pfPrTg5phoNxGo3TOUlYZxvFJwxvhweEM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 09:01:45.134', '2025-06-23 09:01:45.139038', '2025-06-23 09:01:45.139038', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (21, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY4NjgwNSwiZXhwIjoxNzUwNzczMjA1fQ.A7RgWKClcTUmNPo2t8FNrhH0fAqnH-8HsuWbl-1GwLw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 20:53:25.843', '2025-06-23 20:53:25.845753', '2025-06-23 20:53:25.845753', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (22, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY4ODMyMywiZXhwIjoxNzUwNzc0NzIzfQ.gehIg_vhtM4ZPcPidBv37pXrrUvY2YBdZ5kSpLcGKIM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 21:18:43.196', '2025-06-23 21:18:43.197315', '2025-06-23 21:18:43.197315', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (23, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY4ODY2MywiZXhwIjoxNzUwNzc1MDYzfQ.2J3FVenLVBFWb6sgA5YEQN67DnTZvTCeQGD_SRlzMnM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 21:24:23.961', '2025-06-23 21:24:23.961872', '2025-06-23 21:24:23.961872', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (24, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY4ODc4NywiZXhwIjoxNzUwNzc1MTg3fQ.ADWO11QzHOGRfHszoKkrmrpAoh40IuXAHuRLQbKk8BU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 21:26:27.432', '2025-06-23 21:26:27.434279', '2025-06-23 21:26:27.434279', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (25, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY4ODkzNCwiZXhwIjoxNzUwNzc1MzM0fQ.0PB9RF9qhMTFWQVwfqLxxCnKW3RWsc_rZ1lWGHrvItk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 21:28:54.901', '2025-06-23 21:28:54.902035', '2025-06-23 21:28:54.902035', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (26, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNjkwNjA3LCJleHAiOjE3NTA3NzcwMDd9.xxTfZMWTJ0P-uhrejpbqJusX60zvdrJcESfvJTXlxPE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 21:56:47.07', '2025-06-23 21:56:47.073606', '2025-06-23 21:56:47.073606', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (27, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNjkwOTEzLCJleHAiOjE3NTA3NzczMTN9.0u23RUiHCvkLxbHVjpQ9JqTeK26l5fwLlbEd7FAuJOs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 22:01:53.449', '2025-06-23 22:01:53.450247', '2025-06-23 22:01:53.450247', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (28, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNjkxMDc2LCJleHAiOjE3NTA3Nzc0NzZ9.56YzXPDoyVnnUckb9PqSYPqsj4iTOrAY5ZbCI4G5vTY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 22:04:36.68', '2025-06-23 22:04:36.68267', '2025-06-23 22:04:36.68267', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (29, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNjkxMTM1LCJleHAiOjE3NTA3Nzc1MzV9.vob2Jl-jxRB0lp7aNKUQkN7_IWjyoxq2SHAZdP0Lc5g', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 22:05:35.479', '2025-06-23 22:05:35.479636', '2025-06-23 22:05:35.479636', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (30, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY5MTYyMiwiZXhwIjoxNzUwNzc4MDIyfQ.r7eo5_E6UN7fvfgtTx8V0pRjyAu3yMX5mYAjWelEJQQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 22:13:42.787', '2025-06-23 22:13:42.788025', '2025-06-23 22:13:42.788025', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (31, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNjkxNjYwLCJleHAiOjE3NTA3NzgwNjB9.039OOEd8vWldIZxYfC2zkir8J8eZGuibVtheaWFX0V0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 22:14:20.754', '2025-06-23 22:14:20.761785', '2025-06-23 22:14:20.761785', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (32, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDY5MjEzNSwiZXhwIjoxNzUwNzc4NTM1fQ._qQXl6dfJi_a3WNWlo7tEQtMQ3D3eUpes8zZ26XSldM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-24 22:22:15.077', '2025-06-23 22:22:15.080395', '2025-06-23 22:22:15.080395', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (33, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwNzcxNjE5LCJleHAiOjE3NTA4NTgwMTl9.sj4Lem_ZALpNdAY2hW8qGx4BjIMZvfQavIzMJJ3w9YI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-25 20:26:59.313', '2025-06-24 20:26:59.315731', '2025-06-24 20:26:59.315731', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (34, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDgyMjM4OSwiZXhwIjoxNzUwOTA4Nzg5fQ.cI2wtjWFnb3BQzb4D6VqOVnstSKRQBqdwtJeNkDvpyQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-26 10:33:09.999', '2025-06-25 10:33:10.003284', '2025-06-25 10:33:10.003284', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (35, 12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIsInJvbGUiOiJzaXN3YSIsImVtYWlsIjoic2FrdGlAZ21haWwuY29tIiwiaWF0IjoxNzUwODk4OTA4LCJleHAiOjE3NTA5ODUzMDh9.p-Vyi0DAIce3BUZcAWYULqN-7IPoapcU8zcHq28sTUc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 07:48:28.613', '2025-06-26 07:48:28.617709', '2025-06-26 07:48:28.617709', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (36, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDkwNDYxNSwiZXhwIjoxNzUwOTkxMDE1fQ.fFYOBm62IYx_wReSigcjAACpIqMtCegMn4Q6-6r7ksY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 09:23:35.327', '2025-06-26 09:23:35.328578', '2025-06-26 09:23:35.328578', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (37, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDkzOTk2MiwiZXhwIjoxNzUxMDI2MzYyfQ.wDXgqONm0R84UIoFjs012uwSuwxtZCugaG4OJelW1yk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:12:42.921', '2025-06-26 19:12:42.92532', '2025-06-26 19:12:42.92532', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (38, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MDQ4MiwiZXhwIjoxNzUxMDI2ODgyfQ.UUoa-tAeYu1qoqv4PzWAXza618OA1xv2Z0jaLv90tGo', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:21:22.008', '2025-06-26 19:21:22.009643', '2025-06-26 19:21:22.009643', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (39, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MTQ3MSwiZXhwIjoxNzUxMDI3ODcxfQ.cQwFIRIssw24dIrkFI8t8v5AMRPUE6nKPDMb3TnjvJQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:37:51.104', '2025-06-26 19:37:51.105489', '2025-06-26 19:37:51.105489', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (40, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MTcyNCwiZXhwIjoxNzUxMDI4MTI0fQ.Lt9P8MB5qc8Cb6KR3iVEe9HblcQ9x0UfRIPv-NmlRbk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:42:04.69', '2025-06-26 19:42:04.691841', '2025-06-26 19:42:04.691841', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (41, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MTg4NSwiZXhwIjoxNzUxMDI4Mjg1fQ.JyPLt6n-gsKjYD4sd79pK1e6GfYATZp_0Q1VydjiYLA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:44:45.617', '2025-06-26 19:44:45.618742', '2025-06-26 19:44:45.618742', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (42, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MTkwNSwiZXhwIjoxNzUxMDI4MzA1fQ.VD9NpwV6Bjz1s8TQKSgEtyq2BD9IcgnSK97HGedBmHo', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:45:05.811', '2025-06-26 19:45:05.812211', '2025-06-26 19:45:05.812211', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (43, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MTk5MywiZXhwIjoxNzUxMDI4MzkzfQ.ZLlDs9Zlt7Vw24Rq1LTrXrpeWd6EdrfGoGkIPXadRqc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:46:33.731', '2025-06-26 19:46:33.732189', '2025-06-26 19:46:33.732189', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (44, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MjEwNSwiZXhwIjoxNzUxMDI4NTA1fQ.H8a7tb_dRNhX5vvXVVPHB0hiLTH8ha_Fha8Pf_c3WHQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:48:25.933', '2025-06-26 19:48:25.934985', '2025-06-26 19:48:25.934985', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (45, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MjQ1NywiZXhwIjoxNzUxMDI4ODU3fQ.7d-DFp5KZeb5f4xM3wioEbMztr9ZEKQvIjyapSWoIs4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:54:17.736', '2025-06-26 19:54:17.738252', '2025-06-26 19:54:17.738252', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (46, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MjY5MCwiZXhwIjoxNzUxMDI5MDkwfQ.o3QK9fzws2GUshvBqnUe401gEOUbzKEI_YJAWmcSz1Y', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:58:10.324', '2025-06-26 19:58:10.325169', '2025-06-26 19:58:10.325169', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (47, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MjcyNiwiZXhwIjoxNzUxMDI5MTI2fQ._JrBC_jc_ktg3mVgMZWvfnjm7PftsJ1fqus8780sEow', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:58:46.174', '2025-06-26 19:58:46.175898', '2025-06-26 19:58:46.175898', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (48, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0Mjc1MCwiZXhwIjoxNzUxMDI5MTUwfQ.3ytm0y9DDTEw4CRUHw2j9J9oTm88GuVHI5Lh68ktSHk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 19:59:10.519', '2025-06-26 19:59:10.520002', '2025-06-26 19:59:10.520002', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (49, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MzAxNCwiZXhwIjoxNzUxMDI5NDE0fQ.2BrWpzAim42ZB_90XxjHNHjZqb803eiGTjcE_ZM0bfE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 20:03:34.484', '2025-06-26 20:03:34.485316', '2025-06-26 20:03:34.485316', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (50, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MzEwNCwiZXhwIjoxNzUxMDI5NTA0fQ.b9TSunwsV83k2SJNnKQwegICMpHYDgLjjgICCTNHL68', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 20:05:04.401', '2025-06-26 20:05:04.402481', '2025-06-26 20:05:04.402481', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (51, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MzUxMSwiZXhwIjoxNzUxMDI5OTExfQ.OucFksoxeRIeiPnY6OIqr0RWXpQLy5MdcrVynx_Tv94', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 20:11:51.327', '2025-06-26 20:11:51.328242', '2025-06-26 20:11:51.328242', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (52, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0MzcxMCwiZXhwIjoxNzUxMDMwMTEwfQ.wsvs4jTAQJme6nXcPVUtcyhPeT7-3slhywhYc5O5ynk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 20:15:10.563', '2025-06-26 20:15:10.564109', '2025-06-26 20:15:10.564109', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (53, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk0Mzk1NywiZXhwIjoxNzUxMDMwMzU3fQ.aPsygbDSoUrQHHMEbihl735daAk2Kw9zsYPXAEzF7Lg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 20:19:17.996', '2025-06-26 20:19:17.99713', '2025-06-26 20:19:17.99713', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (54, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk1MDQ4NiwiZXhwIjoxNzUxMDM2ODg2fQ.qQSTx1RKSZkgIWQH-KbWGmWPUQUWTZn3lQtKo9IHdJs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 22:08:06.555', '2025-06-26 22:08:06.556486', '2025-06-26 22:08:06.556486', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (55, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk1Mjg3MSwiZXhwIjoxNzUxMDM5MjcxfQ.PNxPZfDPhijWuSOMfShfnJPQpATZusti60q7rDDPc3Y', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 22:47:51.192', '2025-06-26 22:47:51.197182', '2025-06-26 22:47:51.197182', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (56, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk1MzAwOSwiZXhwIjoxNzUxMDM5NDA5fQ.fTjTGllPJpA3xnZzbG2PxXULaK4e3BDE9yWaU_5OLZU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-27 22:50:09.598', '2025-06-26 22:50:09.599149', '2025-06-26 22:50:09.599149', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (57, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwOTk0MzM2LCJleHAiOjE3NTEwODA3MzZ9.Lzh5w7jNNoZ7WEqHmIhkz2TgsAsUXMR8PcSV1dQ3v9I', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:18:56.84', '2025-06-27 10:18:56.842373', '2025-06-27 10:18:56.842373', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (58, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwOTk0NTQwLCJleHAiOjE3NTEwODA5NDB9.DvEpwwwMZ5N35nKzWCZBLn17nf68YE1KVhbnMha_FgA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:22:20.969', '2025-06-27 10:22:20.970321', '2025-06-27 10:22:20.970321', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (59, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwOTk0NTU1LCJleHAiOjE3NTEwODA5NTV9.S8NejuWx-bOKFz2Pvoz-b1F-G4mTzLxzByz_boaGthw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:22:35.599', '2025-06-27 10:22:35.599772', '2025-06-27 10:22:35.599772', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (60, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwOTk0NjI5LCJleHAiOjE3NTEwODEwMjl9.RzNdlG9ADMhfNjp2GZtjVrgNKpW34RWROOLa2A4qpmk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:23:49.028', '2025-06-27 10:23:49.029143', '2025-06-27 10:23:49.029143', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (61, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwOTk0Nzc2LCJleHAiOjE3NTEwODExNzZ9.TtFxJ-TQ23Ki7AOmwDsh285Q1UQxN0BP_da9fDgpQjg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:26:16.652', '2025-06-27 10:26:16.653675', '2025-06-27 10:26:16.653675', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (62, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUwOTk0ODY1LCJleHAiOjE3NTEwODEyNjV9.9cbPjd2-1R11_kuFKmwGb8tWxPAeoXQ_oIcDfsNp5U8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:27:45.58', '2025-06-27 10:27:45.581284', '2025-06-27 10:27:45.581284', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (63, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk5NTE0OCwiZXhwIjoxNzUxMDgxNTQ4fQ.gasjmmm--4xqHlKG_SSYNqdLENz6OPs3xIKxhSdObEU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:32:28.086', '2025-06-27 10:32:28.086904', '2025-06-27 10:32:28.086904', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (64, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk5NTI1MywiZXhwIjoxNzUxMDgxNjUzfQ.929mUZD89ROEwnNMEVvwl1pG9YkGSQBgv-707vyJUJ0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 10:34:13.075', '2025-06-27 10:34:13.076031', '2025-06-27 10:34:13.076031', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (65, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk5NzQxNywiZXhwIjoxNzUxMDgzODE3fQ.Ve2oSb6xprKjOfBkd8pUVLVAQLkOB3_LdNEiVSA8EtM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 11:10:17.439', '2025-06-27 11:10:17.4413', '2025-06-27 11:10:17.4413', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (66, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk5NzU5OCwiZXhwIjoxNzUxMDgzOTk4fQ.0hOGlIY1-nFPSAwNPNEp77WI21qH5ef5DBQDkZpaovw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 11:13:18.484', '2025-06-27 11:13:18.485532', '2025-06-27 11:13:18.485532', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (67, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk5Nzk1OSwiZXhwIjoxNzUxMDg0MzU5fQ.X4bTerOt0AVxVueRj9WmH0ijKMqkCsOI3S6gsBRAMNY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 11:19:19.738', '2025-06-27 11:19:19.740287', '2025-06-27 11:19:19.740287', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (68, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MDk5ODA5NSwiZXhwIjoxNzUxMDg0NDk1fQ.Rzoj9w6USfDTeFUZGOvcinSHpZWTCcFXeqHnaRYo3gU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-28 11:21:35.282', '2025-06-27 11:21:35.282652', '2025-06-27 11:21:35.282652', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (69, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDc2NzU3LCJleHAiOjE3NTExNjMxNTd9.IbzjIr0BV3OPJqJrRf_o0TG8URuWtMB5tJR_1VRHsUE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:12:37.739', '2025-06-28 09:12:37.741392', '2025-06-28 09:12:37.741392', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (70, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDc3NzA2LCJleHAiOjE3NTExNjQxMDZ9.G_hL9vY3o5dnn7OstNAdFpIGSC_-36t2pcSDiy0uY_E', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:28:26.818', '2025-06-28 09:28:26.819464', '2025-06-28 09:28:26.819464', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (71, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDc4MDA3LCJleHAiOjE3NTExNjQ0MDd9.BfgsdL6jY6Eq5nKPBDuD6qRTgL4bZqZLLc64QMSHUa0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:33:27.046', '2025-06-28 09:33:27.047799', '2025-06-28 09:33:27.047799', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (72, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDc4NDE0LCJleHAiOjE3NTExNjQ4MTR9.DHCVuaMkeVrVQlzNd4Sa9_rx1HWfN4dfqnQCrC4wjTo', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:40:14.029', '2025-06-28 09:40:14.030245', '2025-06-28 09:40:14.030245', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (73, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA3ODQ2OSwiZXhwIjoxNzUxMTY0ODY5fQ.9klHCIjFo6np5msnSFg0AyO_lpG8HrhFjhHYB6niiF4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:41:09.864', '2025-06-28 09:41:09.864822', '2025-06-28 09:41:09.864822', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (74, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDc5MTE1LCJleHAiOjE3NTExNjU1MTV9.fiGjYeat_5Qca9mNTyJy1EBXJ8JAXb4aUIBucAwCIio', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:51:55.114', '2025-06-28 09:51:55.115355', '2025-06-28 09:51:55.115355', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (75, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA3OTE0OCwiZXhwIjoxNzUxMTY1NTQ4fQ.kHF2MiPDrIb3HlD5LVcidy_MnSD__6o2HjEzi2hbtUc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 09:52:28.165', '2025-06-28 09:52:28.166113', '2025-06-28 09:52:28.166113', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (76, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MDQ3OSwiZXhwIjoxNzUxMTY2ODc5fQ.WLyS7DgwIBAEzgg0CfEwy9jXZmFezHx05TlupE-Blfc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:14:39.095', '2025-06-28 10:14:39.095843', '2025-06-28 10:14:39.095843', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (77, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDgwNTA5LCJleHAiOjE3NTExNjY5MDl9.trDbgW4ThabKOlmHqbMd5EuTzyK2ZoxIggZV_Ciw2bY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:15:09.923', '2025-06-28 10:15:09.923956', '2025-06-28 10:15:09.923956', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (78, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MDU2NSwiZXhwIjoxNzUxMTY2OTY1fQ.rckVaJtqQTpfGjgzCLRaT06IaGeJnT01UdcjdEobOzs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:16:05.62', '2025-06-28 10:16:05.621089', '2025-06-28 10:16:05.621089', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (79, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MDY4OSwiZXhwIjoxNzUxMTY3MDg5fQ.lB_Fd0th4PgT7wLU0tR1wfpLz9xgvwHYeoYV_EGLpco', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:18:09.576', '2025-06-28 10:18:09.577392', '2025-06-28 10:18:09.577392', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (80, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDgwNzIyLCJleHAiOjE3NTExNjcxMjJ9.hVm4JNysYZMjFvP4QSxYBTlqfe9hjJ4JUPRsw5mTc9U', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:18:42.942', '2025-06-28 10:18:42.942855', '2025-06-28 10:18:42.942855', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (81, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MDg2NywiZXhwIjoxNzUxMTY3MjY3fQ.OyR3MnH4fk7_mAkL75OsRMrCmcDWnjR7uuErqHEHWyc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:21:07.416', '2025-06-28 10:21:07.417663', '2025-06-28 10:21:07.417663', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (82, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDgwOTAwLCJleHAiOjE3NTExNjczMDB9.POFezcaCNvC5NwN44EpKNgcQxMZv1wWwXPI8hKnInWQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:21:40.301', '2025-06-28 10:21:40.302535', '2025-06-28 10:21:40.302535', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (83, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDgxMTk0LCJleHAiOjE3NTExNjc1OTR9.h7ABn0ZTgSyJOyxFWTLlPqWm2H7MhED8Djwh35MEyPg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:26:34.372', '2025-06-28 10:26:34.372889', '2025-06-28 10:26:34.372889', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (84, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MTMzNiwiZXhwIjoxNzUxMTY3NzM2fQ.CBCu9oeKt26QhSQXMPdpzvDde1JzFo9RL-QMwOH1jAs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:28:56.862', '2025-06-28 10:28:56.863517', '2025-06-28 10:28:56.863517', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (85, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MTUzMCwiZXhwIjoxNzUxMTY3OTMwfQ.82PcJ_QEypeia0YtpZ9ZxPG2fgow_w9oNvJjNZor3wY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:32:10.848', '2025-06-28 10:32:10.849017', '2025-06-28 10:32:10.849017', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (86, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MTYyNSwiZXhwIjoxNzUxMTY4MDI1fQ.vNy2ANykzICfqhksUA2D_knZVgzpKyY7_BLMUFsJg54', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:33:45.25', '2025-06-28 10:33:45.250893', '2025-06-28 10:33:45.250893', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (87, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA4MTcwNywiZXhwIjoxNzUxMTY4MTA3fQ.era7BGqBzGvheWEKKu5ohmx1rmoW8V9HGfIK--aQrOE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:35:07.389', '2025-06-28 10:35:07.390202', '2025-06-28 10:35:07.390202', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (88, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDgxNzc0LCJleHAiOjE3NTExNjgxNzR9.depstrQ4gYFEeL7wNKGERan-7s1nYZUdeK3ckkCSHWA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 10:36:14.291', '2025-06-28 10:36:14.293071', '2025-06-28 10:36:14.293071', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (89, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTA5MjM1NiwiZXhwIjoxNzUxMTc4NzU2fQ.0MJAhR3QlGY6IVfg-QVueTCu89q_9pf6lUvlJrR7RYI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 13:32:36.927', '2025-06-28 13:32:36.928965', '2025-06-28 13:32:36.928965', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (90, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMDkyNTg1LCJleHAiOjE3NTExNzg5ODV9.RHXvfVzMbE2Nx_mBtrnSrpEnAEr22rWpqcte9-zvKWI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-29 13:36:25.448', '2025-06-28 13:36:25.451129', '2025-06-28 13:36:25.451129', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (91, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTEzOTE0NSwiZXhwIjoxNzUxMjI1NTQ1fQ.zW-O90Qr1o-RLAzu2MvGlk6FhP_8VC2r3UhiDnswJh0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 02:32:25.345', '2025-06-29 02:32:25.347986', '2025-06-29 02:32:25.347986', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (92, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTEzOTM2OSwiZXhwIjoxNzUxMjI1NzY5fQ.PkkKiYA3d5MUqYgfBOqYOGc5r5X4J2utnai92CK7nwY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 02:36:09.808', '2025-06-29 02:36:09.809212', '2025-06-29 02:36:09.809212', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (93, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTEzOTQ1MiwiZXhwIjoxNzUxMjI1ODUyfQ.rQKOdISgczlsLipyaWvFq6en5Hh-Sr5GkOC5voZL9Sc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 02:37:32.85', '2025-06-29 02:37:32.851371', '2025-06-29 02:37:32.851371', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (94, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTEzOTY5MywiZXhwIjoxNzUxMjI2MDkzfQ.6tQuxv7DspzxcaQJwcPmKpmnCPnn9L0bDuvbnaWfc1E', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 02:41:33.183', '2025-06-29 02:41:33.18472', '2025-06-29 02:41:33.18472', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (95, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MDY1MCwiZXhwIjoxNzUxMjI3MDUwfQ.yyhZlcwMhzUG-kbLK3c3-ML4clD3_-w2owq4j1TPSgA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 02:57:30.543', '2025-06-29 02:57:30.54414', '2025-06-29 02:57:30.54414', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (96, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MTQ5MSwiZXhwIjoxNzUxMjI3ODkxfQ.N6NyBXHTMdPgL4iggv4Pug_gAAOJgtMtNG40PA59AKI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:11:31.478', '2025-06-29 03:11:31.478446', '2025-06-29 03:11:31.478446', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (97, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MTY3NSwiZXhwIjoxNzUxMjI4MDc1fQ.bcYgXFZKkuywfiV8XG_KpUl-IQwbV3WidCr8fwcfD-Y', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:14:35.666', '2025-06-29 03:14:35.667898', '2025-06-29 03:14:35.667898', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (98, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MTk0NywiZXhwIjoxNzUxMjI4MzQ3fQ.D6mcD_vRA5iUqsPkSDitZRaHda8SRhXjCcNDCFxGvlg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:19:07.4', '2025-06-29 03:19:07.402236', '2025-06-29 03:19:07.402236', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (99, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MjQ4OSwiZXhwIjoxNzUxMjI4ODg5fQ.t3Jz8EAXrhJ3LCK4AXVPI0OAZ8CUgoJxswUK_Y9SGns', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:28:09.669', '2025-06-29 03:28:09.670555', '2025-06-29 03:28:09.670555', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (100, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MjY2MCwiZXhwIjoxNzUxMjI5MDYwfQ.8mmBHNYpoDI3Or4BLFypciR0rWvD0BwWwMVliExf1MY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:31:00.429', '2025-06-29 03:31:00.431005', '2025-06-29 03:31:00.431005', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (101, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0Mjk1NSwiZXhwIjoxNzUxMjI5MzU1fQ.Lr2Di1GtRx21IQuJ0tL4nJcva9J6qMgDj5MEyY-UbM4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:35:55.048', '2025-06-29 03:35:55.049297', '2025-06-29 03:35:55.049297', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (102, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MzA1NywiZXhwIjoxNzUxMjI5NDU3fQ.mZR3fnOex5fpBSB-JpYWncAHTG9tFMgtxNxwSIk4HE4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:37:37.932', '2025-06-29 03:37:37.933124', '2025-06-29 03:37:37.933124', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (103, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0MzEzNCwiZXhwIjoxNzUxMjI5NTM0fQ.ETapG53wsmLNFT0cTp8wT4Y8MCcm50NcxYeWizDLv5c', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:38:54.272', '2025-06-29 03:38:54.273125', '2025-06-29 03:38:54.273125', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (104, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE0NDI3NCwiZXhwIjoxNzUxMjMwNjc0fQ.KlAbTb9Hs1Q8qDqTBqLsON3anEWSc93n_EtGq0ERx1k', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 03:57:54.878', '2025-06-29 03:57:54.879475', '2025-06-29 03:57:54.879475', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (105, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE3MTE4NCwiZXhwIjoxNzUxMjU3NTg0fQ.THfIhBRQwsCFE17QzYrx3F8NC33Q2BEBdqOeHNzGWTo', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 11:26:24.381', '2025-06-29 11:26:24.382527', '2025-06-29 11:26:24.382527', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (106, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUxMTcxMjIxLCJleHAiOjE3NTEyNTc2MjF9.EGMXeAAWbZvChxqycLdUzm_mUZzugVQHrnmPcOm5z9c', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 11:27:01.544', '2025-06-29 11:27:01.544365', '2025-06-29 11:27:01.544365', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (107, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE3MTIzOSwiZXhwIjoxNzUxMjU3NjM5fQ.KU4ZE2Bp8zlYCxwfgQVQ0Yn1pJTM0KYgJWLTd7S1fBY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 11:27:19.193', '2025-06-29 11:27:19.193704', '2025-06-29 11:27:19.193704', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (108, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MTE4MzMyMiwiZXhwIjoxNzUxMjY5NzIyfQ.bn7Ibm0YFoO1gwHfm3wIv38sQ9ox8UCxnhbGo2gMdD8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0', '2025-06-30 14:48:42.19', '2025-06-29 14:48:42.196904', '2025-06-29 14:48:42.196904', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (109, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxMjA5MDYwLCJleHAiOjE3NTEyOTU0NjB9.YYz3Pufo6xnvSyehyhUvFS1V3enks3kSIKaMiMASgrY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-06-30 21:57:40.216', '2025-06-29 21:57:40.218805', '2025-06-29 21:57:40.218805', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (110, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxMjQ1MDA4LCJleHAiOjE3NTEzMzE0MDh9._4sPAWcXeVJreUvKtm6D2a1bnSycDee0kU0kOlPfPfg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-01 07:56:48.05', '2025-06-30 07:56:48.053163', '2025-06-30 07:56:48.053163', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (112, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxNzE4ODg2LCJleHAiOjE3NTE4MDUyODZ9.F1DfWIwfnmFLvubGfVzu822aF9l5WU6T3-79Ui8MFto', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-06 19:34:46.359', '2025-07-05 19:34:46.369423', '2025-07-05 20:32:32.212775', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (111, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxNTU5MzM3LCJleHAiOjE3NTE2NDU3Mzd9.8PdoDAPh4OQWl3yxoupl7ubeqjUr2aRs-elW6DuLEzc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-04 23:15:37.148', '2025-07-03 23:15:37.156581', '2025-07-03 23:19:35.106557', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (113, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxNzIzNTk3LCJleHAiOjE3NTE4MDk5OTd9.qGp7YX0UlUvKfD1OyE-5QtzRr0bOs1O7qKJ2RBtvHTU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-06 20:53:17.572', '2025-07-05 20:53:17.576961', '2025-07-05 20:55:10.948816', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (114, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxODE0NTkyLCJleHAiOjE3NTE5MDA5OTJ9.8CfSEgKaZ7OAjyX7xxajyREHoBHRICxD8B8Y2PInaGA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 22:09:52.489', '2025-07-06 22:09:52.501121', '2025-07-06 22:09:52.501121', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (115, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxODE1MjIwLCJleHAiOjE3NTE5MDE2MjB9.G48xT4jHhsSpeI0ex2jb1BwsFjD3f89Dy3Rxo9182Wg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 22:20:20.449', '2025-07-06 22:20:20.451932', '2025-07-06 22:20:20.451932', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (121, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxODU1NjEyLCJleHAiOjE3NTE5NDIwMTJ9.exPCYN2oxl8vLdD6ooReF_zB4nSj2eQ852zAkL_wrmI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-08 09:33:32.003', '2025-07-07 09:33:32.017715', '2025-07-07 10:35:24.307558', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (122, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE4NTkzNTEsImV4cCI6MTc1MTk0NTc1MX0.YbLvkKtnLhb768Xs-hAXrWR_hXahd8EVaoYn7jfHkss', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-08 10:35:51.837', '2025-07-07 10:35:51.838384', '2025-07-07 10:35:51.838384', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (123, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE5NDA0MTMsImV4cCI6MTc1MjAyNjgxM30.SfwYNuqrJnHWTFYvzlCpxwAvOvpvhe3EiL5BqQKZQQ0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 09:06:53.31', '2025-07-08 09:06:53.314385', '2025-07-08 09:29:26.399543', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (124, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTQyMTE3LCJleHAiOjE3NTIwMjg1MTd9.2LBesASYUWOiljzM57cZBFfEMTUmyNvQJaXL4rMNVi8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 09:35:17.813', '2025-07-08 09:35:17.814861', '2025-07-08 09:36:15.529486', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (116, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxODE1OTkyLCJleHAiOjE3NTE5MDIzOTJ9.bDrGEBgAeuIt14gkdWJL86Orm5UY2SJvN4W7A1TdStQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 22:33:12.892', '2025-07-06 22:33:12.893304', '2025-07-06 23:08:42.063259', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (117, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE4MTgyODYsImV4cCI6MTc1MTkwNDY4Nn0.cxL1CUcHsP-7GnkbsBEqqTITJ9d5jOyykLcy_rIMEWQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 23:11:26.29', '2025-07-06 23:11:26.291129', '2025-07-06 23:11:26.291129', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (118, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE4MTkxNTIsImV4cCI6MTc1MTkwNTU1Mn0.E0HalTqEd3cCmfPmAuslHnS7vccgmLN61B4foDQJ1gY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 23:25:52.606', '2025-07-06 23:25:52.612914', '2025-07-06 23:26:10.919698', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (119, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxODE5MTkwLCJleHAiOjE3NTE5MDU1OTB9.b_DCLz20SNWayv_zDKN7lQQ2jvsdrHsX3Vngh6Z5L24', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 23:26:30.702', '2025-07-06 23:26:30.708248', '2025-07-06 23:33:14.062107', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (120, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE4MTk2MjQsImV4cCI6MTc1MTkwNjAyNH0.5RVsew2gb04FM7Njod2KuHu-JovE8cfPxYkvr59qWcs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-07 23:33:44.51', '2025-07-06 23:33:44.512035', '2025-07-06 23:33:44.512035', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (125, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE5NDIxODksImV4cCI6MTc1MjAyODU4OX0.SIoe-eBaXc7YqJxatAtspr8K-5a0bG0tZhQpITuFJuM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 09:36:29.345', '2025-07-08 09:36:29.354406', '2025-07-08 10:17:22.548057', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (126, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTQ0NjkyLCJleHAiOjE3NTIwMzEwOTJ9.2jliCmhHae5BzVM5KDqNAWp_LfVZpXpjaIObfxFdZ-M', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 10:18:12.334', '2025-07-08 10:18:12.33616', '2025-07-08 10:58:13.580707', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (127, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE5NDcxMjAsImV4cCI6MTc1MjAzMzUyMH0.r0L-F2f5KsCphi19--QhgEBHUDS-KCTzGBaOleferT4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 10:58:40.992', '2025-07-08 10:58:40.994744', '2025-07-08 12:59:07.425213', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (128, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTU0MzY3LCJleHAiOjE3NTIwNDA3Njd9.XXHsm3iT_SPSAOFtvJaX1idLtdnxQ5pUyOzg8zSEcdc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 12:59:27.96', '2025-07-08 12:59:27.962769', '2025-07-08 13:34:36.130199', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (129, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE5NTY1MDYsImV4cCI6MTc1MjA0MjkwNn0.4eiyjesbtM-Xcj3Iuc1tYQwt1CVF13ywi9nzsKBr0Dk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 13:35:06.177', '2025-07-08 13:35:06.183444', '2025-07-08 13:35:06.183444', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (130, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTYxNTIyLCJleHAiOjE3NTIwNDc5MjJ9.9JhHK4WeLLIOzZ2YyMy8P6kexu_bTiVDmabtD32HCuw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 14:58:42.215', '2025-07-08 14:58:42.21987', '2025-07-08 14:58:42.21987', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (131, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTYxNTU2LCJleHAiOjE3NTIwNDc5NTZ9.o9q_A7IZy0H3G9Hv5FhTtw5oTl7bDyg2uEOdjFN3E10', NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 Edg/138.0.0.0', '2025-07-09 14:59:16.076', '2025-07-08 14:59:16.078018', '2025-07-08 14:59:16.078018', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (132, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTY5NTYyLCJleHAiOjE3NTIwNTU5NjJ9.KGPipYqjgADNVSifT1rT0zWB9-KfpHnMb9Df1-H9n7Q', NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 Edg/138.0.0.0', '2025-07-09 17:12:42.595', '2025-07-08 17:12:42.602982', '2025-07-08 17:12:42.602982', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (133, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTY5NjE3LCJleHAiOjE3NTIwNTYwMTd9.nMpKlm-VWN_DROUBjBVKVi1RklKlPmlKpd4kFYsx9HU', NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 Edg/138.0.0.0', '2025-07-09 17:13:37.178', '2025-07-08 17:13:37.181913', '2025-07-08 17:13:37.181913', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (134, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTY5NzcwLCJleHAiOjE3NTIwNTYxNzB9.C9KhUC4hO-SWYUUucL2pXfNY3OsC-iaC_MkRL0toLz0', NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 Edg/138.0.0.0', '2025-07-09 17:16:10.989', '2025-07-08 17:16:10.996559', '2025-07-08 17:16:10.996559', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (135, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTY5OTI4LCJleHAiOjE3NTIwNTYzMjh9.gS2xdEOrqri5-ZEEcN9-CUokCuvjlzbAjSVTq8ACS9M', NULL, '::1', 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 Edg/138.0.0.0', '2025-07-09 17:18:48.669', '2025-07-08 17:18:48.670806', '2025-07-08 17:18:48.670806', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (136, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTcwNDIwLCJleHAiOjE3NTIwNTY4MjB9.N3sZDo9u171e3KvxPbO-X722iAPV6ZigWBVj2gdt0FQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 17:27:00.226', '2025-07-08 17:27:00.235794', '2025-07-08 17:27:00.235794', true);


--
-- Data for Name: user_streaks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (7, 'tejo@gmail.com', '$2b$10$iDdH/7Jao9MUlVlw36jnGufSoslRYnklQXZS24MWh/ntntqteW8tO', 'orangtua', '2025-05-11 02:24:15.275135+07', '2025-05-11 02:24:24.716664+07', NULL, false, NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (4, 'ayu@gmail.com', '$2b$10$2rqlr.KsFu.7pe7qVuiwu.QTKmyefcVLc9mTFZpy7MiM0WI/0X1hC', 'orangtua', '2025-05-09 11:21:33.881021+07', '2025-06-23 21:28:40.157746+07', NULL, true, 'FY5HEI35EN6XONJYM5TFIW2AFE3HI2LZKRJHQZ2QMVNUCTK6EZGA', NULL, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (12, 'sakti@gmail.com', '$2b$10$h/MpsaPMYm38ZJDNi9My6OVY2t3VJHM..KeqNOvEVbiFlUXMCzu2G', 'siswa', '2025-06-26 07:46:52.905692+07', '2025-06-26 07:48:28.610203+07', NULL, true, 'NRLVO2JMEUXWC2CKNVAS6UCGIJEDIJCSGIVFA4SEOIUGWXTJEVMA', NULL, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (13, 'Budi@gmail.com', '$2b$10$LT.UfepEsjDdLsqOOiTMpe9t1./k7SWsbwkP1lDcxX4p4rbVBIoBu', 'guru', '2025-06-26 22:46:31.163405+07', '2025-06-29 11:26:24.376946+07', NULL, true, 'HBSSG2CUKVXCU6JPGVIFU5TVHZWHKILHLJHGKZSUFFDESYKCMJ4A', NULL, '2025-06-29 11:26:24.376946');
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (10, 'admin@platform.com', '$2b$10$Xfm.yJfMM9uY07efA8Zf9enI7JONqBVh89EtDe34pdhxuJ33SdHWu', 'admin', '2025-06-18 10:14:51.162478+07', '2025-06-29 11:27:01.540141+07', 'uploads/profile-pictures/profile_10_1750691161410.png', true, 'NN2EG4CAEE2CQXLVGF6WGYLGKJGCYWRWF4RXC63OHZRHAOB4LJKA', NULL, '2025-06-29 11:27:01.540141');
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (5, 'ros@gmail.com', '$2b$10$Uc4yBIVgBocnkP6W/3ituel4Z.8ypaJeKn.avWfOc8.dl/ZfCF5Py', 'guru', '2025-05-09 11:44:14.150172+07', '2025-06-26 22:39:25.178667+07', NULL, true, 'NVFXCTKGLBGEEMDDIVBXEQDIFFGES6KWGQ6HOMTHIIYUA4COPV3A', NULL, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (1, 'dimasrizky822@gmail.com', '$2b$10$3UaVMWehk2G7irXhlLw7I.9xnDXqIZqBzKRAhoTpr9IG/s73qW4hS', 'siswa', '2025-05-07 20:48:22.124923+07', '2025-06-29 14:48:42.179288+07', 'uploads/profile-pictures/profile_1_1750688863556.jpeg', true, 'JRKXEOSBJJFWINJPIA4CSQROIEXE2T3ZMV2X23JGMRYSMWRDMFYQ', NULL, '2025-06-29 14:48:42.179288');
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (6, 'nafis@gmail.com', '$2b$10$Q4Vuf/yYl6SOisWi5fP7yu32E1PTfO0UNnzp87aKKKGBi/Vg03AyK', 'siswa', '2025-05-11 02:21:14.196755+07', '2025-06-16 07:55:37.582099+07', NULL, false, NULL, NULL, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (2, 'tio@gmail.com', '$2b$10$7LULZ7RBZftd/M9t9zyJdu7ywx8qifCYEqMzuGp2l/oJ9Okqzm4fu', 'siswa', '2025-05-08 15:12:19.104442+07', '2025-07-08 17:27:00.222302+07', 'uploads/profile-pictures/profile_2_1751815244629.png', true, 'M5CUUUZ6HFQV26B6FFTXGOJMMRPHINCWHY4TSRKIJQYUWN3DKRFQ', NULL, '2025-07-08 17:27:00.222302');
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify) VALUES (14, 'Siti.Amh123@gmail.com', '$2b$10$uXPVa/lQuEbZs3RR8naQReGdN2sfNeuxoROdu/qK1INRLVC6JvXxK', 'guru', '2025-07-06 23:10:42.212824+07', '2025-07-08 13:35:06.173148+07', NULL, true, 'INZE6UTSFQUWCR3LKQXT6QZONVNE6KSCLZYVONKDN4VEM3J2OBVQ', NULL, '2025-07-08 13:35:06.173148');


--
-- Name: achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.achievements_id_seq', 1, false);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 1, false);


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_id_seq', 4, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 11, true);


--
-- Name: certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificates_id_seq', 1, false);


--
-- Name: class_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.class_members_id_seq', 6, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classes_id_seq', 3, true);


--
-- Name: course_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.course_ratings_id_seq', 1, false);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.courses_id_seq', 5, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, false);


--
-- Name: guru_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.guru_id_seq', 3, true);


--
-- Name: lesson_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lesson_progress_id_seq', 1, false);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lessons_id_seq', 1, false);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.login_attempts_id_seq', 326, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modules_id_seq', 4, true);


--
-- Name: orangtua_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orangtua_id_seq', 3, true);


--
-- Name: siswa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.siswa_id_seq', 4, true);


--
-- Name: teacher_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_profiles_id_seq', 1, false);


--
-- Name: temp_2fa_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.temp_2fa_tokens_id_seq', 31, true);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_achievements_id_seq', 1, false);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 136, true);


--
-- Name: user_streaks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_streaks_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 14, true);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: certificates certificates_certificate_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_number_key UNIQUE (certificate_number);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: class_members class_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT class_members_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: course_ratings course_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_ratings
    ADD CONSTRAINT course_ratings_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: guru guru_nuptk_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru
    ADD CONSTRAINT guru_nuptk_key UNIQUE (nuptk);


--
-- Name: guru guru_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru
    ADD CONSTRAINT guru_pkey PRIMARY KEY (id);


--
-- Name: lesson_progress lesson_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: orangtua orangtua_nik_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orangtua
    ADD CONSTRAINT orangtua_nik_key UNIQUE (nik);


--
-- Name: orangtua orangtua_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orangtua
    ADD CONSTRAINT orangtua_pkey PRIMARY KEY (id);


--
-- Name: siswa siswa_nis_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa
    ADD CONSTRAINT siswa_nis_key UNIQUE (nis);


--
-- Name: siswa siswa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa
    ADD CONSTRAINT siswa_pkey PRIMARY KEY (id);


--
-- Name: teacher_profiles teacher_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_pkey PRIMARY KEY (id);


--
-- Name: teacher_profiles teacher_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_user_id_key UNIQUE (user_id);


--
-- Name: temp_2fa_tokens temp_2fa_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temp_2fa_tokens
    ADD CONSTRAINT temp_2fa_tokens_pkey PRIMARY KEY (id);


--
-- Name: certificates unique_certificate; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT unique_certificate UNIQUE (user_id, course_id);


--
-- Name: class_members unique_class_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT unique_class_member UNIQUE (class_id, user_id);


--
-- Name: course_ratings unique_course_rating; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_ratings
    ADD CONSTRAINT unique_course_rating UNIQUE (user_id, course_id);


--
-- Name: enrollments unique_enrollment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT unique_enrollment UNIQUE (user_id, course_id);


--
-- Name: lessons unique_lesson_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT unique_lesson_order UNIQUE (module_id, order_index);


--
-- Name: lesson_progress unique_lesson_progress; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT unique_lesson_progress UNIQUE (user_id, lesson_id);


--
-- Name: modules unique_module_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT unique_module_order UNIQUE (course_id, order_index);


--
-- Name: user_sessions unique_session_token; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT unique_session_token UNIQUE (session_token);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_streaks user_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_pkey PRIMARY KEY (id);


--
-- Name: user_streaks user_streaks_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_key UNIQUE (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_course_ratings_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_course_ratings_course ON public.course_ratings USING btree (course_id);


--
-- Name: idx_courses_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_category ON public.courses USING btree (category_id);


--
-- Name: idx_courses_instructor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_instructor ON public.courses USING btree (instructor_id);


--
-- Name: idx_courses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_courses_status ON public.courses USING btree (status);


--
-- Name: idx_enrollments_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);


--
-- Name: idx_enrollments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);


--
-- Name: idx_enrollments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_user ON public.enrollments USING btree (user_id);


--
-- Name: idx_lesson_progress_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_course ON public.lesson_progress USING btree (course_id);


--
-- Name: idx_lesson_progress_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);


--
-- Name: idx_lessons_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_module ON public.lessons USING btree (module_id);


--
-- Name: idx_login_attempts_email_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_email_created ON public.login_attempts USING btree (email, created_at);


--
-- Name: idx_login_attempts_ip_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_login_attempts_ip_created ON public.login_attempts USING btree (ip_address, created_at);


--
-- Name: idx_modules_course; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_modules_course ON public.modules USING btree (course_id);


--
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_expires ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_user_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_sessions_user_active ON public.user_sessions USING btree (user_id, is_active);


--
-- Name: idx_users_2fa_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_2fa_enabled ON public.users USING btree (is_2fa_enabled);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: admin trigger_sync_admin_delete_to_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_admin_delete_to_users AFTER DELETE ON public.admin FOR EACH ROW EXECUTE FUNCTION public.sync_admin_delete_to_users();


--
-- Name: admin trigger_sync_admin_to_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_admin_to_users AFTER INSERT ON public.admin FOR EACH ROW EXECUTE FUNCTION public.sync_admin_to_users();


--
-- Name: admin trigger_sync_admin_update_to_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_sync_admin_update_to_users AFTER UPDATE ON public.admin FOR EACH ROW EXECUTE FUNCTION public.sync_admin_update_to_users();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: class_members update_class_members_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_class_members_updated_at BEFORE UPDATE ON public.class_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: classes update_classes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: course_ratings update_course_ratings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_course_ratings_updated_at BEFORE UPDATE ON public.course_ratings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: courses update_courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lessons update_lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: modules update_modules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: certificates certificates_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: certificates certificates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: course_ratings course_ratings_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_ratings
    ADD CONSTRAINT course_ratings_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_ratings course_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_ratings
    ADD CONSTRAINT course_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: courses courses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: courses courses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: class_members fk_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT fk_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: user_sessions fk_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: class_members fk_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_members
    ADD CONSTRAINT fk_student FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: classes fk_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: temp_2fa_tokens fk_temp_2fa_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temp_2fa_tokens
    ADD CONSTRAINT fk_temp_2fa_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: guru guru_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guru
    ADD CONSTRAINT guru_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lesson_progress lesson_progress_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: lesson_progress lesson_progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);


--
-- Name: lesson_progress lesson_progress_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id);


--
-- Name: lesson_progress lesson_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_progress
    ADD CONSTRAINT lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: modules modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: orangtua orangtua_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orangtua
    ADD CONSTRAINT orangtua_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: siswa siswa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.siswa
    ADD CONSTRAINT siswa_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: teacher_profiles teacher_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teacher_profiles
    ADD CONSTRAINT teacher_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_streaks user_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

