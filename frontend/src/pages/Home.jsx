import React, { useState, useEffect } from 'react';
import { FiShoppingBag, FiArrowRight, FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useNotification } from '../context/NotificationContext';
import { getProducts } from '../api/productService';
import { useCart } from '../context/CartContext';

// Helper untuk format Rupiah
const formatRupiah = (number) => {
  const numValue = parseInt(number) || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numValue);
};

const Home = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const heroImages = [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=800",
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      
      if (response.status === 'success' && response.data && response.data.length > 0) {
        // Sort by sales descending
        const sortedProducts = [...response.data].sort((a, b) => (b.sales || 0) - (a.sales || 0));
        setFeaturedProducts(sortedProducts.slice(0, 4));
      } else {
        setFeaturedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    showSuccess(`${product.name} ditambahkan ke keranjang`);
  };

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gray-50 via-white to-gray-100 overflow-hidden">
        <div className="container mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12">
          {/* Left Content */}
          <div className="flex flex-col w-full md:w-1/2 justify-center">
            <div className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm mb-6 w-fit">
              <FiZap className="text-yellow-400" size={16} />
              <span className="font-medium">Koleksi Terbatas: Edisi Anak Muda</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight mb-4 text-black">
              Gaya Kamu,<br className="hidden md:block" /> Aturan Kamu.
            </h1>
            
            <p className="text-base md:text-lg mb-6 leading-relaxed max-w-lg" style={{ color: '#374151' }}>
              Temukan outfit street-wear terbaik untuk mengekspresikan jati diri kamu yang sebenarnya di OutfitKita.
            </p>
            
            <div className="flex gap-3 flex-wrap">
              <button 
                onClick={() => navigate('/products')}
                className="flex items-center gap-2 bg-black text-white font-bold py-2.5 px-6 rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl text-sm"
              >
                Belanja Sekarang <FiArrowRight size={16} />
              </button>
              <button 
                onClick={() => navigate('/products')}
                className="flex items-center gap-2 border-2 border-black text-black font-bold py-2.5 px-6 rounded-full hover:bg-black hover:text-white transition-all text-sm"
              >
                Lihat Katalog
              </button>
            </div>
          </div>

          {/* Right Image Slideshow */}
          <div className="w-full md:w-1/2 relative">
            <div className="absolute -top-10 -right-10 w-80 h-80 bg-yellow-200 rounded-full blur-3xl opacity-30 z-0"></div>
            
            <div className="relative z-10 w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-square max-h-[500px] rounded-[2rem] shadow-2xl overflow-hidden bg-gray-100 border-8 border-white">
              {heroImages.map((img, index) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`Hero Outfit ${index + 1}`} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === currentImageIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                  }`}
                  style={{ transformOrigin: 'center' }}
                />
              ))}
              
              {/* Slideshow Indicators */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 w-2.5 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED PRODUCTS - "PALING LARIS MINGGU INI" */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Paling Laris Minggu Ini</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#4b5563' }}>Jangan sampai kehabisan! Ini adalah koleksi yang paling banyak dicari Gen-Z</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
              
              <div className="text-center mt-16">
                <button 
                  onClick={() => navigate('/products')}
                  className="inline-flex items-center gap-2 border-2 border-black text-black font-bold py-3 px-10 rounded-full hover:bg-black hover:text-white transition-all"
                >
                  Lihat Koleksi Lengkap <FiArrowRight size={18} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Footer Spacing */}
      <div className="h-8"></div>
    </div>
  );
};

export default Home;