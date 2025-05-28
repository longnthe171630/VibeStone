import React, { useContext, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../Context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { notifyLogin, notifyRegistration, notifyError } from '../../utils/notifications'

const LoginPopup = ({ setShowLogin }) => {

    const { setToken, url,loadCartData } = useContext(StoreContext)
    const [currState, setCurrState] = useState("Đăng ký");

    const [data, setData] = useState({
        name: "",
        email: "",
        password: ""
    })

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData(data => ({ ...data, [name]: value }))
    }

    const onLogin = async (e) => {
        e.preventDefault()

        let new_url = url;
        if (currState === "Đăng nhập") {
            new_url += "/api/user/login";
        }
        else {
            new_url += "/api/user/register"
        }
        try {
            const response = await axios.post(new_url, data);
            if (response.data.success) {
                // Lưu token vào state và localStorage
                setToken(response.data.token)
                localStorage.setItem("token", response.data.token)
                
                if (currState === "Đăng nhập") {
                    // Đăng nhập: Đồng bộ giỏ hàng từ database
                    await loadCartData({token:response.data.token})
                    
                    // Hiển thị thông báo đăng nhập thành công
                    notifyLogin(data.name || data.email)
                } else {
                    // Đăng ký: Nếu có giỏ hàng trong localStorage, đồng bộ lên database
                    const localCart = localStorage.getItem('cart');
                    if (localCart) {
                        const cartItems = JSON.parse(localCart);
                        // Đồng bộ từng sản phẩm lên database
                        for (const itemId in cartItems) {
                            const quantity = cartItems[itemId];
                            for (let i = 0; i < quantity; i++) {
                                await axios.post(url + "/api/cart/add", { itemId }, { headers: { token: response.data.token } });
                            }
                        }
                        // Sau khi đồng bộ xong, lấy lại giỏ hàng từ database
                        await loadCartData({token:response.data.token});
                    }
                    
                    // Hiển thị thông báo đăng ký thành công
                    notifyRegistration()
                }
                
                // Đóng popup đăng nhập
                setShowLogin(false)
            }
            else {
                notifyError(response.data.message)
            }
        } catch (error) {
            notifyError(error.response?.data?.message || "Đã xảy ra lỗi")
        }
    }

    return (
        <div className='login-popup'>
            <form onSubmit={onLogin} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currState}</h2> <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
                </div>
                <div className="login-popup-inputs">
                    {currState === "Đăng ký" ? <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Tên tài khoản' required /> : <></>}
                    <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email của bạn' />
                    <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Mật khẩu' required />
                </div>
                <button>{currState === "Đăng nhập" ? "Đăng nhập" : "Đăng ký"}</button>
                <div className="login-popup-condition">
                    <input type="checkbox" name="" id="" required/>
                    <p>Đồng ý với bảo mật và điều khoản!</p>
                </div>
                {currState === "Đăng nhập"
                    ? <p>Chưa có tài khoản? <span onClick={() => setCurrState('Đăng ký')}>Đăng ký</span></p>
                    : <p>Đã có tài khoản? <span onClick={() => setCurrState('Đăng nhập')}>Đăng nhập</span></p>
                }
            </form>
        </div>
    )
}

export default LoginPopup