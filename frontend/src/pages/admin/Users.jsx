import React, { useState, useEffect } from 'react';
import { FiTrash2, FiShield, FiUser, FiSearch, FiMail, FiCalendar } from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import axiosInstance from '../../api/axiosInstance';
import { useNotification } from '../../context/NotificationContext';

const UserManagement = () => {
  const { showConfirm, showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('?action=get_users');
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    const { isConfirmed } = await showConfirm('Hapus Akun', `Hapus akun "${name}"?`, 'Ya, Hapus', 'Batal');
    if (isConfirmed) {
      try {
        setLoading(true);
        const response = await axiosInstance.post('?action=delete_user', { user_id: id });
        if (response.data.status === 'success') {
          setUsers(users.filter(u => u.id !== id));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        showError('Gagal menghapus pengguna');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout currentPage="users">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl shadow-lg shadow-purple-100/20">
              <FiUser size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Pengguna</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{users.length} Terdaftar</p>
            </div>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none w-72 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Users Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identitas</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Akses</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Date</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Memuat data...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Tidak ada pengguna ditemukan</td></tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] border border-slate-200">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><FiMail size={10} /> {user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                          user.role === 'Admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {user.role === 'Admin' && <FiShield size={10} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                          user.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-black text-slate-800">{user.orders}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <FiCalendar size={12} />
                          <span className="text-[10px] font-bold">{user.joinDate}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
