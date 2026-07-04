<?php
// GET ALL ORDERS (Admin)
function getOrders($db) {
    try {
        // Check what columns exist
        $columnsResult = $db->query("DESCRIBE orders");
        $columnNames = [];
        while ($col = $columnsResult->fetch_assoc()) {
            $columnNames[] = $col['Field'];
        }
        
        // Build dynamic SELECT clause
        $selectParts = [
            'o.id',
            'o.order_number',
            'o.status',
            'o.created_at',
            'COUNT(oi.id) as items_count'
        ];
        
        if (in_array('customer_name', $columnNames)) {
            $selectParts[] = 'COALESCE(NULLIF(o.customer_name, ""), u.name) as customer_name';
        } else {
            $selectParts[] = 'u.name as customer_name';
        }

        if (in_array('customer_email', $columnNames)) {
            $selectParts[] = 'COALESCE(NULLIF(o.customer_email, ""), u.email) as customer_email';
        } else {
            $selectParts[] = 'u.email as customer_email';
        }
        
        if (in_array('total_price', $columnNames)) {
            $selectParts[] = 'o.total_price';
        } elseif (in_array('total_amount', $columnNames)) {
            $selectParts[] = 'o.total_amount';
        }
        if (in_array('payment_proof', $columnNames)) {
            $selectParts[] = 'o.payment_proof';
            $selectParts[] = 'o.payment_uploaded_at';
        }
        
        $selectClause = implode(', ', $selectParts);
        
        $query = "
            SELECT $selectClause
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        ";
        
        $result = $db->query($query);
        
        if (!$result) {
            throw new Exception("Query failed: " . $db->error);
        }
        
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $totalAmount = $row['total_price'] ?? $row['total_amount'] ?? 0;
            
            $orders[] = [
                'id' => $row['order_number'],
                'customer' => $row['customer_name'] ?? 'Unknown',
                'email' => $row['customer_email'] ?? '',
                'items' => (int)$row['items_count'],
                'amount' => (int)$totalAmount,
                'status' => ucfirst($row['status']),
                'date' => date('Y-m-d', strtotime($row['created_at'])),
                'payment_proof' => $row['payment_proof'] ?? null,
                'payment_uploaded_at' => $row['payment_uploaded_at'] ?? null,
            ];
        }
        
        return $orders;
    } catch (Exception $e) {
        throw new Exception("Error getting orders: " . $e->getMessage());
    }
}

