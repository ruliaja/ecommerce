import React, { useState, useEffect } from 'react';
import { FiFilter, FiSearch, FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api/productService';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';

const Products = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Get subcategories for selected main category
  const getSubCategoriesForMain = (mainCat) => {
    if (!mainCat) return [];
    const subs = new Set();
    products.forEach(product => {
      const productCategory = (product.category || '').trim();
      if (productCategory.startsWith(mainCat)) {
        const parts = productCategory.split('-').map(p => p.trim());
        if (parts.length > 1) {
          subs.add(parts[1]);
        }
      }
    });
    return Array.from(subs).sort();
  };

  // Get category from URL params — runs after products are loaded too
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const mainCategoryParam = searchParams.get('mainCategory');
    const subCategoryParam = searchParams.get('subCategory');
    const searchParam = searchParams.get('search');

    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
    }

    // Support two-level params (from ProductDetail "Lihat Semua")
    if (mainCategoryParam) {
      const mainCat = mainCategoryParam.charAt(0).toUpperCase() + mainCategoryParam.slice(1).toLowerCase();
      if (['Pria', 'Wanita', 'Unisex'].includes(mainCat)) {
        setSelectedMainCategory(mainCat);
        if (subCategoryParam) {
          setSelectedSubCategory(decodeURIComponent(subCategoryParam));
        }
      }
    } else if (categoryParam) {
      // Legacy support
      const mainCat = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1).toLowerCase();
      if (['Pria', 'Wanita', 'Unisex'].includes(mainCat)) {
        setSelectedMainCategory(mainCat);
      }
    }
  }, [searchParams, products]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      
      if (response.status === 'success') {
        const productsData = response.data || [];
        
        // Set products
        setProducts(productsData);
        
        // Extract unique main categories (Pria, Wanita, Unisex)
        const mainCatsSet = new Set();
        productsData.forEach(product => {
          const category = (product.category || '').trim();
          if (category) {
            const mainCat = category.split('-')[0].trim();
            if (['Pria', 'Wanita', 'Unisex'].includes(mainCat)) {
              mainCatsSet.add(mainCat);
            }
          }
        });
        
        const mainCatsArray = Array.from(mainCatsSet).sort((a, b) => {
          const order = ['Pria', 'Wanita', 'Unisex'];
          return order.indexOf(a) - order.indexOf(b);
        });
        
        setMainCategories(mainCatsArray);
        setFilteredProducts(productsData);
      } else {
        showError('Gagal memuat produk');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      showError('Terjadi kesalahan saat memuat produk');
    } finally {
      setLoading(false);
    }
  };

  // Update subcategories list only — never reset selectedSubCategory here
  // Reset only happens via user manual clicks (onClick handlers)
  useEffect(() => {
    if (selectedMainCategory) {
      const subs = getSubCategoriesForMain(selectedMainCategory);
      setSubCategories(subs);
    } else {
      setSubCategories([]);
      setSelectedSubCategory(null); // hanya reset saat kembali ke semua kategori
    }
  }, [selectedMainCategory, products]);

  useEffect(() => {
    if (!products || products.length === 0) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    // Filter by main category
    if (selectedMainCategory) {
      filtered = filtered.filter(p => {
        const productCategory = (p.category || '').trim();
        return productCategory.startsWith(selectedMainCategory);
      });

      // Filter by subcategory if selected
      if (selectedSubCategory) {
        filtered = filtered.filter(p => {
          const productCategory = (p.category || '').trim();
          return productCategory.includes(selectedSubCategory);
        });
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => parseInt(a.price) - parseInt(b.price));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => parseInt(b.price) - parseInt(a.price));
    } else if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.sales || 0) - (a.sales || 0));
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedMainCategory, selectedSubCategory, sortBy]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    showSuccess(`${product.name} ditambahkan ke keranjang`);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="py-10 md:py-12 shadow-inner relative overflow-hidden" style={{ backgroundColor: '#111827', color: 'white' }}>
        {/* Simple decorative gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(0,0,0,0.2), transparent)' }}></div>
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-4 text-gray-300 hover:text-white transition-colors text-sm"
          >
            <FiArrowLeft size={16} />
            <span className="font-bold uppercase tracking-widest" style={{ color: 'white' }}>Beranda</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Koleksi Produk</h1>
          <p className="text-base max-w-lg" style={{ color: '#e5e7eb' }}>Temukan outfit street-wear terbaik untuk mengekspresikan jati diri kamu.</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar - Filters */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm sticky top-24 space-y-5">
              {/* Search */}
              <div>
                <label className="block text-[11px] font-black mb-2 uppercase tracking-[0.2em]" style={{ color: '#374151' }}>
                  Cari Produk
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input
                    type="text"
                    placeholder="Nama produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-100 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-[11px] font-black mb-2 uppercase tracking-[0.2em]" style={{ color: '#374151' }}>
                  Kategori
                </label>
                
                {!selectedMainCategory ? (
                  // Show main categories
                  <div className="space-y-2">
                    {mainCategories.map((mainCat) => (
                      <button
                        key={mainCat}
                        onClick={() => {
                          setSelectedMainCategory(mainCat);
                          setSelectedSubCategory(null); // reset sub saat pilih main manual
                        }}
                        className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all bg-gray-50 text-gray-700 hover:bg-black hover:text-white shadow-sm"
                      >
                        {mainCat}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Show subcategories for selected main category
                  <div className="space-y-2">
                    <button
                      onClick={() => { setSelectedMainCategory(null); setSelectedSubCategory(null); }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-black text-white hover:bg-gray-800 flex items-center gap-2 shadow-md"
                    >
                      <span>← Kembali</span>
                    </button>
                    
                    <div className="py-2 px-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900">{selectedMainCategory}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {subCategories.length > 0 ? (
                        subCategories.map((subCat) => (
                          <button
                            key={subCat}
                            onClick={() => setSelectedSubCategory(selectedSubCategory === subCat ? null : subCat)}
                            className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              selectedSubCategory === subCat
                                ? 'bg-black text-white'
                                : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                            }`}
                          >
                            {subCat}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600 py-2">Tidak ada sub-kategori</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div className="relative">
                <label className="block text-[11px] font-black mb-2 uppercase tracking-[0.2em]" style={{ color: '#374151' }}>
                  Urutkan
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold transition-all hover:bg-gray-100 shadow-sm"
                  >
                    <span>
                      {sortBy === 'newest' && 'Terbaru'}
                      {sortBy === 'popular' && 'Paling Laris'}
                      {sortBy === 'price-low' && 'Harga: Terendah'}
                      {sortBy === 'price-high' && 'Harga: Tertinggi'}
                    </span>
                    <FiChevronDown className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-1">
                      {[
                        { id: 'newest', label: 'Terbaru' },
                        { id: 'popular', label: 'Paling Laris' },
                        { id: 'price-low', label: 'Harga: Terendah' },
                        { id: 'price-high', label: 'Harga: Tertinggi' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSortBy(option.id);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-all hover:bg-gray-50 ${
                            sortBy === option.id ? 'bg-black text-white hover:bg-black/90' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Backdrop to close sort */}
                {isSortOpen && <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)}></div>}
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedMainCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedMainCategory(null);
                    setSelectedSubCategory(null);
                  }}
                  className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
                >
                  ✕ Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-5xl mb-4">😕</div>
                <p className="text-2xl font-bold text-gray-900 mb-2">Tidak ada produk ditemukan</p>
                <p className="text-gray-600 mb-6">Coba ubah filter atau cari kata kunci lain</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedMainCategory(null);
                    setSelectedSubCategory(null);
                  }}
                  className="px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-900 transition-all"
                >
                  Lihat Semua Produk
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-700 font-medium">
                    Menampilkan <span className="font-black text-black">{filteredProducts.length}</span> produk
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
