import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHeart, FiShoppingBag, FiCheck, FiTruck, FiRotateCcw, FiUser } from 'react-icons/fi';
import { getProductDetail, getProducts } from '../api/productService';
import { getProductReviews, getProductRating } from '../api/reviewService';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ratingData, setRatingData] = useState({ total_reviews: 0, average_rating: 0, distribution: { 5:0, 4:0, 3:0, 2:0, 1:0 } });

  const isWishlisted = product ? isInWishlist(product.id) : false;

  // Parse available sizes and colors from product
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];
  const availableSizes = product?.sizes 
    ? product.sizes.split(',').map(s => s.trim()).filter(Boolean).sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }) 
    : [];
  const availableColors = product?.colors ? product.colors.split(',').map(c => c.trim()).filter(Boolean) : [];
  // Check if product actually has color variants (not just '-')
  const hasColorVariants = product?.variants?.some(v => v.color && v.color !== '-') ?? false;
  const hasSizeVariants = availableSizes.length > 0;
  const hasVariants = hasSizeVariants || availableColors.length > 0;

  // Get variant stock for selected combination
  const getVariantStock = () => {
    if (!product?.variants || !selectedSize) return null;
    if (hasColorVariants && selectedColor) {
      // Size + Color lookup
      const variant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
      return variant ? variant.stock : 0;
    } else if (!hasColorVariants) {
      // Size-only lookup (color is '-' in DB)
      const variant = product.variants.find(v => v.size === selectedSize && (!v.color || v.color === '-'));
      return variant ? variant.stock : null;
    }
    return null;
  };

  const variantStock = getVariantStock();
  const displayStock = (() => {
    if (hasSizeVariants && selectedSize) {
      if (hasColorVariants && selectedColor) return variantStock;
      if (!hasColorVariants) return variantStock;
    }
    return product?.stock ?? 0;
  })();

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchReviews();
    }
  }, [id]);

  const fetchReviews = async () => {
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        getProductReviews(id),
        getProductRating(id)
      ]);
      if (reviewsRes.status === 'success') setReviews(reviewsRes.data || []);
      if (ratingRes.status === 'success') setRatingData(ratingRes.data);
    } catch (e) {
      console.error('Error fetching reviews:', e);
    }
  };

  useEffect(() => {
    // Reset size/color when product changes
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
  }, [product?.id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      const productResponse = await getProductDetail(id);
      
      if (productResponse.status === 'success' && productResponse.data) {
        const productData = productResponse.data[0] || productResponse.data;
        setProduct(productData);

        // Fetch related products (same category)
        const allProducts = await getProducts();
        if (allProducts.status === 'success') {
          const related = allProducts.data?.filter(p => 
            p.category_id === productData.category_id && p.id !== productData.id
          ).sort(() => 0.5 - Math.random()).slice(0, 4) || [];
          setRelatedProducts(related);
        }
      } else {
        showError('Produk tidak ditemukan');
      }
    } catch (error) {
      showError('Gagal memuat detail produk');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (number) => {
    const numValue = parseInt(number) || 0;
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(numValue);
  };

  const formatDescription = (rawText) => {
    if (!rawText) return null;
    
    // Replace literal '\n' string with actual newline character
    const text = rawText.replace(/\\n/g, '\n');
    
    // Split by double newlines to get blocks (paragraphs/lists)
    const blocks = text.split(/\n\n+/);
    
    return blocks.map((block, index) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return null;

      // Check if it's a heading (ends with colon)
      if (trimmedBlock.endsWith(':')) {
        return <h4 key={index} className="font-bold text-gray-900 mt-5 mb-2">{trimmedBlock}</h4>;
      }

      // Check if it's a list (contains single newlines)
      if (trimmedBlock.includes('\n')) {
        const items = trimmedBlock.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="list-disc pl-5 mb-4 space-y-1.5 text-gray-700">
            {items.map((item, i) => (
              <li key={i}>{item.trim()}</li>
            ))}
          </ul>
        );
      }

      // Check if it's a note (wrapped in parentheses)
      if (trimmedBlock.startsWith('(') && trimmedBlock.endsWith(')')) {
        return <p key={index} className="italic text-gray-600 mb-4">{trimmedBlock}</p>;
      }

      // Format product name as italic if it exists in the paragraph
      const renderWithItalics = (str) => {
        if (!product?.name) return str;
        const parts = str.split(new RegExp(`(${product.name})`, 'gi'));
        return parts.map((part, i) => 
          part.toLowerCase() === product.name.toLowerCase() ? <em key={i} className="font-semibold">{part}</em> : part
        );
      };

      // Normal paragraph
      return <p key={index} className="mb-4 text-gray-700 text-justify leading-relaxed">{renderWithItalics(trimmedBlock)}</p>;
    });
  };

  const handleAddToCart = () => {
    if (hasSizeVariants) {
      if (!selectedSize) {
        showError('Silakan pilih ukuran terlebih dahulu');
        return;
      }
      if (hasColorVariants && !selectedColor) {
        showError('Silakan pilih warna terlebih dahulu');
        return;
      }
      if (variantStock !== null && variantStock <= 0) {
        showError('Stok untuk varian ini habis');
        return;
      }
    }

    if (quantity > 0 && displayStock > 0) {
      addToCart(product, quantity, selectedSize || null, selectedColor || null);
      showSuccess(
        `${product.name}${selectedSize ? ` (${selectedSize})` : ''}${selectedColor ? ` - ${selectedColor}` : ''} x${quantity} ditambahkan ke keranjang`
      );
      setQuantity(1);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showError('Silakan login terlebih dahulu untuk menambahkan ke favorit');
      navigate('/login');
      return;
    }

    setIsUpdatingWishlist(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        showSuccess(`${product.name} dihapus dari favorit`);
      } else {
        await addToWishlist(product);
        showSuccess(`${product.name} ditambahkan ke favorit`);
      }
    } catch (error) {
      showError('Gagal memperbarui favorit');
      console.error(error);
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center">
        <p className="text-2xl font-semibold text-gray-900 mb-4">Produk tidak ditemukan</p>
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
        >
          Kembali ke Produk
        </button>
      </div>
    );
  }

  const images = product.images?.split(',') || [product.image_url || product.imageUrl];

  return (
    <div className="bg-white min-h-screen">
      {/* Header Navigation */}
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 hover:text-black transition-colors mb-2 text-xs font-black uppercase tracking-[0.2em]"
          style={{ color: '#4b5563' }}
        >
          <FiArrowLeft size={16} />
          <span>Kembali</span>
        </button>
      </div>

      {/* Product Section */}
      <section className="container mx-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
          
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-3xl overflow-hidden aspect-[4/5] flex items-center justify-center border border-gray-100 shadow-inner">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${
                      selectedImage === idx 
                        ? 'border-black' 
                        : 'border-transparent bg-gray-50'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-3 sm:space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-gray-100 rounded-md" style={{ color: '#4b5563' }}>
                    {product.category}
                  </span>
                  {product.is_new && (
                    <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-[0.1em]">
                      New Release
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight tracking-tight">
                  {product.name}
                </h1>
              </div>

              <div className="flex items-center gap-4 py-3 border-y border-gray-50">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.round(ratingData.average_rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-black">{ratingData.average_rating > 0 ? ratingData.average_rating : '-'}</span>
                </div>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="text-xs font-bold" style={{ color: '#6b7280' }}>{ratingData.total_reviews} ulasan</span>
              </div>

              <div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl sm:text-4xl font-black text-black">
                    {formatRupiah(product.price)}
                  </p>
                  {product.original_price && product.original_price > product.price && (
                    <p className="text-base sm:text-lg font-bold line-through" style={{ color: '#9ca3af' }}>
                      {formatRupiah(product.original_price)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Description Card */}
            {product.description && (
              <div className="bg-gray-50 rounded-3xl p-4 sm:p-6 border border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-gray-900">Deskripsi Produk</h3>
                <div className={`text-sm relative overflow-hidden transition-all duration-300 ${isDescExpanded ? '' : 'max-h-40'}`}>
                  {formatDescription(product.description)}
                  {!isDescExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
                  )}
                </div>
                <button 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="mt-4 text-xs font-bold text-gray-900 underline hover:text-gray-600 transition-colors"
                >
                  {isDescExpanded ? 'Tutup Deskripsi' : 'Baca Selengkapnya'}
                </button>
              </div>
            )}

            {/* Selection Options */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm space-y-5 sm:space-y-6">
              {/* Size Selector */}
              {availableSizes.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#111827' }}>
                    Ukuran <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-10 px-3 rounded-xl text-xs font-black transition-all border-2 ${
                          selectedSize === size
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-gray-50 text-black border-transparent hover:border-gray-200'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {availableColors.length > 0 && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#111827' }}>
                    Warna <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`h-10 px-5 rounded-xl text-xs font-black transition-all border-2 ${
                          selectedColor === color
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-gray-50 text-black border-transparent hover:border-gray-200'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="pt-4 border-t border-gray-50">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#111827' }}>
                      Jumlah
                    </label>
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold hover:shadow-sm active:scale-95 transition-all text-black"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-transparent text-center font-black text-sm text-black focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold hover:shadow-sm active:scale-95 transition-all text-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                    displayStock > 0
                      ? 'bg-green-50 text-green-700 border border-green-100'
                      : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {displayStock > 0 ? `Tersedia: ${displayStock}` : 'Habis'}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-5 sm:mt-6">
                  <button
                    onClick={handleAddToCart}
                    disabled={displayStock <= 0}
                    className="col-span-4 bg-black text-white h-12 sm:h-14 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-gray-800 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <FiShoppingBag size={18} />
                    <span className="hidden sm:inline">Tambah ke Keranjang</span>
                    <span className="sm:hidden">Keranjang</span>
                  </button>
                  <button
                    onClick={handleToggleWishlist}
                    disabled={isUpdatingWishlist}
                    className={`h-12 sm:h-14 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 border-2 ${
                      isWishlisted
                        ? 'bg-red-50 border-red-500 text-red-500 shadow-inner'
                        : 'bg-white border-gray-100 text-black hover:border-black shadow-sm'
                    }`}
                  >
                    <FiHeart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>

            {/* Shipping Info Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1.5 sm:gap-2">
                <FiTruck className="text-black" size={16} />
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black">Gratis Ongkir</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">Min. Rp500rb</p>
              </div>
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1.5 sm:gap-2">
                <FiRotateCcw className="text-black" size={16} />
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black">30 Hari Retur</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">Tanpa Tanya</p>
              </div>
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-1.5 sm:gap-2">
                <FiCheck className="text-black" size={16} />
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black">QC Passed</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:block">Terjamin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-white py-12 border-t border-gray-100">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-black tracking-tight">Produk Serupa</h2>
              <button
                onClick={() => {
                  const parts = (product.category || '').split(' - ');
                  const mainCat = parts[0]?.trim() || '';
                  const subCat = parts[1]?.trim() || '';
                  const params = new URLSearchParams();
                  if (mainCat) params.set('mainCategory', mainCat);
                  if (subCat) params.set('subCategory', subCat);
                  navigate(`/products?${params.toString()}`);
                }}
                className="text-xs font-black uppercase tracking-widest text-black hover:opacity-60 transition-all"
              >
                Lihat Semua →
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(relatedProduct => (
                <div
                  key={relatedProduct.id}
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                >
                  <div className="relative aspect-square overflow-hidden bg-gray-200">
                    <img
                      src={relatedProduct.image_url || relatedProduct.imageUrl}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-1">{relatedProduct.category}</p>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {relatedProduct.name}
                    </h3>
                    <p className="font-bold text-lg text-black">
                      {formatRupiah(relatedProduct.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-black text-black tracking-tight mb-8">Ulasan Pelanggan</h2>

          {ratingData.total_reviews > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Rating Summary */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-center mb-6">
                  <p className="text-5xl font-black text-black">{ratingData.average_rating}</p>
                  <div className="flex gap-0.5 justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < Math.round(ratingData.average_rating) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-gray-500 mt-1">{ratingData.total_reviews} ulasan</p>
                </div>
                <div className="space-y-2">
                  {[5,4,3,2,1].map(star => {
                    const count = ratingData.distribution[star] || 0;
                    const pct = ratingData.total_reviews > 0 ? (count / ratingData.total_reviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600 w-4">{star}</span>
                        <span className="text-yellow-400 text-xs">★</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review List */}
              <div className="lg:col-span-2 space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                        {review.user_avatar ? (
                          <img src={review.user_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FiUser size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-black text-gray-900">{review.user_name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(review.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xs ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                        {review.review && (
                          <p className="text-sm text-gray-700 leading-relaxed">{review.review}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="flex gap-1 justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-2xl text-gray-200">★</span>
                ))}
              </div>
              <p className="text-sm font-bold text-gray-400">Belum ada ulasan untuk produk ini</p>
              <p className="text-xs text-gray-300 mt-1">Jadilah yang pertama memberikan ulasan!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;