// GET USER ORDERS
function getUserOrders($db, $userId) {
    try {
        // First, check what columns exist in the orders table
        $columnsResult = $db->query("DESCRIBE orders");
        $columnNames = [];
        while ($col = $columnsResult->fetch_assoc()) {
            $columnNames[] = $col['Field'];
        }
        
        // Build dynamic SELECT clause
        $selectParts = [
            'o.id',
            'o.order_number',
            'o.status',
            'o.created_at'
        ];
        
        // Add optional columns if they exist
        if (in_array('total_amount', $columnNames)) {
            $selectParts[] = 'o.total_amount';
        }
        if (in_array('total_price', $columnNames)) {
            $selectParts[] = 'o.total_price';
        }
        if (in_array('shipping_cost', $columnNames)) {
            $selectParts[] = 'o.shipping_cost';
        }
        if (in_array('customer_address', $columnNames)) {
            $selectParts[] = 'o.customer_address';
        }
        if (in_array('tracking_number', $columnNames)) {
            $selectParts[] = 'o.tracking_number';
        }
        if (in_array('payment_proof', $columnNames)) {
            $selectParts[] = 'o.payment_proof';
            $selectParts[] = 'o.payment_uploaded_at';
        }
        if (in_array('rejection_reason', $columnNames)) {
            $selectParts[] = 'o.rejection_reason';
        }
        if (in_array('payment_method', $columnNames)) {
            $selectParts[] = 'o.payment_method';
        }
        
        $selectClause = implode(', ', $selectParts);
        
        $query = "
            SELECT $selectClause
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY 
                CASE 
                    WHEN o.status IN ('pending', 'processing', 'shipped') THEN 0
                    ELSE 1
                END ASC,
                o.created_at DESC
        ";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $db->error);
        }
        
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            return [];
        }
        
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $orderId = $row['id'];
            
            // Check what columns exist in order_items table
            $itemColumnsResult = $db->query("DESCRIBE order_items");
            $itemColumnNames = [];
            while ($col = $itemColumnsResult->fetch_assoc()) {
                $itemColumnNames[] = $col['Field'];
            }
            
            // Build dynamic SELECT clause for order items
            $itemSelectParts = ['oi.id', 'oi.product_id'];
            
            // Support both old (quantity/price) and new (qty/price_at_purchase) column names
            $qtyCol = in_array('qty', $itemColumnNames) ? 'qty' : (in_array('quantity', $itemColumnNames) ? 'quantity' : null);
            $priceCol = in_array('price_at_purchase', $itemColumnNames) ? 'price_at_purchase' : (in_array('price', $itemColumnNames) ? 'price' : null);
            
            if ($qtyCol) $itemSelectParts[] = "oi.$qtyCol";
            if ($priceCol) $itemSelectParts[] = "oi.$priceCol";
            if (in_array('subtotal', $itemColumnNames)) $itemSelectParts[] = 'oi.subtotal';
            
            $itemSelectParts[] = 'p.name as product_name';
            $itemSelectParts[] = 'p.image_url';
            $itemSelectParts[] = 'p.price as product_price';
            
            $itemSelectClause = implode(', ', $itemSelectParts);
            
            // Get order items
            $itemsQuery = "
                SELECT $itemSelectClause
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            ";
            
            $itemsStmt = $db->prepare($itemsQuery);
            if (!$itemsStmt) {
                continue;
            }
            
            $itemsStmt->bind_param("i", $orderId);
            $itemsStmt->execute();
            $itemsResult = $itemsStmt->get_result();
            
            $items = [];
            while ($itemRow = $itemsResult->fetch_assoc()) {
                $rawQty = $itemRow[$qtyCol] ?? $itemRow['quantity'] ?? $itemRow['qty'] ?? 0;
                $rawPrice = $itemRow[$priceCol] ?? $itemRow['price_at_purchase'] ?? $itemRow['price'] ?? 0;
                
                $qty = (!empty($rawQty) && (int)$rawQty > 0) ? (int)$rawQty : 1;
                $price = (!empty($rawPrice) && (float)$rawPrice > 0) ? (int)$rawPrice : (int)($itemRow['product_price'] ?? 0);
                
                $items[] = [
                    'id' => $itemRow['id'],
                    'product_id' => $itemRow['product_id'],
                    'product_name' => $itemRow['product_name'] ?? 'Product',
                    'quantity' => $qty,
                    'price' => $price,
                    'image_url' => $itemRow['image_url']
                ];
            }
            $itemsStmt->close();
            
            // Determine total amount (try multiple column names)
            $totalAmount = $row['total_amount'] ?? $row['total_price'] ?? 0;
            
            $orders[] = [
                'id' => (int)$row['id'],
                'order_number' => $row['order_number'],
                'total_price' => (int)$totalAmount,
                'total_amount' => (int)$totalAmount,
                'shipping_cost' => (int)($row['shipping_cost'] ?? 0),
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'order_date' => $row['created_at'],
                'address' => $row['customer_address'] ?? 'Tidak tersedia',
                'tracking_number' => $row['tracking_number'] ?? null,
                'payment_proof' => $row['payment_proof'] ?? null,
                'payment_uploaded_at' => $row['payment_uploaded_at'] ?? null,
                'rejection_reason' => $row['rejection_reason'] ?? null,
                'payment_method' => $row['payment_method'] ?? 'transfer',
                'items' => $items
            ];
        }
        
        $stmt->close();
        return $orders;
    } catch (Exception $e) {
        throw new Exception("Error getting user orders: " . $e->getMessage());
    }
}

// GET RECENT ORDERS (for dashboard)
function getRecentOrders($db, $limit = 4) {
    try {
        // Check what columns exist
        $columnsResult = $db->query("DESCRIBE orders");
        $columnNames = [];
        while ($col = $columnsResult->fetch_assoc()) {
            $columnNames[] = $col['Field'];
        }
        
        // Build dynamic SELECT clause
        $selectParts = [
            'o.id',
            'o.order_number',
            'o.status',
            'o.created_at'
        ];
        
        if (in_array('customer_name', $columnNames)) {
            $selectParts[] = 'COALESCE(NULLIF(o.customer_name, ""), u.name) as customer_name';
        } else {
            $selectParts[] = 'u.name as customer_name';
        }
        
        if (in_array('total_price', $columnNames)) {
            $selectParts[] = 'o.total_price';
        } elseif (in_array('total_amount', $columnNames)) {
            $selectParts[] = 'o.total_amount';
        }
        
        $selectClause = implode(', ', $selectParts);
        
        $query = "
            SELECT $selectClause
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            ORDER BY o.created_at DESC
            LIMIT ?
        ";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $db->error);
        }
        
        $stmt->bind_param("i", $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $totalAmount = $row['total_price'] ?? $row['total_amount'] ?? 0;
            
            $orders[] = [
                'id' => $row['order_number'],
                'customer' => $row['customer_name'] ?? 'Unknown',
                'amount' => (int)$totalAmount,
                'status' => ucfirst($row['status']),
                'date' => $row['created_at']
            ];
        }
        
        $stmt->close();
        return $orders;
    } catch (Exception $e) {
        throw new Exception("Error getting recent orders: " . $e->getMessage());
    }
}

