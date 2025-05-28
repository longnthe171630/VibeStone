import React, { useContext, useState, useEffect } from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext';
import ProductDetailPopup from '../ProductDetailPopup/ProductDetailPopup';

const FoodItem = ({ image, name, price, desc, id }) => {
    const { cartItems, addToCart, removeFromCart, url, food_list } = useContext(StoreContext);
    const [cart, setCart] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const CURRENCY = ' VNĐ';
    
    // Lấy dữ liệu giỏ hàng từ localStorage và cập nhật khi có thay đổi
    useEffect(() => {
        // Lấy giỏ hàng ban đầu từ localStorage
        const loadCart = () => {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        };
        
        // Lắng nghe sự kiện thay đổi trong localStorage
        const handleStorageChange = () => {
            loadCart();
        };
        
        // Lắng nghe custom event để cập nhật khi thêm/xóa sản phẩm
        const handleCartUpdated = () => {
            loadCart();
        };
        
        // Load cart ban đầu
        loadCart();
        
        // Đăng ký các sự kiện
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('cartUpdated', handleCartUpdated);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cartUpdated', handleCartUpdated);
        };
    }, []);
    
    // Hàm định dạng tiền tệ với dấu phân cách hàng nghìn
    const formatCurrency = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    // Hàm xử lý thêm vào giỏ hàng với hiệu ứng bay
    const handleAddToCart = () => {
        // Thêm sản phẩm vào giỏ hàng (StoreContext đã cập nhật localStorage)
        addToCart(id);
        
        // Tạo hiệu ứng sản phẩm bay vào giỏ hàng
        const productElement = document.querySelector(`[data-product-id="${id}"]`);
        if (productElement) {
            const cartIcon = document.querySelector('.navbar-search-icon');
            if (cartIcon) {
                const productRect = productElement.getBoundingClientRect();
                const cartRect = cartIcon.getBoundingClientRect();
                
                // Tạo sản phẩm bay
                const flyingProduct = document.createElement('div');
                flyingProduct.className = 'flying-product';
                
                // Đặt style ban đầu
                flyingProduct.style.cssText = `
                    position: fixed;
                    top: ${productRect.top}px;
                    left: ${productRect.left}px;
                    width: 50px;
                    height: 50px;
                    background: url(${url}/images/${image}) center/cover;
                    background-size: cover;
                    border-radius: 50%;
                    z-index: 1000;
                    pointer-events: none;
                    opacity: 0.9;
                    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                `;
                
                document.body.appendChild(flyingProduct);
                
                // Tính toán đường bay
                const midX = (productRect.left + cartRect.left) / 2;
                const midY = productRect.top - 100;
                
                // Kích hoạt animation
                requestAnimationFrame(() => {
                    // Đường bay parabol
                    flyingProduct.style.transform = `translate(${midX - productRect.left}px, ${midY - productRect.top}px) rotate(-45deg)`;
                    flyingProduct.style.opacity = '1.5';
                    
                    // Hoàn thành animation
                    setTimeout(() => {
                        flyingProduct.style.transform = `translate(${cartRect.left - productRect.left}px, ${cartRect.top - productRect.top}px) scale(0.1) rotate(45deg)`;
                        flyingProduct.style.opacity = '0';
                        
                        // Bounce effect
                        setTimeout(() => {
                            flyingProduct.style.transform = `translate(${cartRect.left - productRect.left}px, ${cartRect.top - productRect.top}px) scale(0.1) rotate(45deg) translateY(5px)`;
                        }, 100);
                    }, 400);
                });
                
                // Kích hoạt sự kiện cập nhật giỏ hàng ngay lập tức
                window.dispatchEvent(new Event('cartUpdated'));
                
                // Tạo hiệu ứng nhảy số cho cart icon
                const cartCountElement = document.querySelector('.cart-count');
                if (cartCountElement) {
                    cartCountElement.classList.remove('animate-bounce');
                    setTimeout(() => {
                        cartCountElement.classList.add('animate-bounce');
                    }, 10);
                }
                
                // Xóa phần tử sau khi animation kết thúc
                setTimeout(() => {
                    document.body.removeChild(flyingProduct);
                }, 800);
            }
        }
    }

    // Hàm hiển thị chi tiết sản phẩm
    const showProductDetail = () => {
        // Tìm sản phẩm trong danh sách
        const product = food_list.find(item => item._id === id);
        if (product) {
            setSelectedProduct(product);
        }
    };

    // Hàm đóng popup chi tiết sản phẩm
    const closeProductDetail = () => {
        setSelectedProduct(null);
    };

    return (
        <>
            <div className='food-item'>
                <div className='food-item-img-container' onClick={showProductDetail}>
                    <img 
                        className='food-item-image' 
                        src={typeof image === 'string' ? `${url}/images/${image}` : image} 
                        alt={name} 
                    />
                </div>
                <h3 className="food-item-name" onClick={showProductDetail}>{name}</h3>
                <p className="food-item-price">{formatCurrency(price)}{' VNĐ'}</p>
                <p className="food-item-desc" title={desc}>
                    {desc && desc.length > 100 ? `${desc.substring(0, 100)}...` : desc}
                </p>
                <button 
                    className={`food-item-add-btn ${cart[id] ? 'added' : ''}`}
                    onClick={handleAddToCart}
                    data-product-id={id}
                >
                    {cart[id] ? `Đã thêm (${cart[id]})` : 'Thêm vào giỏ'}
                </button>
            </div>

            {/* Popup chi tiết sản phẩm */}
            {selectedProduct && (
                <ProductDetailPopup 
                    product={selectedProduct} 
                    onClose={closeProductDetail} 
                    onAddToCart={addToCart} 
                />
            )}
        </>
    )
}

export default FoodItem
