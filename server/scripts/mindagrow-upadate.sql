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
    '2fa_verify',
    'google_oauth'
);


--
-- Name: initialize_user_levels(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_user_levels() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO user_levels (user_id)
    SELECT id FROM users 
    WHERE role = 'siswa' 
    AND id NOT IN (SELECT user_id FROM user_levels WHERE user_id IS NOT NULL)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;


--
-- Name: reset_daily_missions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reset_daily_missions() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This function can be called daily to reset missions
    -- For now, it's just a placeholder
    -- In production, you'd typically handle this via cron job or application scheduler
    NULL;
END;
$$;


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


--
-- Name: update_weekly_leaderboard(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_weekly_leaderboard() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    week_start_date DATE;
    week_end_date DATE;
BEGIN
    -- Calculate current week start (Monday) and end (Sunday)
    week_start_date := DATE_TRUNC('week', CURRENT_DATE);
    week_end_date := week_start_date + INTERVAL '6 days';
    
    -- Clear existing entries for current week
    DELETE FROM weekly_leaderboard WHERE week_start = week_start_date;
    
    -- Insert current week leaderboard
    INSERT INTO weekly_leaderboard (user_id, week_start, week_end, total_xp, rank_position)
    SELECT 
        ul.user_id,
        week_start_date,
        week_end_date,
        ul.total_xp,
        ROW_NUMBER() OVER (ORDER BY ul.total_xp DESC)
    FROM user_levels ul
    JOIN users u ON ul.user_id = u.id
    WHERE u.role = 'siswa'
    ORDER BY ul.total_xp DESC;
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
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id integer NOT NULL,
    class_id integer NOT NULL,
    teacher_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    due_date timestamp with time zone,
    points integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    file_url character varying(500),
    status character varying(50) DEFAULT 'active'::character varying,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_assignment_status CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('completed'::character varying)::text, ('draft'::character varying)::text])))
);


--
-- Name: assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assignments_id_seq OWNED BY public.assignments.id;


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
-- Name: daily_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_missions (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    mission_type character varying(50) NOT NULL,
    target_count integer DEFAULT 1,
    xp_reward integer DEFAULT 10,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: daily_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_missions_id_seq OWNED BY public.daily_missions.id;


--
-- Name: daily_quiz_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_quiz_completions (
    id integer NOT NULL,
    user_id integer,
    quiz_date date DEFAULT CURRENT_DATE,
    completed_quizzes integer DEFAULT 0,
    correct_answers integer DEFAULT 0,
    total_questions integer DEFAULT 0,
    xp_earned integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: daily_quiz_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_quiz_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_quiz_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_quiz_completions_id_seq OWNED BY public.daily_quiz_completions.id;


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
-- Name: game_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    game_id character varying(50) NOT NULL,
    total_questions integer DEFAULT 0,
    correct_answers integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: game_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.game_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: game_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.game_progress_id_seq OWNED BY public.game_progress.id;


--
-- Name: game_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_sessions (
    id integer NOT NULL,
    user_id integer,
    game_id integer,
    score integer DEFAULT 0,
    max_score integer DEFAULT 100,
    duration_seconds integer DEFAULT 0,
    questions_answered integer DEFAULT 0,
    correct_answers integer DEFAULT 0,
    hints_used integer DEFAULT 0,
    moves_made integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: game_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.game_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: game_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.game_sessions_id_seq OWNED BY public.game_sessions.id;


--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100),
    total_questions integer DEFAULT 10,
    questions_data jsonb,
    xp_per_question integer DEFAULT 5,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: games_backup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games_backup (
    id integer,
    name character varying(255),
    description text,
    category character varying(100),
    difficulty_level integer,
    xp_reward integer,
    image_url character varying(500),
    is_active boolean,
    created_at timestamp with time zone,
    total_questions integer,
    questions_data jsonb,
    xp_per_question integer
);


--
-- Name: games_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.games_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: games_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.games_id_seq OWNED BY public.games.id;


--
-- Name: guru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guru (
    id integer NOT NULL,
    user_id integer,
    nuptk character varying(50) NOT NULL,
    nama_lengkap character varying(255) NOT NULL,
    no_telepon character varying(20) NOT NULL,
    registration_method character varying(20) DEFAULT 'manual'::character varying
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
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    class_id integer NOT NULL,
    teacher_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_url character varying(500),
    file_type character varying(50),
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'active'::character varying,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    file_size character varying(20),
    CONSTRAINT chk_material_file_type CHECK (((file_type)::text = ANY (ARRAY[('pdf'::character varying)::text, ('doc'::character varying)::text, ('docx'::character varying)::text, ('ppt'::character varying)::text, ('pptx'::character varying)::text, ('video'::character varying)::text, ('image'::character varying)::text, ('other'::character varying)::text]))),
    CONSTRAINT chk_material_status CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('draft'::character varying)::text])))
);


--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


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
    no_telepon character varying(20) NOT NULL,
    registration_method character varying(20) DEFAULT 'manual'::character varying
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
    no_telepon character varying(20) NOT NULL,
    registration_method character varying(20) DEFAULT 'manual'::character varying,
    total_xp integer DEFAULT 0,
    current_level integer DEFAULT 1
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
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id integer NOT NULL,
    assignment_id integer NOT NULL,
    student_id integer NOT NULL,
    comment text NOT NULL,
    file_url text,
    file_size character varying(50),
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    score integer,
    feedback text,
    status character varying(50) DEFAULT 'submitted'::character varying,
    graded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_submission_score CHECK (((score >= 0) AND (score <= 100))),
    CONSTRAINT chk_submission_status CHECK (((status)::text = ANY ((ARRAY['submitted'::character varying, 'graded'::character varying, 'returned'::character varying])::text[])))
);


