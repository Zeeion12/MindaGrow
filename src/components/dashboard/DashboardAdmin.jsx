import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, Activity, LogOut, Eye, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayLogins: 0,
    weekLogins: 0,
    roleStats: []
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [userDetails, setUserDetails] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Simulate authentication token (in real app, get from localStorage/context)
  const token = localStorage.getItem('adminToken') || 'sample-admin-token';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, statsRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/activities', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // For demo purposes, using sample data
      setSampleData();
    } finally {
      setLoading(false);
    }
  };

  const setSampleData = () => {
    const sampleUsers = [
      {
        id: 1,
        nama_lengkap: 'Budi Santoso',
        email: 'budi@email.com',
        role: 'siswa',
        identifier: '12345',
        last_login: '2025-06-15T08:30:00',
        created_at: '2025-06-10T10:00:00'
      },
      {
        id: 2,
        nama_lengkap: 'Siti Rahayu',
        email: 'siti@email.com',
        role: 'guru',
        identifier: 'NUPTK123',
        last_login: '2025-06-15T09:15:00',
        created_at: '2025-06-08T14:30:00'
      },
      {
        id: 3,
        nama_lengkap: 'Ahmad Wijaya',
        email: 'ahmad@email.com',
        role: 'orangtua',
        identifier: '1234567890123456',
        last_login: '2025-06-14T19:45:00',
        created_at: '2025-06-05T16:20:00'
      }
    ];

    setUsers(sampleUsers);
    setStats({
      totalUsers: 3,
      todayLogins: 2,
      weekLogins: 3,
      roleStats: [
        { role: 'siswa', count: 1 },
        { role: 'guru', count: 1 },
        { role: 'orangtua', count: 1 }
      ]
    });
    setActivities(sampleUsers);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belum pernah login';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hari ini';
    if (diffDays === 2) return 'Kemarin';
    if (diffDays <= 7) return `${diffDays - 1} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'siswa': return 'bg-blue-100 text-blue-800';
      case 'guru': return 'bg-green-100 text-green-800';
      case 'orangtua': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'siswa': return 'Siswa';
      case 'guru': return 'Guru';
      case 'orangtua': return 'Orang Tua';
      default: return role;
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUserDetails(userData.user);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // For demo, show sample data
      const user = users.find(u => u.id === userId);
      setUserDetails(user);
      setShowUserModal(true);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        alert('User berhasil dihapus');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Gagal menghapus user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Platform Personalisasi Siswa</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedView('overview')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('users')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Semua User
            </button>
            <button
              onClick={() => setSelectedView('activities')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === 'activities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Aktivitas Login
            </button>
          </nav>
        </div>

        {/* Stats Cards */}
        {selectedView === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total User</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Login Hari Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.todayLogins}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Login Minggu Ini</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.weekLogins}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">User Aktif</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.last_login).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Distribusi Role User</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stats.roleStats.map((stat) => (
                    <div key={stat.role} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                      <p className="text-sm text-gray-600 capitalize">{getRoleLabel(stat.role)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Table */}
        {(selectedView === 'users' || selectedView === 'overview') && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedView === 'overview' ? 'User Terdaftar' : 'Semua User'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Terakhir Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.slice(0, selectedView === 'overview' ? 5 : users.length).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.nama_lengkap || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.identifier || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activities Table */}
        {selectedView === 'activities' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Aktivitas Login Terbaru</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {activity.nama_lengkap || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{activity.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(activity.role)}`}>
                          {getRoleLabel(activity.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(activity.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && userDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detail User</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama</label>
                  <p className="text-sm text-gray-900">{userDetails.nama_lengkap || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{userDetails.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userDetails.role)}`}>
                    {getRoleLabel(userDetails.role)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Identifier</label>
                  <p className="text-sm text-gray-900">{userDetails.identifier || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Terakhir Login</label>
                  <p className="text-sm text-gray-900">{formatDate(userDetails.last_login)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Daftar</label>
                  <p className="text-sm text-gray-900">{formatDate(userDetails.created_at)}</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;