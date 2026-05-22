import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Product, ProductMedia } from '../types';
import { useCart } from '../hooks/useCart';
import './ProductDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-production-e853.up.railway.app/api';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCart((state) => state.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      axios.get(`${API_URL}/products/${id}`),
      axios.get(`${API_URL}/products/${id}/media`),
    ]).then(([prodRes, mediaRes]) => {
      setProduct(prodRes.data);
      setMedia(mediaRes.data);
    }).catch(() => {
      navigate('/');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading || !product) return null;

  const allMedia = media.length > 0 ? media : (product.image_url ? [{ id: 'main', product_id: product.id, url: product.image_url, type: 'image' as const, sort_order: 0, created_at: '' }] : []);
  const current = allMedia[currentIndex];

  function next() { setCurrentIndex((i) => Math.min(i + 1, allMedia.length - 1)); }
  function prev() { setCurrentIndex((i) => Math.max(i - 1, 0)); }
  function handleAdd() { if (!product) return; addItem(product); setAdded(true); setTimeout(() => setAdded(false), 1500); }

  return (
    <div className="product-detail">
      <header className="detail-header">
        <button className="detail-back" onClick={() => navigate(-1)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
      </header>

      {allMedia.length > 0 && (
        <div className="detail-gallery">
          <div className="gallery-main">
            {current.type === 'video' ? (
              <video src={current.url} controls autoPlay muted playsInline className="gallery-video" />
            ) : (
              <img src={current.url} alt={product.name} className="gallery-image" />
            )}
            {allMedia.length > 1 && (
              <>
                <button className="gallery-nav gallery-prev" onClick={prev} disabled={currentIndex === 0}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button className="gallery-nav gallery-next" onClick={next} disabled={currentIndex === allMedia.length - 1}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
                <div className="gallery-dots">
                  {allMedia.map((_, i) => (
                    <span key={i} className={`gallery-dot ${i === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(i)} />
                  ))}
                </div>
              </>
            )}
          </div>
          {allMedia.length > 1 && (
            <div className="gallery-thumbs">
              {allMedia.map((m, i) => (
                <button key={m.id} className={`thumb ${i === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(i)}>
                  {m.type === 'video' ? (
                    <div className="thumb-video-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="8 5 19 12 8 19" /></svg>
                    </div>
                  ) : (
                    <img src={m.url} alt="" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="detail-info">
        <h1 className="detail-name">{product.name}</h1>
        <p className="detail-price">{product.price.toLocaleString('ru-RU')} ₽</p>
        {product.description && <p className="detail-desc">{product.description}</p>}
        <button className={`detail-add-btn ${added ? 'added' : ''}`} onClick={handleAdd}>
          {added ? 'Добавлено ✓' : 'В корзину'}
        </button>
      </div>
    </div>
  );
}