// GET DASHBOARD STATS
function getDashboardStats($db) {
    try {
        // Get total products
        $productsResult = $db->query("SELECT COUNT(*) as count FROM products");
        $totalProducts = $productsResult->fetch_assoc()['count'];
        
        // Get total orders
        $ordersResult = $db->query("SELECT COUNT(*) as count FROM orders");
        $totalOrders = $ordersResult->fetch_assoc()['count'];
        
        // Get total revenue - check which price column exists
        $columnsResult = $db->query("DESCRIBE orders");
        $priceColumn = null;
        while ($col = $columnsResult->fetch_assoc()) {
            if ($col['Field'] === 'total_price') {
                $priceColumn = 'total_price';
                break;
            }
            if ($col['Field'] === 'total_amount') {
                $priceColumn = 'total_amount';
            }
        }
        
        $totalRevenue = 0;
        if ($priceColumn) {
            $revenueResult = $db->query("SELECT SUM($priceColumn) as total FROM orders WHERE status IN ('shipped', 'delivered', 'completed')");
            $revenueData = $revenueResult->fetch_assoc();
            $totalRevenue = $revenueData['total'] ?? 0;
        }
        
        // Get total users
        $usersResult = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
        $totalUsers = $usersResult->fetch_assoc()['count'];
        
        // Get status counts
        $statusCountsResult = $db->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
        $statusCounts = [
            'pending' => 0,
            'waiting_confirmation' => 0,
            'processing' => 0,
            'settlement' => 0,
            'shipped' => 0,
            'delivered' => 0,
            'completed' => 0,
            'cancel' => 0,
            'cancelled' => 0,
            'expire' => 0
        ];
        while ($row = $statusCountsResult->fetch_assoc()) {
            $statusCounts[$row['status']] = (int)$row['count'];
        }
        
        return [
            'totalProducts' => (int)$totalProducts,
            'totalOrders' => (int)$totalOrders,
            'totalRevenue' => (int)$totalRevenue,
            'totalUsers' => (int)$totalUsers,
            'statusCounts' => $statusCounts,
        ];
    } catch (Exception $e) {
        throw new Exception("Error getting dashboard stats: " . $e->getMessage());
    }
}

