import React from 'react'
import './Header.css'
import { useNavigate } from 'react-router-dom'
const Header = () => {
    const navigate = useNavigate()
    return (
        <div className='header'>
            <div className='header-contents'>
                <h2>
                    <span><i className="fas fa-coins"></i> Chiêu tài</span> <br />
                    <span><i className="fas fa-gem"></i> Hút lộc</span> <br />
                    <span><i className="fas fa-yin-yang"></i> Vạn sự bình an</span>
                    {/* <span> Chiêu tài</span> <br />
                    <span> Hút lộc</span> <br />
                    <span> Vạn sự bình an</span> */}
                </h2>
                <p>Khám phá bộ sưu tập vật phẩm phong thủy đa dạng, được tuyển chọn kỹ lưỡng từ những chất liệu tinh túy và chế tác bởi đôi tay nghệ nhân lành nghề. Chúng tôi cam kết mang đến sự hài hòa, may mắn và thịnh vượng cho không gian sống và công việc của bạn – từng vật phẩm là một nguồn năng lượng tích cực được gửi gắm với tâm huyết và sự am hiểu sâu sắc về phong thủy.</p>
                <button onClick={() => navigate('/store')}>Xem Cửa Hàng</button>
            </div>
        </div>
    )
}

export default Header
