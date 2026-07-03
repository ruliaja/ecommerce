<?php

/**
 * Get or create an active conversation for a customer user.
 * Each customer can only have one active conversation at a time.
 */
function getOrCreateConversation($db, $userId) {
    // Check if user exists
    $userCheck = $db->prepare("SELECT id, name, role FROM users WHERE id = ?");
    $userCheck->bind_param("i", $userId);
    $userCheck->execute();
    $userResult = $userCheck->get_result();
    
    if ($userResult->num_rows === 0) {
        $userCheck->close();
        return ["status" => "error", "message" => "User tidak ditemukan"];
    }
    $user = $userResult->fetch_assoc();
    $userCheck->close();

    // Look for existing active conversation
    $stmt = $db->prepare("SELECT id, user_id, admin_id, status, last_message_at, created_at FROM chat_conversations WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $conversation = $result->fetch_assoc();
        $stmt->close();
        return ["status" => "success", "data" => $conversation];
    }
    $stmt->close();

    // Create new conversation
    $insert = $db->prepare("INSERT INTO chat_conversations (user_id) VALUES (?)");
    $insert->bind_param("i", $userId);
    
    if ($insert->execute()) {
        $newId = $db->insert_id;
        $insert->close();

        // Fetch the newly created conversation
        $fetch = $db->prepare("SELECT id, user_id, admin_id, status, last_message_at, created_at FROM chat_conversations WHERE id = ?");
        $fetch->bind_param("i", $newId);
        $fetch->execute();
        $conv = $fetch->get_result()->fetch_assoc();
        $fetch->close();

        return ["status" => "success", "data" => $conv];
    }

    $error = $insert->error;
    $insert->close();
    return ["status" => "error", "message" => "Gagal membuat conversation: " . $error];
}

/**
 * Send a chat message in a conversation.
 */
function sendChatMessage($db, $conversationId, $senderId, $senderType, $message) {
    if (empty(trim($message))) {
        return ["status" => "error", "message" => "Pesan tidak boleh kosong"];
    }

    // Verify conversation exists
    $convCheck = $db->prepare("SELECT id, user_id, status FROM chat_conversations WHERE id = ?");
    $convCheck->bind_param("i", $conversationId);
    $convCheck->execute();
    $convResult = $convCheck->get_result();

    if ($convResult->num_rows === 0) {
        $convCheck->close();
        return ["status" => "error", "message" => "Conversation tidak ditemukan"];
    }
    
    $conv = $convResult->fetch_assoc();
    $convCheck->close();

    if ($conv['status'] === 'closed') {
        return ["status" => "error", "message" => "Conversation sudah ditutup"];
    }

    // If sender is admin and conversation has no admin yet, assign them
    if ($senderType === 'admin') {
        $updateAdmin = $db->prepare("UPDATE chat_conversations SET admin_id = ? WHERE id = ? AND admin_id IS NULL");
        $updateAdmin->bind_param("ii", $senderId, $conversationId);
        $updateAdmin->execute();
        $updateAdmin->close();
    }

    // Insert message with sender_type
    $stmt = $db->prepare("INSERT INTO chat_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiss", $conversationId, $senderId, $senderType, $message);

    if ($stmt->execute()) {
        $messageId = $db->insert_id;
        $stmt->close();

        // Update last_message_at on conversation
        $update = $db->prepare("UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?");
        $update->bind_param("i", $conversationId);
        $update->execute();
        $update->close();

        // Fetch the new message
        $fetch = $db->prepare("SELECT m.id, m.conversation_id, m.sender_id, m.sender_type, m.message, m.is_read, m.created_at, 
                                      COALESCE(u.name, a.name) as sender_name 
                               FROM chat_messages m 
                               LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'customer'
                               LEFT JOIN admins a ON m.sender_id = a.id AND m.sender_type = 'admin'
                               WHERE m.id = ?");
        $fetch->bind_param("i", $messageId);
        $fetch->execute();
        $msg = $fetch->get_result()->fetch_assoc();
        $fetch->close();

        return ["status" => "success", "data" => $msg];
    }

    $error = $stmt->error;
    $stmt->close();
    return ["status" => "error", "message" => "Gagal mengirim pesan: " . $error];
}

/**
 * Get messages from a conversation.
 * Supports polling via after_id parameter — only returns messages with id > after_id.
 */
function getChatMessages($db, $conversationId, $afterId = 0) {
    $query = "SELECT m.id, m.conversation_id, m.sender_id, m.sender_type, m.message, m.is_read, m.created_at, 
                     COALESCE(u.name, a.name) as sender_name 
              FROM chat_messages m 
              LEFT JOIN users u ON m.sender_id = u.id AND m.sender_type = 'customer'
              LEFT JOIN admins a ON m.sender_id = a.id AND m.sender_type = 'admin'
              WHERE m.conversation_id = ? AND m.id > ? 
              ORDER BY m.created_at ASC";

    $stmt = $db->prepare($query);
    $stmt->bind_param("ii", $conversationId, $afterId);
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['conversation_id'] = (int)$row['conversation_id'];
        $row['sender_id'] = (int)$row['sender_id'];
        $row['is_read'] = (bool)$row['is_read'];
        $messages[] = $row;
    }
    $stmt->close();

    return ["status" => "success", "data" => $messages];
}

