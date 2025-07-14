"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import Header from "../../components/layout/layoutParts/Header"
import axios from "axios"

export default function PenilaianTugas() {
    const { user } = useAuth()
    const [assignments, setAssignments] = useState([])
    const [selectedAssignment, setSelectedAssignment] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [selectedSubmission, setSelectedSubmission] = useState(null)
    const [gradeInput, setGradeInput] = useState("")
    const [feedbackInput, setFeedbackInput] = useState("")
    const [filterStatus, setFilterStatus] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [gradingMode, setGradingMode] = useState(false)
    const [gradingLoading, setGradingLoading] = useState(false)
    const [stats, setStats] = useState(null)
    const [viewMode, setViewMode] = useState(false)


    useEffect(() => {
        fetchAssignments()
    }, [])

    // function baru untuk fetch assignments dari API
    const fetchAssignments = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")

            const response = await axios.get('http://localhost:5000/api/teacher/assignments', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.data.success) {
                // Transform data untuk UI
                const transformedAssignments = response.data.assignments.map(assignment => ({
                    id: assignment.id,
                    title: assignment.title,
                    course: assignment.class_name,
                    class: assignment.class_grade,
                    total_submissions: assignment.total_submissions || 0,
                    graded: 0, // Will be calculated after fetching submissions
                    pending: 0, // Will be calculated after fetching submissions
                    deadline: assignment.due_date,
                    created_date: assignment.created_at,
                    max_score: assignment.points || 100,
                    description: assignment.description,
                }))

                setAssignments(transformedAssignments)
            } else {
                console.error('Failed to fetch assignments:', response.data.message)
            }
        } catch (error) {
            console.error('Error fetching assignments:', error)
            alert('Gagal memuat daftar tugas')
        } finally {
            setLoading(false)
        }
    }

    //useEffect untuk fetch submissions 
    useEffect(() => {
        if (selectedAssignment) {
            fetchSubmissionsForGrading(selectedAssignment.id)
        }
    }, [selectedAssignment])

    //function baru untuk fetch submissions
    const fetchSubmissionsForGrading = async (assignmentId) => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")

            const response = await axios.get(
                `http://localhost:5000/api/assignments/${assignmentId}/grading`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (response.data.success) {
                const { submissions, stats } = response.data

                // Transform submissions untuk UI
                const transformedSubmissions = submissions.map(submissionData => ({
                    id: submissionData.submission ? submissionData.submission.id : null,
                    student_name: submissionData.student_name,
                    student_id: submissionData.student_nis,
                    submitted_date: submissionData.submission ? submissionData.submission.submitted_at : null,
                    status: submissionData.status,
                    score: submissionData.submission ? submissionData.submission.score : null,
                    feedback: submissionData.submission ? submissionData.submission.feedback : "",
                    file_url: submissionData.submission ? submissionData.submission.file_url : null,
                    late: false, // TODO: Calculate based on due_date
                    comment: submissionData.submission ? submissionData.submission.comment : null,
                    student_user_id: submissionData.student_id
                }))

                setSubmissions(transformedSubmissions)
                setStats(stats)

                // Update assignment stats
                setAssignments(prev => prev.map(assignment =>
                    assignment.id === assignmentId
                        ? {
                            ...assignment,
                            total_submissions: stats.total_students,
                            graded: parseInt(stats.graded_count) || 0,
                            pending: parseInt(stats.pending_grading) || 0
                        }
                        : assignment
                ))
            } else {
                console.error('Failed to fetch submissions:', response.data.message)
            }
        } catch (error) {
            console.error('Error fetching submissions:', error)
            alert('Gagal memuat data submission')
        } finally {
            setLoading(false)
        }
    }

    const refreshDashboard = () => {
        // Emit custom event untuk refresh dashboard
        window.dispatchEvent(new CustomEvent('refreshDashboard'))
    }

    //function handleGradeSubmission
    const handleGradeSubmission = async () => {
        if (!selectedSubmission || !gradeInput) {
            alert('Pilih submission dan masukkan nilai')
            return
        }

        const score = parseInt(gradeInput)
        if (isNaN(score) || score < 0 || score > selectedAssignment.max_score) {
            alert(`Nilai harus antara 0-${selectedAssignment.max_score}`)
            return
        }

        try {
            setGradingLoading(true)
            const token = localStorage.getItem("token")

            const endpoint = selectedSubmission.score !== null
                ? `http://localhost:5000/api/submissions/${selectedSubmission.id}/grade` // PUT untuk update
                : `http://localhost:5000/api/submissions/${selectedSubmission.id}/grade` // POST untuk grade baru

            const method = selectedSubmission.score !== null ? 'put' : 'post'

            const response = await axios[method](endpoint, {
                score: score,
                feedback: feedbackInput.trim(),
                status: 'graded'
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.data.success) {
                // Update submissions state
                setSubmissions(prev => prev.map(sub =>
                    sub.id === selectedSubmission.id
                        ? {
                            ...sub,
                            score: score,
                            feedback: feedbackInput.trim(),
                            status: 'graded'
                        }
                        : sub
                ))

                // Update assignment statistics
                setAssignments(prev => prev.map(assignment =>
                    assignment.id === selectedAssignment.id
                        ? {
                            ...assignment,
                            graded: selectedSubmission.score !== null
                                ? assignment.graded
                                : assignment.graded + 1,
                            pending: selectedSubmission.score !== null
                                ? assignment.pending
                                : Math.max(0, assignment.pending - 1)
                        }
                        : assignment
                ))

                // Reset form
                setGradeInput("")
                setFeedbackInput("")
                setSelectedSubmission(null)
                setGradingMode(false)

                // **TAMBAH** - Refresh dashboard
                refreshDashboard()

                alert('Nilai berhasil disimpan!')
            }
        } catch (error) {
            console.error('Error grading submission:', error)
            alert('Terjadi kesalahan saat menyimpan nilai')
        } finally {
            setGradingLoading(false)
        }
    }


    const getStatusColor = (status, submission) => {
        switch (status) {
            case "graded":
                return "bg-green-100 text-green-800 border-green-200"
            case "submitted":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "not_submitted":
                return "bg-gray-100 text-gray-800 border-gray-200"
            case "pending_grading":
                return "bg-orange-100 text-orange-800 border-orange-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatusText = (status, submission) => {
        switch (status) {
            case "graded":
                return "Sudah Dinilai"
            case "submitted":
            case "pending_grading":
                return "Belum Dinilai"
            case "not_submitted":
                return "Belum Submit"
            default:
                return "Tidak Diketahui"
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case "graded":
                return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            case "submitted":
            case "pending_grading":
                return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
            case "not_submitted":
                return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            default:
                return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
        }
    }

    // TAMBAHKAN setelah useEffect untuk fetchSubmissionsForGrading
    const filteredSubmissions = submissions.filter(submission => {
        // Filter berdasarkan search term
        const matchesSearch = searchTerm === '' ||
            submission.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.student_id?.toString().includes(searchTerm);

        // Filter berdasarkan status
        let matchesStatus = true;
        if (filterStatus !== 'all') {
            if (filterStatus === 'submitted') {
                matchesStatus = submission.status === 'submitted' || submission.status === 'pending_grading';
            } else if (filterStatus === 'graded') {
                matchesStatus = submission.status === 'graded';
            } else if (filterStatus === 'not_submitted') {
                matchesStatus = submission.status === 'not_submitted';
            }
        }

        return matchesSearch && matchesStatus;
    });

    // Function untuk download file submission
    const handleDownloadFile = async (submissionId) => {
        try {
            const token = localStorage.getItem("token")
            const response = await axios.get(
                `http://localhost:5000/api/submissions/${submissionId}/download`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    responseType: 'blob' // Penting untuk file download
                }
            )

            // Create blob link untuk download
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url

            // Get filename dari header response
            const contentDisposition = response.headers['content-disposition']
            let filename = 'submission_file'
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            link.setAttribute('download', filename)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error downloading file:', error)
            alert('Gagal mengunduh file submission')
        }
    }

    // Function untuk lihat detail jawaban siswa
    const handleViewSubmission = (submission) => {
        setSelectedSubmission(submission)
        setViewMode(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="container mx-auto px-4 py-6">
                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Penilaian Tugas</h1>
                    <p className="text-gray-600">Kelola dan berikan nilai untuk tugas-tugas siswa Anda.</p>
                </div>

                {!selectedAssignment ? (
                    /* Assignment List View */
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Tugas</h2>

                        <div className="grid gap-4">
                            {assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedAssignment(assignment)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                                            <p className="text-gray-600">
                                                {assignment.course} - Kelas {assignment.class}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">Deadline</div>
                                            <div className="font-medium text-gray-900">
                                                {new Date(assignment.deadline).toLocaleDateString("id-ID")}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{assignment.total_submissions}</div>
                                            <div className="text-sm text-gray-500">Total Siswa</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{assignment.graded}</div>
                                            <div className="text-sm text-gray-500">Sudah Dinilai</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">{assignment.pending}</div>
                                            <div className="text-sm text-gray-500">Belum Dinilai</div>
                                        </div>
                                    </div>

                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${assignment.total_submissions > 0
                                                    ? (assignment.graded / assignment.total_submissions) * 100
                                                    : 0}%`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-right text-sm text-gray-500 mt-1">
                                        {assignment.total_submissions > 0
                                            ? Math.round((assignment.graded / assignment.total_submissions) * 100)
                                            : 0}% selesai
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Assignment Detail View */
                    <div className="space-y-6">
                        {/* Assignment Header */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <button
                                        onClick={() => setSelectedAssignment(null)}
                                        className="text-blue-500 hover:text-blue-700 mb-2 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Kembali ke Daftar Tugas
                                    </button>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedAssignment.title}</h2>
                                    <p className="text-gray-600">
                                        {selectedAssignment.course} - Kelas {selectedAssignment.class}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-500">Nilai Maksimal</div>
                                    <div className="text-2xl font-bold text-blue-600">{selectedAssignment.max_score}</div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-800 mb-2">Deskripsi Tugas:</h4>
                                <p className="text-gray-600">{selectedAssignment.description}</p>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-blue-600">{stats?.total_students || 0}</div>
                                    <div className="text-sm text-gray-500">Total Siswa</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-green-600">{stats?.graded_count || 0}</div>
                                    <div className="text-sm text-gray-500">Sudah Dinilai</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-yellow-600">{stats?.pending_grading || 0}</div>
                                    <div className="text-sm text-gray-500">Belum Dinilai</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-purple-600">{stats?.not_submitted || 0}</div>
                                    <div className="text-sm text-gray-500">Belum Submit</div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Progress Penilaian</span>
                                        <span>{Math.round(((stats?.graded_count || 0) / (stats?.total_students || 1)) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${((stats?.graded_count || 0) / (stats?.total_students || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {stats?.average_score && (
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                            {parseFloat(stats.average_score).toFixed(1)}
                                        </div>
                                        <div className="text-sm text-blue-500">Rata-rata Nilai</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Cari nama siswa..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="submitted">Belum Dinilai</option>
                                        <option value="graded">Sudah Dinilai</option>
                                        <option value="not_submitted">Belum Submit</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submissions Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Siswa
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal Submit
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nilai
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSubmissions.map((submission) => (
                                            <tr key={`${submission.student_user_id}-${submission.student_id}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <span className="text-blue-800 font-medium">{submission.student_name.charAt(0)}</span>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{submission.student_name}</div>
                                                            <div className="text-sm text-gray-500">NIS: {submission.student_id}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    {/* Show actions only if student has submitted */}
                                                    {submission.status !== 'not_submitted' && (
                                                        <>
                                                            {submission.file_url && (
                                                                <button
                                                                    onClick={() => handleDownloadFile(submission.id)}
                                                                    className="text-blue-600 hover:text-blue-900 mr-2"
                                                                    title="Download file submission"
                                                                >
                                                                    Download
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleViewSubmission(submission)}
                                                                className="text-indigo-600 hover:text-indigo-900 mr-2"
                                                                title="Lihat detail submission"
                                                            >
                                                                Lihat Detail
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedSubmission(submission)
                                                                    setGradingMode(true)
                                                                    setGradeInput(submission.score?.toString() || "")
                                                                    setFeedbackInput(submission.feedback || "")
                                                                }}
                                                                className={`${submission.score !== null
                                                                    ? 'text-yellow-600 hover:text-yellow-900'
                                                                    : 'text-green-600 hover:text-green-900'
                                                                    }`}
                                                            >
                                                                {submission.score !== null ? "Edit Nilai" : "Beri Nilai"}
                                                            </button>
                                                        </>
                                                    )}

                                                    {submission.status === 'not_submitted' && (
                                                        <span className="text-gray-400 text-sm">Belum ada submission</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {submission.submitted_date ? (
                                                        <div>
                                                            <div className="text-sm text-gray-900">
                                                                {new Date(submission.submitted_date).toLocaleDateString("id-ID")}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(submission.submitted_date).toLocaleTimeString("id-ID", {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </div>
                                                            {submission.late && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                                                    Terlambat
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">Belum submit</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {submission.score !== null ? (
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {submission.score}/{selectedAssignment.max_score}
                                                            </div>
                                                            {submission.feedback && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Ada feedback
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* TAMBAHKAN empty state jika tidak ada submissions */}
                                {filteredSubmissions.length === 0 && (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada submission</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm || filterStatus !== 'all'
                                                ? 'Tidak ada submission yang sesuai dengan filter.'
                                                : 'Belum ada siswa yang mengumpulkan tugas ini.'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Grading Modal */}
                {gradingMode && selectedSubmission && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {selectedSubmission.score !== null ? "Edit Nilai" : "Beri Nilai"} -{" "}
                                        {selectedSubmission.student_name}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setGradingMode(false)
                                            setSelectedSubmission(null)
                                            setGradeInput("")
                                            setFeedbackInput("")
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-800 mb-2">Informasi Siswa:</h4>
                                        <p>
                                            <strong>Nama:</strong> {selectedSubmission.student_name}
                                        </p>
                                        <p>
                                            <strong>ID Siswa:</strong> {selectedSubmission.student_id}
                                        </p>
                                        <p>
                                            <strong>Tanggal Submit:</strong>{" "}
                                            {new Date(selectedSubmission.submitted_date).toLocaleString("id-ID")}
                                        </p>
                                        {selectedSubmission.late && (
                                            <p className="text-red-600">
                                                <strong>Status:</strong> Terlambat
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nilai (0 - {selectedAssignment.max_score})
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={selectedAssignment.max_score}
                                            value={gradeInput}
                                            onChange={(e) => setGradeInput(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={`Masukkan nilai (0-${selectedAssignment.max_score})`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback untuk Siswa</label>
                                        <textarea
                                            value={feedbackInput}
                                            onChange={(e) => setFeedbackInput(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Berikan feedback konstruktif untuk siswa..."
                                        />
                                    </div>

                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            onClick={() => {
                                                setGradingMode(false)
                                                setSelectedSubmission(null)
                                                setGradeInput("")
                                                setFeedbackInput("")
                                            }}
                                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleGradeSubmission}
                                            disabled={
                                                !gradeInput ||
                                                Number.parseInt(gradeInput) < 0 ||
                                                Number.parseInt(gradeInput) > selectedAssignment.max_score
                                            }
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Simpan Nilai
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Submission Modal */}
                {viewMode && selectedSubmission && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Detail Submission - {selectedSubmission.student_name}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setViewMode(false)
                                            setSelectedSubmission(null)
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Informasi Siswa */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-800 mb-3">Informasi Siswa</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm text-gray-500">Nama:</span>
                                                <p className="font-medium">{selectedSubmission.student_name}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">NIS:</span>
                                                <p className="font-medium">{selectedSubmission.student_id}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Tanggal Submit:</span>
                                                <p className="font-medium">
                                                    {selectedSubmission.submitted_date
                                                        ? new Date(selectedSubmission.submitted_date).toLocaleString("id-ID")
                                                        : 'Belum submit'
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-500">Status:</span>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedSubmission.status)}`}>
                                                    {getStatusText(selectedSubmission.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Jawaban/Komentar Siswa */}
                                    {selectedSubmission.comment && (
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-800 mb-3">Jawaban Siswa</h4>
                                            <div className="bg-white p-3 rounded border">
                                                <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.comment}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* File Submission */}
                                    {selectedSubmission.file_url && (
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-800 mb-3">File yang Dikumpulkan</h4>
                                            <div className="flex items-center justify-between bg-white p-3 rounded border">
                                                <div className="flex items-center">
                                                    <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    <div>
                                                        <p className="font-medium text-gray-900">File Submission</p>
                                                        <p className="text-sm text-gray-500">Klik untuk download</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadFile(selectedSubmission.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nilai dan Feedback (jika sudah dinilai) */}
                                    {selectedSubmission.score !== null && (
                                        <div className="bg-yellow-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-800 mb-3">Penilaian</h4>
                                            <div className="bg-white p-3 rounded border">
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <span className="text-sm text-gray-500">Nilai:</span>
                                                        <p className="text-2xl font-bold text-green-600">
                                                            {selectedSubmission.score}/{selectedAssignment.max_score}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Persentase:</span>
                                                        <p className="text-xl font-semibold text-blue-600">
                                                            {Math.round((selectedSubmission.score / selectedAssignment.max_score) * 100)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedSubmission.feedback && (
                                                    <div>
                                                        <span className="text-sm text-gray-500">Feedback:</span>
                                                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 border-t">
                                    {selectedSubmission.status !== 'not_submitted' && (
                                        <button
                                            onClick={() => {
                                                setViewMode(false)
                                                setGradingMode(true)
                                                setGradeInput(selectedSubmission.score?.toString() || "")
                                                setFeedbackInput(selectedSubmission.feedback || "")
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            {selectedSubmission.score !== null ? "Edit Nilai" : "Beri Nilai"}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setViewMode(false)
                                            setSelectedSubmission(null)
                                        }}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}


