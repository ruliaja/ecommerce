<?php

function getOrCreateSessionId() {
    if (!isset($_COOKIE['guest_session_id'])) {
        $sessionId = 'guest_' . bin2hex(random_bytes(16));
        setcookie('guest_session_id', $sessionId, time() + (30 * 24 * 60 * 60), '/');
        return $sessionId;
    }
    return $_COOKIE['guest_session_id'];
}

function addToCart($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;
        $guestSessionId = !$userId ? getOrCreateSessionId() : null;
        $productId = (int)($data['product_id'] ?? 0);
        $quantity = (int)($data['quantity'] ?? 1);
        $price = (int)($data['price'] ?? 0);
        $selectedSize = $data['selected_size'] ?? null;
        $selectedColor = $data['selected_color'] ?? null;

        if (!$productId || !$quantity) {
            throw new Exception("Invalid product_id or quantity");
        }

        // Check if same product + size + color already in cart
        if ($userId) {
            $checkQuery = "SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ? AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL)) AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bind_param("iissss", $userId, $productId, $selectedSize, $selectedSize, $selectedColor, $selectedColor);
        } else {
            $checkQuery = "SELECT id, quantity FROM cart WHERE guest_session_id = ? AND product_id = ? AND (selected_size = ? OR (selected_size IS NULL AND ? IS NULL)) AND (selected_color = ? OR (selected_color IS NULL AND ? IS NULL))";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bind_param("sissss", $guestSessionId, $productId, $selectedSize, $selectedSize, $selectedColor, $selectedColor);
        }
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        if ($result && $result->num_rows > 0) {
            // Update quantity
            $row = $result->fetch_assoc();
            $newQuantity = $row['quantity'] + $quantity;
            $updateQuery = "UPDATE cart SET quantity = ? WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->bind_param("ii", $newQuantity, $row['id']);
            $stmt->execute();
            $stmt->close();
            $checkStmt->close();
            
            return [
                'status' => 'success',
                'message' => 'Item quantity updated',
                'action' => 'updated',
                'guest_session_id' => !$userId ? $guestSessionId : null
            ];
        } else {
            $checkStmt->close();
            // Insert new item
            $insertQuery = "INSERT INTO cart (user_id, guest_session_id, product_id, quantity, price, selected_size, selected_color) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $db->prepare($insertQuery);
            $stmt->bind_param("isiiiss", $userId, $guestSessionId, $productId, $quantity, $price, $selectedSize, $selectedColor);
            
            if (!$stmt->execute()) {
                throw new Exception("Error adding to cart: " . $stmt->error);
            }
            
            $stmt->close();
            
            return [
                'status' => 'success',
                'message' => 'Item added to cart',
                'action' => 'added',
                'guest_session_id' => !$userId ? $guestSessionId : null
            ];
        }
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

function getCart($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;
        $guestSessionId = $data['guest_session_id'] ?? (!$userId ? getOrCreateSessionId() : null);

        if ($userId) {
            $query = "SELECT c.id, c.product_id, c.quantity, c.selected_size, c.selected_color, p.name, p.image_url, p.price AS product_price FROM cart c
                      JOIN products p ON c.product_id = p.id
                      WHERE c.user_id = ?
                      ORDER BY c.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bind_param("i", $userId);
        } else {
            $query = "SELECT c.id, c.product_id, c.quantity, c.selected_size, c.selected_color, p.name, p.image_url, p.price AS product_price FROM cart c
                      JOIN products p ON c.product_id = p.id
                      WHERE c.guest_session_id = ?
                      ORDER BY c.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bind_param("s", $guestSessionId);
        }

        $stmt->execute();
        $result = $stmt->get_result();
        
        $cartItems = [];
        while ($row = $result->fetch_assoc()) {
            $cartItems[] = [
                'cart_id' => (int)$row['id'],
                'id' => (int)$row['product_id'],
                'name' => $row['name'],
                'image_url' => $row['image_url'],
                'price' => (int)$row['product_price'],
                'quantity' => (int)$row['quantity'],
                'selected_size' => $row['selected_size'],
                'selected_color' => $row['selected_color'],
            ];
        }
        
        $stmt->close();

        return [
            'status' => 'success',
            'data' => $cartItems,
            'guest_session_id' => !$userId ? $guestSessionId : null
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

function updateCartItem($db, $data) {
    try {
        $cartId = (int)($data['cart_id'] ?? 0);
        $quantity = (int)($data['quantity'] ?? 0);

        if (!$cartId || $quantity < 0) {
            throw new Exception("Invalid cart_id or quantity");
        }

        if ($quantity == 0) {
            // Delete item
            $deleteQuery = "DELETE FROM cart WHERE id = ?";
            $stmt = $db->prepare($deleteQuery);
            $stmt->bind_param("i", $cartId);
            $stmt->execute();
            $stmt->close();
            
            return [
                'status' => 'success',
                'message' => 'Item removed from cart',
                'action' => 'removed'
            ];
        } else {
            // Update quantity
            $updateQuery = "UPDATE cart SET quantity = ? WHERE id = ?";
            $stmt = $db->prepare($updateQuery);
            $stmt->bind_param("ii", $quantity, $cartId);
            $stmt->execute();
            $stmt->close();
            
            return [
                'status' => 'success',
                'message' => 'Item quantity updated',
                'action' => 'updated'
            ];
        }
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

function removeFromCart($db, $data) {
    try {
        $cartId = (int)($data['cart_id'] ?? 0);

        if (!$cartId) {
            throw new Exception("Invalid cart_id");
        }

        $deleteQuery = "DELETE FROM cart WHERE id = ?";
        $stmt = $db->prepare($deleteQuery);
        $stmt->bind_param("i", $cartId);
        
        if (!$stmt->execute()) {
            throw new Exception("Error removing from cart: " . $stmt->error);
        }
        
        $stmt->close();

        return [
            'status' => 'success',
            'message' => 'Item removed from cart'
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

function clearCart($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;
        $guestSessionId = !$userId ? getOrCreateSessionId() : null;

        if ($userId) {
            $deleteQuery = "DELETE FROM cart WHERE user_id = ?";
            $stmt = $db->prepare($deleteQuery);
            $stmt->bind_param("i", $userId);
        } else {
            $deleteQuery = "DELETE FROM cart WHERE guest_session_id = ?";
            $stmt = $db->prepare($deleteQuery);
            $stmt->bind_param("s", $guestSessionId);
        }

        if (!$stmt->execute()) {
            throw new Exception("Error clearing cart: " . $stmt->error);
        }
        
        $stmt->close();

        return [
            'status' => 'success',
            'message' => 'Cart cleared successfully',
            'guest_session_id' => !$userId ? $guestSessionId : null
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => $e->getMessage()
        ];
    }
}

?>


