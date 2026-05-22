import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Product } from '../types';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

interface ProductLocation {
  id: string;
  product_id: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
}

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Locations state
  const [showLocations, setShowLocations] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [locations, setLocations] = useState<ProductLocation[]>([]);
  const [newLocation, setNewLocation] = useState({ latitude: '', longitude: '' });
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (e) {
      console.error('Failed to fetch products:', e);
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', category: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || '',
    });
    setImagePreview(product.image_url);
    setImageFile(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    // stock is no longer sent, backend defaults to 0 and calculates dynamically
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/products/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post(`${API_URL}/products`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowForm(false);
      fetchProducts();
    } catch (e) {
      console.error('Save error:', e);
      alert('Ошибка при сохранении');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить товар?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      fetchProducts();
    } catch (e) {
      console.error('Delete error:', e);
    }
  }

  // Location Management
  async function openLocations(product: Product) {
    setSelectedProduct(product);
    setShowLocations(true);
    setLoadingLocations(true);
    try {
      const res = await axios.get(`${API_URL}/products/${product.id}/locations`);
      setLocations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLocations(false);
    }
  }

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await axios.post(`${API_URL}/products/${selectedProduct.id}/locations`, {
        latitude: parseFloat(newLocation.latitude),
        longitude: parseFloat(newLocation.longitude)
      });
      setNewLocation({ latitude: '', longitude: '' });
      openLocations(selectedProduct);
      fetchProducts(); // update stock count in background
    } catch (e) {
      console.error(e);
      alert('Ошибка добавления локации');
    }
  }

  async function handleDeleteLocation(locId: string) {
    if (!confirm('Удалить клад?')) return;
    try {
      await axios.delete(`${API_URL}/products/locations/${locId}`);
      if (selectedProduct) openLocations(selectedProduct);
      fetchProducts(); // update stock count in background
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <h1 className="admin-title neon-text">Товары</h1>
        <button className="admin-add-btn glass-panel" onClick={openAddForm}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      {loading ? (
        <div className="admin-loading">
          <div className="admin-skeleton" />
          <div className="admin-skeleton" />
          <div className="admin-skeleton" />
        </div>
      ) : products.length === 0 ? (
        <div className="admin-empty">
          <p>Нет товаров</p>
          <button onClick={openAddForm} className="glass-panel neon-text">Добавить первый</button>
        </div>
      ) : (
        <div className="admin-list">
          {products.map((product) => (
            <div key={product.id} className="admin-product-card glass-panel">
              <div className="admin-product-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <div className="admin-product-image-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="admin-product-info">
                <h3>{product.name}</h3>
                <p>${product.price.toFixed(2)} · Кладов: {product.stock}</p>
              </div>
              <div className="admin-product-actions">
                <button onClick={() => openLocations(product)} className="admin-location-btn" title="Кладовая">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </button>
                <button onClick={() => openEditForm(product)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(product.id)} className="admin-delete-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showLocations && selectedProduct && (
        <div className="admin-form-overlay" onClick={() => setShowLocations(false)}>
          <div className="admin-form glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-form-header">
              <h2>Кладовой: {selectedProduct.name}</h2>
              <button onClick={() => setShowLocations(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="locations-list">
              {loadingLocations ? <p>Загрузка...</p> : locations.length === 0 ? <p>Нет локаций</p> : locations.map(loc => (
                <div key={loc.id} className="location-item">
                  <div className="location-info">
                    <span>{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                    <span className={`loc-status ${loc.status}`}>{loc.status}</span>
                  </div>
                  {loc.status === 'available' && (
                    <button onClick={() => handleDeleteLocation(loc.id)} className="admin-delete-btn">Удалить</button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddLocation} className="add-location-form">
              <h4>Добавить клад</h4>
              <div className="form-row">
                <input 
                  type="number" 
                  step="any" 
                  placeholder="Широта (Lat)" 
                  value={newLocation.latitude} 
                  onChange={e => setNewLocation({...newLocation, latitude: e.target.value})} 
                  required 
                />
                <input 
                  type="number" 
                  step="any" 
                  placeholder="Долгота (Lng)" 
                  value={newLocation.longitude} 
                  onChange={e => setNewLocation({...newLocation, longitude: e.target.value})} 
                  required 
                />
              </div>
              <button type="submit" className="form-submit-btn neon-text">Добавить локацию</button>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="admin-form-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-form glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="admin-form-header">
              <h2>{editingProduct ? 'Редактировать' : 'Новый товар'}</h2>
              <button onClick={() => setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-image-upload glass-panel" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" />
                ) : (
                  <div className="form-image-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span>Загрузить фото</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>

              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Название товара"
                  required
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Описание товара"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Цена ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Категория</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Категория"
                />
              </div>

              <button type="submit" className="form-submit-btn neon-text glass-panel">
                {editingProduct ? 'Сохранить' : 'Добавить'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
