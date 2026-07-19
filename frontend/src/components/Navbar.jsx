import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingBag, FiUser, FiMenu, FiX, FiLogOut, FiHeart } from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { isLoggedIn, getCurrentUser, logoutUser } from '../api/authService';
import { getProducts } from '../api/productService';
import Fuse from 'fuse.js';

const Navbar = () => {
  const navigate = useNavigate();
  const { showAlertSuccess } = useNotification();
  const { getTotalItems } = useCart();
  const { getWishlistCount } = useWishlist();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [fuse, setFuse] = useState(null);
  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartCount = getTotalItems();
  const wishlistCount = getWishlistCount();
  const user = getCurrentUser();
  const logged = isLoggedIn();

  // Load products for search on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await getProducts();
        if (response.status === 'success') {
          const products = response.data || [];
          setAllProducts(products);

          // Initialize Fuse with fuzzy search options
          const fuseInstance = new Fuse(products, {
            keys: [
              { name: 'name', weight: 0.4 },
              { name: 'category', weight: 0.3 },
              { name: 'description', weight: 0.2 },
              { name: 'price', weight: 0.1 }
            ],
            threshold: 0.3, // Allow for typos (0.3 = 30% mismatch tolerance)
            useExtendedSearch: false,
            ignoreLocation: true,
            includeScore: true
          });
          setFuse(fuseInstance);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    if (fuse) {
      const results = fuse.search(query);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results
    }
  };

  // Handle product click
  const handleProductClick = (product) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    navigate(`/product/${product.id}`);
  };

  // Close search box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logoutUser();
    setIsUserMenuOpen(false);
    showAlertSuccess('Sampai Jumpa! 👋', 'Anda telah keluar dari akun.', 2000);
    setTimeout(() => {
      navigate('/');
      window.location.reload();
    }, 2500);
  };

  return (
    <nav className="fixed w-full z-50 border-b border-gray-100 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition-opacity" style={{ color: 'black' }}>
          OUTFIT<span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>KITA</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 font-medium" style={{ color: '#1f2937' }}>
          <Link to="/" className="hover:text-yellow-600 transition">Beranda</Link>
          <Link to="/shop" className="hover:text-yellow-600 transition">Produk</Link>
          <Link to="/about" className="hover:text-yellow-600 transition">Tentang</Link>
        </div>

        {/* Search Bar - Desktop */}
        <div
          ref={searchBoxRef}
          className="hidden lg:block relative"
        >
          <div className="flex items-center bg-gray-100 rounded-xl px-4 py-1.5 w-72 hover:bg-gray-200 transition-all duration-300 focus-within:ring-2 focus-within:ring-black focus-within:bg-white shadow-inner">
            <FiSearch size={18} className="text-gray-700" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari produk, kategori..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchOpen(true)}
              className="ml-3 bg-transparent w-full outline-none text-sm placeholder-gray-600"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && (
            <div className="absolute top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {searchQuery === '' ? (
                <div className="p-4 text-center text-gray-600">
                  <p className="text-sm">Mulai ketik untuk mencari...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-600">
                  <p className="text-sm">Tidak ada produk ditemukan</p>
                  <p className="text-xs mt-2">Coba kata kunci lain atau periksa ejaan</p>
                </div>
              ) : (
                <div>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleProductClick(result.item)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition text-left"
                    >
                      {result.item.image_url && (
                        <img
                          src={result.item.image_url}
                          alt={result.item.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">
                          {result.item.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {result.item.category || 'Kategori'}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          Rp {result.item.price?.toLocaleString('id-ID')}
                        </p>
                      </div>
                      {result.score && (
                        <div className="text-xs text-gray-400">
                          Match: {(100 - result.score * 100).toFixed(0)}%
                        </div>
                      )}
                    </button>
                  ))}

                  {searchQuery && (
                    <button
                      onClick={() => {
                        navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
                        setSearchQuery('');
                        setSearchResults([]);
                        setSearchOpen(false);
                      }}
                      className="w-full p-3 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition font-medium text-sm"
                    >
                      Lihat Semua Hasil untuk "{searchQuery}"
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center space-x-5">
          {logged && (
            <Link to="/favorites" className="relative hover:text-red-500 transition">
              <FiHeart size={22} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}
          <Link to="/cart" className="relative hover:text-yellow-600">
            <FiShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account */}
          {logged ? (
            <div className="hidden md:block relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 hover:opacity-80 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-300">
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <FiUser size={18} className="text-gray-600" />
                  )}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.username || user?.name}</p>
                    <p className="text-sm text-gray-700">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Profil Saya
                  </Link>
                  <Link
                    to="/profile/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Pesanan Saya
                  </Link>
                  <Link
                    to="/favorites"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FiHeart size={16} className="text-red-500" />
                    <span>Favorit Saya</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                  >
                    <FiLogOut size={18} />
                    <span>Keluar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/login" className="px-4 py-1.5 text-sm font-semibold text-gray-700 hover:text-black transition">
                Masuk
              </Link>
              <Link to="/register" className="px-5 py-1.5 text-sm bg-black text-white font-bold rounded-full hover:bg-gray-800 transition shadow-md hover:shadow-lg">
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-6 space-y-4 shadow-xl">
          {/* Mobile Search Bar */}
          <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-full hover:bg-gray-200 transition focus-within:ring-2 focus-within:ring-yellow-500 focus-within:bg-white mb-4">
            <FiSearch size={18} className="text-gray-600" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="ml-3 bg-transparent w-full outline-none text-sm placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Mobile Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => {
                    handleProductClick(result.item);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition text-left"
                >
                  {result.item.image_url && (
                    <img
                      src={result.item.image_url}
                      alt={result.item.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {result.item.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Rp {result.item.price?.toLocaleString('id-ID')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <hr className="my-2" />

          {logged ? (
            <>
              <div className="pb-3 mb-2 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-300">
                    {user?.profile_image ? (
                      <img
                        src={user.profile_image}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser size={18} className="text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.username || user?.name}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>
              <Link to="/profile" className="block text-lg font-semibold" onClick={() => setIsOpen(false)}>Profil Saya</Link>
              <Link to="/profile/orders" className="block text-lg font-semibold" onClick={() => setIsOpen(false)}>Pesanan Saya</Link>
              <Link to="/favorites" className="text-lg font-semibold flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <FiHeart className="text-red-500" />
                Favorit Saya
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full text-left text-lg font-semibold text-red-600 pb-2 border-b border-gray-200 mb-2"
              >
                Keluar
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 pb-3 border-b border-gray-200 mb-2">
              <Link to="/login" className="block text-lg font-semibold text-center py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition" onClick={() => setIsOpen(false)}>Masuk</Link>
              <Link to="/register" className="block text-lg font-semibold text-center py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition" onClick={() => setIsOpen(false)}>Daftar</Link>
            </div>
          )}

          <Link to="/" className="block text-lg font-semibold" onClick={() => setIsOpen(false)}>Beranda</Link>
          <Link to="/shop" className="block text-lg font-semibold" onClick={() => setIsOpen(false)}>Produk</Link>
          <Link to="/about" className="block text-lg font-semibold" onClick={() => setIsOpen(false)}>Tentang</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;