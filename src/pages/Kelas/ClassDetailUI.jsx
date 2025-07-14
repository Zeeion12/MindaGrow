"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import { format } from "date-fns"

import {
    LuBookOpen,
    LuCalendar,
    LuClock,
    LuFileText,
    LuMoreVertical,
    LuPlusCircle,
    LuUsers,
    LuVideo,
    LuDownload,
    LuEye,
    LuCheckCircle2,
    LuAlertCircle,
    LuX,
    LuSend,
    LuPaperclip,
    LuUserPlus,
    LuUserMinus,
    LuTrash2,
} from "react-icons/lu"

export default function EnhancedClassDetail() {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState("stream")
    const [showBackConfirm, setShowBackConfirm] = useState(false)
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    const [showMaterialModal, setShowMaterialModal] = useState(false)
    const [showAssignmentDetailModal, setShowAssignmentDetailModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showMaterialDetailModal, setShowMaterialDetailModal] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(null)
    const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(null)
    const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(null)
    const navigate = useNavigate()
    const { user } = useAuth()
    const [showSubmissionModal, setShowSubmissionModal] = useState(false)
    const [submissionForm, setSubmissionForm] = useState({
        assignmentId: null,
        comment: "",
        file: null,
    })
    const [submissionLoading, setSubmissionLoading] = useState(false)

    // State untuk data kelas dari database
    const [classData, setClassData] = useState(null)
    const [classMembers, setClassMembers] = useState([])
    const [teacher, setTeacher] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // States untuk form
    const [announcementText, setAnnouncementText] = useState("")
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        points: "",
        file: null,
    })
    const [newMaterial, setNewMaterial] = useState({
        title: "",
        description: "",
        type: "pdf",
        file: null,
    })
    const [newStudent, setNewStudent] = useState({
        nis: "",
    })
    const [addStudentLoading, setAddStudentLoading] = useState(false)
    const [assignmentLoading, setAssignmentLoading] = useState(false); // New state for assignment loading
    const [materialLoading, setMaterialLoading] = useState(false); // New state for material loading


    // Dummy Pengumuman (masih dummy untuk sementara)
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            teacher: "Guru",
            avatar: "/placeholder.svg?height=40&width=40",
            content:
                "Selamat datang di kelas ini! Jangan lupa untuk membaca materi pengantar yang sudah saya upload.",
            timestamp: "2 hari yang lalu",
        },
    ])
    const [assignments, setAssignments] = useState([]); // Akan diisi dari API
    const [materials, setMaterials] = useState([]);   // Akan diisi dari API


    // Function untuk fetch detail kelas dari database
    const fetchClassDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = localStorage.getItem("token")

            if (!token) {
                setError("Token tidak ditemukan")
                return
            }

            const response = await axios.get(`http://localhost:5000/api/classes/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log("Class details response:", response.data)

            setClassData(response.data.class)
            setTeacher(response.data.teacher)
            setClassMembers(response.data.members || [])

            // Update announcements dengan nama guru yang sebenarnya
            setAnnouncements(prev => prev.map(announcement => ({
                ...announcement,
                teacher: response.data.teacher?.name || announcement.teacher
            })))

            // Update assignments total dengan jumlah member yang sebenarnya
            setAssignments(prev => prev.map(assignment => ({
                ...assignment,
                total: response.data.members?.length || assignment.total
            })))

            // Panggil fungsi fetch tugas dan materi setelah data kelas didapatkan
            await fetchAssignments();
            await fetchMaterials();

        } catch (error) {
            console.error("Error fetching class details:", error)
            if (error.response?.status === 401) {
                localStorage.removeItem("token")
                navigate("/login")
            } else if (error.response?.status === 403) {
                setError("Anda tidak memiliki akses ke kelas ini")
            } else if (error.response?.status === 404) {
                setError("Kelas tidak ditemukan")
            } else {
                setError("Gagal memuat data kelas")
            }
        } finally {
            setLoading(false)
        }
    }

    // Function untuk menambah siswa ke kelas
    const handleAddStudent = async () => {
        if (!newStudent.nis.trim()) {
            alert("NIS siswa wajib diisi")
            return
        }

        try {
            setAddStudentLoading(true)
            const token = localStorage.getItem("token")

            const response = await axios.post(
                `http://localhost:5000/api/classes/${id}/members`,
                { nis: newStudent.nis },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            console.log("Student added:", response.data)

            // Reset form
            setNewStudent({ nis: "" })
            setShowAddStudentModal(false)

            // Refresh data kelas
            await fetchClassDetails()

            alert(response.data.message || "Siswa berhasil ditambahkan")

        } catch (error) {
            console.error("Error adding student:", error)
            const errorMessage = error.response?.data?.message || "Gagal menambahkan siswa"
            alert(errorMessage)
        } finally {
            setAddStudentLoading(false)
        }
    }

    // Function untuk menghapus siswa dari kelas
    const handleRemoveStudent = async (studentUserId) => {
        try {
            const token = localStorage.getItem("token")

            await axios.delete(`http://localhost:5000/api/classes/${id}/members/${studentUserId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            setShowRemoveStudentModal(null)

            // Refresh data kelas
            await fetchClassDetails()

            alert("Siswa berhasil dihapus dari kelas")

        } catch (error) {
            console.error("Error removing student:", error)
            const errorMessage = error.response?.data?.message || "Gagal menghapus siswa"
            alert(errorMessage)
        }
    }

    // Fungsi untuk mengambil data tugas - IMPROVED VERSION
    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:5000/api/classes/${id}/assignments`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Assignments response:", response.data);

            // Process assignments untuk siswa - TAMBAHKAN info nilai
            const assignmentsWithSubmissionInfo = response.data.assignments.map(assignment => {
                let displayStatus = assignment.status;
                let submissionInfo = null;

                // Untuk siswa, cek status submission mereka
                if (user?.role === "siswa") {
                    // Cek apakah ada data submission dari backend
                    if (assignment.my_submission_id) {
                        submissionInfo = {
                            id: assignment.my_submission_id,
                            status: assignment.my_submission_status,
                            submitted_at: assignment.my_submitted_at,
                            score: assignment.my_score, // **TAMBAHKAN** score dari backend
                            file_url: assignment.my_submission_file_url
                        };
                        displayStatus = assignment.my_submission_status;
                    } else {
                        // Belum submit, cek apakah deadline sudah lewat
                        const now = new Date();
                        const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                        if (dueDate && dueDate < now && assignment.status === 'active') {
                            displayStatus = 'overdue';
                        }
                    }
                }

                return {
                    ...assignment,
                    my_submission: submissionInfo,
                    my_submission_status: displayStatus
                };
            });

            setAssignments(assignmentsWithSubmissionInfo);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        }
    };

    // Fungsi untuk mengambil data materi
    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`http://localhost:5000/api/classes/${id}/materials`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setMaterials(response.data.materials);
        } catch (error) {
            console.error("Error fetching materials:", error);
            // Handle error fetching materials
        }
    };

    // TAMBAHKAN function helper untuk file URL
    const getFullFileUrl = (fileUrl) => {
        if (!fileUrl) return null;
        if (fileUrl.startsWith('http')) return fileUrl;
        return `http://localhost:5000/${fileUrl}`;
    };

    // useEffect untuk fetch data saat component mount
    useEffect(() => {
        if (id) {
            fetchClassDetails()
        }
    }, [id, user])

    //function to handle back navigation
    const handleBack = () => {
        if (user?.role === "guru") {
            navigate("/kelas-yang-diajar")
        } else {
            navigate("/kelas")
        }
    }

    // Function untuk handle klik tombol Users
    const handleUsersClick = () => {
        setActiveTab("people")
    }

    // Functions untuk handle form submissions (masih dummy)
    const handleCreateAnnouncement = () => {
        if (announcementText.trim()) {
            const newAnnouncement = {
                id: announcements.length + 1,
                teacher: teacher?.name || user?.nama_lengkap || "Guru",
                avatar: "/placeholder.svg?height=40&width=40",
                content: announcementText,
                timestamp: "Baru saja",
            }
            setAnnouncements([newAnnouncement, ...announcements])
            setAnnouncementText("")
            setShowAnnouncementModal(false)
        }
    }

    const handleCreateAssignment = async () => {
        if (!newAssignment.title.trim()) {
            alert("Judul tugas wajib diisi.");
            return;
        }

        if (!newAssignment.description.trim()) {
            alert("Deskripsi tugas wajib diisi.");
            return;
        }

        if (!newAssignment.dueDate) {
            alert("Tanggal deadline tugas wajib diisi.");
            return;
        }

        setAssignmentLoading(true);
        try {
            const token = localStorage.getItem("token");

            // Format tanggal dengan benar
            const fullDueDate = newAssignment.dueDate + (newAssignment.dueTime ? `T${newAssignment.dueTime}:00` : 'T23:59:59');

            const formData = new FormData();
            formData.append("title", newAssignment.title.trim());
            formData.append("description", newAssignment.description.trim());
            formData.append("due_date", fullDueDate);
            formData.append("points", newAssignment.points || 100);

            // Hanya append file jika ada
            if (newAssignment.file) {
                formData.append("file", newAssignment.file);
            }

            console.log("Sending assignment data:", {
                title: newAssignment.title,
                description: newAssignment.description,
                due_date: fullDueDate,
                points: newAssignment.points || 100,
                hasFile: !!newAssignment.file
            });

            const response = await axios.post(
                `http://localhost:5000/api/classes/${id}/assignments`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log("Assignment created successfully:", response.data);
            alert(response.data.message || "Tugas berhasil dibuat");

            // Reset form
            setNewAssignment({
                title: "",
                description: "",
                dueDate: "",
                dueTime: "",
                points: "",
                file: null,
            });

            setShowAssignmentModal(false);
            await fetchAssignments(); // Refresh daftar tugas


        } catch (error) {
            console.error("Error creating assignment:", error);
            console.error("Error response:", error.response?.data);

            const errorMessage = error.response?.data?.message || "Gagal membuat tugas. Silakan coba lagi.";
            alert(errorMessage);
        } finally {
            setAssignmentLoading(false);
        }
    };

    const handleCreateMaterial = async () => {
        if (!newMaterial.title || !newMaterial.description || !newMaterial.file) {
            alert("Judul, deskripsi, dan file materi wajib diisi.");
            return;
        }

        setMaterialLoading(true);
        try {
            const token = localStorage.getItem("token");

            const formData = new FormData();
            formData.append("title", newMaterial.title.trim());
            formData.append("description", newMaterial.description.trim());
            formData.append("file_type", newMaterial.type);
            formData.append("file", newMaterial.file);

            console.log("Sending material data:", {
                title: newMaterial.title,
                description: newMaterial.description,
                file_type: newMaterial.type,
                fileName: newMaterial.file.name,
                fileSize: newMaterial.file.size
            });

            const response = await axios.post(
                `http://localhost:5000/api/classes/${id}/materials`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log("Material created successfully:", response.data);
            alert(response.data.message || "Materi berhasil ditambahkan");

            // Reset form
            setNewMaterial({
                title: "",
                description: "",
                type: "pdf",
                file: null,
            });

            setShowMaterialModal(false);
            await fetchMaterials(); // Refresh daftar materi

        } catch (error) {
            console.error("Error creating material:", error);
            console.error("Error response:", error.response?.data);

            const errorMessage = error.response?.data?.message || "Gagal menambahkan materi. Silakan coba lagi.";
            alert(errorMessage);
        } finally {
            setMaterialLoading(false);
        }
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Tugas berhasil dihapus.");
            setShowDeleteAssignmentModal(null);
            fetchAssignments(); // Refresh daftar tugas
        } catch (error) {
            console.error("Error deleting assignment:", error);
            alert(error.response?.data?.message || "Gagal menghapus tugas.");
        }
    };

    const handleDeleteMaterial = async (materialId) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/materials/${materialId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Materi berhasil dihapus.");
            setShowDeleteMaterialModal(null);
            fetchMaterials(); // Refresh daftar materi
        } catch (error) {
            console.error("Error deleting material:", error);
            alert(error.response?.data?.message || "Gagal menghapus materi.");
        }
    };

    // Handle submission assignment oleh siswa
    const handleSubmitAssignment = (assignmentId) => {
        setSubmissionForm({
            assignmentId: assignmentId,
            comment: "",
            file: null,
        })
        setShowSubmissionModal(true)
    }

    const handleCreateSubmission = async () => {
        if (!submissionForm.comment.trim()) {
            alert("Komentar wajib diisi.");
            return;
        }

        setSubmissionLoading(true);
        try {
            const token = localStorage.getItem("token");

            const formData = new FormData();
            formData.append("comment", submissionForm.comment.trim());

            if (submissionForm.file) {
                formData.append("file", submissionForm.file);
            }

            const response = await axios.post(
                `http://localhost:5000/api/assignments/${submissionForm.assignmentId}/submit`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            alert(response.data.message || "Tugas berhasil dikumpulkan");

            // Reset form
            setSubmissionForm({
                assignmentId: null,
                comment: "",
                file: null,
            });

            setShowSubmissionModal(false);
            await fetchAssignments(); // Refresh daftar tugas

        } catch (error) {
            console.error("Error submitting assignment:", error);
            const errorMessage = error.response?.data?.message || "Gagal mengumpulkan tugas. Silakan coba lagi.";
            alert(errorMessage);
        } finally {
            setSubmissionLoading(false);
        }
    };

    // Ngambil warna status tugas
    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "inactive":
                return "bg-gray-100 text-gray-800 border-gray-200";
            case "completed":
                return "bg-green-100 text-green-800 border-green-200";
            case "draft":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "submitted":
                return "bg-purple-100 text-purple-800 border-purple-200"; // Untuk submission siswa
            case "graded":
                return "bg-green-100 text-green-800 border-green-200"; // Untuk submission siswa
            case "returned":
                return "bg-orange-100 text-orange-800 border-orange-200"; // Untuk submission siswa
            case "overdue": // Ini bisa dihitung di frontend berdasarkan due_date
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    }

    // Ngambil icon status tugas
    const getStatusIcon = (status) => {
        switch (status) {
            case "active":
                return <LuCheckCircle2 className="w-4 h-4" />;
            case "inactive":
                return <LuX className="w-4 h-4" />;
            case "completed":
                return <LuCheckCircle2 className="w-4 h-4" />;
            case "draft":
                return <LuFileText className="w-4 h-4" />;
            case "submitted":
                return <LuSend className="w-4 h-4" />; // Untuk submission siswa
            case "graded":
                return <LuCheckCircle2 className="w-4 h-4" />; // Untuk submission siswa
            case "returned":
                return <LuAlertCircle className="w-4 h-4" />; // Untuk submission siswa
            case "overdue":
                return <LuClock className="w-4 h-4" />;
            default:
                return <LuClock className="w-4 h-4" />;
        }
    }

    // **TAMBAHKAN** - Function helper untuk warna grade
    const getGradeColor = (score, maxScore) => {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 85) return 'text-green-700 bg-green-50 border-green-200';
        if (percentage >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
        if (percentage >= 60) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        return 'text-red-700 bg-red-50 border-red-200';
    };


    // Fungsi untuk mengunduh file - FIXED VERSION
    const handleDownloadFile = async (itemId, type) => {
        try {
            const token = localStorage.getItem("token");
            let url = '';

            if (type === 'assignment') {
                url = `http://localhost:5000/api/assignments/${itemId}/download`;
            } else if (type === 'material') {
                url = `http://localhost:5000/api/materials/${itemId}/download`;
            } else if (type === 'submission') {
                url = `http://localhost:5000/api/submissions/${itemId}/download`;
            } else {
                console.error('Unknown download type:', type);
                return;
            }

            console.log('Downloading from:', url);

            // Gunakan fetch dengan proper headers untuk download
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get('content-disposition');
            let fileName = 'downloaded_file';

            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }

            // Get blob dari response
            const blob = await response.blob();

            // Create download link
            const link = document.createElement('a');
            const objectUrl = window.URL.createObjectURL(blob);
            link.href = objectUrl;
            link.download = fileName;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(objectUrl);

            console.log('File downloaded successfully:', fileName);

        } catch (error) {
            console.error(`Error downloading ${type}:`, error);

            let errorMessage = `Gagal mengunduh ${type}.`;
            if (error.message.includes('404')) {
                errorMessage = `File ${type} tidak ditemukan.`;
            } else if (error.message.includes('403')) {
                errorMessage = `Anda tidak memiliki akses untuk mengunduh ${type} ini.`;
            }

            alert(errorMessage);
        }
    };

    const handleViewAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setShowAssignmentDetailModal(true);
    };

    const handleViewMaterial = (material) => {
        setSelectedMaterial(material);
        setShowMaterialDetailModal(true);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat detail kelas...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LuAlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        )
    }

    // Jika tidak ada data kelas
    if (!classData) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Data kelas tidak ditemukan</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                                <LuBookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{classData.name}</h1>
                                <p className="text-white/80">{classData.grade} • {classData.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</p>
                                <p className="text-white/80 text-sm">{teacher?.name} • {classMembers.length} siswa</p>
                                {classData.schedule && (
                                    <p className="text-white/80 text-sm">Jadwal: {classData.schedule}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleUsersClick}
                                className="flex items-center px-3 py-1.5 bg-white/10 rounded-md text-sm hover:bg-white/20 transition"
                            >
                                <LuUsers className="w-4 h-4 mr-2" />
                                {user?.role === "guru" ? "Kelola Siswa" : "Lihat Anggota"}
                            </button>
                            <button
                                onClick={() => setShowBackConfirm(true)}
                                className="flex items-center p-1.5 bg-white/10 rounded-md text-sm hover:bg-white/20 transition"
                            >
                                <LuMoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="w-full">
                        <div className="grid grid-cols-4 w-full bg-transparent h-12">
                            <button
                                onClick={() => setActiveTab("stream")}
                                className={`flex items-center justify-center font-medium ${activeTab === "stream" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                            >
                                Stream
                            </button>
                            <button
                                onClick={() => setActiveTab("classwork")}
                                className={`flex items-center justify-center font-medium ${activeTab === "classwork" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                            >
                                Tugas Kelas
                            </button>

                            <button
                                onClick={() => setActiveTab("materials")}
                                className={`flex items-center justify-center font-medium ${activeTab === "materials" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                            >
                                Materi
                            </button>
                            <button
                                onClick={() => setActiveTab("people")}
                                className={`flex items-center justify-center font-medium ${activeTab === "people" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                            >
                                Anggota
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-6">
                {/* Stream Tab */}
                {activeTab === "stream" && (
                    <div className="space-y-6">
                        {/* Tombol Buat Pengumuman untuk Guru */}
                        {user?.role === "guru" && (
                            <div className="bg-white rounded-lg shadow p-4">
                                <button
                                    onClick={() => setShowAnnouncementModal(true)}
                                    className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    <LuPlusCircle className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-600">Buat pengumuman untuk kelas Anda</span>
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1fr] gap-6">
                            {/* Pengumuman */}
                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span>
                                                        {teacher?.name ? teacher.name.split(' ').map(n => n[0]).join('') : 'G'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="text-black font-semibold">{announcement.teacher}</h3>
                                                        <span className="text-sm text-gray-500">{announcement.timestamp}</span>
                                                    </div>
                                                    <p className="text-gray-700 mb-4">{announcement.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Tugas Mendatang */}
                                <div className="bg-white rounded-lg shadow">
                                    <div className="p-4 border-b">
                                        <h2 className="text-lg text-black font-semibold flex items-center">
                                            <LuCalendar className="w-5 h-5 mr-2" />
                                            Tugas Mendatang
                                        </h2>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {assignments
                                            .filter((a) => a.status === "pending" || a.status === "upcoming")
                                            .map((assignment) => (
                                                <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <h4 className="font-medium text-black text-sm mb-1">{assignment.title}</h4>
                                                    <p className="text-xs text-gray-600 mb-2">{assignment.dueDate}</p>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}
                                                    >
                                                        {getStatusIcon(assignment.status)}
                                                        <span className="ml-1 capitalize">{assignment.status}</span>
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Data Stat Kelas */}
                                <div className="bg-white rounded-lg shadow">
                                    <div className="p-4 border-b">
                                        <h2 className="text-lg font-semibold">Statistik Kelas</h2>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Siswa</span>
                                            <span className="font-semibold">{classMembers.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Tugas Aktif</span>
                                            <span className="font-semibold">{assignments.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Materi</span>
                                            <span className="font-semibold">{materials.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tugas Kelas */}
                {activeTab === "classwork" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Tugas Kelas</h2>
                            {user?.role === "guru" && (
                                <button
                                    onClick={() => setShowAssignmentModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <LuPlusCircle className="w-5 h-5" />
                                    <span>Buat Tugas</span>
                                </button>
                            )}
                        </div>

                        <div className="grid gap-6">
                            {assignments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Belum ada tugas di kelas ini.</div>
                            ) : (
                                assignments.map((assignment) => {
                                    const now = new Date();
                                    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                                    let displayStatus = assignment.status;

                                    // Logic untuk menentukan status "overdue" di frontend
                                    if (dueDate && dueDate < now && assignment.status === 'active') {
                                        displayStatus = 'overdue';
                                    }
                                    // Jika siswa, status tugas mereka mungkin berbeda dari status tugas secara umum
                                    if (user?.role === "siswa" && assignment.my_submission_status) {
                                        displayStatus = assignment.my_submission_status;
                                    }

                                    return (
                                        <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-start space-x-4">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <LuFileText className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold mb-2">{assignment.title}</h3>
                                                            <p className="text-gray-600 mb-3">{assignment.description}</p>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                {dueDate && (
                                                                    <span>Due: {format(dueDate, 'dd MMMM yyyy, HH:mm')}</span>
                                                                )}
                                                                <span>•</span>
                                                                <span>{assignment.points} poin</span>
                                                                {user?.role === "guru" && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>
                                                                            {assignment.total_submissions || 0}/{classMembers.length} diserahkan
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* **TAMBAHKAN** - Section untuk menampilkan status dan nilai */}
                                                    <div className="flex flex-col items-end space-y-2">
                                                        {/* Status Badge */}
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(displayStatus)}`}
                                                        >
                                                            {getStatusIcon(displayStatus)}
                                                            <span className="ml-1 capitalize">{displayStatus}</span>
                                                        </span>

                                                        {/* **TAMBAHKAN** - Nilai untuk siswa yang sudah dinilai */}
                                                        {user?.role === "siswa" && assignment.my_submission && assignment.my_submission.score !== null && (
                                                            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                                                                <div className="text-lg font-bold text-green-700">
                                                                    {assignment.my_submission.score}/{assignment.points}
                                                                </div>
                                                                <div className="text-xs text-green-600">
                                                                    Nilai: {Math.round((assignment.my_submission.score / assignment.points) * 100)}%
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* **TAMBAHKAN** - Info pending grade untuk siswa */}
                                                        {user?.role === "siswa" && assignment.my_submission && assignment.my_submission.score === null && assignment.my_submission_status === 'submitted' && (
                                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-center">
                                                                <div className="text-xs text-yellow-700 font-medium">
                                                                    Menunggu Penilaian
                                                                </div>
                                                                <div className="text-xs text-yellow-600">
                                                                    Sudah dikumpulkan
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Sisa kode untuk border dan action buttons tetap sama */}
                                                <div className="border-t border-gray-200 my-4"></div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {user?.role === "guru" && (
                                                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                                                                <div
                                                                    className="bg-blue-600 h-2 rounded-full"
                                                                    style={{ width: `${(assignment.total_submissions / classMembers.length) * 100 || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                        {user?.role === "guru" && (
                                                            <span className="text-sm text-gray-500">
                                                                {Math.round((assignment.total_submissions / classMembers.length) * 100) || 0}%
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action buttons tetap sama */}
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleViewAssignment(assignment)}
                                                            className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition">
                                                            <LuEye className="w-4 h-4 mr-1" />
                                                            Lihat
                                                        </button>

                                                        {/* DOWNLOAD ASSIGNMENT FILE */}
                                                        {assignment.file_url && (
                                                            <button
                                                                onClick={() => handleDownloadFile(assignment.id, 'assignment')}
                                                                className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition"
                                                            >
                                                                <LuDownload className="w-4 h-4 mr-1" />
                                                                Download
                                                            </button>
                                                        )}

                                                        {/* GURU ACTIONS */}
                                                        {user?.role === "guru" && (
                                                            <button
                                                                onClick={() => setShowDeleteAssignmentModal(assignment.id)}
                                                                className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 transition"
                                                            >
                                                                <LuTrash2 className="w-4 h-4 mr-1" />
                                                                Hapus
                                                            </button>
                                                        )}

                                                        {/* SISWA ACTIONS - Logic tetap sama */}
                                                        {user?.role === "siswa" && (
                                                            <>
                                                                {/* JIKA BELUM SUBMIT DAN BELUM OVERDUE */}
                                                                {!assignment.my_submission && assignment.my_submission_status !== "overdue" && (
                                                                    <button
                                                                        onClick={() => handleSubmitAssignment(assignment.id)}
                                                                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
                                                                    >
                                                                        <LuPlusCircle className="w-4 h-4 mr-1" />
                                                                        Submit
                                                                    </button>
                                                                )}

                                                                {/* JIKA SUDAH SUBMIT - DOWNLOAD SUBMISSION */}
                                                                {assignment.my_submission && assignment.my_submission.file_url && (
                                                                    <button
                                                                        onClick={() => handleDownloadFile(assignment.my_submission.id, 'submission')}
                                                                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition"
                                                                    >
                                                                        <LuDownload className="w-4 h-4 mr-1" />
                                                                        My Submission
                                                                    </button>
                                                                )}

                                                                {/* JIKA OVERDUE DAN BELUM SUBMIT */}
                                                                {!assignment.my_submission && assignment.my_submission_status === "overdue" && (
                                                                    <span className="text-xs text-red-600 px-3 py-1.5 bg-red-50 rounded-md border border-red-200">
                                                                        Deadline terlewat
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}


                {/* Materi */}
                {activeTab === "materials" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Materi Pembelajaran</h2>
                            {user?.role === "guru" && (
                                <button
                                    onClick={() => setShowMaterialModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <LuPlusCircle className="w-5 h-5" />
                                    <span>Tambah Materi</span>
                                </button>
                            )}
                        </div>

                        <div className="grid gap-4">
                            {materials.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Belum ada materi di kelas ini.</div>
                            ) : (
                                materials.map((material) => (
                                    <div key={material.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                        <div className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                    {material.file_type === "pdf" && <LuFileText className="w-6 h-6 text-green-600" />}
                                                    {material.file_type && material.file_type.startsWith("video") && <LuVideo className="w-6 h-6 text-green-600" />}
                                                    {(material.file_type === "doc" || material.file_type === "docx") && <LuFileText className="w-6 h-6 text-green-600" />}
                                                    {/* Tambahkan icon lain sesuai kebutuhan */}
                                                    {!material.file_type && <LuFileText className="w-6 h-6 text-green-600" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold mb-1">{material.title}</h3>
                                                    <p className="text-gray-600 text-sm mb-2">{material.description}</p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span>{material.file_type?.toUpperCase() || 'FILE'}</span>
                                                        <span>•</span>
                                                        <span>{material.file_size || 'Ukuran tidak diketahui'}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(material.uploaded_at), 'dd MMMM yyyy')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleViewMaterial(material)}
                                                        className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition">
                                                        <LuEye className="w-4 h-4 mr-1" />
                                                        Lihat
                                                    </button>
                                                    {material.file_url && (
                                                        <button
                                                            onClick={() => handleDownloadFile(material.id, 'material')}
                                                            className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition"
                                                        >
                                                            <LuDownload className="w-4 h-4 mr-1" />
                                                            Download
                                                        </button>
                                                    )}
                                                    {user?.role === "guru" && (
                                                        <button
                                                            onClick={() => setShowDeleteMaterialModal(material.id)}
                                                            className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 transition"
                                                        >
                                                            <LuTrash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}


                {/* Anggota */}
                {activeTab === "people" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Guru */}
                            <div className="bg-white rounded-lg shadow self-start">
                                <div className="p-4 border-b">
                                    <h2 className="text-lg font-semibold flex items-center">
                                        <LuUsers className="w-5 h-5 mr-2" />
                                        Pengajar
                                    </h2>
                                </div>

                                <div className="p-4 space-y-4">
                                    {teacher ? (
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold">
                                                    {teacher.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{teacher.name}</h3>
                                                <p className="text-sm text-gray-600">{teacher.email}</p>
                                                {teacher.nuptk && (
                                                    <p className="text-xs text-gray-500">NUPTK: {teacher.nuptk}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">Data pengajar tidak tersedia</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Siswa */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center">
                                        <LuUsers className="w-5 h-5 mr-2" />
                                        Siswa ({classMembers.length})
                                    </h2>
                                    {user?.role === "guru" && (
                                        <button
                                            onClick={() => setShowAddStudentModal(true)}
                                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
                                        >
                                            <LuUserPlus className="w-4 h-4 mr-1" />
                                            Tambah Siswa
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3 p-3 max-h-96 overflow-y-auto">
                                    {classMembers.length === 0 ? (
                                        <div className="text-center py-8">
                                            <LuUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">Belum ada siswa di kelas ini</p>
                                            {user?.role === "guru" && (
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Klik "Tambah Siswa" untuk menambahkan siswa ke kelas
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        classMembers.map((student) => (
                                            <div key={student.user_id} className="flex items-center justify-between space-x-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                                                        <span className="text-green-600 font-semibold">
                                                            {student.nama_lengkap.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium">{student.nama_lengkap}</h4>
                                                        <p className="text-xs text-gray-500">NIS: {student.nis}</p>
                                                        {student.email && (
                                                            <p className="text-xs text-gray-400">{student.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {user?.role === "guru" && (
                                                    <button
                                                        onClick={() => setShowRemoveStudentModal(student)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                        title={`Hapus ${student.nama_lengkap} dari kelas`}
                                                    >
                                                        <LuUserMinus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Buat Pengumuman */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Buat Pengumuman</h3>
                            <button onClick={() => setShowAnnouncementModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pengumuman</label>
                                <textarea
                                    value={announcementText}
                                    onChange={(e) => setAnnouncementText(e.target.value)}
                                    placeholder="Tulis pengumuman untuk siswa..."
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAnnouncementModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateAnnouncement}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <LuSend className="w-4 h-4 mr-2" />
                                Posting
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Buat Tugas - IMPROVED VERSION */}
            {showAssignmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Buat Tugas</h3>
                            <button onClick={() => setShowAssignmentModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Judul Tugas <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    placeholder="Masukkan judul tugas"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={assignmentLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    placeholder="Jelaskan instruksi tugas dengan detail..."
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    disabled={assignmentLoading}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Deadline <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={newAssignment.dueDate}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]} // Tidak boleh kurang dari hari ini
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={assignmentLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Waktu Deadline
                                    </label>
                                    <input
                                        type="time"
                                        value={newAssignment.dueTime}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueTime: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={assignmentLoading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Kosongkan untuk 23:59</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Poin
                                </label>
                                <input
                                    type="number"
                                    value={newAssignment.points}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, points: e.target.value })}
                                    placeholder="100"
                                    min="1"
                                    max="1000"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={assignmentLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lampiran (Opsional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="assignment-file-upload"
                                        onChange={(e) => setNewAssignment({ ...newAssignment, file: e.target.files[0] })}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mkv,.mov,.webm,.zip,.rar,.7z"
                                        disabled={assignmentLoading}
                                    />
                                    <label htmlFor="assignment-file-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <LuPaperclip className="w-8 h-8 text-gray-400 mb-3" />
                                            {newAssignment.file ? (
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                                        {newAssignment.file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(newAssignment.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Klik untuk menambahkan file atau drag & drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        Maksimal 10MB
                                                    </p>
                                                </div>
                                            )}
                                            <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                                                {newAssignment.file ? 'Ganti File' : 'Pilih File'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    <p className="font-medium mb-1">File yang didukung:</p>
                                    <p>📄 Dokumen: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT</p>
                                    <p>🖼️ Gambar: JPG, JPEG, PNG, GIF, WEBP</p>
                                    <p>🎥 Video: MP4, AVI, MKV, MOV, WEBM</p>
                                    <p>📦 Arsip: ZIP, RAR, 7Z</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowAssignmentModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={assignmentLoading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={assignmentLoading}
                            >
                                {assignmentLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Membuat...
                                    </div>
                                ) : (
                                    "Buat Tugas"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Modal Tambah Materi - IMPROVED VERSION */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Tambah Materi</h3>
                            <button onClick={() => setShowMaterialModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Judul Materi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newMaterial.title}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                    placeholder="Masukkan judul materi pembelajaran"
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    disabled={materialLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Deskripsi <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={newMaterial.description}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                    placeholder="Jelaskan tentang materi pembelajaran ini..."
                                    rows={3}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    disabled={materialLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kategori Materi
                                </label>
                                <select
                                    value={newMaterial.type}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    disabled={materialLoading}
                                >
                                    <option value="pdf">📄 PDF Document</option>
                                    <option value="video">🎥 Video</option>
                                    <option value="doc">📝 Dokumen Word</option>
                                    <option value="ppt">📊 Presentasi</option>
                                    <option value="image">🖼️ Gambar</option>
                                    <option value="other">📁 Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload File <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="material-file-upload"
                                        onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files[0] })}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mkv,.mov,.webm,.zip,.rar,.7z"
                                        disabled={materialLoading}
                                    />
                                    <label htmlFor="material-file-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <LuPaperclip className="w-8 h-8 text-gray-400 mb-3" />
                                            {newMaterial.file ? (
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                                        {newMaterial.file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(newMaterial.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Drag & drop file atau klik untuk browse
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        Maksimal 10MB
                                                    </p>
                                                </div>
                                            )}
                                            <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                                                {newMaterial.file ? 'Ganti File' : 'Pilih File'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    <p className="font-medium mb-1">File yang didukung:</p>
                                    <p>📄 Dokumen: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT</p>
                                    <p>🖼️ Gambar: JPG, JPEG, PNG, GIF, WEBP</p>
                                    <p>🎥 Video: MP4, AVI, MKV, MOV, WEBM</p>
                                    <p>📦 Arsip: ZIP, RAR, 7Z</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowMaterialModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={materialLoading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateMaterial}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={materialLoading}
                            >
                                {materialLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Menambahkan...
                                    </div>
                                ) : (
                                    "Tambah Materi"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Modal Tambah Siswa */}
            {showAddStudentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Tambah Siswa</h3>
                            <button onClick={() => setShowAddStudentModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIS Siswa</label>
                                <input
                                    type="text"
                                    value={newStudent.nis}
                                    onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })}
                                    placeholder="Masukkan NIS siswa (contoh: 2024001)"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Siswa akan dicari berdasarkan NIS yang terdaftar di sistem
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddStudentModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={addStudentLoading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddStudent}
                                disabled={addStudentLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addStudentLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Menambahkan...
                                    </div>
                                ) : (
                                    "Tambah Siswa"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Siswa */}
            {showRemoveStudentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">Hapus Siswa dari Kelas</h3>
                            <button onClick={() => setShowRemoveStudentModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <LuUserMinus className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{showRemoveStudentModal?.nama_lengkap}</h4>
                                    <p className="text-sm text-gray-500">NIS: {showRemoveStudentModal?.nis}</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Konfirmasi:</strong> Siswa ini akan dihapus dari kelas. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRemoveStudentModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleRemoveStudent(showRemoveStudentModal.user_id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Hapus dari Kelas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Tugas */}
            {showDeleteAssignmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">Hapus Tugas</h3>
                            <button onClick={() => setShowDeleteAssignmentModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <LuTrash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {assignments.find((a) => a.id === showDeleteAssignmentModal)?.title}
                                    </h4>
                                    <p className="text-sm text-gray-500">Tugas akan dihapus secara permanen</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. Semua data tugas dan submission
                                    siswa akan hilang.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteAssignmentModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDeleteAssignment(showDeleteAssignmentModal)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Hapus Tugas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Materi */}
            {showDeleteMaterialModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">Hapus Materi</h3>
                            <button onClick={() => setShowDeleteMaterialModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <LuTrash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {materials.find((m) => m.id === showDeleteMaterialModal)?.title}
                                    </h4>
                                    <p className="text-sm text-gray-500">Materi akan dihapus secara permanen</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. File materi akan hilang dari sistem.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteMaterialModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDeleteMaterial(showDeleteMaterialModal)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Hapus Materi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back Confirmation Popup */}
            {showBackConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg text-black font-semibold mb-4">Ingin kembali?</h3>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleBack}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-md hover:opacity-90"
                            >
                                Ya
                            </button>
                            <button
                                onClick={() => setShowBackConfirm(false)}
                                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 text-gray-700"
                            >
                                Tidak
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Tugas */}
            {showAssignmentDetailModal && selectedAssignment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{selectedAssignment.title}</h3>
                            <button onClick={() => setShowAssignmentDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-gray-700">
                            <div>
                                <p className="font-medium">Deskripsi:</p>
                                <p>{selectedAssignment.description}</p>
                            </div>
                            {selectedAssignment.due_date && (
                                <div>
                                    <p className="font-medium">Jatuh Tempo:</p>
                                    <p>{format(new Date(selectedAssignment.due_date), 'dd MMMM yyyy, HH:mm')}</p>
                                </div>
                            )}
                            <div>
                                <p className="font-medium">Poin:</p>
                                <p>{selectedAssignment.points || 100}</p>
                            </div>
                            {selectedAssignment.file_url && (
                                <div>
                                    <p className="font-medium">Lampiran:</p>
                                    <div className="flex space-x-2">
                                        <a
                                            href={getFullFileUrl(selectedAssignment.file_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center"
                                        >
                                            <LuPaperclip className="w-4 h-4 mr-1" />
                                            Lihat Lampiran
                                        </a>
                                        <button
                                            onClick={() => handleDownloadFile(selectedAssignment.id, 'assignment')}
                                            className="text-green-600 hover:underline flex items-center"
                                        >
                                            <LuDownload className="w-4 h-4 mr-1" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            )}
                            {user?.role === "guru" && (
                                <div>
                                    <p className="font-medium">Status Tugas:</p>
                                    <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedAssignment.status)}`}
                                    >
                                        {getStatusIcon(selectedAssignment.status)}
                                        <span className="ml-1 capitalize">{selectedAssignment.status}</span>
                                    </span>
                                </div>
                            )}
                            {user?.role === "siswa" && selectedAssignment.my_submission && (
                                <div>
                                    <p className="font-medium">Status Pengiriman Anda:</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedAssignment.my_submission_status)}`}
                                        >
                                            {getStatusIcon(selectedAssignment.my_submission_status)}
                                            <span className="ml-1 capitalize">{selectedAssignment.my_submission_status}</span>
                                        </span>

                                        {/* **TAMBAHKAN** - Tampilkan nilai jika sudah dinilai */}
                                        {selectedAssignment.my_submission.score !== null && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                                <div className="text-sm font-bold text-green-700">
                                                    Nilai: {selectedAssignment.my_submission.score}/{selectedAssignment.points}
                                                </div>
                                                <div className="text-xs text-green-600">
                                                    ({Math.round((selectedAssignment.my_submission.score / selectedAssignment.points) * 100)}%)
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* **TAMBAHKAN** - Tampilkan feedback jika ada */}
                                    {selectedAssignment.my_submission.feedback && (
                                        <div className="mt-3">
                                            <p className="font-medium text-sm">Feedback dari Guru:</p>
                                            <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-sm text-blue-800">{selectedAssignment.my_submission.feedback}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAssignmentDetailModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Materi */}
            {showMaterialDetailModal && selectedMaterial && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{selectedMaterial.title}</h3>
                            <button onClick={() => setShowMaterialDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-gray-700">
                            <div>
                                <p className="font-medium">Deskripsi:</p>
                                <p>{selectedMaterial.description}</p>
                            </div>
                            <div>
                                <p className="font-medium">Tipe File:</p>
                                <p>{selectedMaterial.file_type?.toUpperCase() || 'Tidak Diketahui'}</p>
                            </div>
                            {selectedMaterial.file_size && (
                                <div>
                                    <p className="font-medium">Ukuran File:</p>
                                    <p>{selectedMaterial.file_size}</p>
                                </div>
                            )}
                            <div>
                                <p className="font-medium">Diunggah Pada:</p>
                                <p>{format(new Date(selectedMaterial.uploaded_at), 'dd MMMM yyyy, HH:mm')}</p>
                            </div>
                            {selectedMaterial.file_url && (
                                <div>
                                    <p className="font-medium">File Materi:</p>
                                    <div className="flex space-x-2">
                                        <a
                                            href={getFullFileUrl(selectedMaterial.file_url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline flex items-center"
                                        >
                                            <LuPaperclip className="w-4 h-4 mr-1" />
                                            Lihat File
                                        </a>
                                        <button
                                            onClick={() => handleDownloadFile(selectedMaterial.id, 'material')}
                                            className="text-green-600 hover:underline flex items-center"
                                        >
                                            <LuDownload className="w-4 h-4 mr-1" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowMaterialDetailModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal Submit Assignment untuk Siswa */}
            {showSubmissionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Submit Tugas</h3>
                            <button onClick={() => setShowSubmissionModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Komentar/Jawaban <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={submissionForm.comment}
                                    onChange={(e) => setSubmissionForm({ ...submissionForm, comment: e.target.value })}
                                    placeholder="Tulis jawaban atau komentar untuk tugas ini..."
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    disabled={submissionLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lampiran File (Opsional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        className="hidden"
                                        id="submission-file-upload"
                                        onChange={(e) => setSubmissionForm({ ...submissionForm, file: e.target.files[0] })}
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z"
                                        disabled={submissionLoading}
                                    />
                                    <label htmlFor="submission-file-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center">
                                            <LuPaperclip className="w-8 h-8 text-gray-400 mb-3" />
                                            {submissionForm.file ? (
                                                <div className="text-center">
                                                    <p className="text-sm font-medium text-gray-900 mb-1">
                                                        {submissionForm.file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {(submissionForm.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Klik untuk menambahkan file pendukung
                                                    </p>
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        Maksimal 10MB
                                                    </p>
                                                </div>
                                            )}
                                            <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                                                {submissionForm.file ? 'Ganti File' : 'Pilih File'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                            <button
                                onClick={() => setShowSubmissionModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={submissionLoading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateSubmission}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={submissionLoading}
                            >
                                {submissionLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Mengirim...
                                    </div>
                                ) : (
                                    "Submit Tugas"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}