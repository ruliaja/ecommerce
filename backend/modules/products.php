<?php
// GET ALL PRODUCTS
function getProducts($db) {
    $query = "SELECT p.*, c.category_name,
              (SELECT COALESCE(SUM(oi.qty), 0) 
               FROM order_items oi 
               JOIN orders o ON oi.order_id = o.id 
               WHERE oi.product_id = p.id AND o.status IN ('shipped', 'delivered', 'completed')
              ) as sales
              FROM products p 
              LEFT JOIN categories c ON p.category_id = c.id 
              ORDER BY p.created_at DESC";
    
    $stmt = $db->prepare($query);
    
    if (!$stmt) {
        return ["status" => "error", "message" => "Prepare failed: " . $db->error];
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    
    $stmt->close();
    return $products;
}

// GET PRODUCT BY ID (with variants)
function getProductById($db, $id) {
    $id = (int)$id;
    $query = "SELECT * FROM products WHERE id = ?";
    
    $stmt = $db->prepare($query);
    
    if (!$stmt) {
        return ["status" => "error", "message" => "Prepare failed: " . $db->error];
    }
    
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        return null;
    }
    
    $product = $result->fetch_assoc();
    $stmt->close();

    // Load variants
    $product['variants'] = getProductVariants($db, $id);
    
    return $product;
}

// GET PRODUCT VARIANTS
function getProductVariants($db, $productId) {
    $stmt = $db->prepare("SELECT id, size, color, stock FROM product_variants WHERE product_id = ? ORDER BY FIELD(size, 'XS','S','M','L','XL','XXL','All Size'), color ASC");
    if (!$stmt) return [];
    $stmt->bind_param("i", $productId);
    $stmt->execute();
    $result = $stmt->get_result();
    $variants = [];
    while ($row = $result->fetch_assoc()) {
        $variants[] = [
            'id' => (int)$row['id'],
            'size' => $row['size'],
            'color' => $row['color'],
            'stock' => (int)$row['stock'],
        ];
    }
    $stmt->close();
    return $variants;
}

// GET PRODUCT BY SLUG
function getProductBySlug($db, $slug) {
    $slug = $db->real_escape_string($slug);
    $query = "SELECT * FROM products WHERE slug = ?";
    
    $stmt = $db->prepare($query);
    
    if (!$stmt) {
        return ["status" => "error", "message" => "Prepare failed: " . $db->error];
    }
    
    $stmt->bind_param("s", $slug);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        return null;
    }
    
    $product = $result->fetch_assoc();
    $stmt->close();
    return $product;
}

