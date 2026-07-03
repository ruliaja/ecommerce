<?php

function addReview($db, $data) {
    $productId = $data['product_id'] ?? null;
    $userId = $data['user_id'] ?? null;
    $orderId = $data['order_id'] ?? null;
    $rating = $data['rating'] ?? null;
    $review = $data['review'] ?? '';

    if (!$productId || !$userId || !$orderId || !$rating) {
        return ["status" => "error", "message" => "Data tidak lengkap"];
    }

    if ($rating < 1 || $rating > 5) {
        return ["status" => "error", "message" => "Rating harus antara 1-5"];
    }

    // Check if user has a completed order for this product
    $checkOrder = $db->prepare("
        SELECT o.id FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE (o.id = ? OR o.order_number = ?)
        AND o.user_id = ?
        AND oi.product_id = ?
        AND LOWER(o.status) IN ('delivered', 'completed')
    ");
    $checkOrder->bind_param("ssii", $orderId, $orderId, $userId, $productId);
    $checkOrder->execute();
    $result = $checkOrder->get_result();

    if ($result->num_rows === 0) {
        $checkOrder->close();
        return ["status" => "error", "message" => "Anda hanya bisa memberikan ulasan untuk pesanan yang sudah selesai"];
    }
    $checkOrder->close();

    // Check if already reviewed
    $checkExist = $db->prepare("SELECT id FROM reviews WHERE product_id = ? AND user_id = ? AND order_id = ?");
    $checkExist->bind_param("iis", $productId, $userId, $orderId);
    $checkExist->execute();
    $existResult = $checkExist->get_result();

    if ($existResult->num_rows > 0) {
        $checkExist->close();
        return ["status" => "error", "message" => "Anda sudah memberikan ulasan untuk produk ini di pesanan ini"];
    }
    $checkExist->close();

    // Insert review
    $stmt = $db->prepare("INSERT INTO reviews (product_id, user_id, order_id, rating, review) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("iisis", $productId, $userId, $orderId, $rating, $review);

    if ($stmt->execute()) {
        $reviewId = $stmt->insert_id;
        $stmt->close();
        return ["status" => "success", "message" => "Ulasan berhasil ditambahkan", "data" => ["id" => $reviewId]];
    } else {
        $error = $stmt->error;
        $stmt->close();
        return ["status" => "error", "message" => "Gagal menambahkan ulasan: " . $error];
    }
}

function getProductReviews($db, $productId) {
    $stmt = $db->prepare("
        SELECT r.id, r.rating, r.review, r.created_at,
               u.name AS user_name, u.profile_image AS user_avatar
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.product_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();

    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'id' => (int)$row['id'],
            'rating' => (int)$row['rating'],
            'review' => $row['review'],
            'user_name' => $row['user_name'],
            'user_avatar' => $row['user_avatar'],
            'created_at' => $row['created_at'],
        ];
    }
    $stmt->close();
    return $reviews;
}

function getProductRating($db, $productId) {
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) AS total_reviews,
            COALESCE(AVG(rating), 0) AS average_rating,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS star_5,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS star_4,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS star_3,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS star_2,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS star_1
        FROM reviews
        WHERE product_id = ?
    ");
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();

    return [
        'total_reviews' => (int)$data['total_reviews'],
        'average_rating' => round((float)$data['average_rating'], 1),
        'distribution' => [
            5 => (int)$data['star_5'],
            4 => (int)$data['star_4'],
            3 => (int)$data['star_3'],
            2 => (int)$data['star_2'],
            1 => (int)$data['star_1'],
        ]
    ];
}

function checkUserReview($db, $userId, $productId, $orderId) {
    $stmt = $db->prepare("SELECT id, rating, review FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?");
    $stmt->bind_param("iis", $userId, $productId, $orderId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $review = $result->fetch_assoc();
        $stmt->close();
        return ["reviewed" => true, "data" => $review];
    }
    $stmt->close();
    return ["reviewed" => false];
}
?>