// GET SALES REPORT (daily, monthly, yearly) - v3 JOIN based
function getSalesReport($db, $period, $startDate = null, $endDate = null) {
    try {
        // Detect price column
        $columnsResult = $db->query("DESCRIBE orders");
        $columnNames = [];
        while ($col = $columnsResult->fetch_assoc()) {
            $columnNames[] = $col['Field'];
        }
        $priceColumn = in_array('total_price', $columnNames) ? 'total_price' : (in_array('total_amount', $columnNames) ? 'total_amount' : null);
        
        if (!$priceColumn) {
            throw new Exception("No price column found in orders table");
        }
        
        $validStatuses = "('shipped', 'delivered', 'completed')";
        
        // Prepare custom dates
        $customDateFilter = "";
        if ($startDate && $endDate) {
            $cleanStart = $db->real_escape_string($startDate);
            $cleanEnd = $db->real_escape_string($endDate);
        }

        // Build date grouping based on period
        switch ($period) {
            case 'daily':
                $dateExpr = "DATE(created_at)";
                if ($startDate && $endDate) {
                    $dateFilter = "AND DATE(created_at) BETWEEN '$cleanStart' AND '$cleanEnd'";
                } else {
                    $dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                }
                break;
            case 'monthly':
                $dateExpr = "DATE_FORMAT(created_at, '%Y-%m')";
                if ($startDate && $endDate) {
                    $dateFilter = "AND DATE_FORMAT(created_at, '%Y-%m') BETWEEN '$cleanStart' AND '$cleanEnd'";
                } else {
                    $dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
                }
                break;
            case 'weekly':
                $dateExpr = "DATE(DATE_ADD(created_at, INTERVAL - WEEKDAY(created_at) DAY))";
                if ($startDate && $endDate) {
                    $dateFilter = "AND DATE(DATE_ADD(created_at, INTERVAL - WEEKDAY(created_at) DAY)) BETWEEN '$cleanStart' AND '$cleanEnd'";
                } else {
                    $dateFilter = "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)";
                }
                break;
            default:
                throw new Exception("Invalid period: $period");
        }
        
        // Query 1: Orders and revenue (simple, no JOINs — matches dashboard logic)
        $orderQuery = "
            SELECT 
                $dateExpr as date_label,
                COUNT(*) as total_orders,
                COALESCE(SUM($priceColumn), 0) as total_revenue
            FROM orders 
            WHERE status IN $validStatuses $dateFilter
            GROUP BY $dateExpr
            ORDER BY $dateExpr ASC
        ";
        
        $orderResult = $db->query($orderQuery);
        if (!$orderResult) {
            throw new Exception("Order query failed: " . $db->error);
        }
        
        // Build order data map
        $orderMap = [];
        while ($row = $orderResult->fetch_assoc()) {
            $orderMap[$row['date_label']] = [
                'revenue' => (int)$row['total_revenue'],
                'orders' => (int)$row['total_orders'],
            ];
        }
        
        // Query 2: Item counts per period
        $dateExprAliased = str_replace('created_at', 'o.created_at', $dateExpr);
        $dateFilterAliased = str_replace('created_at', 'o.created_at', $dateFilter);
        $itemQuery = "
            SELECT 
                $dateExprAliased as date_label,
                COALESCE(SUM(oi.qty), 0) as total_items
            FROM orders o
            JOIN order_items oi ON oi.order_id = o.id
            WHERE o.status IN $validStatuses $dateFilterAliased
            GROUP BY $dateExprAliased
        ";
        
        $itemResult = $db->query($itemQuery);
        $itemMap = [];
        if ($itemResult) {
            while ($row = $itemResult->fetch_assoc()) {
                $itemMap[$row['date_label']] = (int)$row['total_items'];
            }
        }
        // Merge both maps into final data
        $data = [];
        $grandTotalRevenue = 0;
        $grandTotalOrders = 0;
        $grandTotalItems = 0;
        
        foreach ($orderMap as $label => $info) {
            $revenue = $info['revenue'];
            $orders = $info['orders'];
            $items = $itemMap[$label] ?? 0;
            
            $data[] = [
                'label' => $label,
                'revenue' => $revenue,
                'orders' => $orders,
                'items' => $items,
            ];
            
            $grandTotalRevenue += $revenue;
            $grandTotalOrders += $orders;
            $grandTotalItems += $items;
        }
        
        // Get top products for the period
        $topProductsQuery = "
            SELECT p.name, p.image_url, 
                   SUM(oi.qty) as total_sold,
                   SUM(COALESCE(oi.subtotal, oi.qty * COALESCE(oi.price_at_purchase, p.price, 0))) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status IN $validStatuses
        ";
        
        if ($startDate && $endDate) {
            if ($period === 'daily') {
                $topProductsQuery .= " AND DATE(o.created_at) BETWEEN '$cleanStart' AND '$cleanEnd'";
            } elseif ($period === 'monthly') {
                $topProductsQuery .= " AND DATE_FORMAT(o.created_at, '%Y-%m') BETWEEN '$cleanStart' AND '$cleanEnd'";
            } elseif ($period === 'weekly') {
                $topProductsQuery .= " AND DATE(DATE_ADD(o.created_at, INTERVAL - WEEKDAY(o.created_at) DAY)) BETWEEN '$cleanStart' AND '$cleanEnd'";
            }
        } else {
            if ($period === 'daily') {
                $topProductsQuery .= " AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            } elseif ($period === 'monthly') {
                $topProductsQuery .= " AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
            } elseif ($period === 'weekly') {
                $topProductsQuery .= " AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)";
            }
        }
        
        $topProductsQuery .= " GROUP BY oi.product_id ORDER BY total_sold DESC LIMIT 5";
        
        $topResult = $db->query($topProductsQuery);
        $topProducts = [];
        if ($topResult) {
            while ($row = $topResult->fetch_assoc()) {
                $topProducts[] = [
                    'name' => $row['name'],
                    'image_url' => $row['image_url'],
                    'total_sold' => (int)$row['total_sold'],
                    'total_revenue' => (int)$row['total_revenue'],
                ];
            }
        }
        // Get detailed records for the period (for PDF export)
        $detailsQuery = "
            SELECT DATE(o.created_at) as date_label, o.order_number, p.name as product_name, 
                   COALESCE(NULLIF(o.customer_name, ''), u.name, 'Unknown') as customer_name, 
                   oi.qty, 
                   COALESCE(oi.subtotal, oi.qty * COALESCE(oi.price_at_purchase, p.price, 0)) as price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            LEFT JOIN users u ON o.user_id = u.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.status IN $validStatuses
        ";
        
        if ($startDate && $endDate) {
            if ($period === 'daily') {
                $detailsQuery .= " AND DATE(o.created_at) BETWEEN '$cleanStart' AND '$cleanEnd'";
            } elseif ($period === 'monthly') {
                $detailsQuery .= " AND DATE_FORMAT(o.created_at, '%Y-%m') BETWEEN '$cleanStart' AND '$cleanEnd'";
            } elseif ($period === 'weekly') {
                $detailsQuery .= " AND DATE(DATE_ADD(o.created_at, INTERVAL - WEEKDAY(o.created_at) DAY)) BETWEEN '$cleanStart' AND '$cleanEnd'";
            }
        } else {
            if ($period === 'daily') {
                $detailsQuery .= " AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            } elseif ($period === 'monthly') {
                $detailsQuery .= " AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
            } elseif ($period === 'weekly') {
                $detailsQuery .= " AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)";
            }
        }
        $detailsQuery .= " ORDER BY o.created_at DESC";
        
        $detailsResult = $db->query($detailsQuery);
        $details = [];
        if ($detailsResult) {
            while ($row = $detailsResult->fetch_assoc()) {
                $details[] = [
                    'date' => $row['date_label'],
                    'order_number' => $row['order_number'],
                    'product_name' => $row['product_name'],
                    'customer_name' => $row['customer_name'],
                    'qty' => (int)$row['qty'],
                    'price' => (int)$row['price']
                ];
            }
        }
        
        // Query for cancelled summary
        $cancelQuery = "
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM($priceColumn), 0) as total_revenue
            FROM orders 
            WHERE status IN ('cancel', 'cancelled', 'rejected')
        ";
        if ($startDate && $endDate) {
            if ($period === 'daily') {
                $cancelQuery .= " AND DATE(created_at) BETWEEN '$cleanStart' AND '$cleanEnd'";
            } elseif ($period === 'monthly') {
                $cancelQuery .= " AND DATE_FORMAT(created_at, '%Y-%m') BETWEEN '$cleanStart' AND '$cleanEnd'";
            } elseif ($period === 'weekly') {
                $cancelQuery .= " AND DATE(DATE_ADD(created_at, INTERVAL - WEEKDAY(created_at) DAY)) BETWEEN '$cleanStart' AND '$cleanEnd'";
            }
        } else {
            if ($period === 'daily') {
                $cancelQuery .= " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            } elseif ($period === 'monthly') {
                $cancelQuery .= " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
            } elseif ($period === 'weekly') {
                $cancelQuery .= " AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)";
            }
        }

        $cancelResult = $db->query($cancelQuery);
        $totalCancelledOrders = 0;
        $totalCancelledRevenue = 0;
        if ($cancelResult && $row = $cancelResult->fetch_assoc()) {
            $totalCancelledOrders = (int)$row['total_orders'];
            $totalCancelledRevenue = (int)$row['total_revenue'];
        }

        return [
            'status' => 'success',
            'period' => $period,
            'data' => $data,
            'summary' => [
                'total_revenue' => $grandTotalRevenue,
                'total_orders' => $grandTotalOrders,
                'total_items' => $grandTotalItems,
                'total_cancelled_orders' => $totalCancelledOrders,
                'total_cancelled_revenue' => $totalCancelledRevenue,
            ],
            'top_products' => $topProducts,
            'details' => $details,
        ];
    } catch (Exception $e) {
        throw new Exception("Error getting sales report: " . $e->getMessage());
    }
}

