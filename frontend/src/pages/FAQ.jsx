import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiMail, FiMessageCircle, FiPhone } from 'react-icons/fi';
import MainLayout from '../layouts/MainLayout';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "Bagaimana cara melacak pesanan saya?",
      answer: "Anda dapat melacak pesanan melalui menu 'Pesanan Saya' di profil Anda. Pilih pesanan yang ingin dilacak untuk melihat detail pengiriman dan nomor resi."
    },
    {
      question: "Berapa lama waktu pengiriman barang?",
      answer: "Waktu pengiriman bergantung pada lokasi tujuan. Untuk area Jabodetabek biasanya memakan waktu 1-3 hari kerja. Tidak melayani di Luar Jabodetabek"
    },
    {
      question: "Apakah barang yang sudah dibeli bisa dikembalikan?",
      answer: "Ya, kami menerima pengembalian barang dalam waktu 7 hari setelah barang diterima, dengan syarat tag/label masih utuh dan barang belum dicuci atau dipakai."
    },
    {
      question: "Metode pembayaran apa saja yang tersedia?",
      answer: "Kami menerima pembayaran melalui transfer bank (BRI), e-wallet (GoPay)."
    },
    {
      question: "Bagaimana cara membatalkan pesanan?",
      answer: "Pesanan hanya dapat dibatalkan jika statusnya masih 'Menunggu Pembayaran'. Buka 'Pesanan Saya' lalu klik tombol 'Batalkan Pesanan'."
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Pusat Bantuan & Hubungi Kami</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan umum di bawah ini, atau hubungi tim dukungan pelanggan kami jika Anda membutuhkan bantuan lebih lanjut.
            </p>
          </div>

          {/* Contact Card */}
          <div className="max-w-2xl mx-auto w-full">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-10 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-100">
                <FiMessageCircle size={36} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Hubungi melalui Chatbox</h3>
              <p className="text-gray-500 mb-8 text-lg">
                Punya pertanyaan? Tim dukungan kami siap membantu Anda secara real-time melalui fitur chatbox kami.
              </p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
                className="w-full sm:w-auto px-10 bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-200"
              >
                Mulai Chat Sekarang
              </button>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Pertanyaan yang Sering Diajukan (FAQ)</h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                      openIndex === index ? 'border-gray-900 shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <button
                      className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                      onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                    >
                      <span className={`font-semibold text-lg ${openIndex === index ? 'text-gray-900' : 'text-gray-700'}`}>
                        {faq.question}
                      </span>
                      <span className={`ml-6 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${openIndex === index ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {openIndex === index ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                      </span>
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="p-5 pt-0 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default FAQ;
