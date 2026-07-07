import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiPackage, FiGrid, FiList, FiCheckCircle, FiAlertCircle, FiX, FiChevronDown } from 'react-icons/fi';
import AdminLayout from '../../layouts/AdminLayout';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../api/productService';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';

const ProductManagement = () => {
  const { showSuccess, showError, showConfirm } = useNotification();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    mainCategory: '',
    subCategory: '',
    price: '',
    description: '',
    stock: '',
    image_url: '',
    selectedSizes: [],
    colors: '',
  });
  const [variants, setVariants] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubCategoryOpen, setIsSubCategoryOpen] = useState(false);

  // Size options per category
  const sizeOptions = {
    'Pria': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'Wanita': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'],
    'Unisex': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'],
  };

  // Category mapping
  const categoryMapping = {
    '': { label: 'Pilih Kategori', subs: [] },
    'Pria': { label: 'Pria', subs: ['Kaos', 'Kemeja', 'Hoodie', 'Jaket', 'Outerwear', 'Celana Panjang', 'Celana Pendek', 'Sepatu', 'Sandal'] },
    'Wanita': { label: 'Wanita', subs: ['Kaos', 'Kemeja', 'Dress', 'Hoodie', 'Jaket', 'Outerwear', 'Celana Panjang', 'Celana Pendek', 'Rok', 'Sepatu', 'Sandal'] },
    'Unisex': { label: 'Unisex', subs: ['Kaos', 'Kemeja', 'Hoodie', 'Jaket', 'Outerwear', 'Celana Panjang', 'Celana Pendek', 'Sepatu', 'Sandal'] },
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      if (response.status === 'success') {
        setProducts(response.data || []);
      }
    } catch (error) {
      showError('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (product) => {
    setEditingProduct(product);
    const existingCategory = product.category ?? '';
    const parts = existingCategory.split(' - ');
    let mainCat = '';
    let subCat = '';
    if (parts.length >= 2) {
      mainCat = parts[0];
      subCat = parts[1];
    } else {
      mainCat = existingCategory;
      subCat = '';
    }
    const sizesArr = product.sizes ? product.sizes.split(',').map(s => s.trim()) : [];
    setFormData({
      name: product.name ?? '',
      mainCategory: mainCat,
      subCategory: subCat,
      price: product.price ?? '',
      description: product.description ?? '',
      stock: product.stock ?? '',
      image_url: product.image_url ?? '',
      selectedSizes: sizesArr,
      colors: product.colors ?? '',
    });
    setImagePreview(product.image_url ?? '');
    setImageFile(null);
    setShowModal(true);

    try {
      const { getProductDetail } = await import('../../api/productService');
      const res = await getProductDetail(product.id);
      if (res.status === 'success') {
        const detail = Array.isArray(res.data) ? res.data[0] : res.data;
        setVariants(detail.variants || []);
      } else {
        setVariants([]);
      }
    } catch {
      setVariants(product.variants || []);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    await uploadImage(file);
  };

  const uploadImage = async (file) => {
    try {
      setUploadProgress(0);
      const fd = new FormData();
      fd.append('image', file);
      const uploadRes = await axios.post('https://outfitkita.my.id/api/index.php?action=upload_image', fd, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      if (uploadRes.data.status === 'success') {
        setFormData(prev => ({ ...prev, image_url: uploadRes.data.image_url }));
        showSuccess('Gambar berhasil diunggah');
      } else {
        showError(uploadRes.data.message || 'Gagal mengunggah gambar');
      }
    } catch (err) {
      showError('Gagal mengunggah gambar');
    } finally {
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.mainCategory || !formData.subCategory || !formData.price) {
      showError('Data wajib harus diisi');
      return;
    }
    try {
      const combinedCategory = `${formData.mainCategory} - ${formData.subCategory}`;
      const totalVariantStock = variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
      const productData = {
        name: formData.name,
        category: combinedCategory,
        price: formData.price,
        description: formData.description,
        stock: variants.length > 0 ? totalVariantStock : formData.stock,
        image_url: formData.image_url,
        sizes: formData.selectedSizes.join(','),
        colors: formData.colors,
        variants: variants,
      };
      let response = editingProduct ? await updateProduct({ id: editingProduct.id, ...productData }) : await addProduct(productData);
      if (response.status === 'success') {
        showSuccess(editingProduct ? 'Produk diperbarui' : 'Produk ditambahkan');
        setShowModal(false);
        resetForm();
        fetchProducts();
      } else {
        showError(response.message || 'Gagal menyimpan');
      }
    } catch (error) {
      showError('Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', mainCategory: '', subCategory: '', price: '', description: '', stock: '', image_url: '', selectedSizes: [], colors: '', });
    setVariants([]); setImageFile(null); setImagePreview(''); setUploadProgress(0);
  };

  const generateVariants = () => {
    const colors = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
    let sizes = [...formData.selectedSizes];
    if (!sizes.length) { showError('Pilih ukuran dahulu'); return; }
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'All Size'];
    sizes.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    const newVariants = [];
    if (colors.length > 0) {
      sizes.forEach(size => {
        colors.forEach(color => {
          const existing = variants.find(v => v.size === size && v.color === color);
          newVariants.push({ size, color, stock: existing ? existing.stock : 0 });
        });
      });
    } else {
      sizes.forEach(size => {
        const existing = variants.find(v => v.size === size && (!v.color || v.color === '-'));
        newVariants.push({ size, color: '-', stock: existing ? existing.stock : 0 });
      });
    }
    setVariants(newVariants);
    showSuccess(`${newVariants.length} varian dibuat`);
  };

  const updateVariantStock = (index, stock) => {
    const updated = [...variants];
    updated[index].stock = parseInt(stock) || 0;
    setVariants(updated);
  };

  const handleDelete = async (productId) => {
    const { isConfirmed } = await showConfirm('Hapus Produk', 'Hapus produk ini?', 'Ya, Hapus', 'Batal');
    if (isConfirmed) {
      try {
        const response = await deleteProduct(productId);
        if (response.status === 'success') {
          showSuccess('Produk dihapus');
          fetchProducts();
          setSelectedProducts(prev => {
            const updated = new Set(prev);
            updated.delete(productId);
            return updated;
          });
        }
      } catch (error) {
        showError('Gagal menghapus');
      }
    }
  };

  const handleBulkDelete = async () => {
    const { isConfirmed } = await showConfirm('Hapus Produk', `Hapus ${selectedProducts.size} produk terpilih?`, 'Ya, Hapus', 'Batal');
    if (isConfirmed) {
      try {
        let successCount = 0;
        for (const productId of selectedProducts) {
          const response = await deleteProduct(productId);
          if (response.status === 'success') successCount++;
        }
        if (successCount > 0) {
          showSuccess(`${successCount} produk dihapus`);
          setSelectedProducts(new Set());
          fetchProducts();
        }
      } catch (error) {
        showError('Gagal menghapus produk');
      }
    }
  };

  const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseInt(number) || 0);

  return (
    <AdminLayout currentPage="products">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400 text-slate-900 rounded-xl shadow-lg shadow-yellow-400/20">
              <FiPackage size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Produk</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{products.length} Total Item</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none w-64 transition-all"
              />
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
            >
              <FiPlus size={16} /> Tambah
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.size > 0 && (
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedProducts.size} Produk Dipilih</span>
            <div className="flex gap-2">
              <button onClick={handleBulkDelete} className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors">Hapus</button>
              <button onClick={() => setSelectedProducts(new Set())} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black uppercase rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">Batal</button>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length}
                      onChange={(e) => setSelectedProducts(e.target.checked ? new Set(filteredProducts.map(p => p.id)) : new Set())}
                      className="rounded border-slate-300 text-yellow-400 focus:ring-yellow-400"
                    />
                  </th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produk</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stok</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Memuat data...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-400">Tidak ada produk ditemukan</td></tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors group ${selectedProducts.has(product.id) ? 'bg-yellow-50/50' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => {
                            const updated = new Set(selectedProducts);
                            if (updated.has(product.id)) updated.delete(product.id);
                            else updated.add(product.id);
                            setSelectedProducts(updated);
                          }}
                          className="rounded border-slate-300 text-yellow-400 focus:ring-yellow-400"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl border border-slate-100 overflow-hidden flex-shrink-0 bg-slate-50">
                            <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{product.name}</p>
                            <div className="flex gap-1 mt-1">
                              {product.is_new && <span className="text-[8px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded uppercase">New</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{product.category}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-black text-slate-800">{formatRupiah(product.price)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex text-[10px] font-black px-2 py-0.5 rounded-full ${product.stock > 20 ? 'text-green-600 bg-green-50' :
                            product.stock > 5 ? 'text-orange-600 bg-orange-50' :
                              'text-rose-600 bg-rose-50'
                          }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(product)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FiEdit size={14} /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col border border-white/20">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all text-slate-400">
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Produk</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-bold"
                        placeholder="Nama produk..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Custom Dropdown Kategori */}
                      <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kategori</label>
                        <button
                          type="button"
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all"
                        >
                          <span className={formData.mainCategory ? "text-slate-800" : "text-slate-400"}>
                            {formData.mainCategory || 'Pilih...'}
                          </span>
                          <FiChevronDown className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isCategoryOpen && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden">
                            {['Pria', 'Wanita', 'Unisex'].map(cat => (
                              <div
                                key={cat}
                                onClick={() => {
                                  setFormData({ ...formData, mainCategory: cat, subCategory: '' });
                                  setIsCategoryOpen(false);
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                {cat}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Custom Dropdown Sub Kategori */}
                      <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sub</label>
                        <button
                          type="button"
                          onClick={() => setIsSubCategoryOpen(!isSubCategoryOpen)}
                          disabled={!formData.mainCategory}
                          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all disabled:opacity-50"
                        >
                          <span className={formData.subCategory ? "text-slate-800" : "text-slate-400"}>
                            {formData.subCategory || 'Pilih...'}
                          </span>
                          <FiChevronDown className={`transition-transform duration-200 ${isSubCategoryOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isSubCategoryOpen && formData.mainCategory && (
                          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/50 overflow-hidden">
                            {categoryMapping[formData.mainCategory]?.subs.map(sub => (
                              <div
                                key={sub}
                                onClick={() => {
                                  setFormData({ ...formData, subCategory: sub });
                                  setIsSubCategoryOpen(false);
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                {sub}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Harga</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Stok Global</label>
                        <input
                          type="number"
                          value={variants.length > 0 ? variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0) : formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          disabled={variants.length > 0}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-bold disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Gambar Produk</label>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 cursor-pointer hover:bg-slate-50 transition-all group">
                            <FiPlus className="text-slate-300 group-hover:text-yellow-400 mb-1" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Pilih File</span>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          </label>
                          {(imagePreview || formData.image_url) && (
                            <div className="w-24 h-24 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                              <img src={imagePreview || formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-medium italic"
                          placeholder="Atau masukkan URL gambar..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Variants & Stock */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pilihan Ukuran</label>
                      <div className="flex flex-wrap gap-1.5">
                        {(sizeOptions[formData.mainCategory] || []).map(size => (
                          <button
                            key={size}
                            onClick={() => {
                              const newSizes = formData.selectedSizes.includes(size)
                                ? formData.selectedSizes.filter(s => s !== size)
                                : [...formData.selectedSizes, size];
                              setFormData({ ...formData, selectedSizes: newSizes });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${formData.selectedSizes.includes(size)
                                ? 'bg-[#0f172a] text-white border-[#0f172a]'
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                              }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pilihan Warna</label>
                      <input
                        type="text"
                        value={formData.colors}
                        onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-bold"
                        placeholder="Hitam, Putih, Navy..."
                      />
                    </div>

                    {formData.selectedSizes.length > 0 && (
                      <button
                        onClick={generateVariants}
                        className="w-full py-2 bg-yellow-400 text-[#0f172a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/10 flex items-center justify-center gap-2"
                      >
                        <FiGrid size={12} /> Generate Varian
                      </button>
                    )}

                    {variants.length > 0 && (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50/50">
                        <div className="max-h-48 overflow-auto scrollbar-hide">
                          <table className="w-full text-[10px] text-left">
                            <thead className="bg-slate-100 sticky top-0 z-10">
                              <tr>
                                <th className="px-3 py-2 font-black text-slate-500 uppercase tracking-widest">Varian</th>
                                <th className="px-3 py-2 font-black text-slate-500 uppercase tracking-widest w-20">Stok</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {variants.map((v, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-1.5">
                                    <span className="font-bold text-slate-700">{v.size}</span>
                                    {v.color !== '-' && <span className="ml-1 text-slate-400">/ {v.color}</span>}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      value={v.stock}
                                      onChange={(e) => updateVariantStock(i, e.target.value)}
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-yellow-400 outline-none font-black text-center"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi Produk</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all font-medium leading-relaxed"
                    rows="4"
                    placeholder="Tulis deskripsi produk..."
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Batal</button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#0f172a] text-yellow-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2"
                >
                  <FiCheckCircle size={14} /> Simpan Produk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ProductManagement;
