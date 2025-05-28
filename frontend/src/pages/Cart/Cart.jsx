import React, { useState, useEffect, useContext } from 'react'
import './Cart.css'
import { useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext'
import { notifyRemovedFromCart } from '../../utils/notifications'
import axios from 'axios'

const Cart = () => {
  const [cartItems, setCartItems] = useState({})
  const [products, setProducts] = useState([])
  const navigate = useNavigate()
  const CURRENCY = ' VNĐ'
  const DELIVERY_CHARGE = 10000
  const { url, token, removeFromCart, addToCart } = useContext(StoreContext)
  
  // Hàm định dạng tiền tệ với dấu phân cách hàng nghìn
  const formatCurrency = (amount) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  useEffect(() => {
    // Lấy dữ liệu giỏ hàng từ localStorage
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }

    // Lấy danh sách sản phẩm từ localStorage
    const savedProducts = localStorage.getItem('products')
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    }
  }, [])

  // Tăng số lượng sản phẩm
  const increaseQuantity = async (itemId) => {
    try {
      // Sử dụng hàm addToCart từ StoreContext để đồng bộ với database
      if (token) {
        // Nếu đã đăng nhập, sử dụng hàm từ StoreContext để đồng bộ với database
        await addToCart(itemId);
      } else {
        // Nếu chưa đăng nhập, chỉ cập nhật localStorage
        setCartItems(prevCart => {
          const newCart = { ...prevCart }
          newCart[itemId] = (newCart[itemId] || 0) + 1
          localStorage.setItem('cart', JSON.stringify(newCart))
          
          // Kích hoạt sự kiện cập nhật giỏ hàng
          window.dispatchEvent(new Event('cartUpdated'))
          
          // Tạo hiệu ứng nhảy cho cart icon
          const cartCountElement = document.querySelector('.cart-count')
          if (cartCountElement) {
            cartCountElement.classList.remove('animate-bounce')
            setTimeout(() => {
              cartCountElement.classList.add('animate-bounce')
            }, 10)
          }
          
          return newCart
        })
      }
    } catch (error) {
      console.error('Error increasing quantity:', error);
    }
  }

  // Giảm số lượng sản phẩm
  const decreaseQuantity = async (itemId) => {
    try {
      // Tìm sản phẩm để hiển thị thông báo
      const product = products.find(p => p._id === itemId);
      const isRemovingCompletely = cartItems[itemId] <= 1;
      
      if (token) {
        // Nếu đã đăng nhập, sử dụng hàm từ StoreContext để đồng bộ với database
        await removeFromCart(itemId);
      } else {
        // Nếu chưa đăng nhập, chỉ cập nhật localStorage
        setCartItems(prevCart => {
          const newCart = { ...prevCart }
          if (newCart[itemId] > 1) {
            newCart[itemId] -= 1
          } else {
            delete newCart[itemId]
          }
          localStorage.setItem('cart', JSON.stringify(newCart))
          
          // Kích hoạt sự kiện cập nhật giỏ hàng
          window.dispatchEvent(new Event('cartUpdated'))
          
          // Tạo hiệu ứng nhảy cho cart icon
          const cartCountElement = document.querySelector('.cart-count')
          if (cartCountElement) {
            cartCountElement.classList.remove('animate-bounce')
            setTimeout(() => {
              cartCountElement.classList.add('animate-bounce')
            }, 10)
          }
          
          return newCart
        })
        
        // Hiển thị thông báo khi xóa hoàn toàn sản phẩm khỏi giỏ hàng
        if (isRemovingCompletely && product) {
          notifyRemovedFromCart(product.name);
        }
      }
    } catch (error) {
      console.error('Error decreasing quantity:', error);
    }
  }

  // Xóa toàn bộ sản phẩm
  const removeItem = async (itemId) => {
    try {
      // Tìm sản phẩm để hiển thị thông báo
      const product = products.find(p => p._id === itemId);
      
      if (token) {
        // Nếu đã đăng nhập, xóa sản phẩm trong database
        // Lấy số lượng hiện tại của sản phẩm
        const quantity = cartItems[itemId] || 0;
        
        // Gọi API xóa nhiều lần để xóa hết sản phẩm
        for (let i = 0; i < quantity; i++) {
          await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
        }
        
        // Cập nhật state
        setCartItems(prevCart => {
          const newCart = { ...prevCart }
          delete newCart[itemId]
          return newCart
        })
        
        // Cập nhật localStorage để đồng bộ
        const cart = JSON.parse(localStorage.getItem('cart') || '{}');
        delete cart[itemId];
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Kích hoạt sự kiện cập nhật giỏ hàng
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        // Nếu chưa đăng nhập, chỉ cập nhật localStorage
        setCartItems(prevCart => {
          const newCart = { ...prevCart }
          delete newCart[itemId]
          localStorage.setItem('cart', JSON.stringify(newCart))
          
          // Kích hoạt sự kiện cập nhật giỏ hàng
          window.dispatchEvent(new Event('cartUpdated'))
          
          return newCart
        })
      }
      
      // Tạo hiệu ứng nhảy cho cart icon
      const cartCountElement = document.querySelector('.cart-count')
      if (cartCountElement) {
        cartCountElement.classList.remove('animate-bounce')
        setTimeout(() => {
          cartCountElement.classList.add('animate-bounce')
        }, 10)
      }
      
      // Hiển thị thông báo khi xóa sản phẩm
      if (product) {
        notifyRemovedFromCart(product.name);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  const getTotalCartAmount = () => {
    let totalAmount = 0
    for (const itemId in cartItems) {
      // Tìm sản phẩm bằng ID dưới dạng chuỗi, không chuyển đổi thành số nguyên
      const product = products.find(p => p._id === itemId)
      if (product) {
        totalAmount += product.price * cartItems[itemId]
      } else {
        console.log(`Không tìm thấy sản phẩm với ID: ${itemId}`, 'Danh sách sản phẩm:', products)
      }
    }
    return totalAmount
  }

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Sản phẩm </p> <p>Tiêu đề </p> <p>Giá </p> <p>Số lượng </p> <p>Tổng </p> <p>Gỡ bỏ</p>
        </div>
        <br />
        <hr />
        {Object.keys(cartItems).map((itemId) => {
          const item = products.find(p => p._id === itemId);
          if (item && cartItems[itemId] > 0) {
            return (
              <div key={itemId}>
              <div className="cart-items-title cart-items-item">
                  <img src={item.image ? `${url}/images/${item.image}` : ''} alt={item.name} />
                <p>{item.name}</p>
                  <p>{formatCurrency(item.price)}{CURRENCY}</p>
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(itemId)}>-</button>
                    <span>{cartItems[itemId]}</span>
                    <button onClick={() => increaseQuantity(itemId)}>+</button>
                  </div>
                  <p>{formatCurrency(item.price * cartItems[itemId])}{CURRENCY}</p>
                  <p className='cart-items-remove-icon' onClick={() => removeItem(itemId)}>x</p>
                </div>
                <hr />
              </div>
            )
          }
          return null
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Tổng kết giỏ hàng</h2>
          <div>
            <div className="cart-total-details">
              <p>Thành tiền</p>
              <p>{formatCurrency(getTotalCartAmount())}{CURRENCY}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Phí vận chuyển</p>
              <p>{formatCurrency(getTotalCartAmount() === 0 ? 0 : DELIVERY_CHARGE)}{CURRENCY}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Tổng</b>
              <b>{formatCurrency(getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + DELIVERY_CHARGE)}{CURRENCY}</b>
            </div>
          </div>
          <button onClick={() => navigate('/order')}>THANH TOÁN</button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>Nếu bạn có mã khuyến mãi, hãy nhập nó vào đây!</p>
            <div className='cart-promocode-input'>
              <input type="text" placeholder='Mã khuyến mãi'/>
              <button>Xác nhận</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
