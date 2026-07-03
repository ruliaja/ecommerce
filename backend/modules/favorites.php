<?php

// ADD TO FAVORITES
function addToFavorite($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;
        $productId = (int)($data['product_id'] ?? 0);

        if (!$userId || !$productId) {
            return ["status" => "error", "message" => "user_id dan product_id diperlukan"];
        }

        // Check if already in favorites
        $checkQuery = "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?";
        $stmt = $db->prepare($checkQuery);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("ii", $userId, $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $stmt->close();
            return ["status" => "error", "message" => "Produk sudah ada di favorit"];
        }
        $stmt->close();

        // Insert to favorites
        $insertQuery = "INSERT INTO favorites (user_id, product_id) VALUES (?, ?)";
        $stmt = $db->prepare($insertQuery);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("ii", $userId, $productId);
        
        if ($stmt->execute()) {
            $stmt->close();
            return ["status" => "success", "message" => "Produk ditambahkan ke favorit"];
        } else {
            $error_msg = $stmt->error;
            $stmt->close();
            return ["status" => "error", "message" => "Error adding to favorites: " . $error_msg];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => $e->getMessage()];
    }
}

// REMOVE FROM FAVORITES
function removeFromFavorite($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;
        $productId = (int)($data['product_id'] ?? 0);

        if (!$userId || !$productId) {
            return ["status" => "error", "message" => "user_id dan product_id diperlukan"];
        }

        $deleteQuery = "DELETE FROM favorites WHERE user_id = ? AND product_id = ?";
        $stmt = $db->prepare($deleteQuery);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("ii", $userId, $productId);
        
        if ($stmt->execute()) {
            $stmt->close();
            return ["status" => "success", "message" => "Produk dihapus dari favorit"];
        } else {
            $error_msg = $stmt->error;
            $stmt->close();
            return ["status" => "error", "message" => "Error removing from favorites: " . $error_msg];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => $e->getMessage()];
    }
}

// GET USER FAVORITES
function getFavorites($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return ["status" => "error", "message" => "user_id diperlukan"];
        }

        $query = "SELECT f.id as favorite_id, p.* 
                  FROM favorites f
                  JOIN products p ON f.product_id = p.id
                  LEFT JOIN categories c ON p.category_id = c.id
                  WHERE f.user_id = ?
                  ORDER BY f.created_at DESC";
        
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $favorites = [];
        while ($row = $result->fetch_assoc()) {
            // Parse JSON fields if they exist
            if (isset($row['images']) && $row['images']) {
                $row['images'] = json_decode($row['images'], true);
            }
            $favorites[] = $row;
        }
        
        $stmt->close();
        return ["status" => "success", "data" => $favorites];
    } catch (Exception $e) {
        return ["status" => "error", "message" => $e->getMessage()];
    }
}

// CHECK IF PRODUCT IS FAVORITE
function isFavorite($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;
        $productId = (int)($data['product_id'] ?? 0);

        if (!$userId || !$productId) {
            return ["status" => "error", "message" => "user_id dan product_id diperlukan"];
        }

        $query = "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("ii", $userId, $productId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $isFav = $result->num_rows > 0;
        $stmt->close();
        
        return ["status" => "success", "is_favorite" => $isFav];
    } catch (Exception $e) {
        return ["status" => "error", "message" => $e->getMessage()];
    }
}

// GET FAVORITE IDS
function getFavoriteIds($db, $userId) {
    try {
        if (!$userId) {
            return [];
        }

        $query = "SELECT product_id FROM favorites WHERE user_id = ?";
        $stmt = $db->prepare($query);
        
        if (!$stmt) {
            return [];
        }

        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $ids = [];
        while ($row = $result->fetch_assoc()) {
            $ids[] = $row['product_id'];
        }
        
        $stmt->close();
        return $ids;
    } catch (Exception $e) {
        return [];
    }
}

// CLEAR ALL FAVORITES
function clearAllFavorites($db, $data) {
    try {
        $userId = $data['user_id'] ?? null;

        if (!$userId) {
            return ["status" => "error", "message" => "user_id diperlukan"];
        }

        $deleteQuery = "DELETE FROM favorites WHERE user_id = ?";
        $stmt = $db->prepare($deleteQuery);
        
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("i", $userId);
        
        if ($stmt->execute()) {
            $stmt->close();
            return ["status" => "success", "message" => "Semua favorit telah dihapus"];
        } else {
            $error_msg = $stmt->error;
            $stmt->close();
            return ["status" => "error", "message" => "Error clearing favorites: " . $error_msg];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => $e->getMessage()];
    }
}

?>