// CREATE NEW ORDER
function createOrder($db, $data) {
    try {
        // Validate required fields
        if (empty($data['items']) || empty($data['customer_address'])) {
            throw new Exception("Items dan customer_address harus diisi");
        }

        // Check what columns exist in orders table
        $columnsResult = $db->query("DESCRIBE orders");
        $availableColumns = [];
        while ($col = $columnsResult->fetch_assoc()) {
            $availableColumns[] = $col['Field'];
        }

        // Generate order number
        $orderNumber = 'ORD' . date('YmdHis') . rand(1000, 9999);

        // Prepare data
        $data['order_number'] = $orderNumber;
        $data['status'] = 'pending';
        $data['customer_name'] = $data['customer_name'] ?? 'Guest';
        $data['customer_email'] = $data['customer_email'] ?? '';
        $data['customer_phone'] = $data['customer_phone'] ?? '';
        $data['customer_city'] = $data['customer_city'] ?? '';
        $data['customer_zip'] = $data['customer_zip'] ?? '';
        $data['shipping_method'] = $data['shipping_method'] ?? 'standard';
        $data['payment_method'] = $data['payment_method'] ?? 'transfer';
        $data['notes'] = $data['notes'] ?? '';
        $data['total_price'] = (int)($data['total_amount'] ?? $data['total_price'] ?? 0);
        $data['shipping_cost'] = (int)($data['shipping_cost'] ?? 0);
        $data['user_id'] = (int)($data['user_id'] ?? 0);

        // Build dynamic INSERT query
        $fieldNames = [];
        $placeholders = [];
        $values = [];
        $types = '';

        $data['shipping_address'] = $data['shipping_address'] ?? $data['customer_address'] ?? '';

        $fieldMap = [
            'order_number' => 's',
            'user_id' => 'i',
            'customer_name' => 's',
            'customer_email' => 's',
            'customer_phone' => 's',
            'customer_address' => 's',
            'shipping_address' => 's',
            'customer_city' => 's',
            'customer_zip' => 's',
            'shipping_method' => 's',
            'payment_method' => 's',
            'total_price' => 'i',
            'shipping_cost' => 'i',
            'notes' => 's',
            'status' => 's',
        ];

        foreach ($fieldMap as $field => $type) {
            if (in_array($field, $availableColumns)) {
                $fieldNames[] = $field;
                $placeholders[] = '?';
                $types .= $type;
                $values[] = $data[$field];
            }
        }

        // Add created_at if exists
        if (in_array('created_at', $availableColumns)) {
            $fieldNames[] = 'created_at';
            $placeholders[] = 'NOW()';
        }

        // Build final query
        $columnList = implode(', ', $fieldNames);
        $placeholderList = implode(', ', $placeholders);
        $query = "INSERT INTO orders ($columnList) VALUES ($placeholderList)";

        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $db->error);
        }

        // Bind parameters only if there are values to bind
        if (!empty($values)) {
            $stmt->bind_param($types, ...$values);
        }

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $orderId = $db->insert_id;
        $stmt->close();

        // Insert order items
        if (!empty($data['items']) && is_array($data['items'])) {
            // Check what columns exist in order_items table
            $itemColumnsResult = $db->query("DESCRIBE order_items");
            $itemAvailableColumns = [];
            while ($col = $itemColumnsResult->fetch_assoc()) {
                $itemAvailableColumns[] = $col['Field'];
            }

            // Build dynamic INSERT query for order items
            $itemFieldNames = ['order_id'];
            $itemPlaceholders = ['?'];
            $itemTypes = 'i';

            // Map frontend field names to possible DB column names
            $qtyDbCol = in_array('qty', $itemAvailableColumns) ? 'qty' : (in_array('quantity', $itemAvailableColumns) ? 'quantity' : null);
            $priceDbCol = in_array('price_at_purchase', $itemAvailableColumns) ? 'price_at_purchase' : (in_array('price', $itemAvailableColumns) ? 'price' : null);
            $hasSubtotal = in_array('subtotal', $itemAvailableColumns);
            $hasSizeCol = in_array('selected_size', $itemAvailableColumns);
            $hasColorCol = in_array('selected_color', $itemAvailableColumns);

            if (in_array('product_id', $itemAvailableColumns)) {
                $itemFieldNames[] = 'product_id';
                $itemPlaceholders[] = '?';
                $itemTypes .= 'i';
            }
            if ($qtyDbCol) {
                $itemFieldNames[] = $qtyDbCol;
                $itemPlaceholders[] = '?';
                $itemTypes .= 'i';
            }
            if ($priceDbCol) {
                $itemFieldNames[] = $priceDbCol;
                $itemPlaceholders[] = '?';
                $itemTypes .= 'i';
            }
            if ($hasSubtotal) {
                $itemFieldNames[] = 'subtotal';
                $itemPlaceholders[] = '?';
                $itemTypes .= 'i';
            }
            if ($hasSizeCol) {
                $itemFieldNames[] = 'selected_size';
                $itemPlaceholders[] = '?';
                $itemTypes .= 's';
            }
            if ($hasColorCol) {
                $itemFieldNames[] = 'selected_color';
                $itemPlaceholders[] = '?';
                $itemTypes .= 's';
            }

            $itemColumnList = implode(', ', $itemFieldNames);
            $itemPlaceholderList = implode(', ', $itemPlaceholders);
            $itemQuery = "INSERT INTO order_items ($itemColumnList) VALUES ($itemPlaceholderList)";

            $itemStmt = $db->prepare($itemQuery);
            if (!$itemStmt) {
                throw new Exception("Prepare items failed: " . $db->error);
            }

            foreach ($data['items'] as $item) {
                $itemBindValues = [$orderId];
                $itemQty = (int)($item['quantity'] ?? 1);
                $itemPrice = (int)($item['price'] ?? 0);
                
                if (in_array('product_id', $itemAvailableColumns)) {
                    $itemBindValues[] = (int)($item['product_id'] ?? 0);
                }
                if ($qtyDbCol) {
                    $itemBindValues[] = $itemQty;
                }
                if ($priceDbCol) {
                    $itemBindValues[] = $itemPrice;
                }
                if ($hasSubtotal) {
                    $itemBindValues[] = $itemQty * $itemPrice;
                }
                if ($hasSizeCol) {
                    $itemBindValues[] = $item['selected_size'] ?? null;
                }
                if ($hasColorCol) {
                    $itemBindValues[] = $item['selected_color'] ?? null;
                }

                if (!empty($itemBindValues)) {
                    $itemStmt->bind_param($itemTypes, ...$itemBindValues);
                }

                if (!$itemStmt->execute()) {
                    throw new Exception("Insert item failed: " . $itemStmt->error);
                }
            }
            $itemStmt->close();

            // Reduce stock for each ordered product (both variant and global)
            foreach ($data['items'] as $item) {
                $qty = (int)($item['quantity'] ?? 1);
                $pid = (int)($item['product_id'] ?? 0);
                $itemSize = $item['selected_size'] ?? null;
                $itemColor = $item['selected_color'] ?? null;

                if ($pid > 0) {
                    // Reduce variant stock if size specified
                    if ($itemSize && $itemColor) {
                        // Size + Color variant
                        $varStmt = $db->prepare("UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE product_id = ? AND size = ? AND color = ?");
                        if ($varStmt) {
                            $varStmt->bind_param("iiss", $qty, $pid, $itemSize, $itemColor);
                            $varStmt->execute();
                            $varStmt->close();
                        }
                    } elseif ($itemSize) {
                        // Size-only variant (color stored as '-')
                        $defaultColor = '-';
                        $varStmt = $db->prepare("UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE product_id = ? AND size = ? AND color = ?");
                        if ($varStmt) {
                            $varStmt->bind_param("iiss", $qty, $pid, $itemSize, $defaultColor);
                            $varStmt->execute();
                            $varStmt->close();
                        }
                    }
                    // Always reduce global product stock
                    $stockStmt = $db->prepare("UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?");
                    if ($stockStmt) {
                        $stockStmt->bind_param("ii", $qty, $pid);
                        $stockStmt->execute();
                        $stockStmt->close();
                    }
                }
            }
        }

        // Remove only the purchased items from the user's cart
        if (!empty($data['user_id']) && !empty($data['items']) && is_array($data['items'])) {
            $cartIds = [];
            $productIds = [];
            foreach ($data['items'] as $item) {
                if (!empty($item['cart_id'])) {
                    $cartIds[] = (int)$item['cart_id'];
                } elseif (!empty($item['product_id'])) {
                    $productIds[] = (int)$item['product_id'];
                }
            }
            
            if (!empty($cartIds)) {
                $inClause = implode(',', $cartIds);
                $clearCartStmt = $db->prepare("DELETE FROM cart WHERE id IN ($inClause)");
                if ($clearCartStmt) {
                    $clearCartStmt->execute();
                    $clearCartStmt->close();
                }
            }
            
            if (!empty($productIds)) {
                $inClause = implode(',', $productIds);
                $clearCartStmt = $db->prepare("DELETE FROM cart WHERE user_id = ? AND product_id IN ($inClause)");
                if ($clearCartStmt) {
                    $clearCartStmt->bind_param("i", $data['user_id']);
                    $clearCartStmt->execute();
                    $clearCartStmt->close();
                }
            }
        }

        return [
            'status' => 'success',
            'message' => 'Order created successfully',
            'order_id' => $orderId,
            'order_number' => $orderNumber,
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => 'Error creating order: ' . $e->getMessage(),
        ];
    }
}

