import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMessageCircle, FiSend, FiCheck, FiCheckCircle, FiX, FiSearch, FiUser, FiChevronDown, FiRefreshCw, FiClock } from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getAdminConversations,
  getMessages,
  sendMessage,
  markAsRead,
  closeConversation,
  reopenConversation,
} from '../../api/chatService';
import { getCurrentUser } from '../../api/authService';

const ChatManagement = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingRef = useRef(null);
  const convPollingRef = useRef(null);
  const lastMsgIdRef = useRef(0);

  const admin = getCurrentUser();

  useEffect(() => {
    fetchConversations();
    convPollingRef.current = setInterval(fetchConversations, 5000);
    return () => clearInterval(convPollingRef.current);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      pollingRef.current = setInterval(() => pollNewMessages(selectedConv.id), 3000);
      return () => clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [selectedConv?.id]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  };

  const fetchConversations = async () => {
    try {
      const res = await getAdminConversations();
      if (res.status === 'success') {
        setConversations(res.data);
        if (selectedConv) {
          const updated = res.data.find(c => c.id === selectedConv.id);
          if (updated) setSelectedConv(updated);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadMessages = async (convId) => {
    setMsgLoading(true);
    setMessages([]);
    setLastMessageId(0);
    lastMsgIdRef.current = 0;
    try {
      const res = await getMessages(convId, 0);
      if (res.status === 'success') {
        setMessages(res.data);
        if (res.data.length > 0) {
          const maxId = Math.max(...res.data.map(m => m.id));
          setLastMessageId(maxId);
          lastMsgIdRef.current = maxId;
        }
        await markAsRead(convId, admin.id);
        fetchConversations();
      }
      setTimeout(() => scrollToBottom(false), 100);
    } catch (e) { console.error(e); }
    finally { setMsgLoading(false); }
  };

  const pollNewMessages = async (convId) => {
    try {
      const res = await getMessages(convId, lastMsgIdRef.current);
      if (res.status === 'success' && res.data.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.filter(m => !m._optimistic).map(m => m.id));
          const newMsgs = res.data.filter(m => !existingIds.has(m.id));
          return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
        });
        const maxId = Math.max(...res.data.map(m => m.id));
        lastMsgIdRef.current = maxId;
        setLastMessageId(maxId);
        await markAsRead(convId, 'admin');
        fetchConversations();
      }
    } catch (e) {}
  };

  const handleSend = async () => {
    if (!text.trim() || sending || !selectedConv) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    const optimistic = {
      id: `opt_${Date.now()}`, conversation_id: selectedConv.id, sender_id: admin.id,
      sender_name: admin.name, sender_type: 'admin', message: msg,
      is_read: false, created_at: new Date().toISOString(), _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await sendMessage(selectedConv.id, admin.id, 'admin', msg);
      if (res.status === 'success') {
        setMessages(prev => prev.map(m => m._optimistic && m.message === msg ? res.data : m));
        setLastMessageId(res.data.id);
        fetchConversations();
      }
    } catch (e) {
      setMessages(prev => prev.filter(m => !m._optimistic));
      setText(msg);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCloseConv = async (convId) => {
    try {
      await closeConversation(convId);
      fetchConversations();
      if (selectedConv?.id === convId) {
        setSelectedConv(prev => ({ ...prev, status: 'closed' }));
      }
    } catch (e) { console.error(e); }
  };

  const handleReopenConv = async (convId) => {
    try {
      await reopenConversation(convId);
      fetchConversations();
      if (selectedConv?.id === convId) {
        setSelectedConv(prev => ({ ...prev, status: 'active' }));
      }
    } catch (e) { console.error(e); }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d) => {
    const date = new Date(d); const today = new Date();
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Hari Ini';
    if (date.toDateString() === y.toDateString()) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };
  const formatRelative = (d) => {
    const now = new Date(); const date = new Date(d);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff/60)} mnt`;
    if (diff < 86400) return formatTime(d);
    return formatDate(d);
  };

  const filteredConversations = conversations.filter(c =>
    c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = messages.reduce((g, m) => {
    const d = formatDate(m.created_at);
    if (!g[d]) g[d] = [];
    g[d].push(m);
    return g;
  }, {});

  return (
    <AdminLayout currentPage="chat" noPadding={true}>
      <div className="flex h-full bg-white overflow-hidden font-['Inter',_sans-serif]">
        {/* Sidebar List */}
        <div className={`flex flex-col border-r border-slate-100 transition-all ${selectedConv ? 'hidden md:flex w-80' : 'w-full md:w-80'} bg-slate-50/50`}>
          <div className="p-3 bg-white border-b border-slate-100">
            <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
              <FiMessageCircle size={14} className="text-yellow-400" /> Percakapan
            </h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                placeholder="Cari pelanggan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="p-8 text-center animate-pulse"><div className="w-12 h-1 h-1 bg-slate-200 rounded-full mx-auto mb-2" /><div className="w-24 h-1 bg-slate-100 rounded-full mx-auto" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-12 text-center">
                <FiMessageCircle size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tidak ada pesan</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`px-3 py-2.5 cursor-pointer border-b border-slate-100/50 transition-all group relative ${
                    selectedConv?.id === conv.id ? 'bg-white shadow-sm' : 'hover:bg-white'
                  }`}
                >
                  {selectedConv?.id === conv.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400" />}
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden shadow-inner">
                      {conv.user_avatar ? <img src={conv.user_avatar} alt="" className="w-full h-full object-cover" /> : <FiUser size={16} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className={`text-[11px] font-black uppercase tracking-tight truncate ${conv.unread_count > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                          {conv.user_name}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                          {formatRelative(conv.last_message_at)}
                        </span>
                      </div>
                      <p className={`text-[10px] truncate ${conv.unread_count > 0 ? 'font-black text-slate-800' : 'font-medium text-slate-400'}`}>
                        {conv.last_sender_type === 'admin' ? <span className="text-yellow-600 mr-1 italic">Anda:</span> : ''}
                        {conv.last_message || '...'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="absolute right-4 bottom-3 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                        <span className="text-[8px] font-black text-slate-900">{conv.unread_count}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`flex-1 flex flex-col bg-white ${!selectedConv && 'hidden md:flex'}`}>
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/30">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6">
                <FiMessageCircle size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pilih Percakapan</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Mulai membalas pesan pelanggan</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-12 px-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedConv(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-800"><FiChevronDown size={18} className="rotate-90" /></button>
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shadow-inner">
                    {selectedConv.user_avatar ? <img src={selectedConv.user_avatar} alt="" className="w-full h-full object-cover" /> : <FiUser size={12} className="text-slate-400" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">{selectedConv.user_name}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">{selectedConv.user_email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedConv.status === 'active' ? (
                    <button onClick={() => handleCloseConv(selectedConv.id)} className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-lg border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-1.5">
                      <FiX size={10} /> Tutup
                    </button>
                  ) : (
                    <button onClick={() => handleReopenConv(selectedConv.id)} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center gap-1.5">
                      <FiRefreshCw size={10} /> Buka
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 scrollbar-hide">
                {msgLoading ? (
                  <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse tracking-widest">Memuat pesan...</div>
                ) : (
                  Object.entries(grouped).map(([date, msgs]) => (
                    <div key={date} className="space-y-3">
                      <div className="flex justify-center mb-2">
                        <span className="px-2.5 py-0.5 bg-white border border-slate-100 text-[8px] font-black text-slate-400 uppercase rounded-full shadow-sm">
                          {date}
                        </span>
                      </div>
                      {msgs.map(msg => {
                        const isSent = msg.sender_type === 'admin';
                        return (
                          <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] group relative ${isSent ? 'items-end' : 'items-start'}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm transition-all hover:shadow-md ${
                                isSent 
                                  ? 'bg-[#0f172a] text-white rounded-br-none' 
                                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                              }`}>
                                {msg.message}
                              </div>
                              <div className={`flex items-center gap-1.5 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{formatTime(msg.created_at)}</span>
                                {isSent && (
                                  msg.is_read 
                                    ? <FiCheckCircle size={10} className="text-yellow-500" /> 
                                    : <FiCheck size={10} className="text-slate-300" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                {selectedConv.status === 'closed' ? (
                  <div className="flex-1 py-2 text-center bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                    Percakapan ini telah ditutup
                  </div>
                ) : (
                  <>
                    <input
                      placeholder="Ketik balasan..."
                      value={text}
                      onChange={e => setText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                      className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!text.trim() || sending}
                      className="w-9 h-9 bg-slate-900 text-yellow-400 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 shadow-lg shadow-slate-900/10"
                    >
                      <FiSend size={16} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ChatManagement;
