import React, { useContext, useEffect, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext'

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [cartCount, setCartCount] = useState(0);
  const { token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '{}');
      // Tính tổng số lượng sản phẩm thay vì số lượng loại sản phẩm
      const totalItems = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
      setCartCount(totalItems);
    };

    // Cập nhật số lượng ban đầu
    updateCartCount();

    // Lắng nghe sự kiện thay đổi trong localStorage
    window.addEventListener('storage', updateCartCount);
    
    // Lắng nghe custom event để cập nhật khi thêm sản phẩm
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate('/')
  }

  return (
    <div className='navbar'>
      <Link to='/'><img className='logo' src={assets.logo} alt="" /></Link>
      <ul className="navbar-menu">
        <Link to="/" onClick={() => setMenu("home")} className={`${menu === "home" ? "active" : ""}`}>Trang chủ</Link>
        <a onClick={() => navigate('/store')} className={`${menu === "menu" ? "active" : ""}`}>Cửa hàng</a>        
        <a href='#footer' onClick={() => setMenu("contact")} className={`${menu === "contact" ? "active" : ""}`}>Liên hệ</a>
        <Link to="/tuvi" onClick={() => setMenu("mob-app")} className={`${menu === "mob-app" ? "active" : ""}`}>Tử Vi</Link>
      </ul>
      <div className="navbar-right">
        <img src={assets.search_icon} alt="" />
        <Link to='/cart' className='navbar-search-icon'>
          <img src={assets.basket_icon} alt="" />
          {cartCount > 0 && (
            <div className="cart-count animate-bounce">{cartCount}</div>
          )}
        </Link>
        {!token ? <button onClick={() => setShowLogin(true)}>Đăng kí</button>
          : <div className='navbar-profile'>
            <img src={assets.profile_icon} alt="" />
            <ul className='navbar-profile-dropdown'>
              <li onClick={()=>navigate('/myorders')}> <img src={assets.bag_icon} alt="" /> <p>Đơn hàng</p></li>
              <hr />
              <li onClick={logout}> <img src={assets.logout_icon} alt="" /> <p>Đăng xuất</p></li> 
            </ul>
          </div>
        }
      </div>
    </div>
  )
}

export default Navbar