// GET ORDER DETAIL
function getOrderDetail($db, $orderId) {
    try {
        $query = "
            SELECT o.* 
            FROM orders o 
            WHERE o.id = ? OR o.order_number = ?
            LIMIT 1
        ";

        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $db->error);
        }

        $stmt->bind_param("is", $orderId, $orderId);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            throw new Exception("Order not found");
        }

        $order = $result->fetch_assoc();
        $stmt->close();

        // Get order items with product details
        $itemsQuery = "
            SELECT oi.*, p.name as product_name, p.image_url, p.price as product_price 
            FROM order_items oi 
            LEFT JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        ";

        $itemsStmt = $db->prepare($itemsQuery);
        if (!$itemsStmt) {
            throw new Exception("Prepare items failed: " . $db->error);
        }

        $itemsStmt->bind_param("i", $order['id']);
        $itemsStmt->execute();
        $itemsResult = $itemsStmt->get_result();

        $items = [];
        while ($row = $itemsResult->fetch_assoc()) {
            // Normalize column names for frontend compatibility
            // Use empty() to also catch 0 values and fall back to product data
            $rawQty = $row['qty'] ?? $row['quantity'] ?? 0;
            $rawPrice = $row['price_at_purchase'] ?? $row['price'] ?? 0;
            
            $qty = (!empty($rawQty) && (int)$rawQty > 0) ? (int)$rawQty : 1;
            $price = (!empty($rawPrice) && (float)$rawPrice > 0) ? (int)$rawPrice : (int)($row['product_price'] ?? 0);
            
            $items[] = [
                'id' => $row['id'],
                'product_id' => $row['product_id'],
                'product_name' => $row['product_name'] ?? $row['name'] ?? 'Product',
                'quantity' => $qty,
                'price' => $price,
                'subtotal' => (!empty($row['subtotal']) && (float)$row['subtotal'] > 0) ? (int)$row['subtotal'] : ($qty * $price),
                'image_url' => $row['image_url'],
                'selected_size' => $row['selected_size'] ?? null,
                'selected_color' => $row['selected_color'] ?? null,
            ];
        }
        $itemsStmt->close();

        // Also normalize order-level price fields
        $order['total_price'] = (int)($order['total_price'] ?? $order['total_amount'] ?? 0);
        $order['items'] = $items;

        return $order;
    } catch (Exception $e) {
        throw new Exception("Error getting order detail: " . $e->getMessage());
    }
}

