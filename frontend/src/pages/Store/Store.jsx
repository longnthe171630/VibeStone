import { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import './Store.css'
import { StoreContext } from '../../Context/StoreContext'
import ProductDetailPopup from '../../components/ProductDetailPopup/ProductDetailPopup'

const Store = () => {
    const CURRENCY = ' VNĐ'
    
    // Hàm định dạng tiền tệ với dấu phân cách hàng nghìn
    const formatCurrency = (amount) => {
        return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    const { url, food_list, fetchFoodList } = useContext(StoreContext)
    const [allProducts, setAllProducts] = useState([])

    // Lấy danh sách sản phẩm từ API và lưu vào localStorage
    useEffect(() => {
        // Sử dụng hàm fetchFoodList từ StoreContext để lấy danh sách sản phẩm
        const loadProducts = async () => {
            try {
                await fetchFoodList();
                
                // Lưu vào localStorage
                localStorage.setItem('products', JSON.stringify(food_list));
            } catch (error) {
                console.error('Lỗi khi lấy danh sách sản phẩm:', error);
                
                // Nếu có lỗi, thử lấy từ localStorage
                const savedProducts = localStorage.getItem('products');
                if (savedProducts) {
                    setAllProducts(JSON.parse(savedProducts));
                }
            }
        };

        loadProducts();
    }, [url, fetchFoodList])
    
    // Cập nhật allProducts khi food_list thay đổi
    useEffect(() => {
        if (food_list && food_list.length > 0) {
            setAllProducts(food_list);
        }
    }, [food_list])

    // Cập nhật filteredProducts khi allProducts thay đổi
    useEffect(() => {
        console.log('allProducts đã thay đổi:', allProducts);
        setFilteredProducts(allProducts);
    }, [allProducts])

    // Khởi tạo cart từ localStorage hoặc object rỗng
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart')
        return savedCart ? JSON.parse(savedCart) : {}
    })

    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("")
    const [selectedSubCategory, setSelectedSubCategory] = useState("")
    const [filteredProducts, setFilteredProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    
    // Phân trang
    const [currentPage, setCurrentPage] = useState(1)
    const productsPerPage = 12 // Hiển thị tối đa 12 sản phẩm trên mỗi trang

    // Thêm sản phẩm vào giỏ hàng
    const addToCart = (itemId) => {
        // Cập nhật state
        if (!cart[itemId]) {
            setCart(prev => ({ ...prev, [itemId]: 1 }));
        } else {
            setCart(prev => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        
        // Cập nhật localStorage
        const updatedCart = { ...cart };
        updatedCart[itemId] = (updatedCart[itemId] || 0) + 1;
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        
        // Thông báo cập nhật giỏ hàng
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Tạo hiệu ứng sản phẩm bay vào giỏ hàng
        const productElement = document.querySelector(`[data-product-id="${itemId}"]`);
        if (productElement) {
            const cartIcon = document.querySelector('.navbar-search-icon');
            if (cartIcon) {
                // Tìm thông tin sản phẩm
                const product = allProducts.find(p => p._id === itemId);
                if (!product) return;
                
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
                    background: url(${url}/images/${product.image}) center/cover;
                    background-size: cover;
                    border-radius: 50%;
                    z-index: 1000;
                    pointer-events: none;
                    opacity: 0.9;
                    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    border: 2px solid rgba(255,255,255,0.8);
                `;
                
                document.body.appendChild(flyingProduct);
                
                // Tính toán đường bay
                const midX = (productRect.left + cartRect.left) / 2;
                const midY = productRect.top - 100;
                
                // Kích hoạt animation
                requestAnimationFrame(() => {
                    // Đường bay parabol
                    flyingProduct.style.transform = `translate(${midX - productRect.left}px, ${midY - productRect.top}px) rotate(-45deg)`;
                    flyingProduct.style.opacity = '1';
                    
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
    };

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
            'Vòng Tay': ['phong-thuy', 'thoi-trang', 'cao-cap'],
            'Vòng Cổ': ['phong-thuy', 'thoi-trang', 'cao-cap'],
            'Hũ Đá': ['da-tu-nhien', 'da-quy', 'da-ban-quy'],
            'Móc Khóa': ['phong-thuy', 'qua-tang', 'trang-tri'],
            'Cây Đá': ['phong-thuy', 'trang-tri', 'qua-tang'],
            'Cầu Thủy Tinh': ['phong-thuy', 'trang-tri'],
            'Nhẫn': ['phong-thuy', 'thoi-trang'],
            'Tượng': ['phong-thuy', 'trang-tri', 'qua-tang']
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
    
    // Hàm hiển thị chi tiết sản phẩm khi người dùng bấm vào sản phẩm
    const showProductDetail = (product) => {
        setSelectedProduct(product)
    }
    
    // Hàm đóng popup chi tiết sản phẩm
    const closeProductDetail = () => {
        setSelectedProduct(null)
    }
    
    // Tính toán sản phẩm hiển thị trên trang hiện tại
    const indexOfLastProduct = currentPage * productsPerPage
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
    
    // Tổng số trang
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
    
    // Chuyển đến trang tiếp theo
    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
            // Cuộn lên đầu trang
            window.scrollTo(0, 0)
        }
    }
    
    // Quay lại trang trước
    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
            // Cuộn lên đầu trang
            window.scrollTo(0, 0)
        }
    }
    
    // Chuyển đến trang cụ thể
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber)
        // Cuộn lên đầu trang
        window.scrollTo(0, 0)
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
                        <option value="Vòng Tay">Vòng tay</option>
                        <option value="Vòng Cổ">Vòng cổ</option>
                        <option value="Hũ Đá">Hũ đá</option>
                        <option value="Móc Khóa">Móc khóa</option>
                        <option value="Cây Đá">Cây đá</option>
                        <option value="Cầu Thủy Tinh">Cầu thủy tinh</option>
                        <option value="Nhẫn">Nhẫn</option>
                        <option value="Tượng">Tượng</option>
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
                    currentProducts.map((product) => (
                        <div key={product._id} className="product-card" data-product-id={product._id}>
                            <div className="product-image" onClick={() => showProductDetail(product)}>
                                <img src={product.image ? `${url}/images/${product.image}` : ''} alt={product.name} />
                            </div>
                            <h3 onClick={() => showProductDetail(product)}>{product.name}</h3>
                            <p className="price">{formatCurrency(product.price)}{CURRENCY}</p>
                            <p className="description">{product.description.length > 100 ? `${product.description.substring(0, 100)}...` : product.description}</p>
                            <button 
                                className={`add-to-cart ${cart[product._id] ? 'added' : ''}`}
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
            
            {/* Phân trang */}
            {filteredProducts.length > 0 && totalPages > 1 && (
                <div className="pagination">
                    <button 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                        className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
                    >
                        &laquo; Trước
                    </button>
                    
                    <div className="pagination-numbers">
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Hiển thị tối đa 5 số trang, những trang khác hiển thị dấu ...
                            if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => goToPage(pageNumber)}
                                        className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            } else if (
                                (pageNumber === 2 && currentPage > 3) ||
                                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                            ) {
                                return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                            }
                            return null;
                        })}
                    </div>
                    
                    <button 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                        className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
                    >
                        Tiếp &raquo;
                    </button>
                </div>
            )}
            
            {/* Popup chi tiết sản phẩm */}
            {selectedProduct && (
                <ProductDetailPopup 
                    product={selectedProduct} 
                    onClose={closeProductDetail} 
                    onAddToCart={addToCart} 
                />
            )}
        </div>
    )
}

export default Store 