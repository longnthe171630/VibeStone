import { createContext, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";
import { notifyAddedToCart, notifyRemovedFromCart } from "../utils/notifications";
export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const url = "http://localhost:5000"
    const [food_list, setFoodList] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState("")
    const currency = "VNĐ";
    const deliveryCharge = 10000;

    const addToCart = async (itemId) => {
        try {
            // Tìm thông tin sản phẩm để hiển thị thông báo
            const product = food_list.find(item => item._id === itemId);
            
            // Nếu đã đăng nhập, lưu vào database
            if (token) {
                // Cập nhật state trước
                if (!cartItems[itemId]) {
                    setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
                } else {
                    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
                }
                
                // Gửi API để lưu vào database
                await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
                
                // Sau khi lưu thành công, cập nhật lại giỏ hàng từ database
                await loadCartData({ token });
            } else {
                // Nếu chưa đăng nhập, tạm thời lưu vào localStorage
                // Cập nhật state
                if (!cartItems[itemId]) {
                    setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
                } else {
                    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
                }
                
                // Cập nhật localStorage
                const cart = JSON.parse(localStorage.getItem('cart') || '{}');
                cart[itemId] = (cart[itemId] || 0) + 1;
                localStorage.setItem('cart', JSON.stringify(cart));
            }
            
            // Thông báo cập nhật giỏ hàng
            window.dispatchEvent(new Event('cartUpdated'));
            
            // Hiển thị thông báo
            notifyAddedToCart(product ? product.name : null);
        } catch (error) {
            console.error("Error adding to cart:", error);
        }
    }

    const removeFromCart = async (itemId) => {
        try {
            // Lấy thông tin sản phẩm trước khi xóa để hiển thị thông báo
            const product = food_list.find(item => item._id === itemId);
            
            // Nếu đã đăng nhập, lưu vào database
            if (token) {
                // Cập nhật state trước
                setCartItems((prev) => {
                    const newCart = { ...prev };
                    if (newCart[itemId] > 0) {
                        newCart[itemId] -= 1;
                        if (newCart[itemId] <= 0) {
                            delete newCart[itemId];
                        }
                    }
                    return newCart;
                });
                
                // Gửi API để lưu vào database
                await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
                
                // Sau khi lưu thành công, cập nhật lại giỏ hàng từ database
                await loadCartData({ token });
            } else {
                // Nếu chưa đăng nhập, tạm thời lưu vào localStorage
                // Cập nhật state
                setCartItems((prev) => {
                    const newCart = { ...prev };
                    if (newCart[itemId] > 0) {
                        newCart[itemId] -= 1;
                        if (newCart[itemId] <= 0) {
                            delete newCart[itemId];
                        }
                    }
                    return newCart;
                });
                
                // Cập nhật localStorage
                const cart = JSON.parse(localStorage.getItem('cart') || '{}');
                if (cart[itemId]) {
                    cart[itemId] = cart[itemId] - 1;
                    if (cart[itemId] <= 0) {
                        delete cart[itemId];
                    }
                    localStorage.setItem('cart', JSON.stringify(cart));
                }
            }
            
            // Thông báo cập nhật giỏ hàng
            window.dispatchEvent(new Event('cartUpdated'));
            
            // Hiển thị thông báo
            notifyRemovedFromCart(product ? product.name : null);
        } catch (error) {
            console.error("Error removing from cart:", error);
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            try {
              if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                totalAmount += itemInfo.price * cartItems[item];
            }  
            } catch (error) {
                console.log(error);
            }
            
        }
        return totalAmount;
    }

    const fetchFoodList = async () => {
        const response = await axios.get(url + "/api/food/list");
        setFoodList(response.data.data)
    }

    const loadCartData = async ({token}) => {
        try {
            const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
            if (response.data.success) {
                // Cập nhật state với dữ liệu từ database
                setCartItems(response.data.cartData);
                
                // Đồng bộ dữ liệu với localStorage (chỉ để hỗ trợ các component khác vẫn đang sử dụng localStorage)
                // localStorage.setItem('cart', JSON.stringify(response.data.cartData));
                
                // Thông báo cập nhật giỏ hàng
                window.dispatchEvent(new Event('cartUpdated'));
            }
        } catch (error) {
            console.error("Error loading cart data:", error);
        }
    }

    useEffect(() => {
        async function loadData() {
            // Lấy danh sách sản phẩm
            await fetchFoodList();
            
            // Kiểm tra token trong localStorage
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                setToken(savedToken);
                
                // Lấy dữ liệu giỏ hàng từ database
                await loadCartData({ token: savedToken });
            } else {
                // Nếu không có token, kiểm tra giỏ hàng trong localStorage
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    setCartItems(JSON.parse(savedCart));
                }
            }
        }
        loadData();
    }, [])

    const contextValue = {
        url,
        food_list,
        menu_list,
        cartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        token,
        setToken,
        loadCartData,
        setCartItems,
        currency,
        deliveryCharge,
        fetchFoodList
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )

}

export default StoreContextProvider;