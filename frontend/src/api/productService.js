import axios from 'axios';

const API_URL = 'https://outfitkita.my.id/api/';

// Normalize product data from API to match frontend format
const normalizeProduct = (product) => {
  let imageUrl = product.image_url;
  // Perbaiki URL gambar yang masih hardcoded ke localhost dari database lama
  if (imageUrl) {
    imageUrl = imageUrl.replace('https://outfitkita.my.id/backend');
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    original_price: product.original_price,
    image_url: imageUrl,
    images: product.images,
    category: product.category_name || product.category,
    category_id: product.category_id,
    stock: product.stock,
    sizes: product.sizes || '',
    colors: product.colors || '',
    variants: product.variants || [],
    is_new: product.is_new,
    is_featured: product.is_featured,
    sales: product.sales,
    rating: product.rating,
    slug: product.slug,
    created_at: product.created_at,
  };
};

// Get All Products
export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}?action=get_products`);
    if (response.data.status === 'success' && Array.isArray(response.data.data)) {
      return {
        status: 'success',
        data: response.data.data.map(normalizeProduct)
      };
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal mengambil data produk'
    };
  }
};

// Get Product Detail
export const getProductDetail = async (productId) => {
  try {
    const response = await axios.get(`${API_URL}?action=get_product&id=${productId}`);
    if (response.data.status === 'success') {
      const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      return {
        status: 'success',
        data: data.map(normalizeProduct)
      };
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal mengambil detail produk'
    };
  }
};

// Add Product
export const addProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_URL}?action=add_product`, productData);
    return response.data;
  } catch (error) {
    console.error('Error adding product:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal menambah produk'
    };
  }
};

// Update Product
export const updateProduct = async (productData) => {
  try {
    const response = await axios.post(`${API_URL}?action=update_product`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal memperbarui produk'
    };
  }
};

// Delete Product
export const deleteProduct = async (productId) => {
  try {
    const response = await axios.post(`${API_URL}?action=delete_product`, { id: productId });
    return response.data;
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal menghapus produk'
    };
  }
};

// Get Categories with Random Products
export const getCategoriesWithProducts = async (limit = 3) => {
  try {
    const response = await axios.get(`${API_URL}?action=get_categories_with_products&limit=${limit}`);
    if (response.data.status === 'success' && Array.isArray(response.data.data)) {
      return {
        status: 'success',
        data: response.data.data.map(category => ({
          id: category.id,
          name: category.name,
          products: category.products.map(normalizeProduct)
        }))
      };
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching categories with products:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'Gagal mengambil kategori dan produk'
    };
  }
};
