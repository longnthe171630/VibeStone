import React, { useState, useEffect } from 'react'
import './Cart.css'
import { useNavigate } from 'react-router-dom'

const Cart = () => {
  const [cartItems, setCartItems] = useState({})
  const [products, setProducts] = useState([])
  const navigate = useNavigate()
  const CURRENCY = ' VNĐ'
  const DELIVERY_CHARGE = 10000

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
  const increaseQuantity = (itemId) => {
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

  // Giảm số lượng sản phẩm
  const decreaseQuantity = (itemId) => {
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
  }

  // Xóa toàn bộ sản phẩm
  const removeItem = (itemId) => {
    setCartItems(prevCart => {
      const newCart = { ...prevCart }
      delete newCart[itemId]
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

  const getTotalCartAmount = () => {
    let totalAmount = 0
    for (const itemId in cartItems) {
      const product = products.find(p => p._id === parseInt(itemId))
      if (product) {
        totalAmount += product.price * cartItems[itemId]
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
        {products.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
              <div className="cart-items-title cart-items-item">
                  <img src={item.image} alt="" />
                <p>{item.name}</p>
                  <p>{item.price}{CURRENCY}</p>
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(item._id)}>-</button>
                    <span>{cartItems[item._id]}</span>
                    <button onClick={() => increaseQuantity(item._id)}>+</button>
                  </div>
                  <p>{item.price * cartItems[item._id]}{CURRENCY}</p>
                  <p className='cart-items-remove-icon' onClick={() => removeItem(item._id)}>x</p>
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
              <p>Chi phí sản phẩm</p>
              <p>{getTotalCartAmount()}{CURRENCY}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Phí vận chuyển</p>
              <p>{getTotalCartAmount() === 0 ? 0 : DELIVERY_CHARGE}{CURRENCY}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Tổng</b>
              <b>{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + DELIVERY_CHARGE}{CURRENCY}</b>
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