/**
 * Get all conversations for admin panel.
 * Includes user info, last message preview, and unread count.
 */
function getAdminConversations($db) {
    $query = "SELECT 
                c.id,
                c.user_id,
                c.admin_id,
                c.status,
                c.last_message_at,
                c.created_at,
                u.name as user_name,
                u.email as user_email,
                u.profile_image as user_avatar,
                (SELECT message FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT sender_type FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sender_type,
                (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id AND is_read = 0 AND sender_type = 'customer') as unread_count
              FROM chat_conversations c
              JOIN users u ON c.user_id = u.id
              ORDER BY 
                c.status ASC,
                c.last_message_at DESC";

    $result = $db->query($query);

    if (!$result) {
        return ["status" => "error", "message" => "Query failed: " . $db->error];
    }

    $conversations = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['user_id'] = (int)$row['user_id'];
        $row['admin_id'] = $row['admin_id'] ? (int)$row['admin_id'] : null;
        $row['unread_count'] = (int)$row['unread_count'];
        $conversations[] = $row;
    }

    return ["status" => "success", "data" => $conversations];
}

/**
 * Mark all messages in a conversation as read for a specific user type.
 * Only marks messages NOT sent by the reader as read.
 */
function markMessagesAsRead($db, $conversationId, $readerType) {
    // If reader is customer, mark admin messages as read, and vice versa
    $targetSenderType = ($readerType === 'customer') ? 'admin' : 'customer';
    
    $stmt = $db->prepare("UPDATE chat_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type = ? AND is_read = 0");
    $stmt->bind_param("is", $conversationId, $targetSenderType);

    if ($stmt->execute()) {
        $affected = $stmt->affected_rows;
        $stmt->close();
        return ["status" => "success", "message" => "$affected pesan ditandai sudah dibaca"];
    }

    $error = $stmt->error;
    $stmt->close();
    return ["status" => "error", "message" => "Gagal menandai pesan: " . $error];
}

/**
 * Close a conversation.
 */
function closeConversation($db, $conversationId) {
    $stmt = $db->prepare("UPDATE chat_conversations SET status = 'closed' WHERE id = ?");
    $stmt->bind_param("i", $conversationId);

    if ($stmt->execute()) {
        $stmt->close();
        return ["status" => "success", "message" => "Conversation ditutup"];
    }

    $error = $stmt->error;
    $stmt->close();
    return ["status" => "error", "message" => "Gagal menutup conversation: " . $error];
}

/**
 * Reopen a closed conversation.
 */
function reopenConversation($db, $conversationId) {
    $stmt = $db->prepare("UPDATE chat_conversations SET status = 'active' WHERE id = ?");
    $stmt->bind_param("i", $conversationId);

    if ($stmt->execute()) {
        $stmt->close();
        return ["status" => "success", "message" => "Conversation dibuka kembali"];
    }

    $error = $stmt->error;
    $stmt->close();
    return ["status" => "error", "message" => "Gagal membuka conversation: " . $error];
}

/**
 * Get total unread message count for a user.
 */
function getUnreadCount($db, $userId, $userType = 'customer') {
    if ($userType === 'admin') {
        // Admin: count all unread messages from customers across all active conversations
        $query = "SELECT COUNT(*) as count FROM chat_messages m 
                  JOIN chat_conversations c ON m.conversation_id = c.id 
                  WHERE m.sender_type = 'customer' AND m.is_read = 0 AND c.status = 'active'";
        $result = $db->query($query);
    } else {
        // Customer: count unread messages from admin in their conversations
        $query = "SELECT COUNT(*) as count FROM chat_messages m 
                  JOIN chat_conversations c ON m.conversation_id = c.id 
                  WHERE c.user_id = ? AND m.sender_type = 'admin' AND m.is_read = 0";
        $stmt = $db->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();
    }

    $count = $result->fetch_assoc()['count'];
    return ["status" => "success", "data" => ["unread_count" => (int)$count]];
}
?>
