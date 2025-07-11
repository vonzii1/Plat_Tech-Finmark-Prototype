import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const initialForm = {
  productId: '',
  name: '',
  description: '',
  category: '',
  price: '',
  stockQuantity: '',
  minStockLevel: '',
  isActive: true,
  images: [],
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [editStockModal, setEditStockModal] = useState({ open: false, product: null, stock: 0 });
  const [editStockLoading, setEditStockLoading] = useState(false);
  const [editStockError, setEditStockError] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/products');
        setProducts(res.data.data.products || []);
      } catch (err) {
        setError('Failed to load products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Open modal if ?add=1 is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add')) {
      setShowModal(true);
    }
  }, [location.search]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSpecificationChange = (idx, field, value) => {
    setForm(f => {
      const specs = [...f.specifications];
      specs[idx][field] = value;
      return { ...f, specifications: specs };
    });
  };

  const addSpecificationRow = () => {
    setForm(f => ({ ...f, specifications: [...f.specifications, { key: '', value: '' }] }));
  };

  const removeSpecificationRow = (idx) => {
    setForm(f => {
      const specs = [...f.specifications];
      specs.splice(idx, 1);
      return { ...f, specifications: specs };
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const previews = [...imagePreviews];
    const base64Images = [...form.images];
    let filesLoaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        base64Images.push(reader.result);
        previews.push(reader.result);
        filesLoaded++;
        if (filesLoaded === files.length) {
          setForm(f => ({ ...f, images: base64Images }));
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
    setImagePreviews(previews => previews.filter((_, i) => i !== idx));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormFieldErrors({});
    try {
      const res = await axios.post('/api/products', {
        productId: form.productId,
        name: form.name,
        description: form.description,
        category: form.category,
        price: parseFloat(form.price),
        stockQuantity: parseInt(form.stockQuantity, 10),
        minStockLevel: parseInt(form.minStockLevel, 10),
        isActive: form.isActive,
        images: form.images,
      });
      setProducts([res.data.product, ...products]);
      setShowModal(false);
      setForm(initialForm);
      setImagePreviews([]);
      navigate('/products'); // Remove ?add=1 from URL
    } catch (err) {
      // If backend returns field errors, map them to fields
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const fieldErrors = {};
        err.response.data.errors.forEach(errorObj => {
          if (errorObj.field && errorObj.message) {
            fieldErrors[errorObj.field] = errorObj.message;
          }
        });
        setFormFieldErrors(fieldErrors);
        setFormError(null); // Don't show generic error if field errors exist
      } else {
        setFormError(
          err.response?.data?.message || 'Failed to add product'
        );
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/products'); // Remove ?add=1 from URL
  };

  const openEditStockModal = (product) => {
    setEditStockModal({ open: true, product, stock: product.stockQuantity });
    setEditStockError('');
  };

  const closeEditStockModal = () => {
    setEditStockModal({ open: false, product: null, stock: 0 });
    setEditStockError('');
  };

  const handleEditStockChange = (e) => {
    setEditStockModal(m => ({ ...m, stock: e.target.value }));
  };

  const handleEditStockSubmit = async (e) => {
    e.preventDefault();
    setEditStockLoading(true);
    setEditStockError('');
    try {
      const res = await axios.put(`/api/products/${editStockModal.product.productId}/stock`, {
        stockQuantity: parseInt(editStockModal.stock, 10)
      });
      setProducts(products => products.map(p =>
        p.productId === editStockModal.product.productId
          ? { ...p, stockQuantity: res.data.data.product.stockQuantity }
          : p
      ));
      closeEditStockModal();
    } catch (err) {
      setEditStockError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setEditStockLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => setShowModal(true)}
        >
          Add Product
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10">Loading products...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No products found.</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {(authUser?.role === 'admin' || authUser?.role === 'manager') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.filter(product => product && product.productId).map(product => (
                <tr key={product._id || product.productId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-14 h-14 object-cover rounded border shadow-sm" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.productId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{Number(product.price).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stockQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {product.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">Inactive</span>
                    )}
                  </td>
                  {(authUser?.role === 'admin' || authUser?.role === 'manager') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                        onClick={() => openEditStockModal(product)}
                      >
                        Edit Stock
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={handleCloseModal}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Add Product</h2>
            {formError && <div className="text-red-500 mb-2">{formError}</div>}
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                <input
                  type="text"
                  name="productId"
                  value={form.productId}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.productId ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formFieldErrors.productId && <div className="text-red-500 text-sm mt-1">{formFieldErrors.productId}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formFieldErrors.name && <div className="text-red-500 text-sm mt-1">{formFieldErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formFieldErrors.description && <div className="text-red-500 text-sm mt-1">{formFieldErrors.description}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.category ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
                {formFieldErrors.category && <div className="text-red-500 text-sm mt-1">{formFieldErrors.category}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                  min="0"
                  step="0.01"
                  required
                />
                {formFieldErrors.price && <div className="text-red-500 text-sm mt-1">{formFieldErrors.price}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={form.stockQuantity}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.stockQuantity ? 'border-red-500' : 'border-gray-300'}`}
                  min="0"
                  required
                />
                {formFieldErrors.stockQuantity && <div className="text-red-500 text-sm mt-1">{formFieldErrors.stockQuantity}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={form.minStockLevel}
                  onChange={handleFormChange}
                  className={`w-full border rounded-md px-3 py-2 ${formFieldErrors.minStockLevel ? 'border-red-500' : 'border-gray-300'}`}
                  min="0"
                  required
                />
                {formFieldErrors.minStockLevel && <div className="text-red-500 text-sm mt-1">{formFieldErrors.minStockLevel}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('product-image-upload').click()}
                  style={{ minHeight: '100px' }}
                >
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="text-gray-500">Drag & drop images here, or <span className="text-blue-600 underline cursor-pointer">browse</span></span>
                </div>
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative group">
                        <img src={src} alt={`Preview ${idx + 1}`} className="w-20 h-20 object-cover rounded border shadow-sm" />
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleRemoveImage(idx); }}
                          className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-gray-700 hover:bg-red-500 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                          title="Remove image"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={formLoading}
              >
                {formLoading ? 'Adding...' : 'Add Product'}
              </button>
              {/* Show generic error only if no field errors */}
              {formError && Object.keys(formFieldErrors).length === 0 && (
                <div className="text-red-500 mt-2">{formError}</div>
              )}
            </form>
          </div>
        </div>
      )}
      {editStockModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={closeEditStockModal}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Stock for {editStockModal.product.name}</h2>
            {editStockError && <div className="text-red-500 mb-2">{editStockError}</div>}
            <form onSubmit={handleEditStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={editStockModal.stock}
                  onChange={handleEditStockChange}
                  className="w-full border rounded-md px-3 py-2"
                  required
                  disabled={editStockLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                disabled={editStockLoading}
              >
                {editStockLoading ? 'Updating...' : 'Update Stock'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products; 