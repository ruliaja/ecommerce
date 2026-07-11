<?php
require_once '../config/database.php';
require_once '../modules/auth.php';
require_once '../modules/products.php';
require_once '../modules/orders.php';
require_once '../modules/cart.php';
require_once '../modules/favorites.php';
require_once '../modules/addresses.php';
require_once '../modules/chat.php';
require_once '../modules/reviews.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Ambil input JSON dari React
$input = json_decode(file_get_contents('php://input'), true);

switch ($action) {
    case 'register':
        if ($method == 'POST') {
            echo json_encode(register($db, $input));
        }
        break;

    case 'login':
        if ($method == 'POST') {
            echo json_encode(login($db, $input));
        }
        break;

    case 'admin_login':
        if ($method == 'POST') {
            echo json_encode(loginAdmin($db, $input));
        }
        break;

    case 'get_products':
        if ($method == 'GET') {
            try {
                $products = getProducts($db);
                echo json_encode(["status" => "success", "data" => $products]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_product':
        if ($method == 'GET') {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                echo json_encode(["status" => "error", "message" => "ID tidak ditemukan"]);
                break;
            }
            try {
                $product = getProductById($db, $id);
                if ($product) {
                    echo json_encode(["status" => "success", "data" => $product]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Produk tidak ditemukan"]);
                }
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_categories_with_products':
        if ($method == 'GET') {
            try {
                $productsPerCategory = isset($_GET['limit']) ? (int)$_GET['limit'] : 3;
                $result = getCategoriesWithProducts($db, $productsPerCategory);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_dashboard_stats':
        if ($method == 'GET') {
            try {
                $stats = getDashboardStats($db);
                $recentOrders = getRecentOrders($db, 50);
                echo json_encode([
                    "status" => "success", 
                    "data" => [
                        "stats" => $stats,
                        "recentOrders" => $recentOrders
                    ]
                ]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_sales_report':
        if ($method == 'GET') {
            try {
                $period = $_GET['period'] ?? 'daily';
                $startDate = $_GET['start_date'] ?? null;
                $endDate = $_GET['end_date'] ?? null;
                $report = getSalesReport($db, $period, $startDate, $endDate);
                echo json_encode($report);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_orders':
        if ($method == 'GET') {
            try {
                $orders = getOrders($db);
                echo json_encode(["status" => "success", "data" => $orders]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_user_orders':
        if ($method == 'GET') {
            try {
                $userId = $_GET['user_id'] ?? null;
                if (!$userId) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }
                $orders = getUserOrders($db, (int)$userId);
                echo json_encode(["status" => "success", "data" => $orders]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_users':
        if ($method == 'GET') {
            try {
                $query = "
                    SELECT 
                        id,
                        name,
                        email,
                        phone,
                        role,
                        created_at,
                        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as orders_count
                    FROM users
                    WHERE role = 'customer'
                    ORDER BY created_at DESC
                ";
                
                $result = $db->query($query);
                
                if (!$result) {
                    throw new Exception("Query failed: " . $db->error);
                }
                
                $users = [];
                while ($row = $result->fetch_assoc()) {
                    $users[] = [
                        'id' => (int)$row['id'],
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'phone' => $row['phone'] ?? '',
                        'role' => 'Customer',
                        'status' => 'Active',
                        'joinDate' => date('Y-m-d', strtotime($row['created_at'])),
                        'orders' => (int)$row['orders_count'],
                    ];
                }
                
                echo json_encode(["status" => "success", "data" => $users]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'delete_user':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                $user_id = $input['user_id'] ?? $_GET['user_id'] ?? null;
                
                if (!$user_id) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }
                
                // Optional: Delete related orders or let ON DELETE CASCADE handle it
                // For safety, we just delete the user.
                $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
                $stmt->bind_param("i", $user_id);
                
                if ($stmt->execute()) {
                    echo json_encode(["status" => "success", "message" => "Pengguna berhasil dihapus"]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Gagal menghapus pengguna: " . $stmt->error]);
                }
                $stmt->close();
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'upload_image':
        if ($method == 'POST') {
            if (!isset($_FILES['image'])) {
                echo json_encode(["status" => "error", "message" => "File image tidak ditemukan"]);
                break;
            }
            $file = $_FILES['image'];
            $allowed = ['png','jpg','jpeg','gif','webp'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowed)) {
                echo json_encode(["status" => "error", "message" => "Format file tidak didukung"]);
                break;
            }
            if ($file['size'] > 5*1024*1024) {
                echo json_encode(["status" => "error", "message" => "Ukuran file terlalu besar (max 5MB)"]);
                break;
            }
            $uploadsDir = __DIR__ . '/../uploads';
            if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);
            $filename = time() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
            $destination = $uploadsDir . '/' . $filename;
            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443 ? 'https' : 'http';
                $scriptPath = $_SERVER['SCRIPT_NAME']; 
                $basePath = preg_replace('#/api/index\.php$#', '', $scriptPath); 
                $uploadUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . $basePath . '/uploads/' . $filename;
                echo json_encode(["status" => "success", "image_url" => $uploadUrl]);
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memindahkan file"]);
            }
        }
        break;

    case 'add_product':
        if ($method == 'POST') {
            try {
                $result = addProduct($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'update_product':
        if ($method == 'POST' || $method == 'PUT') {
            try {
                $result = updateProduct($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'delete_product':
        if ($method == 'POST' || $method == 'DELETE') {
            try {
                $id = $input['id'] ?? $_GET['id'] ?? null;
                if (!$id) {
                    echo json_encode(["status" => "error", "message" => "ID produk tidak ditemukan"]);
                    break;
                }
                $result = deleteProduct($db, $id);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'add_to_cart':
        if ($method == 'POST') {
            try {
                error_log('🛒 Add to cart: ' . json_encode($input));
                $result = addToCart($db, $input);
                error_log('✅ Add to cart result: ' . json_encode($result));
                echo json_encode($result);
            } catch (Exception $e) {
                error_log('❌ Add to cart error: ' . $e->getMessage());
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_cart':
        if ($method == 'GET' || $method == 'POST') {
            try {
                error_log('📦 Get cart: ' . json_encode($input));
                $result = getCart($db, $input);
                error_log('✅ Get cart result: ' . json_encode($result));
                echo json_encode($result);
            } catch (Exception $e) {
                error_log('❌ Get cart error: ' . $e->getMessage());
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'update_cart_item':
        if ($method == 'POST' || $method == 'PUT') {
            try {
                error_log('✏️ Update cart item: ' . json_encode($input));
                $result = updateCartItem($db, $input);
                error_log('✅ Update cart item result: ' . json_encode($result));
                echo json_encode($result);
            } catch (Exception $e) {
                error_log('❌ Update cart item error: ' . $e->getMessage());
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'remove_from_cart':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                error_log('🗑️ Remove from cart: ' . json_encode($input));
                $result = removeFromCart($db, $input);
                error_log('✅ Remove from cart result: ' . json_encode($result));
                echo json_encode($result);
            } catch (Exception $e) {
                error_log('❌ Remove from cart error: ' . $e->getMessage());
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'clear_cart':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                error_log('🧹 Clear cart: ' . json_encode($input));
                $result = clearCart($db, $input);
                error_log('✅ Clear cart result: ' . json_encode($result));
                echo json_encode($result);
            } catch (Exception $e) {
                error_log('❌ Clear cart error: ' . $e->getMessage());
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'create_order':
        if ($method == 'POST') {
            try {
                error_log('📦 Received order data: ' . json_encode($input));
                $result = createOrder($db, $input);
                error_log('✅ Order result: ' . json_encode($result));
                echo json_encode($result);
            } catch (Exception $e) {
                error_log('❌ Order error: ' . $e->getMessage());
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_order':
        if ($method == 'GET') {
            try {
                $orderId = $input['id'] ?? $_GET['id'] ?? null;
                if (!$orderId) {
                    echo json_encode(["status" => "error", "message" => "Order ID tidak ditemukan"]);
                    break;
                }
                $order = getOrderDetail($db, $orderId);
                echo json_encode(["status" => "success", "data" => $order]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'update_order_status':
        if ($method == 'PUT' || $method == 'POST') {
            try {
                $orderId = $input['order_id'] ?? null;
                $status = $input['status'] ?? null;
                $rejectionReason = $input['rejection_reason'] ?? null;
                if (!$orderId || !$status) {
                    echo json_encode(["status" => "error", "message" => "Order ID atau status tidak ditemukan"]);
                    break;
                }
                $result = updateOrderStatus($db, $orderId, $status, $rejectionReason);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_user_profile':
        if ($method == 'GET' || $method == 'POST') {
            try {
                $userId = $input['user_id'] ?? $_GET['user_id'] ?? null;
                if (!$userId) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }
                $query = "SELECT id, name, username, email, phone, profile_image FROM users WHERE id = ?";
                $stmt = $db->prepare($query);
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $db->error);
                }
                $stmt->bind_param("i", $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows === 0) {
                    $stmt->close();
                    echo json_encode(["status" => "error", "message" => "User tidak ditemukan"]);
                    break;
                }
                
                $user = $result->fetch_assoc();
                $stmt->close();
                echo json_encode(["status" => "success", "data" => $user]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'update_user_profile':
        if ($method == 'POST' || $method == 'PUT') {
            try {
                $userId = $input['user_id'] ?? null;
                if (!$userId) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }
                
                $name = $input['name'] ?? null;
                $email = $input['email'] ?? null;
                $username = $input['username'] ?? null;
                $phone = $input['phone'] ?? null;
                $address = $input['address'] ?? null;
                $profile_image = $input['profile_image'] ?? null;
                
                // Validate username if provided
                if ($username !== null) {
                    if (!preg_match('/^[a-zA-Z0-9_-]{3,30}$/', $username)) {
                        echo json_encode(["status" => "error", "message" => "Username hanya boleh mengandung huruf, angka, underscore (_), dan dash (-). Panjang 3-30 karakter"]);
                        break;
                    }
                    
                    // Check if username already exists (for other users)
                    $checkUsername = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
                    $checkUsername->bind_param("si", $username, $userId);
                    $checkUsername->execute();
                    $result = $checkUsername->get_result();
                    
                    if ($result->num_rows > 0) {
                        $checkUsername->close();
                        echo json_encode(["status" => "error", "message" => "Username sudah digunakan oleh pengguna lain"]);
                        break;
                    }
                    $checkUsername->close();
                }
                
                $query = "UPDATE users SET ";
                $params = [];
                $types = "";
                
                if ($name !== null) {
                    $query .= "name = ?, ";
                    $params[] = $name;
                    $types .= "s";
                }
                if ($email !== null) {
                    $query .= "email = ?, ";
                    $params[] = $email;
                    $types .= "s";
                }
                if ($username !== null) {
                    $query .= "username = ?, ";
                    $params[] = $username;
                    $types .= "s";
                }
                if ($phone !== null) {
                    $query .= "phone = ?, ";
                    $params[] = $phone;
                    $types .= "s";
                }

                if ($profile_image !== null) {
                    $query .= "profile_image = ?, ";
                    $params[] = $profile_image;
                    $types .= "s";
                }
                
                $query .= "updated_at = CURRENT_TIMESTAMP WHERE id = ?";
                $params[] = $userId;
                $types .= "i";
                
                $stmt = $db->prepare($query);
                if (!$stmt) {
                    throw new Exception("Prepare failed: " . $db->error);
                }
                $stmt->bind_param($types, ...$params);
                
                if ($stmt->execute()) {
                    $stmt->close();
                    
                    // Get updated user data
                    $selectQuery = "SELECT id, name, username, email, phone, profile_image, role FROM users WHERE id = ?";
                    $selectStmt = $db->prepare($selectQuery);
                    if (!$selectStmt) {
                        throw new Exception("Prepare failed: " . $db->error);
                    }
                    $selectStmt->bind_param("i", $userId);
                    $selectStmt->execute();
                    $result = $selectStmt->get_result();
                    $updatedUser = $result->fetch_assoc();
                    $selectStmt->close();
                    
                    echo json_encode([
                        "status" => "success", 
                        "message" => "Profil berhasil diperbarui",
                        "data" => $updatedUser
                    ]);
                } else {
                    $error = $stmt->error;
                    $stmt->close();
                    throw new Exception($error);
                }
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    // FAVORITES ENDPOINTS
    case 'add_to_favorite':
        if ($method == 'POST') {
            try {
                $result = addToFavorite($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'remove_from_favorite':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                $result = removeFromFavorite($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_favorites':
        if ($method == 'GET') {
            try {
                $result = getFavorites($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'is_favorite':
        if ($method == 'GET') {
            try {
                $result = isFavorite($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'clear_all_favorites':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                $result = clearAllFavorites($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    // ADDRESS ENDPOINTS
    case 'get_default_address':
        if ($method == 'GET') {
            try {
                $user_id = $_GET['user_id'] ?? $input['user_id'] ?? null;
                if (!$user_id) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }

                $addressManager = new AddressManager($db);
                $address = $addressManager->getDefaultAddress($user_id);
                echo json_encode(["status" => "success", "data" => $address]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_user_addresses':
        if ($method == 'GET') {
            try {
                $user_id = $_GET['user_id'] ?? $input['user_id'] ?? null;
                if (!$user_id) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }

                $addressManager = new AddressManager($db);
                $addresses = $addressManager->getUserAddresses($user_id);
                echo json_encode(["status" => "success", "data" => $addresses]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'create_address':
        if ($method == 'POST') {
            try {
                $user_id = $input['user_id'] ?? null;
                $recipient_name = $input['recipient_name'] ?? null;
                $address = $input['address'] ?? null;
                $city = $input['city'] ?? null;
                $province = $input['province'] ?? null;
                $zipCode = $input['zipCode'] ?? null;
                $label = $input['label'] ?? 'Rumah';
                $is_default = (bool)($input['is_default'] ?? false);

                if (!$user_id) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }

                $addressManager = new AddressManager($db);
                $result = $addressManager->createAddress($user_id, $recipient_name, $address, $city, $province, $zipCode, $label, $is_default);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'update_address':
        if ($method == 'PUT' || $method == 'POST') {
            try {
                $address_id = $input['address_id'] ?? null;
                $user_id = $input['user_id'] ?? null;
                $recipient_name = $input['recipient_name'] ?? null;
                $address = $input['address'] ?? null;
                $city = $input['city'] ?? null;
                $province = $input['province'] ?? null;
                $zipCode = $input['zipCode'] ?? null;
                $label = $input['label'] ?? 'Rumah';
                $is_default = (bool)($input['is_default'] ?? false);

                if (!$address_id || !$user_id) {
                    echo json_encode(["status" => "error", "message" => "Address ID dan User ID harus ada"]);
                    break;
                }

                $addressManager = new AddressManager($db);
                $result = $addressManager->updateAddress($address_id, $user_id, $recipient_name, $address, $city, $province, $zipCode, $label, $is_default);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'delete_address':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                $address_id = $input['address_id'] ?? null;
                $user_id = $input['user_id'] ?? null;

                if (!$address_id || !$user_id) {
                    echo json_encode(["status" => "error", "message" => "Address ID dan User ID harus ada"]);
                    break;
                }

                $addressManager = new AddressManager($db);
                $result = $addressManager->deleteAddress($address_id, $user_id);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'set_default_address':
        if ($method == 'PUT' || $method == 'POST') {
            try {
                $address_id = $input['address_id'] ?? null;
                $user_id = $input['user_id'] ?? null;

                if (!$address_id || !$user_id) {
                    echo json_encode(["status" => "error", "message" => "Address ID dan User ID harus ada"]);
                    break;
                }

                $addressManager = new AddressManager($db);
                $result = $addressManager->setDefaultAddress($address_id, $user_id);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'change_password':
        if ($method == 'POST') {
            try {
                $result = changePassword($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'upload_payment_proof':
        if ($method == 'POST') {
            if (!isset($_FILES['payment_proof'])) {
                echo json_encode(["status" => "error", "message" => "File bukti pembayaran tidak ditemukan"]);
                break;
            }
            $orderId = $_POST['order_id'] ?? null;
            if (!$orderId) {
                echo json_encode(["status" => "error", "message" => "Order ID tidak ditemukan"]);
                break;
            }

            $file = $_FILES['payment_proof'];
            $allowed = ['png','jpg','jpeg','gif','webp','pdf'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $allowed)) {
                echo json_encode(["status" => "error", "message" => "Format file tidak didukung. Gunakan JPG, PNG, atau PDF"]);
                break;
            }
            if ($file['size'] > 5*1024*1024) {
                echo json_encode(["status" => "error", "message" => "Ukuran file terlalu besar (max 5MB)"]);
                break;
            }

            $proofDir = __DIR__ . '/../uploads/payment_proofs';
            if (!is_dir($proofDir)) mkdir($proofDir, 0755, true);

            $filename = 'proof_' . $orderId . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $destination = $proofDir . '/' . $filename;

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443 ? 'https' : 'http';
                // Use SCRIPT_NAME (which doesn't include query strings) to build the base path
                $scriptPath = $_SERVER['SCRIPT_NAME']; 
                $basePath = preg_replace('#/api/index\.php$#', '', $scriptPath);
                $proofUrl = $protocol . '://' . $_SERVER['HTTP_HOST'] . $basePath . '/uploads/payment_proofs/' . $filename;

                // Update order: set payment_proof and status to waiting_confirmation
                $stmt = $db->prepare("UPDATE orders SET payment_proof = ?, payment_uploaded_at = NOW(), status = 'waiting_confirmation' WHERE id = ? OR order_number = ?");
                $stmt->bind_param("sis", $proofUrl, $orderId, $orderId);
                if ($stmt->execute()) {
                    $stmt->close();
                    echo json_encode(["status" => "success", "message" => "Bukti pembayaran berhasil diupload", "proof_url" => $proofUrl]);
                } else {
                    $stmt->close();
                    echo json_encode(["status" => "error", "message" => "Gagal menyimpan bukti pembayaran: " . $stmt->error]);
                }
            } else {
                echo json_encode(["status" => "error", "message" => "Gagal memindahkan file"]);
            }
        }
        break;

    // PAYMENT SETTINGS ENDPOINTS
    case 'get_payment_settings':
        if ($method == 'GET') {
            try {
                $activeOnly = isset($_GET['active_only']) ? (bool)$_GET['active_only'] : false;
                $where = $activeOnly ? 'WHERE is_active = 1' : '';
                $result = $db->query("SELECT * FROM payment_settings $where ORDER BY is_active DESC, id ASC");
                if (!$result) throw new Exception("Query failed: " . $db->error);
                $settings = [];
                while ($row = $result->fetch_assoc()) {
                    $settings[] = [
                        'id' => (int)$row['id'],
                        'bank_name' => $row['bank_name'],
                        'account_number' => $row['account_number'],
                        'account_holder' => $row['account_holder'],
                        'description' => $row['description'] ?? '',
                        'is_active' => (bool)$row['is_active'],
                        'created_at' => $row['created_at'],
                    ];
                }
                echo json_encode(["status" => "success", "data" => $settings]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'add_payment_setting':
        if ($method == 'POST') {
            try {
                $bank_name = $input['bank_name'] ?? null;
                $account_number = $input['account_number'] ?? null;
                $account_holder = $input['account_holder'] ?? null;
                $description = $input['description'] ?? '';
                $is_active = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;

                if (!$bank_name || !$account_number || !$account_holder) {
                    echo json_encode(["status" => "error", "message" => "Bank, nomor rekening, dan nama pemilik wajib diisi"]);
                    break;
                }

                $stmt = $db->prepare("INSERT INTO payment_settings (bank_name, account_number, account_holder, description, is_active) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssi", $bank_name, $account_number, $account_holder, $description, $is_active);
                if ($stmt->execute()) {
                    $newId = $db->insert_id;
                    $stmt->close();
                    echo json_encode(["status" => "success", "message" => "Rekening berhasil ditambahkan", "id" => $newId]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Gagal menambahkan rekening: " . $stmt->error]);
                }
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'update_payment_setting':
        if ($method == 'POST' || $method == 'PUT') {
            try {
                $id = $input['id'] ?? null;
                $bank_name = $input['bank_name'] ?? null;
                $account_number = $input['account_number'] ?? null;
                $account_holder = $input['account_holder'] ?? null;
                $description = $input['description'] ?? '';
                $is_active = isset($input['is_active']) ? (int)(bool)$input['is_active'] : 1;

                if (!$id || !$bank_name || !$account_number || !$account_holder) {
                    echo json_encode(["status" => "error", "message" => "ID, bank, nomor rekening, dan nama pemilik wajib diisi"]);
                    break;
                }

                $stmt = $db->prepare("UPDATE payment_settings SET bank_name = ?, account_number = ?, account_holder = ?, description = ?, is_active = ? WHERE id = ?");
                $stmt->bind_param("ssssii", $bank_name, $account_number, $account_holder, $description, $is_active, $id);
                if ($stmt->execute()) {
                    $stmt->close();
                    echo json_encode(["status" => "success", "message" => "Rekening berhasil diperbarui"]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Gagal memperbarui rekening: " . $stmt->error]);
                }
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'delete_payment_setting':
        if ($method == 'DELETE' || $method == 'POST') {
            try {
                $id = $input['id'] ?? $_GET['id'] ?? null;
                if (!$id) {
                    echo json_encode(["status" => "error", "message" => "ID rekening tidak ditemukan"]);
                    break;
                }
                $stmt = $db->prepare("DELETE FROM payment_settings WHERE id = ?");
                $stmt->bind_param("i", $id);
                if ($stmt->execute()) {
                    $stmt->close();
                    echo json_encode(["status" => "success", "message" => "Rekening berhasil dihapus"]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Gagal menghapus rekening: " . $stmt->error]);
                }
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'toggle_payment_setting':
        if ($method == 'POST' || $method == 'PUT') {
            try {
                $id = $input['id'] ?? null;
                $is_active = isset($input['is_active']) ? (int)(bool)$input['is_active'] : null;
                if (!$id || $is_active === null) {
                    echo json_encode(["status" => "error", "message" => "ID dan status is_active wajib diisi"]);
                    break;
                }
                $stmt = $db->prepare("UPDATE payment_settings SET is_active = ? WHERE id = ?");
                $stmt->bind_param("ii", $is_active, $id);
                if ($stmt->execute()) {
                    $stmt->close();
                    $msg = $is_active ? "Rekening diaktifkan" : "Rekening dinonaktifkan";
                    echo json_encode(["status" => "success", "message" => $msg]);
                } else {
                    echo json_encode(["status" => "error", "message" => "Gagal mengupdate status: " . $stmt->error]);
                }
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    // CHAT ENDPOINTS
    case 'get_or_create_conversation':
        if ($method == 'GET' || $method == 'POST') {
            try {
                $userId = $input['user_id'] ?? $_GET['user_id'] ?? null;
                if (!$userId) {
                    echo json_encode(["status" => "error", "message" => "User ID tidak ditemukan"]);
                    break;
                }
                $result = getOrCreateConversation($db, (int)$userId);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'send_chat_message':
        if ($method == 'POST') {
            try {
                $conversationId = $input['conversation_id'] ?? null;
                $senderId = $input['sender_id'] ?? null;
                $senderType = $input['sender_type'] ?? 'customer';
                $message = $input['message'] ?? null;
                if (!$conversationId || !$senderId || !$message) {
                    echo json_encode(["status" => "error", "message" => "conversation_id, sender_id, dan message wajib diisi"]);
                    break;
                }
                $result = sendChatMessage($db, (int)$conversationId, (int)$senderId, $senderType, $message);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_chat_messages':
        if ($method == 'GET') {
            try {
                $conversationId = $_GET['conversation_id'] ?? null;
                $afterId = $_GET['after_id'] ?? 0;
                if (!$conversationId) {
                    echo json_encode(["status" => "error", "message" => "conversation_id wajib diisi"]);
                    break;
                }
                $result = getChatMessages($db, (int)$conversationId, (int)$afterId);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_admin_conversations':
        if ($method == 'GET') {
            try {
                $result = getAdminConversations($db);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'mark_messages_read':
        if ($method == 'POST') {
            try {
                $conversationId = $input['conversation_id'] ?? null;
                $readerType = $input['reader_type'] ?? 'customer';
                if (!$conversationId) {
                    echo json_encode(["status" => "error", "message" => "conversation_id wajib diisi"]);
                    break;
                }
                $result = markMessagesAsRead($db, (int)$conversationId, $readerType);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'close_conversation':
        if ($method == 'POST') {
            try {
                $conversationId = $input['conversation_id'] ?? null;
                if (!$conversationId) {
                    echo json_encode(["status" => "error", "message" => "conversation_id wajib diisi"]);
                    break;
                }
                $result = closeConversation($db, (int)$conversationId);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'reopen_conversation':
        if ($method == 'POST') {
            try {
                $conversationId = $input['conversation_id'] ?? null;
                if (!$conversationId) {
                    echo json_encode(["status" => "error", "message" => "conversation_id wajib diisi"]);
                    break;
                }
                $result = reopenConversation($db, (int)$conversationId);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_unread_count':
        if ($method == 'GET') {
            try {
                $userId = $_GET['user_id'] ?? null;
                $userType = $_GET['user_type'] ?? 'customer';
                if (!$userId) {
                    echo json_encode(["status" => "error", "message" => "user_id wajib diisi"]);
                    break;
                }
                $result = getUnreadCount($db, (int)$userId, $userType);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    // REVIEW ENDPOINTS
    case 'add_review':
        if ($method == 'POST') {
            try {
                $result = addReview($db, $input);
                echo json_encode($result);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_product_reviews':
        if ($method == 'GET') {
            try {
                $productId = $_GET['product_id'] ?? null;
                if (!$productId) {
                    echo json_encode(["status" => "error", "message" => "Product ID tidak ditemukan"]);
                    break;
                }
                $reviews = getProductReviews($db, (int)$productId);
                echo json_encode(["status" => "success", "data" => $reviews]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'get_product_rating':
        if ($method == 'GET') {
            try {
                $productId = $_GET['product_id'] ?? null;
                if (!$productId) {
                    echo json_encode(["status" => "error", "message" => "Product ID tidak ditemukan"]);
                    break;
                }
                $rating = getProductRating($db, (int)$productId);
                echo json_encode(["status" => "success", "data" => $rating]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    case 'check_user_review':
        if ($method == 'GET') {
            try {
                $userId = $_GET['user_id'] ?? null;
                $productId = $_GET['product_id'] ?? null;
                $orderId = $_GET['order_id'] ?? null;
                if (!$userId || !$productId || !$orderId) {
                    echo json_encode(["status" => "error", "message" => "Parameter tidak lengkap"]);
                    break;
                }
                $result = checkUserReview($db, (int)$userId, (int)$productId, $orderId);
                echo json_encode(["status" => "success", "data" => $result]);
            } catch (Exception $e) {
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Endpoint tidak ditemukan"]);
        break;
}
?>