import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiMessageCircle, FiX, FiSend, FiCheck, FiCheckCircle, FiChevronDown } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOrCreateConversation,
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCount,
} from '../api/chatService';

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageId, setLastMessageId] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const pollingRef = useRef(null);
  const unreadPollingRef = useRef(null);

  const { user, isAuthenticated: logged } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'instant' 
      });
    }
  }, []);

  // Check if scrolled to bottom
  const isAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    return container.scrollHeight - container.scrollTop - container.clientHeight < 60;
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    setShowScrollBtn(!isAtBottom());
  }, [isAtBottom]);

  // Initialize conversation when chat opens
  const initConversation = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await getOrCreateConversation(user.id);
      if (res.status === 'success') {
        setConversationId(res.data.id);
        const msgRes = await getMessages(res.data.id, 0);
        if (msgRes.status === 'success') {
          setMessages(msgRes.data);
          if (msgRes.data.length > 0) {
            setLastMessageId(Math.max(...msgRes.data.map(m => m.id)));
          }
          await markAsRead(res.data.id, 'customer');
          setUnreadCount(0);
        }
        setTimeout(() => scrollToBottom(false), 100);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, scrollToBottom]);

  // Fetch new messages for polling
  const fetchNewMessages = useCallback(async () => {
    if (!conversationId || !user?.id) return;
    try {
      const res = await getMessages(conversationId, lastMessageId);
      if (res.status === 'success' && res.data.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.filter(m => !m._optimistic).map(m => m.id));
          const newMsgs = res.data.filter(m => !existingIds.has(m.id));
          return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
        });
        setLastMessageId(Math.max(...res.data.map(m => m.id)));
        await markAsRead(conversationId, 'customer');
      }
    } catch (error) {
      // Silent fail for polling
    }
  }, [conversationId, lastMessageId, user?.id]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getUnreadCount(user.id);
      if (res.status === 'success') {
        setUnreadCount(res.data.unread_count);
      }
    } catch (error) {
      // Silent fail
    }
  }, [user?.id]);

  useEffect(() => {
    if (isOpen && logged && user?.id && user.role !== 'admin' && !conversationId) {
      initConversation();
    }
  }, [isOpen, logged, user?.id, initConversation]);

  // Polling for new messages when chat is open
  useEffect(() => {
    if (isOpen && conversationId && logged) {
      pollingRef.current = setInterval(() => {
        fetchNewMessages();
      }, 3000);

      return () => clearInterval(pollingRef.current);
    }
    return () => clearInterval(pollingRef.current);
  }, [isOpen, conversationId, logged, fetchNewMessages]);

  // Polling for unread count when chat is closed
  useEffect(() => {
    if (!isOpen && logged && user?.id && user.role !== 'admin') {
      fetchUnreadCount();
      unreadPollingRef.current = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(unreadPollingRef.current);
    }
    return () => clearInterval(unreadPollingRef.current);
  }, [isOpen, logged, user?.id, fetchUnreadCount]);

  // Listen for external open-chat events
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && isAtBottom()) {
      scrollToBottom();
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Don't render for admin users, non-logged users, or on admin pages
  if (!logged || !user || user.role === 'admin' || isAdminPage) return null;

  const handleSend = async () => {
    if (!text.trim() || sending || !conversationId) return;
    
    const messageText = text.trim();
    setText('');
    setSending(true);

    // Optimistic update
    const optimisticMsg = {
      id: `opt_${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: user.name,
      sender_type: 'customer',
      message: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const res = await sendMessage(conversationId, user.id, 'customer', messageText);
      if (res.status === 'success') {
        // Replace optimistic message with real one
        setMessages(prev => 
          prev.map(m => m._optimistic && m.message === messageText ? res.data : m)
        );
        setLastMessageId(res.data.id);
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => !m._optimistic));
      setText(messageText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    if (!isOpen) {
      setIsAnimating(true);
      setIsOpen(true);
      setTimeout(() => setIsAnimating(false), 400);
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 300);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hari Ini';
    if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <>
      {/* CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .chat-widget {
          font-family: 'Inter', sans-serif;
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
        }

        .chat-fab {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.4), 0 2px 8px rgba(0,0,0,0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .chat-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 40px rgba(245, 158, 11, 0.5), 0 4px 12px rgba(0,0,0,0.15);
        }

        .chat-fab:active {
          transform: scale(0.95);
        }

        .chat-fab .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid rgba(245, 158, 11, 0.6);
          animation: pulse-ring 2s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .chat-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 700;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          animation: badge-bounce 0.3s ease;
        }

        @keyframes badge-bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        .chat-panel {
          position: absolute;
          bottom: 76px;
          right: 0;
          width: 380px;
          max-height: 550px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: panel-open 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: bottom right;
        }

        .chat-panel.closing {
          animation: panel-close 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
        }

        @keyframes panel-open {
          0% { transform: scale(0.3) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes panel-close {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.3) translateY(20px); opacity: 0; }
        }

        .chat-header {
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: white;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .chat-header-text h3 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
        }

        .chat-header-text p {
          font-size: 12px;
          color: #9ca3af;
          margin: 2px 0 0 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .chat-header-text .online-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: dot-pulse 2s ease-in-out infinite;
        }

        @keyframes dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .chat-close-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .chat-close-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: rotate(90deg);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f9fafb;
          min-height: 300px;
          max-height: 370px;
          position: relative;
          scroll-behavior: smooth;
        }

        .chat-messages::-webkit-scrollbar {
          width: 5px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }

        .chat-date-divider {
          text-align: center;
          margin: 16px 0 12px;
        }

        .chat-date-divider span {
          background: #e5e7eb;
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 14px;
          border-radius: 12px;
        }

        .chat-bubble {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 16px;
          margin-bottom: 4px;
          position: relative;
          animation: bubble-in 0.2s ease;
          word-wrap: break-word;
          line-height: 1.5;
        }

        @keyframes bubble-in {
          0% { transform: scale(0.9) translateY(4px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        .chat-bubble-wrapper {
          display: flex;
          margin-bottom: 2px;
        }

        .chat-bubble-wrapper.sent {
          justify-content: flex-end;
        }

        .chat-bubble-wrapper.received {
          justify-content: flex-start;
        }

        .chat-bubble.sent {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border-bottom-right-radius: 6px;
        }

        .chat-bubble.received {
          background: white;
          color: #111827;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 6px;
        }

        .chat-bubble .message-text {
          font-size: 13.5px;
        }

        .chat-bubble .message-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-top: 4px;
        }

        .chat-bubble .message-time {
          font-size: 10px;
          opacity: 0.7;
        }

        .chat-bubble .message-status {
          display: flex;
          align-items: center;
        }

        .chat-bubble.sent .message-status {
          color: rgba(255,255,255,0.8);
        }

        .chat-input-area {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          border: 1.5px solid #e5e7eb;
          border-radius: 24px;
          padding: 10px 18px;
          font-size: 13.5px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s;
          resize: none;
          max-height: 80px;
          line-height: 1.4;
          background: #f9fafb;
        }

        .chat-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
          background: white;
        }

        .chat-input::placeholder {
          color: #9ca3af;
        }

        .chat-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .chat-send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .chat-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          height: 100%;
        }

        .chat-empty-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .chat-empty h4 {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px;
        }

        .chat-empty p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .chat-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 40px;
        }

        .chat-loading-dots {
          display: flex;
          gap: 6px;
        }

        .chat-loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d97706;
          animation: dot-bounce 1.4s ease-in-out infinite both;
        }

        .chat-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .chat-loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .scroll-to-bottom {
          position: absolute;
          bottom: 8px;
          right: 16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 5;
        }

        .scroll-to-bottom:hover {
          background: #f3f4f6;
          transform: translateY(-2px);
        }

        @media (max-width: 480px) {
          .chat-widget {
            bottom: 16px;
            right: 16px;
          }
          .chat-panel {
            width: calc(100vw - 32px);
            max-height: calc(100vh - 120px);
            bottom: 72px;
          }
          .chat-fab {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>

      <div className="chat-widget">
        {/* Chat Panel */}
        {(isOpen || isAnimating) && (
          <div className={`chat-panel ${!isOpen && isAnimating ? 'closing' : ''}`}>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar">OK</div>
                <div className="chat-header-text">
                  <h3>OutfitKita Support</h3>
                  <p>
                    <span className="online-dot"></span>
                    Biasanya membalas dalam beberapa menit
                  </p>
                </div>
              </div>
              <button className="chat-close-btn" onClick={toggleChat} id="chat-close-btn">
                <FiX size={18} />
              </button>
            </div>

            {/* Messages */}
            <div 
              className="chat-messages" 
              ref={messagesContainerRef} 
              onScroll={handleScroll}
            >
              {loading ? (
                <div className="chat-loading">
                  <div className="chat-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="chat-empty-icon">
                    <FiMessageCircle size={28} color="#d97706" />
                  </div>
                  <h4>Mulai Percakapan</h4>
                  <p>Hai {user?.name?.split(' ')[0]}! 👋<br />Ada yang bisa kami bantu?</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="chat-date-divider">
                      <span>{date}</span>
                    </div>
                    {msgs.map((msg) => {
                      const isMine = msg.sender_type === 'customer';
                      return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-wrapper ${isMine ? 'sent' : 'received'}`}
                      >
                        <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                          <div className="message-text">{msg.message}</div>
                          <div className="message-meta">
                            <span className="message-time">{formatTime(msg.created_at)}</span>
                            {isMine && (
                              <span className="message-status">
                                {msg.is_read ? (
                                  <FiCheckCircle size={12} />
                                ) : (
                                  <FiCheck size={12} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />

              {showScrollBtn && (
                <button className="scroll-to-bottom" onClick={() => scrollToBottom()}>
                  <FiChevronDown size={18} color="#6b7280" />
                </button>
              )}
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                placeholder="Ketik pesan..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending || loading}
                id="chat-input"
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={!text.trim() || sending || loading}
                id="chat-send-btn"
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        )}

        {/* FAB Button */}
        <button className="chat-fab" onClick={toggleChat} id="chat-fab">
          {!isOpen && <span className="pulse-ring"></span>}
          {isOpen ? <FiX size={26} /> : <FiMessageCircle size={26} />}
          {!isOpen && unreadCount > 0 && (
            <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </div>
    </>
  );
};

export default Chat;