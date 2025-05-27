import { createContext, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";
export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const url = "http://localhost:5000"
    const [food_list, setFoodList] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState("")
    const currency = "$";
    const deliveryCharge = 5;

    const addToCart = async (itemId) => {
        // Cập nhật state
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        }
        else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }

        // Cập nhật localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '{}');
        cart[itemId] = (cart[itemId] || 0) + 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Thông báo cập nhật giỏ hàng
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Gửi API nếu đã đăng nhập
        if (token) {
            await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
        }
    }

    const removeFromCart = async (itemId) => {
        // Cập nhật state
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }))
        
        // Cập nhật localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '{}');
        if (cart[itemId]) {
            cart[itemId] = cart[itemId] - 1;
            if (cart[itemId] <= 0) {
                delete cart[itemId];
            }
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        
        // Thông báo cập nhật giỏ hàng
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Gửi API nếu đã đăng nhập
        if (token) {
            await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
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
            setCartItems(response.data.cartData);
        } catch (error) {
            console.error("Error loading cart data:", error);
        }
    }

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"))
                await loadCartData({ token: localStorage.getItem("token") })
            }
        }
        loadData()
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