--
-- Name: submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.submissions_id_seq OWNED BY public.submissions.id;


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
-- Name: user_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_activity_log (
    id integer NOT NULL,
    user_id integer,
    activity_type character varying(50) NOT NULL,
    activity_date date DEFAULT CURRENT_DATE,
    activity_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_activity_log_id_seq OWNED BY public.user_activity_log.id;


--
-- Name: user_daily_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_daily_missions (
    id integer NOT NULL,
    user_id integer,
    mission_id integer,
    current_progress integer DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    mission_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_daily_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_daily_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_daily_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_daily_missions_id_seq OWNED BY public.user_daily_missions.id;


--
-- Name: user_game_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_game_progress (
    id integer NOT NULL,
    user_id integer,
    game_id integer,
    level integer DEFAULT 1,
    score integer DEFAULT 0,
    completion_percentage integer DEFAULT 0,
    last_played_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    total_play_time integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    questions_completed integer DEFAULT 0,
    correct_answers integer DEFAULT 0,
    total_questions integer DEFAULT 0,
    session_count integer DEFAULT 0
);


--
-- Name: user_game_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_game_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_game_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_game_progress_id_seq OWNED BY public.user_game_progress.id;


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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    last_reset_date date DEFAULT CURRENT_DATE,
    is_active boolean DEFAULT false
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
    google_id character varying(255),
    oauth_provider character varying(50),
    is_email_verified boolean DEFAULT false,
    avatar_url text,
    role_selected boolean DEFAULT false,
    role_confirmation_date timestamp without time zone,
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
-- Name: weekly_leaderboard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.weekly_leaderboard (
    id integer NOT NULL,
    user_id integer,
    week_start_date date NOT NULL,
    total_xp integer DEFAULT 0,
    games_played integer DEFAULT 0,
    missions_completed integer DEFAULT 0,
    rank_position integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: weekly_leaderboard_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.weekly_leaderboard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: weekly_leaderboard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.weekly_leaderboard_id_seq OWNED BY public.weekly_leaderboard.id;


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
-- Name: assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments ALTER COLUMN id SET DEFAULT nextval('public.assignments_id_seq'::regclass);


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
-- Name: daily_missions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_missions ALTER COLUMN id SET DEFAULT nextval('public.daily_missions_id_seq'::regclass);


--
-- Name: daily_quiz_completions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quiz_completions ALTER COLUMN id SET DEFAULT nextval('public.daily_quiz_completions_id_seq'::regclass);


--
-- Name: enrollments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN id SET DEFAULT nextval('public.enrollments_id_seq'::regclass);


--
-- Name: game_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_progress ALTER COLUMN id SET DEFAULT nextval('public.game_progress_id_seq'::regclass);


--
-- Name: game_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions ALTER COLUMN id SET DEFAULT nextval('public.game_sessions_id_seq'::regclass);


--
-- Name: games id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games ALTER COLUMN id SET DEFAULT nextval('public.games_id_seq'::regclass);


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
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


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
-- Name: submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions ALTER COLUMN id SET DEFAULT nextval('public.submissions_id_seq'::regclass);


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
-- Name: user_activity_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log ALTER COLUMN id SET DEFAULT nextval('public.user_activity_log_id_seq'::regclass);


--
-- Name: user_daily_missions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions ALTER COLUMN id SET DEFAULT nextval('public.user_daily_missions_id_seq'::regclass);


--
-- Name: user_game_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_progress ALTER COLUMN id SET DEFAULT nextval('public.user_game_progress_id_seq'::regclass);


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
-- Name: weekly_leaderboard id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_leaderboard ALTER COLUMN id SET DEFAULT nextval('public.weekly_leaderboard_id_seq'::regclass);


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
-- Data for Name: assignments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.assignments (id, class_id, teacher_id, title, description, due_date, points, created_at, file_url, status, updated_at) VALUES (2, 5, 13, 'Ketahanan Pangan', 'Rangkumlah', '2025-07-11 23:59:00+07', 98, '2025-07-10 11:46:20.744908+07', 'uploads/assignments/assignment_1752122780702-71349981.docx', 'inactive', '2025-07-12 23:14:41.563764+07');
INSERT INTO public.assignments (id, class_id, teacher_id, title, description, due_date, points, created_at, file_url, status, updated_at) VALUES (1, 3, 14, 'test', 'test', '2025-07-11 23:00:00+07', 100, '2025-07-09 21:13:50.386394+07', 'uploads/assignments/assignment_1752070427027-320438278.pdf', 'inactive', '2025-07-18 13:42:35.904623+07');
INSERT INTO public.assignments (id, class_id, teacher_id, title, description, due_date, points, created_at, file_url, status, updated_at) VALUES (3, 2, 14, 'Operasi Bilangan Bulat', 'Kerjakan soal pada file yang sudah saya lampirkan, jangan lupa kumpulkan, Selamat mengerjakan 😁', '2025-07-18 23:00:00+07', 100, '2025-07-18 13:57:10.655069+07', 'uploads/assignments/assignment_1752821830542-219858828.pdf', 'active', '2025-07-18 13:57:10.655069+07');


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
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (7, 2, 1, '2025-07-09 13:31:34.88102+07', 'active');
INSERT INTO public.class_members (id, class_id, user_id, joined_at, status) VALUES (8, 5, 1, '2025-07-10 11:44:41.227206+07', 'active');


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (1, 'Bahasa Indonesia', 'Kelas E', 14, 'Kelas Bahasa Indonesia untuk semester Ganjil 2024', 'Senin, Rabu, Jumat', 'active', '2025-07-08 11:29:11.872816+07', '2025-07-08 11:29:11.872816+07');
INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (2, 'Matematika', 'Kelas E', 14, 'Kelas Matematika untuk semester Ganjil 2024', 'Selasa, Kamis', 'active', '2025-07-08 11:29:11.872816+07', '2025-07-08 11:29:11.872816+07');
INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (3, 'IPA', 'Kelas E', 14, 'Kelas IPA untuk semester Ganjil 2024', 'Rabu, Jumat', 'active', '2025-07-08 11:29:11.872816+07', '2025-07-08 11:29:11.872816+07');
INSERT INTO public.classes (id, name, grade, teacher_id, description, schedule, status, created_at, updated_at) VALUES (5, 'Musik', '7B', 13, '', 'Rabu, 11:00-12:30', 'active', '2025-07-10 11:44:18.01848+07', '2025-07-10 11:44:18.01848+07');


--
-- Data for Name: course_ratings; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.courses (id, title, description, thumbnail, price, level, duration, category_id, instructor_id, instructor_role, created_by, status, created_at, updated_at) VALUES (5, 'Bahasa Arab untuk Pemula', 'Kursus ini dibuat untuk testing', 'uploads/courses/1752079935795-480745696.webp', 0.00, 'beginner', 60, 11, 13, 'guru', 10, 'active', '2025-06-28 10:28:27.917121', '2025-07-09 23:52:15.841499');
INSERT INTO public.courses (id, title, description, thumbnail, price, level, duration, category_id, instructor_id, instructor_role, created_by, status, created_at, updated_at) VALUES (4, 'Bahasa Indonesia Lanjutan', 'Kursus ini dibuat untuk testing', 'uploads/courses/1752079963754-971003196.jpeg', 75000.00, 'advanced', 240, 8, 14, 'guru', 10, 'active', '2025-06-28 10:20:39.866916', '2025-07-09 23:52:43.796637');
INSERT INTO public.courses (id, title, description, thumbnail, price, level, duration, category_id, instructor_id, instructor_role, created_by, status, created_at, updated_at) VALUES (2, 'Verb', 'Kursus ini dibuat untuk testing', 'uploads/courses/1752079990930-442910427.jpeg', 0.00, 'beginner', 60, 9, 5, 'guru', 13, 'active', '2025-06-27 11:19:44.698268', '2025-07-09 23:53:10.972876');


--
-- Data for Name: daily_missions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.daily_missions (id, title, description, mission_type, target_count, xp_reward, is_active, created_at) VALUES (1, 'Complete 3 quizzes', 'Selesaikan 3 kuis hari ini', 'quiz', 3, 50, true, '2025-07-12 09:36:23.57473+07');
INSERT INTO public.daily_missions (id, title, description, mission_type, target_count, xp_reward, is_active, created_at) VALUES (2, 'Watch 5 tutorial videos', 'Tonton 5 video tutorial', 'video', 5, 30, true, '2025-07-12 09:36:23.57473+07');
INSERT INTO public.daily_missions (id, title, description, mission_type, target_count, xp_reward, is_active, created_at) VALUES (3, 'Solve 10 practice problems', 'Selesaikan 10 soal latihan', 'practice', 10, 100, true, '2025-07-12 09:36:23.57473+07');
INSERT INTO public.daily_missions (id, title, description, mission_type, target_count, xp_reward, is_active, created_at) VALUES (4, 'Play any game', 'Mainkan game apapun', 'game', 1, 25, true, '2025-07-12 09:36:23.57473+07');


--
-- Data for Name: daily_quiz_completions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.daily_quiz_completions (id, user_id, quiz_date, completed_quizzes, correct_answers, total_questions, xp_earned, created_at) VALUES (1, 1, '2025-07-12', 8, 182, 195, 728, '2025-07-12 18:00:22.321796+07');


--
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.enrollments (id, user_id, course_id, enrolled_at, status, completed_at) VALUES (1, 2, 5, '2025-07-18 22:04:18.92569', 'active', NULL);


--
-- Data for Name: game_progress; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: game_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.games (id, name, description, category, total_questions, questions_data, xp_per_question, is_active, created_at) VALUES (1, 'Pattern Puzzle', 'Tebak pola selanjutnya', 'Logic', 20, '{"type": "pattern", "sample_patterns": [{"answer": "🔴", "sequence": ["🔴", "🔵", "🔴", "🔵"]}, {"answer": "9", "sequence": ["1", "3", "5", "7"]}], "difficulty_levels": [1, 2, 3]}', 5, true, '2025-07-12 17:42:07.154508+07');
INSERT INTO public.games (id, name, description, category, total_questions, questions_data, xp_per_question, is_active, created_at) VALUES (2, 'Yes or No', 'Jawab benar atau salah', 'Knowledge', 25, '{"type": "true_false", "topics": ["science", "general_knowledge", "logic"], "sample_questions": [{"answer": true, "statement": "Matahari terbit dari timur"}, {"answer": false, "statement": "Bumi berbentuk datar"}]}', 4, true, '2025-07-12 17:42:07.154508+07');
INSERT INTO public.games (id, name, description, category, total_questions, questions_data, xp_per_question, is_active, created_at) VALUES (3, 'Maze Challenge', 'Selesaikan labirin', 'Strategy', 15, '{"type": "maze", "features": ["hints", "timer", "optimal_path"], "maze_sizes": ["5x5", "7x7", "9x9"], "difficulty_levels": ["easy", "medium", "hard"]}', 8, true, '2025-07-12 17:42:07.154508+07');


--
-- Data for Name: games_backup; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.games_backup (id, name, description, category, difficulty_level, xp_reward, image_url, is_active, created_at, total_questions, questions_data, xp_per_question) VALUES (1, 'Tebak Pola (Pattern Puzzle)', 'Tebak pola selanjutnya', 'Logic', 1, 25, '/images/pattern-puzzle.jpg', true, '2025-07-12 09:36:23.57473+07', 20, NULL, 5);
INSERT INTO public.games_backup (id, name, description, category, difficulty_level, xp_reward, image_url, is_active, created_at, total_questions, questions_data, xp_per_question) VALUES (2, 'Yes or No', 'Jawab benar atau salah', 'Decision', 1, 20, '/images/yes-no.jpg', true, '2025-07-12 09:36:23.57473+07', 25, NULL, 4);
INSERT INTO public.games_backup (id, name, description, category, difficulty_level, xp_reward, image_url, is_active, created_at, total_questions, questions_data, xp_per_question) VALUES (3, 'Maze Challenge', 'Selesaikan labirin', 'Strategy', 2, 35, '/images/maze.jpg', true, '2025-07-12 09:36:23.57473+07', 15, NULL, 8);


--
-- Data for Name: guru; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.guru (id, user_id, nuptk, nama_lengkap, no_telepon, registration_method) VALUES (1, 5, '23786543', 'Rosmaniah S.Pd', '8946346', 'manual');
INSERT INTO public.guru (id, user_id, nuptk, nama_lengkap, no_telepon, registration_method) VALUES (2, 13, '2312356', 'Budi Cahyono S.Kom, M.Kom,', '085321789553', 'manual');
INSERT INTO public.guru (id, user_id, nuptk, nama_lengkap, no_telepon, registration_method) VALUES (3, 14, '0012345678', 'Dr. Siti Aminah, M.Pd.', '0895322535389', 'manual');


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
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (327, 'Siti.Amh123@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-08 18:28:41.929163');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (328, 'Siti.Amh123@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-08 18:28:48.144926');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (329, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-08 18:28:49.374477');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (330, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-08 18:29:05.7585');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (331, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-09 09:31:40.126119');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (332, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 09:31:52.597921');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (333, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-09 13:14:27.242145');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (334, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 13:15:10.34492');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (335, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-09 13:30:11.179172');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (336, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-09 13:30:23.010427');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (337, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 13:30:37.875286');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (338, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-09 15:39:08.160412');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (339, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 15:40:36.334109');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (340, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-09 16:39:40.183292');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (341, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 16:39:51.39578');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (342, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-09 17:32:23.795676');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (343, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 17:32:35.092217');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (344, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-09 23:48:14.303532');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (345, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 23:48:38.94298');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (346, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-07-09 23:50:31.828241');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (347, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 23:50:39.505943');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (348, 'admin@platform.com', '::1', 'login', true, NULL, '2025-07-09 23:51:08.247882');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (349, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-07-09 23:51:15.28742');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (350, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-09 23:53:24.728906');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (351, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-09 23:53:29.151802');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (352, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 07:36:48.950525');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (353, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 07:37:06.71657');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (354, 'Siti.Amh123@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-10 07:39:12.046635');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (355, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-10 07:39:28.868742');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (356, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 07:39:48.863119');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (357, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-10 07:40:55.67129');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (358, 'tio@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-10 07:40:59.872147');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (359, 'tio@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-10 07:41:04.607428');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (360, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 07:41:12.964089');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (361, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-10 07:45:38.325092');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (362, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 08:38:41.224161');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (363, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 08:38:50.405324');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (364, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 10:31:52.83212');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (365, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 10:49:35.052414');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (366, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 10:55:24.956971');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (367, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 10:59:27.338029');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (368, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:02:35.906367');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (369, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:07:39.017257');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (370, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:16:23.177419');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (371, 'dimdev454@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:18:02.812509');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (372, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:20:00.559155');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (373, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:20:09.387418');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (374, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:20:16.523789');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (375, 'admin@platform.com', '::1', 'login', true, NULL, '2025-07-10 11:20:23.19226');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (376, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:20:28.747276');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (377, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:27:22.52025');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (378, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:27:31.574566');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (379, '64721111111', '::1', 'login', false, 'User not found', '2025-07-10 11:29:04.21417');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (380, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:29:24.784446');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (381, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:39:37.247196');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (382, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:39:53.877518');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (383, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:40:41.946864');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (384, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:40:48.644498');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (385, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:42:33.2364');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (386, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:42:41.74176');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (387, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:43:18.181487');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (388, 'tio@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-10 11:43:25.197096');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (389, 'tio@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-10 11:43:29.904086');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (390, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:43:38.14104');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (391, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:43:43.46544');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (392, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-10 11:46:38.967896');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (393, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-10 11:46:46.450138');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (394, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 16:49:40.196196');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (395, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 16:49:49.180666');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (396, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 17:33:43.05542');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (397, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 17:33:52.862213');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (398, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 17:49:27.86254');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (399, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 17:49:38.936236');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (400, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-11 17:55:39.245123');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (401, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 17:55:43.845279');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (402, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 17:55:49.740163');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (403, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 18:01:23.675752');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (404, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 18:01:36.140647');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (405, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 18:07:44.735153');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (406, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 18:07:50.467004');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (407, 'lintang.langitan@gmail.com', '::1', 'login', true, NULL, '2025-07-11 20:12:21.415424');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (408, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-07-11 20:17:34.673229');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (409, 'Budi@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-11 20:17:42.887939');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (410, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-07-11 20:18:21.507672');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (411, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 20:18:25.529482');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (412, 'admin@platform.com', '::1', 'login', true, NULL, '2025-07-11 20:21:11.987169');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (413, 'admin@platform.com', '::1', '2fa_verify', true, NULL, '2025-07-11 20:21:18.77735');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (414, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 21:52:12.386797');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (415, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 21:52:32.988024');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (416, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 22:51:47.816959');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (417, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 22:52:00.13284');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (418, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 22:57:07.011835');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (419, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 22:57:14.211472');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (420, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-11 23:02:50.099442');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (421, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-11 23:02:55.520457');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (422, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 08:43:47.342906');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (423, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 08:44:00.929795');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (424, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 08:45:19.230149');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (425, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 08:45:25.810868');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (426, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 08:47:56.674101');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (427, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 08:48:03.931996');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (428, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 08:54:31.081385');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (429, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 08:54:40.489959');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (430, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 08:58:17.905197');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (431, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 08:58:25.109531');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (432, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 09:17:06.556979');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (433, 'dimasrizky822@gmail.com', '::1', '2fa_verify', false, 'Invalid 2FA token', '2025-07-12 09:17:17.054554');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (434, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 09:17:22.5079');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (435, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 09:24:57.660571');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (436, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 09:25:05.288642');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (437, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 09:36:53.42482');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (438, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 09:37:07.82221');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (439, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 10:16:47.180054');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (440, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 10:16:56.785894');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (441, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 10:19:13.090746');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (442, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 10:19:17.826605');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (443, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 10:20:48.138258');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (444, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 10:20:54.209033');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (445, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 10:26:31.068676');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (446, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 10:26:37.110278');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (447, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 10:57:52.95294');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (448, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 10:58:02.524538');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (449, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 11:07:07.472642');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (450, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 11:07:14.319602');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (451, 'lintang.langitan@gmail.com', '::1', 'login', true, NULL, '2025-07-12 11:08:09.042337');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (452, 'lintang.langitan@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 11:08:16.105139');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (453, 'lintang.langitan@gmail.com', '::1', 'login', true, NULL, '2025-07-12 11:35:12.471505');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (454, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 11:35:32.28639');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (455, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 11:35:44.11363');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (456, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 14:21:00.223176');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (457, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 14:21:15.908199');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (458, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 17:49:17.255046');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (459, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 17:49:24.786987');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (460, 'lintang.langitan@gmail.com', '::1', 'login', true, NULL, '2025-07-12 18:05:37.163118');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (461, 'lintang.langitan@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 18:05:47.508209');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (462, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 18:11:51.607064');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (463, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 18:12:04.658669');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (464, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 23:12:30.731541');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (465, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 23:12:53.486759');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (466, 'Budi@gmail.com', '::1', 'login', true, NULL, '2025-07-12 23:13:27.232432');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (467, 'Budi@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 23:14:07.721506');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (468, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 23:15:00.147435');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (469, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 23:15:06.367756');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (470, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 23:45:05.103119');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (471, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 23:45:22.459302');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (472, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 23:47:44.006517');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (473, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 23:47:54.284325');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (474, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-12 23:53:24.325309');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (475, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-12 23:53:28.610304');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (476, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 00:00:57.480179');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (477, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 00:01:08.698547');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (478, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 00:07:54.205868');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (479, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 00:08:01.901942');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (480, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 00:16:47.314052');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (481, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 00:16:53.325084');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (482, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 00:21:26.402268');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (483, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 00:21:31.161634');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (484, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 00:48:15.125801');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (485, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 00:48:21.367468');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (486, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 01:09:26.188797');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (487, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 01:09:31.197829');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (488, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:00:29.262011');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (489, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:00:42.064149');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (490, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:09:28.255512');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (491, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:09:34.556072');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (492, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:15:06.759316');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (493, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:15:10.341377');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (494, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:21:19.36707');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (495, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:21:22.67971');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (496, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:23:07.601793');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (497, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:23:11.738908');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (498, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:28:00.544481');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (499, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:28:03.477349');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (500, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:35:02.99053');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (501, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:35:14.094244');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (502, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:40:52.602033');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (503, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:40:58.370757');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (504, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:43:48.931144');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (505, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:43:54.209656');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (506, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:53:34.233874');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (507, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:53:41.528588');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (508, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 02:59:29.723924');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (509, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 02:59:33.924802');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (510, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 03:05:51.122764');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (511, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 03:05:55.84396');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (512, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-13 03:09:38.151097');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (513, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-13 03:09:42.328649');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (514, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-14 14:06:01.220453');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (515, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-14 14:06:08.454549');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (516, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-14 14:07:03.452568');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (517, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-14 14:07:07.71346');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (518, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-16 20:35:10.589561');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (519, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-16 20:37:49.83504');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (520, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-16 20:51:26.851011');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (521, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-16 20:51:49.084871');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (522, 'ayu@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-16 21:06:51.379475');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (523, 'ayu@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-16 21:07:08.594257');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (524, 'ayu@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-16 21:07:12.310009');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (525, 'ayu@gmail.com', '::1', 'login', false, 'Invalid password', '2025-07-16 21:07:16.235359');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (526, 'dimasrizky822@gmail.com', '::1', 'login', true, NULL, '2025-07-17 08:26:12.472103');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (527, 'dimasrizky822@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-17 08:26:23.041731');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (528, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-18 02:47:32.838883');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (529, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 02:47:45.293119');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (530, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-18 09:12:42.47486');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (531, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 09:13:51.501012');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (532, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-18 13:42:05.547653');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (533, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 13:42:20.833844');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (534, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-18 13:58:56.803241');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (535, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 13:59:08.087863');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (536, 'Siti.Amh123@gmail.com', '::1', 'login', true, NULL, '2025-07-18 14:20:33.622692');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (537, 'Siti.Amh123@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 14:20:43.077447');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (538, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-18 14:21:36.780264');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (539, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 14:21:43.996626');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (540, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-18 20:13:05.210543');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (541, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 20:13:17.113295');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (542, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-18 21:25:41.609397');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (543, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-18 21:26:06.37577');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (544, 'tio@gmail.com', '::1', 'login', true, NULL, '2025-07-19 08:24:33.130731');
INSERT INTO public.login_attempts (id, email, ip_address, attempt_type, success, error_message, created_at) VALUES (545, 'tio@gmail.com', '::1', '2fa_verify', true, NULL, '2025-07-19 08:24:45.891003');


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.materials (id, class_id, teacher_id, title, description, file_url, file_type, uploaded_at, status, updated_at, file_size) VALUES (1, 3, 14, 'Mikroba Dan Organisme', 'Test', 'uploads/materials/material_1752057241567-529112644.pdf', 'pdf', '2025-07-09 17:34:01.663+07', 'inactive', '2025-07-09 17:34:50.471943+07', '66.51 KB');
INSERT INTO public.materials (id, class_id, teacher_id, title, description, file_url, file_type, uploaded_at, status, updated_at, file_size) VALUES (2, 3, 14, 'Test', 'test', 'uploads/materials/material_1752070547752-705730260.pdf', 'pdf', '2025-07-09 21:15:47.892329+07', 'active', '2025-07-09 21:15:47.892329+07', '66.51 KB');


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: orangtua; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orangtua (id, user_id, nik, nama_lengkap, no_telepon, registration_method) VALUES (2, 4, '94721234567', 'Ayu Ningsih', '0853224678', 'manual');
INSERT INTO public.orangtua (id, user_id, nik, nama_lengkap, no_telepon, registration_method) VALUES (3, 7, '9472000123', 'Suyatno Tejo', '081435472264', 'manual');


--
-- Data for Name: siswa; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon, registration_method, total_xp, current_level) VALUES (2, 2, '23523201', 'Tio Ananda', '94721234567', '0812345678', 'manual', 0, 1);
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon, registration_method, total_xp, current_level) VALUES (3, 6, '23523014', 'Nafis Ilyas Maulana', '9472000123', '08246810', 'manual', 0, 1);
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon, registration_method, total_xp, current_level) VALUES (4, 12, '23523264', 'sakti satya nagara', '977853635', '082142484', 'manual', 0, 1);
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon, registration_method, total_xp, current_level) VALUES (14, 18, '23523056', 'Cahya Lintang Ayu Langitan', '1234567890123456', '081226018341', 'manual', 0, 1);
INSERT INTO public.siswa (id, user_id, nis, nama_lengkap, nik_orangtua, no_telepon, registration_method, total_xp, current_level) VALUES (1, 1, '23523252', 'Muhamad Dimas', '647205080205008', '081256640452', 'manual', 2028, 19);


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.submissions (id, assignment_id, student_id, comment, file_url, file_size, submitted_at, score, feedback, status, graded_at, created_at, updated_at) VALUES (1, 3, 2, 'Wokeeeh', NULL, NULL, '2025-07-18 14:20:14.06888', 100, 'Bagus benar semua ya tio', 'graded', '2025-07-18 14:21:10.329805', '2025-07-18 14:20:14.06888', '2025-07-18 14:21:10.329805');