// ADD PRODUCT
function addProduct($db, $data) {
    if (!isset($data['name']) || !isset($data['category']) || !isset($data['price'])) {
        return ["status" => "error", "message" => "Nama, kategori, dan harga harus diisi"];
    }

    try {
        // Get or create category
        $category_name = $db->real_escape_string($data['category']);
        $catQuery = "SELECT id FROM categories WHERE category_name = ?";
        $catStmt = $db->prepare($catQuery);
        $catStmt->bind_param("s", $category_name);
        $catStmt->execute();
        $catResult = $catStmt->get_result();
        
        if ($catResult->num_rows > 0) {
            $cat = $catResult->fetch_assoc();
            $category_id = $cat['id'];
        } else {
            // Create new category
            $slug = strtolower(str_replace(' ', '-', $category_name));
            $catInsert = $db->prepare("INSERT INTO categories (category_name, slug) VALUES (?, ?)");
            $catInsert->bind_param("ss", $category_name, $slug);
            $catInsert->execute();
            $category_id = $db->insert_id;
            $catInsert->close();
        }
        $catStmt->close();

        // Create slug for product
        $name = $db->real_escape_string($data['name']);
        $slug = strtolower(str_replace(' ', '-', $name)) . '-' . time();
        $description = isset($data['description']) ? $db->real_escape_string($data['description']) : '';
        $price = (int)$data['price'];
        $stock = isset($data['stock']) ? (int)$data['stock'] : 0;
        $image_url = isset($data['image_url']) ? $db->real_escape_string($data['image_url']) : '';
        $sizes = isset($data['sizes']) ? $db->real_escape_string($data['sizes']) : '';
        $colors = isset($data['colors']) ? $db->real_escape_string($data['colors']) : '';

        $query = "
            INSERT INTO products (name, slug, description, price, category_id, image_url, stock, sizes, colors)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("sssiisiss", $name, $slug, $description, $price, $category_id, $image_url, $stock, $sizes, $colors);
        
        if ($stmt->execute()) {
            $product_id = $db->insert_id;
            $stmt->close();

            // Save variants if provided
            if (!empty($data['variants']) && is_array($data['variants'])) {
                saveProductVariants($db, $product_id, $data['variants']);
            }

            return [
                "status" => "success",
                "message" => "Produk berhasil ditambahkan",
                "product_id" => $product_id
            ];
        } else {
            $stmt->close();
            return ["status" => "error", "message" => "Error: " . $db->error];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// UPDATE PRODUCT
function updateProduct($db, $data) {
    if (!isset($data['id']) || !isset($data['name']) || !isset($data['category']) || !isset($data['price'])) {
        return ["status" => "error", "message" => "ID, nama, kategori, dan harga harus diisi"];
    }

    try {
        $id = (int)$data['id'];
        
        // Get or create category
        $category_name = $db->real_escape_string($data['category']);
        $catQuery = "SELECT id FROM categories WHERE category_name = ?";
        $catStmt = $db->prepare($catQuery);
        $catStmt->bind_param("s", $category_name);
        $catStmt->execute();
        $catResult = $catStmt->get_result();
        
        if ($catResult->num_rows > 0) {
            $cat = $catResult->fetch_assoc();
            $category_id = $cat['id'];
        } else {
            // Create new category
            $slug = strtolower(str_replace(' ', '-', $category_name));
            $catInsert = $db->prepare("INSERT INTO categories (category_name, slug) VALUES (?, ?)");
            $catInsert->bind_param("ss", $category_name, $slug);
            $catInsert->execute();
            $category_id = $db->insert_id;
            $catInsert->close();
        }
        $catStmt->close();

        $name = $db->real_escape_string($data['name']);
        $description = isset($data['description']) ? $db->real_escape_string($data['description']) : '';
        $price = (int)$data['price'];
        $stock = isset($data['stock']) ? (int)$data['stock'] : 0;
        $image_url = isset($data['image_url']) ? $db->real_escape_string($data['image_url']) : '';
        $sizes = isset($data['sizes']) ? $db->real_escape_string($data['sizes']) : '';
        $colors = isset($data['colors']) ? $db->real_escape_string($data['colors']) : '';

        $query = "
            UPDATE products 
            SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, stock = ?, sizes = ?, colors = ?
            WHERE id = ?
        ";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("ssiisissi", $name, $description, $price, $category_id, $image_url, $stock, $sizes, $colors, $id);
        
        if ($stmt->execute()) {
            $stmt->close();

            // Save variants if provided
            if (isset($data['variants']) && is_array($data['variants'])) {
                saveProductVariants($db, $id, $data['variants']);
            }

            return ["status" => "success", "message" => "Produk berhasil diperbarui"];
        } else {
            $stmt->close();
            return ["status" => "error", "message" => "Error: " . $db->error];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// SAVE PRODUCT VARIANTS (upsert)
function saveProductVariants($db, $productId, $variants) {
    // Delete existing variants for this product
    $delStmt = $db->prepare("DELETE FROM product_variants WHERE product_id = ?");
    $delStmt->bind_param("i", $productId);
    $delStmt->execute();
    $delStmt->close();

    // Insert new variants
    $insStmt = $db->prepare("INSERT INTO product_variants (product_id, size, color, stock) VALUES (?, ?, ?, ?)");
    if (!$insStmt) return;

    $totalStock = 0;
    foreach ($variants as $variant) {
        $size = $variant['size'] ?? '';
        $color = $variant['color'] ?? '-';  // Use '-' as default when no color
        $stock = (int)($variant['stock'] ?? 0);
        if (!$size) continue;  // Only size is required
        if (empty($color)) $color = '-';
        $insStmt->bind_param("issi", $productId, $size, $color, $stock);
        $insStmt->execute();
        $totalStock += $stock;
    }
    $insStmt->close();

    // Update product total stock to sum of all variants
    $updateStmt = $db->prepare("UPDATE products SET stock = ? WHERE id = ?");
    $updateStmt->bind_param("ii", $totalStock, $productId);
    $updateStmt->execute();
    $updateStmt->close();
}

// DELETE PRODUCT
function deleteProduct($db, $id) {
    try {
        $id = (int)$id;
        $query = "DELETE FROM products WHERE id = ?";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            return ["status" => "error", "message" => "Prepare failed: " . $db->error];
        }

        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            $stmt->close();
            return ["status" => "success", "message" => "Produk berhasil dihapus"];
        } else {
            $stmt->close();
            return ["status" => "error", "message" => "Error: " . $db->error];
        }
    } catch (Exception $e) {
        return ["status" => "error", "message" => "Exception: " . $e->getMessage()];
    }
}

// GET CATEGORIES WITH RANDOM PRODUCTS
function getCategoriesWithProducts($db, $productsPerCategory = 3) {
    // Get all categories
    $catQuery = "SELECT id, category_name FROM categories ORDER BY category_name ASC";
    $catStmt = $db->prepare($catQuery);
    
    if (!$catStmt) {
        return ["status" => "error", "message" => "Prepare failed: " . $db->error];
    }
    
    $catStmt->execute();
    $catResult = $catStmt->get_result();
    
    if ($catResult->num_rows === 0) {
        $catStmt->close();
        return ["status" => "success", "data" => []];
    }
    
    $categories = [];
    while ($category = $catResult->fetch_assoc()) {
        // Get random products from this category
        $prodQuery = "SELECT p.*, c.category_name 
                      FROM products p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      WHERE p.category_id = ? 
                      ORDER BY RAND() 
                      LIMIT ?";
        
        $prodStmt = $db->prepare($prodQuery);
        if (!$prodStmt) {
            continue;
        }
        
        $categoryId = $category['id'];
        $prodStmt->bind_param("ii", $categoryId, $productsPerCategory);
        $prodStmt->execute();
        $prodResult = $prodStmt->get_result();
        
        $products = [];
        while ($product = $prodResult->fetch_assoc()) {
            $products[] = $product;
        }
        
        $prodStmt->close();
        
        // Only add category if it has products
        if (count($products) > 0) {
            $categories[] = [
                "id" => $category['id'],
                "name" => $category['category_name'],
                "products" => $products
            ];
        }
    }
    
    $catStmt->close();
    return ["status" => "success", "data" => $categories];
}
?>