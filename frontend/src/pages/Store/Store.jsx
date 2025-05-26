import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import './Store.css'
import { StoreContext } from '../../Context/StoreContext'

const Store = () => {
    const CURRENCY = ' VNĐ'
    const { url } = useContext(StoreContext)
    const [allProducts, setAllProducts] = useState([])

    // Lấy danh sách sản phẩm từ API và lưu vào localStorage
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Sử dụng API để lấy danh sách sản phẩm
                const response = await axios.get(`${url}/api/products`);
                
                if (response.data && response.data.success) {
                    // Lấy dữ liệu sản phẩm từ response
                    const products = response.data.data;
                    setAllProducts(products);
                    
                    // Lưu vào localStorage
                    localStorage.setItem('products', JSON.stringify(products));
                } else {
                    console.error('Không thể lấy danh sách sản phẩm:', response.data?.error || 'Lỗi không xác định');
                    
                    // Nếu không lấy được từ API, thử lấy từ localStorage
                    const savedProducts = localStorage.getItem('products');
                    if (savedProducts) {
                        setAllProducts(JSON.parse(savedProducts));
                    }
                }
            } catch (error) {
                console.error('Lỗi khi lấy danh sách sản phẩm:', error);
                
                // Nếu có lỗi, thử lấy từ localStorage
                const savedProducts = localStorage.getItem('products');
                if (savedProducts) {
                    setAllProducts(JSON.parse(savedProducts));
                }
            }
        };

        fetchProducts();
    }, [url])

    // Khởi tạo cart từ localStorage hoặc object rỗng
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart')
        return savedCart ? JSON.parse(savedCart) : {}
    })

    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedSubCategory, setSelectedSubCategory] = useState("")
    const [filteredProducts, setFilteredProducts] = useState(allProducts)

    // Hàm thêm sản phẩm vào giỏ hàng
    const addToCart = (itemId) => {
        setCart(prevCart => {
            const newCart = { ...prevCart };
            newCart[itemId] = (newCart[itemId] || 0) + 1;
            localStorage.setItem('cart', JSON.stringify(newCart));
            
            // Tạo hiệu ứng sản phẩm bay vào giỏ hàng
            const productElement = document.querySelector(`[data-product-id="${itemId}"]`);
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
                        background: url(${allProducts.find(p => p._id === itemId)?.image}) center/cover;
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
                        flyingProduct.style.opacity = '0.8';
                        
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
            
            return newCart;
        });
    };

    // Cập nhật localStorage khi cart thay đổi
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart))
    }, [cart])

    // Hàm chuyển đổi tiếng Việt có dấu thành không dấu
    const removeAccents = (str) => {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }

    // Lấy danh sách danh mục con dựa trên danh mục chính
    const getSubCategories = (category) => {
        const subCategories = {
            'vong-tay': ['phong-thuy', 'thoi-trang', 'cao-cap'],
            'vong-co': ['phong-thuy', 'thoi-trang', 'cao-cap'],
            'da-phong-thuy': ['da-tu-nhien', 'da-quy', 'da-ban-quy']
        }
        return subCategories[category] || []
    }

    useEffect(() => {
        let result = allProducts

        // Filter by search term
        if (searchTerm) {
            const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.length > 0)
            
            result = result.filter(product => {
                const productName = removeAccents(product.name.toLowerCase())
                const productDesc = removeAccents(product.description.toLowerCase())
                const searchTermsNoAccent = searchTerms.map(term => removeAccents(term))
                
                return searchTermsNoAccent.every(term => 
                    productName.includes(term) || productDesc.includes(term)
                )
            })
        }

        // Filter by main category
        if (selectedCategory) {
            result = result.filter(product => product.category === selectedCategory)
        }

        // Filter by sub category
        if (selectedSubCategory) {
            result = result.filter(product => product.subCategory === selectedSubCategory)
        }

        setFilteredProducts(result)
    }, [searchTerm, selectedCategory, selectedSubCategory, allProducts])

    const handleSearch = (e) => {
        setSearchTerm(e.target.value)
    }

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value)
        setSelectedSubCategory("") // Reset sub category when main category changes
    }

    const handleSubCategoryChange = (e) => {
        setSelectedSubCategory(e.target.value)
    }

    return (
        <div className="store-container">
            <div className="store-header">
                <h1>Cửa hàng</h1>
                <div className="store-filters">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm sản phẩm..." 
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                    <select 
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                    >
                        <option value="">Tất cả danh mục</option>
                        <option value="vong-tay">Vòng tay</option>
                        <option value="vong-co">Vòng cổ</option>
                        <option value="da-phong-thuy">Đá phong thủy</option>
                    </select>
                    {selectedCategory && (
                        <select 
                            value={selectedSubCategory}
                            onChange={handleSubCategoryChange}
                        >
                            <option value="">Tất cả loại</option>
                            {getSubCategories(selectedCategory).map(subCat => (
                                <option key={subCat} value={subCat}>
                                    {subCat.split('-').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            <div className="products-grid">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div key={product._id} className="product-card" data-product-id={product._id}>
                            <img src={product.image || '' + product.name} alt={product.name} />
                            <h3>{product.name}</h3>
                            <p className="price">{product.price}{CURRENCY}</p>
                            <p className="description">{product.description}</p>
                            <button 
                                className="add-to-cart" 
                                onClick={() => addToCart(product._id)}
                                data-product-id={product._id}
                            >
                                {cart[product._id] ? `Đã thêm (${cart[product._id]})` : 'Thêm vào giỏ'}
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="no-products">
                        <p>Không tìm thấy sản phẩm phù hợp</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Store 