--
-- Data for Name: teacher_profiles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: temp_2fa_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.temp_2fa_tokens (id, user_id, temp_token, secret, expires_at, created_at) VALUES (32, 1, '119244', NULL, '2025-07-10 09:58:41.92', '2025-07-10 09:48:41.996192');


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_activity_log; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_daily_missions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_daily_missions (id, user_id, mission_id, current_progress, is_completed, completed_at, mission_date, created_at) VALUES (1, 1, 3, 22, true, '2025-07-12 18:00:22.321796+07', '2025-07-12', '2025-07-12 18:00:22.321796+07');
INSERT INTO public.user_daily_missions (id, user_id, mission_id, current_progress, is_completed, completed_at, mission_date, created_at) VALUES (2, 1, 4, 1, true, '2025-07-12 18:00:22.321796+07', '2025-07-12', '2025-07-12 18:00:22.321796+07');
INSERT INTO public.user_daily_missions (id, user_id, mission_id, current_progress, is_completed, completed_at, mission_date, created_at) VALUES (5, 1, 1, 3, true, '2025-07-12 18:04:00.816758+07', '2025-07-12', '2025-07-12 18:04:00.816758+07');


--
-- Data for Name: user_game_progress; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_game_progress (id, user_id, game_id, level, score, completion_percentage, last_played_at, total_play_time, created_at, updated_at, questions_completed, correct_answers, total_questions, session_count) VALUES (1, 1, 2, 1, 24, 0, '2025-07-13 01:46:10.97505+07', 0, '2025-07-12 18:00:22.321796+07', '2025-07-12 18:00:22.321796+07', 195, 182, 25, 8);


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
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (136, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUxOTcwNDIwLCJleHAiOjE3NTIwNTY4MjB9.N3sZDo9u171e3KvxPbO-X722iAPV6ZigWBVj2gdt0FQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 17:27:00.226', '2025-07-08 17:27:00.235794', '2025-07-08 18:28:35.438054', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (137, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTE5NzQxNDUsImV4cCI6MTc1MjA2MDU0NX0.SE-CsyEj4fm_pStIfTbj799gvcnjC1eh1W9255aAZ1c', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-09 18:29:05.764', '2025-07-08 18:29:05.766429', '2025-07-08 18:29:05.766429', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (138, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyMDI4MzEyLCJleHAiOjE3NTIxMTQ3MTJ9.sZnJXlCXr-jMD9CZMESTA3-FVSO55LDoeH9QXz-9d_A', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 09:31:52.614', '2025-07-09 09:31:52.619572', '2025-07-09 11:24:23.878409', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (139, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyMDQxNzEwLCJleHAiOjE3NTIxMjgxMTB9.4kqL4HCy8dHEy6u1D_FUOUpKbciLKXXeYoXft9r9AbE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 13:15:10.351', '2025-07-09 13:15:10.352651', '2025-07-09 13:16:22.349991', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (140, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTIwNDI2MzcsImV4cCI6MTc1MjEyOTAzN30.F08oPJ_jGYEAaP3YGDVybzbYicpzdVJhfYq_4LZQFCM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 13:30:37.882', '2025-07-09 13:30:37.883577', '2025-07-09 15:39:02.627149', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (141, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyMDUwNDM2LCJleHAiOjE3NTIxMzY4MzZ9.udMHscoEcEjZU7V4__vmyQ9iiiAco4KzMVG1jj1ZlfA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 15:40:36.338', '2025-07-09 15:40:36.340644', '2025-07-09 15:40:36.340644', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (142, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyMDUzOTkxLCJleHAiOjE3NTIxNDAzOTF9.mYuWSHf79_O7sKa3j8F401WUlToaBsWq9pvnHPLP6ME', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 16:39:51.401', '2025-07-09 16:39:51.402104', '2025-07-09 17:32:19.826526', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (143, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTIwNTcxNTUsImV4cCI6MTc1MjE0MzU1NX0._AtKMbHSWPZcFJIiqwFQ_-hVLiyfpNcrafcaUk3X1wg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 17:32:35.098', '2025-07-09 17:32:35.100224', '2025-07-09 17:32:35.100224', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (144, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjA3OTcxOCwiZXhwIjoxNzUyMTY2MTE4fQ.wrRtsVyWjjISMeyLh7mmBJL1OkS9-QLDt8EDp__GRYI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 23:48:38.951', '2025-07-09 23:48:38.952691', '2025-07-09 23:50:28.697601', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (145, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MjA3OTgzOSwiZXhwIjoxNzUyMTY2MjM5fQ.wsQTCQOUqnMHi_PAt256U-YcSZaC3SwymAf7t71T2l0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 23:50:39.509', '2025-07-09 23:50:39.509597', '2025-07-09 23:51:05.246548', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (146, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUyMDc5ODc1LCJleHAiOjE3NTIxNjYyNzV9.IRAHtiJ7r-Zj2wL18hDu6wFly5Q0I-GszRIpNnUz2SU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 23:51:15.288', '2025-07-09 23:51:15.288647', '2025-07-09 23:51:15.288647', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (147, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjA4MDAwOSwiZXhwIjoxNzUyMTY2NDA5fQ.mzatziGlvLxZ-7ArLuoTBM2RCgrvtR5F9Fb2Iqknexk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-10 23:53:29.152', '2025-07-09 23:53:29.153968', '2025-07-09 23:56:01.558201', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (148, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEwNzgyNiwiZXhwIjoxNzUyMTk0MjI2fQ.BouQP6NX39b6_wkk2lAvNAhe16rqezpSJEAjwhfydxQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 07:37:06.721', '2025-07-10 07:37:06.724473', '2025-07-10 07:37:43.530022', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (149, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTIxMDc5ODgsImV4cCI6MTc1MjE5NDM4OH0.WxDfxez-zvjnA81_c5WRp4TXsRFmwb7C4lqZ7Q4wRdU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 07:39:48.865', '2025-07-10 07:39:48.865873', '2025-07-10 07:40:47.660294', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (150, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyMTA4MDcyLCJleHAiOjE3NTIxOTQ0NzJ9.Z5p3pNAsBxVVHkuGSU0hynTpuXjkVsd5tykxerIo5H0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 07:41:12.966', '2025-07-10 07:41:12.966834', '2025-07-10 07:45:13.755627', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (151, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjExMTUzMCwiZXhwIjoxNzUyMTk3OTMwfQ.YDzXFV96-I6V3053xmzUJK09kkw1Fc_ywy5I7iWQjpE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 08:38:50.405', '2025-07-10 08:38:50.408922', '2025-07-10 08:45:06.018796', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (185, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5MDc5NywiZXhwIjoxNzUyMzc3MTk3fQ.DI76UgcO67OWhFdYYgUmEYOOMrxRvSP5gmd0wf2j0P0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 10:26:37.111', '2025-07-12 10:26:37.112945', '2025-07-12 10:26:37.112945', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (152, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsInJvbGUiOiJzaXN3YSIsImlhdCI6MTc1MjExNTcyMSwiZXhwIjoxNzUyMjAyMTIxfQ.fJ8UDCHOcfkV2GJDsallIjY10tLYKJUTI_442e_moQA', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzUyMTE1NzIxLCJleHAiOjE3NTI3MjA1MjF9.Dc8bT7uN66COVs7Xmq6i6m9LEPaXA5t7EOHofXQMm3k', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 09:48:41.812', '2025-07-10 09:48:41.89631', '2025-07-10 09:48:41.89631', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (153, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMTIwOSwiZXhwIjoxNzUyMjA3NjA5fQ.xcI8wm7eUm68CFHIF27NRDN4zwH7wc8mIM4hZw_yczY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:20:09.388', '2025-07-10 11:20:09.388756', '2025-07-10 11:20:12.433451', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (154, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUyMTIxMjI4LCJleHAiOjE3NTIyMDc2Mjh9.zxj5VdwxgL8WzLBrWarPQWQI608btTN4ul0zeMivhTw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:20:28.748', '2025-07-10 11:20:28.749092', '2025-07-10 11:20:28.749092', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (155, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMTY1MSwiZXhwIjoxNzUyMjA4MDUxfQ.asYgqdGzCxy6cPI_L6SGfeC8rEArYQybhjb4hyK-1Ag', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:27:31.577', '2025-07-10 11:27:31.582641', '2025-07-10 11:27:31.582641', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (156, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMjM5MywiZXhwIjoxNzUyMjA4NzkzfQ.9h4f2YMHDPdjaLTitsQaj9SE8Af0tvpmsJhpC22x560', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:39:53.876', '2025-07-10 11:39:53.881227', '2025-07-10 11:40:24.529429', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (157, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMjQ0OCwiZXhwIjoxNzUyMjA4ODQ4fQ.fpOmdYA2Jio2Dau2-2NKTn9QnFz153lgE5sfmZxg_m4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:40:48.641', '2025-07-10 11:40:48.645993', '2025-07-10 11:40:48.645993', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (158, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMjU2MSwiZXhwIjoxNzUyMjA4OTYxfQ.MhkG7_0jLozvqP45EC02HV974mQcOhBIDtyCn3t7Trg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:42:41.743', '2025-07-10 11:42:41.744999', '2025-07-10 11:43:14.63981', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (159, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMjYyMywiZXhwIjoxNzUyMjA5MDIzfQ.bvoKFrm_REb_jN4u1GpulTqqPDoJECtxXT8Ma_d6Ch0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:43:43.466', '2025-07-10 11:43:43.46823', '2025-07-10 11:46:32.369763', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (160, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjEyMjgwNiwiZXhwIjoxNzUyMjA5MjA2fQ.VK-BQoAHwOTOYvC9tqiGVCdrqYgpMSzBZFSx3sUq3H0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-11 11:46:46.451', '2025-07-10 11:46:46.452237', '2025-07-10 11:47:54.11894', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (161, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIyNzM4OSwiZXhwIjoxNzUyMzEzNzg5fQ.eMGMsdGOyXeJ-F03rwNHjT5Zaq731fkhYA5aVqayQ0w', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 16:49:49.189', '2025-07-11 16:49:49.189755', '2025-07-11 16:50:59.640543', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (166, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIzMjA3MCwiZXhwIjoxNzUyMzE4NDcwfQ.YFsstCkH-53tsU1yOH0BGWv5O7_BJInyyZdty-Pl0J0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 18:07:50.47', '2025-07-11 18:07:50.470633', '2025-07-11 18:09:52.932796', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (163, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIzMDk3OCwiZXhwIjoxNzUyMzE3Mzc4fQ.JUOAJ4pi9kOsT8qHi6rbC6ccqzQ03GBcJJAMgKlbEVY', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 17:49:38.939', '2025-07-11 17:49:38.940119', '2025-07-11 17:55:23.617518', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (162, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIzMDAzMiwiZXhwIjoxNzUyMzE2NDMyfQ.W5K738aE8k8RVEpFAI7LRnyGwmuyS994lxS1abiZsh8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 17:33:52.864', '2025-07-11 17:33:52.865373', '2025-07-11 17:49:04.668057', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (165, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIzMTY5NiwiZXhwIjoxNzUyMzE4MDk2fQ.kUZ5o_aLGKGjz2oroDHQpvZIFZptfQAEDedhTf2O23k', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 18:01:36.145', '2025-07-11 18:01:36.145763', '2025-07-11 18:04:05.225664', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (164, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIzMTM0OSwiZXhwIjoxNzUyMzE3NzQ5fQ.pb2_QG_Iw6QYnm4yKENqhhia0wnzfemQX4n37hl5Gvs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 17:55:49.742', '2025-07-11 17:55:49.743021', '2025-07-11 18:01:02.726516', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (168, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MjIzOTkwNSwiZXhwIjoxNzUyMzI2MzA1fQ.q58gOcOwYqhq2K3bfDtMdAan-8-abUEwu5jWB4Fttj0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 20:18:25.531', '2025-07-11 20:18:25.532685', '2025-07-11 20:19:19.362985', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (167, 18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsInJvbGUiOiJzaXN3YSIsImVtYWlsIjoibGludGFuZy5sYW5naXRhbkBnbWFpbC5jb20iLCJpYXQiOjE3NTIyMzk1ODUsImV4cCI6MTc1MjMyNTk4NX0.bIDgxCSxV3ZuAf_VmbJJ39jGRAU2Zls3vxgEwt1CBxs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 20:13:05.666', '2025-07-11 20:13:05.667727', '2025-07-11 20:17:29.72536', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (169, 10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWRtaW5AcGxhdGZvcm0uY29tIiwiaWF0IjoxNzUyMjQwMDc4LCJleHAiOjE3NTIzMjY0Nzh9.7t0dfKxqe249FIhNGX8z_OlZdujcEAdFB0UyBeIJmTw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 20:21:18.778', '2025-07-11 20:21:18.779811', '2025-07-11 20:21:18.779811', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (170, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI0NTU1MiwiZXhwIjoxNzUyMzMxOTUyfQ.7b-XIra8sOQNFerUtNh4YLOPT_As7yWD175NGcHE700', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 21:52:32.995', '2025-07-11 21:52:33.000773', '2025-07-11 22:10:36.134831', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (171, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI0OTEyMCwiZXhwIjoxNzUyMzM1NTIwfQ.coYZ7wvqCZ0Ixm8pFxZ2XTAsiAdfXpE2nNQYDTsdZ_k', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 22:52:00.136', '2025-07-11 22:52:00.137879', '2025-07-11 22:52:00.137879', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (172, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI0OTQzNCwiZXhwIjoxNzUyMzM1ODM0fQ.hsJQsoS_eLDSCfGMZOfPDoXV-PVQY07Rvmw3En0enT4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 22:57:14.212', '2025-07-11 22:57:14.213252', '2025-07-11 22:57:14.213252', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (173, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI0OTc3NSwiZXhwIjoxNzUyMzM2MTc1fQ.jhxZnVGMbGjoewh5NTheH1K7Sl3azeUYAt__tS8zHcg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-12 23:02:55.524', '2025-07-11 23:02:55.525675', '2025-07-11 23:02:55.525675', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (174, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NDY0MCwiZXhwIjoxNzUyMzcxMDQwfQ.XWZzi_ydskTQyNCf2hA3poWcO297Y0JNwkSXZGjCZNI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 08:44:00.934', '2025-07-12 08:44:00.936123', '2025-07-12 08:44:00.936123', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (175, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NDcyNSwiZXhwIjoxNzUyMzcxMTI1fQ.HG1_0mTXA9G8OcC-Qm1rXas_RAnoKeQl0z6z3gU89ls', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 08:45:25.812', '2025-07-12 08:45:25.813406', '2025-07-12 08:45:25.813406', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (176, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NDg4MywiZXhwIjoxNzUyMzcxMjgzfQ.4WxjrUDcpKS1N4uF-aj55__fQiWi1h_tVms6IwzyXiE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 08:48:03.933', '2025-07-12 08:48:03.935449', '2025-07-12 08:48:03.935449', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (177, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NTI4MCwiZXhwIjoxNzUyMzcxNjgwfQ.AYQNfe7n4bEA4XvHFBadd9nudB-_m4qN7JFTcJbBvOs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 08:54:40.492', '2025-07-12 08:54:40.493465', '2025-07-12 08:54:40.493465', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (178, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NTUwNSwiZXhwIjoxNzUyMzcxOTA1fQ.dwnVwmB7Dmbc58pKx1uDuUVJYC_UbTfRKUG_-wwZ4C8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 08:58:25.111', '2025-07-12 08:58:25.112803', '2025-07-12 08:58:25.112803', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (179, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NjY0MiwiZXhwIjoxNzUyMzczMDQyfQ.GqxrZwJEKL7rpZiMs5OQGXPpxeKbNseyp77qg0cmrmQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 09:17:22.512', '2025-07-12 09:17:22.513743', '2025-07-12 09:17:22.513743', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (180, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NzEwNSwiZXhwIjoxNzUyMzczNTA1fQ.tYbkPf2en8Y94pp40MY6TpbStNhd57UUClrJO9L8m4M', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 09:25:05.291', '2025-07-12 09:25:05.291975', '2025-07-12 09:25:05.291975', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (181, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI4NzgyNywiZXhwIjoxNzUyMzc0MjI3fQ.EE7OnqQ_OAsl6O4bcTcgp6WhfqTz4KFNxuMOJ3iy2fo', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 09:37:07.826', '2025-07-12 09:37:07.827159', '2025-07-12 09:37:07.827159', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (182, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5MDIxNiwiZXhwIjoxNzUyMzc2NjE2fQ.I7amfDWVdmDyfKpbpynKuM0hW7YcKoiqH3FY_OOSRvs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 10:16:56.787', '2025-07-12 10:16:56.789327', '2025-07-12 10:16:56.789327', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (183, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5MDM1NywiZXhwIjoxNzUyMzc2NzU3fQ.2pbTjwIHwTkCioPnUnATth35l7bRwbcpJSUvfO6RpY0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 10:19:17.829', '2025-07-12 10:19:17.830143', '2025-07-12 10:19:17.830143', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (186, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5MjY4MiwiZXhwIjoxNzUyMzc5MDgyfQ.OlLV8eos8ctiO_j8jh0qckfTmcIngv0QK1_yC7KTEg8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 10:58:02.528', '2025-07-12 10:58:02.52924', '2025-07-12 10:58:02.52924', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (184, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5MDQ1NCwiZXhwIjoxNzUyMzc2ODU0fQ.NCTaVvD23c0BqRK2hUg5wV4SuagQOdWDDPIaRxvo-iM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 10:20:54.21', '2025-07-12 10:20:54.210967', '2025-07-12 10:20:54.210967', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (187, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5MzIzNCwiZXhwIjoxNzUyMzc5NjM0fQ.v5zbk4QbuzrSwEFPDwOD3LvMaYkdQfCfpI-yDYy0tS4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 11:07:14.322', '2025-07-12 11:07:14.323356', '2025-07-12 11:07:57.079023', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (188, 18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsInJvbGUiOiJzaXN3YSIsImVtYWlsIjoibGludGFuZy5sYW5naXRhbkBnbWFpbC5jb20iLCJpYXQiOjE3NTIyOTMyOTYsImV4cCI6MTc1MjM3OTY5Nn0.iIGt7hSyysil1yrYZhGXPknnXCISBTyiruojTKKMOEI', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 11:08:16.106', '2025-07-12 11:08:16.107394', '2025-07-12 11:08:16.107394', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (189, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjI5NDk0NCwiZXhwIjoxNzUyMzgxMzQ0fQ.LbCkSYfGO0XwVc8H6_ni7YCbcmahmuk7fwSU_FHJj7I', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 11:35:44.116', '2025-07-12 11:35:44.11843', '2025-07-12 11:39:54.747488', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (190, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMwNDg3NSwiZXhwIjoxNzUyMzkxMjc1fQ.jn-zAUXznsVJvRrlOdKtCUbcPvpcoixPeGY7fuqJTl0', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 14:21:15.911', '2025-07-12 14:21:15.912262', '2025-07-12 14:21:15.912262', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (191, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMxNzM2NCwiZXhwIjoxNzUyNDAzNzY0fQ.8F59FDG6wiy0w4STMJ8Gtu-p4ejhz9SzWYK7Zv_gE0I', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 17:49:24.789', '2025-07-12 17:49:24.790051', '2025-07-12 18:05:26.626881', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (192, 18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTgsInJvbGUiOiJzaXN3YSIsImVtYWlsIjoibGludGFuZy5sYW5naXRhbkBnbWFpbC5jb20iLCJpYXQiOjE3NTIzMTgzNDcsImV4cCI6MTc1MjQwNDc0N30.LTsbsvOHqjcU7OSLC5T_ZiERWaEAOIOV8tJI96Ryx3Y', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 18:05:47.51', '2025-07-12 18:05:47.511583', '2025-07-12 18:11:47.398264', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (193, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMxODcyNCwiZXhwIjoxNzUyNDA1MTI0fQ.WcU3oN4NVU7iykLcCWqGtVJnBBFN3hnKZM1qxjgEFuk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 18:12:04.66', '2025-07-12 18:12:04.661229', '2025-07-12 18:13:53.203106', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (194, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzNjc3MywiZXhwIjoxNzUyNDIzMTczfQ.rgSGg7fU4sEWJnr1WhILr4jYfsT06iSSnYNBPMkCRqQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 23:12:53.49', '2025-07-12 23:12:53.492217', '2025-07-12 23:13:22.316424', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (195, 13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJCdWRpQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzNjg0NywiZXhwIjoxNzUyNDIzMjQ3fQ.J-arp6iid1ajc92fZ7fpXfMPQW1mYobTJYGIpttk6kA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 23:14:07.722', '2025-07-12 23:14:07.723513', '2025-07-12 23:14:54.817767', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (196, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzNjkwNiwiZXhwIjoxNzUyNDIzMzA2fQ.tGSe3cIoNVn_0Fqq4tOr4uAVJRPr2dz0DKfJivyaT10', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 23:15:06.368', '2025-07-12 23:15:06.369095', '2025-07-12 23:15:06.369095', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (197, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzODcyMiwiZXhwIjoxNzUyNDI1MTIyfQ.EX_oIK7rHBAUO-vQQs83-rcBMFrsh0Z-dEal6EsZquA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 23:45:22.461', '2025-07-12 23:45:22.462936', '2025-07-12 23:45:22.462936', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (198, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzODg3NCwiZXhwIjoxNzUyNDI1Mjc0fQ.KDRXzHdbglM6IuwhE1N-vV1Z1qoZvtlK5tM85Z0d8Ts', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 23:47:54.286', '2025-07-12 23:47:54.287527', '2025-07-12 23:47:54.287527', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (199, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzOTIwOCwiZXhwIjoxNzUyNDI1NjA4fQ.JYc7wLG_Rt1pesTyGARPGq4RrSdteUd01IwaPktuNmw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-13 23:53:28.611', '2025-07-12 23:53:28.612505', '2025-07-12 23:53:28.612505', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (200, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjMzOTY2OCwiZXhwIjoxNzUyNDI2MDY4fQ.DyoOrVsTd9Spypi5d9V38Ib1Dpx0L1k7RgAvyW20wQE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 00:01:08.908', '2025-07-13 00:01:08.908662', '2025-07-13 00:01:08.908662', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (201, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0MDA4MSwiZXhwIjoxNzUyNDI2NDgxfQ.S38tzX6-ETCs9W8xdyAfR8xiDF4kEoBc879vJ7RAg8A', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 00:08:01.904', '2025-07-13 00:08:01.905432', '2025-07-13 00:08:01.905432', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (202, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0MDYxMywiZXhwIjoxNzUyNDI3MDEzfQ.NrBVHQHs1D3ShFxh63QJiL8KEY-m7pZX0rGf7Mn980M', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 00:16:53.326', '2025-07-13 00:16:53.327403', '2025-07-13 00:16:53.327403', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (203, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0MDg5MSwiZXhwIjoxNzUyNDI3MjkxfQ.VJRKC6ea3TAw47Q1jcG5ryWKNnx6mmt3Gknad4nThnQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 00:21:31.162', '2025-07-13 00:21:31.163427', '2025-07-13 00:21:31.163427', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (204, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0MjUwMSwiZXhwIjoxNzUyNDI4OTAxfQ.0-jk_aF78F0u4tmhOU_RHTKotN4k_HT8KUh_ifAYeDw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 00:48:21.37', '2025-07-13 00:48:21.37083', '2025-07-13 00:48:21.37083', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (205, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0Mzc3MSwiZXhwIjoxNzUyNDMwMTcxfQ.IgixozUnc-CaOJGJMsbE7So3tzbYTLODHdn_ujWcnv4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 01:09:31.194', '2025-07-13 01:09:31.200556', '2025-07-13 01:09:31.200556', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (206, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0Njg0MiwiZXhwIjoxNzUyNDMzMjQyfQ.Dj4MKDgth2bFi06c6FJnbsArQ_QDtemSuPFjrwlWYFg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:00:42.064', '2025-07-13 02:00:42.067629', '2025-07-13 02:00:42.067629', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (207, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0NzM3NCwiZXhwIjoxNzUyNDMzNzc0fQ.knjalCdD6IEiHEJb0HnT0DIKiavg5ym2XG7Ez_lU8bg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:09:34.555', '2025-07-13 02:09:34.558462', '2025-07-13 02:09:34.558462', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (208, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0NzcxMCwiZXhwIjoxNzUyNDM0MTEwfQ.2jGu42NkcKd-7JynU-T0XA6RDqHFksjF1jAjo1MITXc', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:15:10.34', '2025-07-13 02:15:10.344414', '2025-07-13 02:15:10.344414', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (209, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0ODA4MiwiZXhwIjoxNzUyNDM0NDgyfQ.xTvuG17EKr7yUOOaqIRPSek4D0PTFCKOWnAGrre5aSw', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:21:22.681', '2025-07-13 02:21:22.682341', '2025-07-13 02:21:22.682341', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (210, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0ODE5MSwiZXhwIjoxNzUyNDM0NTkxfQ.WVp2X-USRVDOdtLa3BOEMukmabMQ-0pdGoCENYW2-Kg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:23:11.74', '2025-07-13 02:23:11.740882', '2025-07-13 02:23:11.740882', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (211, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0ODQ4MywiZXhwIjoxNzUyNDM0ODgzfQ.2VkZYHLXDV7L2Y1Jcj5q2NLLOyNC3uJsNYeZhgxo5ks', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:28:03.48', '2025-07-13 02:28:03.481164', '2025-07-13 02:28:03.481164', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (212, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0ODkxNCwiZXhwIjoxNzUyNDM1MzE0fQ.cRVRFT4uMnhUF4EmmMQdMvF8ONnJUGfMHkt1kb1JTPs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:35:14.098', '2025-07-13 02:35:14.098825', '2025-07-13 02:35:14.098825', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (213, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0OTI1OCwiZXhwIjoxNzUyNDM1NjU4fQ.iE5evPg3sv5PN2pdMZjjBnDBLVUlQRMJQszZMjeHk6k', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:40:58.372', '2025-07-13 02:40:58.373618', '2025-07-13 02:40:58.373618', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (214, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM0OTQzNCwiZXhwIjoxNzUyNDM1ODM0fQ.MGd6J_RDo5x03Z1FFiG0UpKiEiVg5sm7YKR5zwNB1Po', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:43:54.207', '2025-07-13 02:43:54.212397', '2025-07-13 02:43:54.212397', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (215, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM1MDAyMSwiZXhwIjoxNzUyNDM2NDIxfQ.SfzF2qG99y3k74rqseSFnWSTXCzJESgLIi0lA1gL6FU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:53:41.524', '2025-07-13 02:53:41.53107', '2025-07-13 02:53:41.53107', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (216, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM1MDM3MywiZXhwIjoxNzUyNDM2NzczfQ.CjPN25Ukoz5eY3gAuKjFhyTiPUeluzkFiNPSBOAtcQM', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 02:59:33.927', '2025-07-13 02:59:33.927739', '2025-07-13 02:59:33.927739', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (217, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM1MDc1NSwiZXhwIjoxNzUyNDM3MTU1fQ.ZMZo6v-0UtdfKy14MOYuF3b5IT_l2K01UIQvCstAgwU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 03:05:55.84', '2025-07-13 03:05:55.846819', '2025-07-13 03:05:55.846819', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (218, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjM1MDk4MiwiZXhwIjoxNzUyNDM3MzgyfQ.EAazJaM6PYceCnSSKnw8k5A9mMJIK1Gxjra1Vua2L24', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-14 03:09:42.326', '2025-07-13 03:09:42.331158', '2025-07-13 03:09:42.331158', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (219, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyNDc2NzY4LCJleHAiOjE3NTI1NjMxNjh9.CfXW94d0T4ryFQYcO92Bj6ovbP4BFKDMel59P8QklQA', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-15 14:06:08.46', '2025-07-14 14:06:08.461813', '2025-07-14 14:06:56.229108', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (220, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTI0NzY4MjcsImV4cCI6MTc1MjU2MzIyN30.puuUIWhf_0PDXNPCVkgKk01Fd8o6Tq4aqkotpbWIb0g', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-15 14:07:07.716', '2025-07-14 14:07:07.718099', '2025-07-14 14:07:07.718099', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (221, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyNjczMDY5LCJleHAiOjE3NTI3NTk0Njl9.PlMkQkGdCSVwJFngXVE6b_lRxD8IRD1_pZeXULnJpO4', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-17 20:37:49.842', '2025-07-16 20:37:49.844424', '2025-07-16 20:51:17.463883', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (222, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTI2NzM5MDksImV4cCI6MTc1Mjc2MDMwOX0.ddxTMUDWra0aPtoQ1zrbLMszvxgm0PaGplA-tSP8B4k', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-17 20:51:49.093', '2025-07-16 20:51:49.093715', '2025-07-16 20:52:47.467409', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (225, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyODA0ODMxLCJleHAiOjE3NTI4OTEyMzF9.jBHcEVVf3EIbMMmdGNaQu9DifUrlGyncomCIqkrRTPo', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 09:13:51.505', '2025-07-18 09:13:51.51459', '2025-07-18 13:41:58.528494', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (223, 1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJkaW1hc3Jpemt5ODIyQGdtYWlsLmNvbSIsImlhdCI6MTc1MjcxNTU4MywiZXhwIjoxNzUyODAxOTgzfQ.SXi2xAvZk_ET9opcpoyUaSDBLvVMTyWE3kfJBDuTAx8', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-18 08:26:23.062', '2025-07-17 08:26:23.066805', '2025-07-17 08:27:29.319018', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (226, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTI4MjA5NDAsImV4cCI6MTc1MjkwNzM0MH0.sfJUrv_8T7y9uxZCaAljRHYGcG6Bj5whBy_32r7BNYU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 13:42:20.843', '2025-07-18 13:42:20.847827', '2025-07-18 13:58:50.949436', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (224, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyNzgxNjY1LCJleHAiOjE3NTI4NjgwNjV9.AaEx7tcxad5J61NAVhWnXWnFiNJ4AfOkhHDZR6ffP7E', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 02:47:45.307', '2025-07-18 02:47:45.31078', '2025-07-18 08:50:36.199257', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (227, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyODIxOTQ4LCJleHAiOjE3NTI5MDgzNDh9.ax4-Dbc14AwRf-79lbHucG6rYf2wYyHI96oJt1iFYjE', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 13:59:08.092', '2025-07-18 13:59:08.094359', '2025-07-18 14:20:27.310377', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (228, 14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTQsInJvbGUiOiJndXJ1IiwiZW1haWwiOiJTaXRpLkFtaDEyM0BnbWFpbC5jb20iLCJpYXQiOjE3NTI4MjMyNDMsImV4cCI6MTc1MjkwOTY0M30.85FAU5Sat7iNqNUK04l8l5dBpiZWws6vJQp2Qx-49yQ', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 14:20:43.087', '2025-07-18 14:20:43.090162', '2025-07-18 14:21:25.366817', false);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (229, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyODIzMzA0LCJleHAiOjE3NTI5MDk3MDR9.O3vH_I4L0hCtggXuitJvpr-pGa_qPTb6mQQ-QSTOExg', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 14:21:44.001', '2025-07-18 14:21:44.002774', '2025-07-18 14:21:44.002774', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (232, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyODg4Mjg1LCJleHAiOjE3NTI5NzQ2ODV9.ug_Y2POoAarEXwmgaIeB_hCmaLDE1eBbJXEY9V3m1Lk', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-07-20 08:24:45.9', '2025-07-19 08:24:45.906243', '2025-07-19 09:19:33.10955', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (231, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyODQ4NzY2LCJleHAiOjE3NTI5MzUxNjZ9.RC9_en-UcIVB20_F_FIBDQjtMWT2uGYgRYj5umLHubs', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 21:26:06.378', '2025-07-18 21:26:06.385147', '2025-07-18 21:56:28.459834', true);
INSERT INTO public.user_sessions (id, user_id, session_token, refresh_token, ip_address, user_agent, expires_at, created_at, last_activity, is_active) VALUES (230, 2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InNpc3dhIiwiZW1haWwiOiJ0aW9AZ21haWwuY29tIiwiaWF0IjoxNzUyODQ0Mzk3LCJleHAiOjE3NTI5MzA3OTd9.aPeolgJhDlHKha5978hZSryQOENMXI-eGyInKErZnkU', NULL, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '2025-07-19 20:13:17.121', '2025-07-18 20:13:17.124201', '2025-07-18 21:17:34.721397', true);


--
-- Data for Name: user_streaks; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_streaks (id, user_id, current_streak, longest_streak, last_activity_date, streak_start_date, created_at, updated_at, last_reset_date, is_active) VALUES (2, 18, 0, 0, NULL, NULL, '2025-07-12 18:05:49.998576+07', '2025-07-12 18:05:49.998576+07', '2025-07-12', false);
INSERT INTO public.user_streaks (id, user_id, current_streak, longest_streak, last_activity_date, streak_start_date, created_at, updated_at, last_reset_date, is_active) VALUES (1, 1, 1, 8, '2025-07-13', '2025-07-12', '2025-07-12 08:54:42.734351+07', '2025-07-12 08:54:42.734351+07', '2025-07-12', false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (7, 'tejo@gmail.com', '$2b$10$iDdH/7Jao9MUlVlw36jnGufSoslRYnklQXZS24MWh/ntntqteW8tO', 'orangtua', '2025-05-11 02:24:15.275135+07', '2025-05-11 02:24:24.716664+07', NULL, false, NULL, NULL, NULL, NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (4, 'ayu@gmail.com', '$2b$10$2rqlr.KsFu.7pe7qVuiwu.QTKmyefcVLc9mTFZpy7MiM0WI/0X1hC', 'orangtua', '2025-05-09 11:21:33.881021+07', '2025-06-23 21:28:40.157746+07', NULL, true, 'FY5HEI35EN6XONJYM5TFIW2AFE3HI2LZKRJHQZ2QMVNUCTK6EZGA', NULL, NULL, NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (12, 'sakti@gmail.com', '$2b$10$h/MpsaPMYm38ZJDNi9My6OVY2t3VJHM..KeqNOvEVbiFlUXMCzu2G', 'siswa', '2025-06-26 07:46:52.905692+07', '2025-06-26 07:48:28.610203+07', NULL, true, 'NRLVO2JMEUXWC2CKNVAS6UCGIJEDIJCSGIVFA4SEOIUGWXTJEVMA', NULL, NULL, NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (5, 'ros@gmail.com', '$2b$10$Uc4yBIVgBocnkP6W/3ituel4Z.8ypaJeKn.avWfOc8.dl/ZfCF5Py', 'guru', '2025-05-09 11:44:14.150172+07', '2025-06-26 22:39:25.178667+07', NULL, true, 'NVFXCTKGLBGEEMDDIVBXEQDIFFGES6KWGQ6HOMTHIIYUA4COPV3A', NULL, NULL, NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (6, 'nafis@gmail.com', '$2b$10$Q4Vuf/yYl6SOisWi5fP7yu32E1PTfO0UNnzp87aKKKGBi/Vg03AyK', 'siswa', '2025-05-11 02:21:14.196755+07', '2025-06-16 07:55:37.582099+07', NULL, false, NULL, NULL, NULL, NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (18, 'lintang.langitan@gmail.com', '$2b$10$XP7mHnnqiG4Qswejk.MnX.YSuUfmivNMA1SXLtfrh5cPy3yXn033O', 'siswa', '2025-07-11 20:12:02.683229+07', '2025-07-12 18:05:47.506704+07', 'uploads/profile-pictures/profile_18_1752239765046.png', true, 'EVKFWLZXMJUE2RR6FJCUAVL5GZDH2233GZFTS22JFEZESYTUMU2A', NULL, '2025-07-12 18:05:47.506704', NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (10, 'admin@platform.com', '$2b$10$Xfm.yJfMM9uY07efA8Zf9enI7JONqBVh89EtDe34pdhxuJ33SdHWu', 'admin', '2025-06-18 10:14:51.162478+07', '2025-07-11 20:21:18.774647+07', 'uploads/profile-pictures/profile_10_1750691161410.png', true, 'NN2EG4CAEE2CQXLVGF6WGYLGKJGCYWRWF4RXC63OHZRHAOB4LJKA', NULL, '2025-07-11 20:21:18.774647', NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (13, 'Budi@gmail.com', '$2b$10$LT.UfepEsjDdLsqOOiTMpe9t1./k7SWsbwkP1lDcxX4p4rbVBIoBu', 'guru', '2025-06-26 22:46:31.163405+07', '2025-07-12 23:14:07.719792+07', NULL, true, 'HBSSG2CUKVXCU6JPGVIFU5TVHZWHKILHLJHGKZSUFFDESYKCMJ4A', NULL, '2025-07-12 23:14:07.719792', NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (14, 'Siti.Amh123@gmail.com', '$2b$10$uXPVa/lQuEbZs3RR8naQReGdN2sfNeuxoROdu/qK1INRLVC6JvXxK', 'guru', '2025-07-06 23:10:42.212824+07', '2025-07-18 14:20:43.075153+07', NULL, true, 'INZE6UTSFQUWCR3LKQXT6QZONVNE6KSCLZYVONKDN4VEM3J2OBVQ', NULL, '2025-07-18 14:20:43.075153', NULL, NULL, false, NULL, false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (1, 'dimasrizky822@gmail.com', '$2b$10$3UaVMWehk2G7irXhlLw7I.9xnDXqIZqBzKRAhoTpr9IG/s73qW4hS', 'siswa', '2025-05-07 20:48:22.124923+07', '2025-07-17 08:26:23.034203+07', 'uploads/profile-pictures/profile_1_1750688863556.jpeg', true, 'JRKXEOSBJJFWINJPIA4CSQROIEXE2T3ZMV2X23JGMRYSMWRDMFYQ', NULL, '2025-07-17 08:26:23.034203', '106155532212043018420', 'google', true, 'https://lh3.googleusercontent.com/a/ACg8ocKOfZ_BLiD5Yh9w-fZP-DA6-bFUg-5oRiCpKT4Q4hNtJ2UwjtgV=s96-c', false, NULL);
INSERT INTO public.users (id, email, password, role, created_at, last_login, profile_picture, is_2fa_enabled, two_factor_secret, backup_codes, last_2fa_verify, google_id, oauth_provider, is_email_verified, avatar_url, role_selected, role_confirmation_date) VALUES (2, 'tio@gmail.com', '$2b$10$7LULZ7RBZftd/M9t9zyJdu7ywx8qifCYEqMzuGp2l/oJ9Okqzm4fu', 'siswa', '2025-05-08 15:12:19.104442+07', '2025-07-19 08:24:45.886299+07', 'uploads/profile-pictures/profile_2_1751815244629.png', true, 'M5CUUUZ6HFQV26B6FFTXGOJMMRPHINCWHY4TSRKIJQYUWN3DKRFQ', NULL, '2025-07-19 08:24:45.886299', NULL, NULL, false, NULL, false, NULL);


--
-- Data for Name: weekly_leaderboard; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.weekly_leaderboard (id, user_id, week_start_date, total_xp, games_played, missions_completed, rank_position, created_at, updated_at) VALUES (1, 1, '2025-07-05', 252, 3, 0, NULL, '2025-07-12 18:00:22.321796+07', '2025-07-12 18:04:00.816758+07');
INSERT INTO public.weekly_leaderboard (id, user_id, week_start_date, total_xp, games_played, missions_completed, rank_position, created_at, updated_at) VALUES (4, 1, '2025-07-12', 476, 5, 0, NULL, '2025-07-13 00:32:56.575673+07', '2025-07-13 01:46:10.97505+07');


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
-- Name: assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assignments_id_seq', 3, true);


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

SELECT pg_catalog.setval('public.class_members_id_seq', 8, true);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classes_id_seq', 5, true);


--
-- Name: course_ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.course_ratings_id_seq', 1, false);


--
-- Name: courses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.courses_id_seq', 5, true);


--
-- Name: daily_missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_missions_id_seq', 4, true);


--
-- Name: daily_quiz_completions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daily_quiz_completions_id_seq', 8, true);


--
-- Name: enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enrollments_id_seq', 1, true);


--
-- Name: game_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.game_progress_id_seq', 1, false);


--
-- Name: game_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.game_sessions_id_seq', 1, false);


--
-- Name: games_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.games_id_seq', 3, true);


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

SELECT pg_catalog.setval('public.login_attempts_id_seq', 545, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.materials_id_seq', 2, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modules_id_seq', 4, true);


--
-- Name: orangtua_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orangtua_id_seq', 7, true);


--
-- Name: siswa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.siswa_id_seq', 14, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.submissions_id_seq', 1, true);


--
-- Name: teacher_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teacher_profiles_id_seq', 1, false);


--
-- Name: temp_2fa_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.temp_2fa_tokens_id_seq', 33, true);


--
-- Name: user_achievements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_achievements_id_seq', 1, false);


--
-- Name: user_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_activity_log_id_seq', 1, false);


--
-- Name: user_daily_missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_daily_missions_id_seq', 22, true);


--
-- Name: user_game_progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_game_progress_id_seq', 8, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 232, true);


--
-- Name: user_streaks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_streaks_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 22, true);


--
-- Name: weekly_leaderboard_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.weekly_leaderboard_id_seq', 8, true);


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
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


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
-- Name: daily_missions daily_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT daily_missions_pkey PRIMARY KEY (id);


--
-- Name: daily_quiz_completions daily_quiz_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quiz_completions
    ADD CONSTRAINT daily_quiz_completions_pkey PRIMARY KEY (id);


--
-- Name: daily_quiz_completions daily_quiz_completions_user_id_quiz_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quiz_completions
    ADD CONSTRAINT daily_quiz_completions_user_id_quiz_date_key UNIQUE (user_id, quiz_date);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: game_progress game_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_progress
    ADD CONSTRAINT game_progress_pkey PRIMARY KEY (id);


--
-- Name: game_sessions game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


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
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


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
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


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
-- Name: submissions unique_assignment_student; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT unique_assignment_student UNIQUE (assignment_id, student_id);


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
-- Name: game_progress unique_user_game; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_progress
    ADD CONSTRAINT unique_user_game UNIQUE (user_id, game_id);


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
-- Name: user_activity_log user_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_pkey PRIMARY KEY (id);


--
-- Name: user_daily_missions user_daily_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT user_daily_missions_pkey PRIMARY KEY (id);


--
-- Name: user_daily_missions user_daily_missions_user_id_mission_id_mission_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT user_daily_missions_user_id_mission_id_mission_date_key UNIQUE (user_id, mission_id, mission_date);


--
-- Name: user_game_progress user_game_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_progress
    ADD CONSTRAINT user_game_progress_pkey PRIMARY KEY (id);


--
-- Name: user_game_progress user_game_progress_user_id_game_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_progress
    ADD CONSTRAINT user_game_progress_user_id_game_id_key UNIQUE (user_id, game_id);


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
-- Name: weekly_leaderboard weekly_leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_leaderboard
    ADD CONSTRAINT weekly_leaderboard_pkey PRIMARY KEY (id);


--
-- Name: weekly_leaderboard weekly_leaderboard_user_id_week_start_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_leaderboard
    ADD CONSTRAINT weekly_leaderboard_user_id_week_start_date_key UNIQUE (user_id, week_start_date);


--
-- Name: idx_assignments_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_class ON public.assignments USING btree (class_id);


--
-- Name: idx_assignments_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_assignments_teacher ON public.assignments USING btree (teacher_id);


--
-- Name: idx_class_members_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_members_class ON public.class_members USING btree (class_id);


--
-- Name: idx_class_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_class_members_user ON public.class_members USING btree (user_id);


--
-- Name: idx_classes_teacher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_teacher ON public.classes USING btree (teacher_id);


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
-- Name: idx_game_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_date ON public.game_sessions USING btree (created_at);


--
-- Name: idx_game_sessions_user_game; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_user_game ON public.game_sessions USING btree (user_id, game_id);


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
-- Name: idx_submissions_assignment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_assignment ON public.submissions USING btree (assignment_id);


--
-- Name: idx_submissions_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_assignment_id ON public.submissions USING btree (assignment_id);


--
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);


--
-- Name: idx_submissions_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_student ON public.submissions USING btree (student_id);


--
-- Name: idx_submissions_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_student_id ON public.submissions USING btree (student_id);


--
-- Name: idx_submissions_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_submissions_submitted_at ON public.submissions USING btree (submitted_at);


--
-- Name: idx_user_activity_log_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_activity_log_user_date ON public.user_activity_log USING btree (user_id, activity_date);


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
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- Name: idx_users_oauth_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_oauth_provider ON public.users USING btree (oauth_provider);


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
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: materials update_materials_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: assignments assignments_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: daily_quiz_completions daily_quiz_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quiz_completions
    ADD CONSTRAINT daily_quiz_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: submissions fk_submission_assignment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: submissions fk_submission_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT fk_submission_student FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: game_progress game_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_progress
    ADD CONSTRAINT game_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: game_sessions game_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: materials materials_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: materials materials_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


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
-- Name: user_activity_log user_activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_activity_log
    ADD CONSTRAINT user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_daily_missions user_daily_missions_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT user_daily_missions_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.daily_missions(id) ON DELETE CASCADE;


--
-- Name: user_daily_missions user_daily_missions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT user_daily_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_game_progress user_game_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_progress
    ADD CONSTRAINT user_game_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_streaks user_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_streaks
    ADD CONSTRAINT user_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: weekly_leaderboard weekly_leaderboard_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.weekly_leaderboard
    ADD CONSTRAINT weekly_leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