function updateOrderStatus($db, $orderId, $status, $rejectionReason = null) {
    try {
        // Map common status names to actual ENUM values in database
        $statusMap = [
            'cancelled' => 'cancel',
            'cancel' => 'cancel',
            'processing' => 'processing',
            'paid' => 'processing',
            'settlement' => 'settlement',
            'delivered' => 'completed',
            'completed' => 'completed',
            'shipped' => 'shipped',
            'pending' => 'pending',
            'expire' => 'expire',
            'waiting_confirmation' => 'waiting_confirmation',
            'rejected' => 'rejected',
            'payment_rejected' => 'rejected',
        ];
        
        $statusLower = strtolower($status);
        if (!isset($statusMap[$statusLower])) {
            throw new Exception("Invalid status: $status");
        }
        
        $mappedStatus = $statusMap[$statusLower];

        // First get the current status and actual ID
        $checkStmt = $db->prepare("SELECT id, status FROM orders WHERE id = ? OR order_number = ?");
        $checkStmt->bind_param("is", $orderId, $orderId);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        if ($result->num_rows === 0) {
            throw new Exception("Order not found");
        }
        $orderRow = $result->fetch_assoc();
        $currentStatus = $orderRow['status'];
        $actualOrderId = $orderRow['id'];
        $checkStmt->close();

        $query = "UPDATE orders SET status = ?, rejection_reason = ? WHERE id = ?";
        $stmt = $db->prepare($query);
        if (!$stmt) {
            throw new Exception("Prepare failed: " . $db->error);
        }

        $stmt->bind_param("ssi", $mappedStatus, $rejectionReason, $actualOrderId);

        if (!$stmt->execute()) {
            throw new Exception("Execute failed: " . $stmt->error);
        }

        $stmt->close();

        // If transitioning to a cancelled state from a non-cancelled state, restore stock
        $cancelledStates = ['cancel', 'cancelled', 'expire', 'rejected'];
        $wasCancelled = in_array(strtolower($currentStatus), $cancelledStates);
        $isCancelling = in_array(strtolower($mappedStatus), $cancelledStates);

        if (!$wasCancelled && $isCancelling) {
            // Restore stock
            $itemsStmt = $db->prepare("SELECT * FROM order_items WHERE order_id = ?");
            if ($itemsStmt) {
                $itemsStmt->bind_param("i", $actualOrderId);
                $itemsStmt->execute();
                $itemsRes = $itemsStmt->get_result();
                while ($item = $itemsRes->fetch_assoc()) {
                    $qty = (int)($item['qty'] ?? $item['quantity'] ?? 1);
                    $pid = (int)($item['product_id'] ?? 0);
                    $itemSize = $item['selected_size'] ?? null;
                    $itemColor = $item['selected_color'] ?? null;

                    if ($pid > 0) {
                        if ($itemSize && $itemColor) {
                            $varStmt = $db->prepare("UPDATE product_variants SET stock = stock + ? WHERE product_id = ? AND size = ? AND color = ?");
                            if ($varStmt) {
                                $varStmt->bind_param("iiss", $qty, $pid, $itemSize, $itemColor);
                                $varStmt->execute();
                                $varStmt->close();
                            }
                        } elseif ($itemSize) {
                            $defaultColor = '-';
                            $varStmt = $db->prepare("UPDATE product_variants SET stock = stock + ? WHERE product_id = ? AND size = ? AND color = ?");
                            if ($varStmt) {
                                $varStmt->bind_param("iiss", $qty, $pid, $itemSize, $defaultColor);
                                $varStmt->execute();
                                $varStmt->close();
                            }
                        }
                        $stockStmt = $db->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
                        if ($stockStmt) {
                            $stockStmt->bind_param("ii", $qty, $pid);
                            $stockStmt->execute();
                            $stockStmt->close();
                        }
                    }
                }
                $itemsStmt->close();
            }
        }

        return [
            'status' => 'success',
            'message' => 'Order status updated successfully',
        ];
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'message' => 'Error updating order status: ' . $e->getMessage(),
        ];
    }
}
?>
