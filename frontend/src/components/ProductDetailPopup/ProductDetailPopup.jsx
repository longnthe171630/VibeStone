import React, { useContext } from 'react';
import './ProductDetailPopup.css';
import { StoreContext } from '../../Context/StoreContext';

const ProductDetailPopup = ({ product, onClose, onAddToCart }) => {
  const { url } = useContext(StoreContext);
  // Hàm định dạng tiền tệ với dấu phân cách hàng nghìn
  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Nếu không có sản phẩm, không hiển thị gì
  if (!product) return null;

  const CURRENCY = ' VNĐ';

  return (
    <div className="product-detail-overlay">
      <div className="product-detail-popup">
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="product-detail-content">
          <div className="product-detail-images">
            <div className="main-image">
              <img src={product.image ? `${url}/images/${product.image}` : ''} alt={product.name} />
            </div>
          </div>
          
          <div className="product-detail-info">
            <h2>{product.name}</h2>
            
            <div className="product-price">
              <span className="current-price">{formatCurrency(product.price)}{CURRENCY}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="original-price">{formatCurrency(product.originalPrice)}{CURRENCY}</span>
              )}
            </div>
            
            {/* Removed rating section as it's not in the database model */}
            
            <div className="product-description">
              <p>{product.description}</p>
            </div>
            
            <div className="product-specifications">
              <h3>Thông tin sản phẩm</h3>
              <ul>
                <li><strong>Danh mục:</strong> {product.category}</li>
              </ul>
            </div>
            
            <div className="product-actions">
              <button 
                className="add-to-cart-btn" 
                onClick={() => onAddToCart(product._id)}
                disabled={product.stock <= 0}
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPopup;
