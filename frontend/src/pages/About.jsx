import React from 'react';
import MainLayout from '../layouts/MainLayout';
import { FiUsers, FiAward, FiShoppingBag, FiHeart, FiTrendingUp } from 'react-icons/fi';

const About = () => {
  return (
    <MainLayout>
      <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header & Vision Mision - Compact Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Hero / Intro */}
            <div className="lg:col-span-1 bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <h1 className="text-3xl font-extrabold tracking-tight mb-4">Tentang OutFitKita</h1>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  Menghadirkan pengalaman berbelanja fashion terbaik dengan koleksi tren terkini. Tampil gaya dan percaya diri setiap hari dengan kurasi produk pilihan kami.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                  <FiTrendingUp className="text-yellow-400 mr-2" />
                  <span className="text-sm font-medium text-white">Stay Trendy, Stay Confident</span>
                </div>
              </div>
            </div>

            {/* Visi Misi */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visi */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                      <FiHeart size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Visi Kami</h2>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Menjadi platform fashion e-commerce terdepan di Indonesia yang dipercaya pelanggan berkat kualitas, kenyamanan, dan pelayanan yang memuaskan.
                  </p>
                </div>

                {/* Misi */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 text-gray-900 rounded-xl flex items-center justify-center">
                      <FiAward size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Misi Kami</h2>
                  </div>
                  <ul className="text-gray-600 text-sm space-y-2.5">
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold">•</span>
                      Menyediakan produk berkualitas tinggi dengan harga yang bersaing.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold">•</span>
                      Memberikan pelayanan responsif dan ramah untuk kepuasan pelanggan.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2 mt-0.5 font-bold">•</span>
                      Terus berinovasi menghadirkan tren fashion terkini secara berkelanjutan.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Value Section - Compact Grid */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mengapa Memilih Kami?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="group p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-yellow-400 group-hover:text-gray-900 transition-all duration-300">
                  <FiShoppingBag size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Produk Original</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Semua produk dijamin 100% original dan melewati proses quality control yang ketat sebelum dikirim.
                </p>
              </div>

              {/* Card 2 */}
              <div className="group p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <FiUsers size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Pelayanan Ramah</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Tim customer service kami selalu siap membantu Anda dengan ramah dan cepat melalui berbagai channel.
                </p>
              </div>

              {/* Card 3 */}
              <div className="group p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                  <FiAward size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Harga Terbaik</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Kami menawarkan harga yang kompetitif tanpa pernah mengorbankan kualitas produk yang Anda terima.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default About;
