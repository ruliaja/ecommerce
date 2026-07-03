import axiosInstance from './axiosInstance';

// Get or create an active conversation for a customer
export const getOrCreateConversation = async (userId) => {
  const response = await axiosInstance.get(`?action=get_or_create_conversation&user_id=${userId}`);
  return response.data;
};

// Send a chat message
export const sendMessage = async (conversationId, senderId, senderType, message) => {
  const response = await axiosInstance.post('?action=send_chat_message', {
    conversation_id: conversationId,
    sender_id: senderId,
    sender_type: senderType,
    message: message,
  });
  return response.data;
};

// Get messages from a conversation (supports polling via afterId)
export const getMessages = async (conversationId, afterId = 0) => {
  const response = await axiosInstance.get(
    `?action=get_chat_messages&conversation_id=${conversationId}&after_id=${afterId}`
  );
  return response.data;
};

// Get all conversations for admin panel
export const getAdminConversations = async () => {
  const response = await axiosInstance.get('?action=get_admin_conversations');
  return response.data;
};

// Mark messages as read
export const markAsRead = async (conversationId, readerType) => {
  const response = await axiosInstance.post('?action=mark_messages_read', {
    conversation_id: conversationId,
    reader_type: readerType,
  });
  return response.data;
};

// Close a conversation
export const closeConversation = async (conversationId) => {
  const response = await axiosInstance.post('?action=close_conversation', {
    conversation_id: conversationId,
  });
  return response.data;
};

// Reopen a closed conversation
export const reopenConversation = async (conversationId) => {
  const response = await axiosInstance.post('?action=reopen_conversation', {
    conversation_id: conversationId,
  });
  return response.data;
};

// Get unread message count for a user
export const getUnreadCount = async (userId, userType = 'customer') => {
  const response = await axiosInstance.get(`?action=get_unread_count&user_id=${userId}&user_type=${userType}`);
  return response.data;
};
