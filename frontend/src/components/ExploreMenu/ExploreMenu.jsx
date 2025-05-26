import React, { useContext } from 'react'
import './ExploreMenu.css'
import { StoreContext } from '../../Context/StoreContext'

const ExploreMenu = ({category,setCategory}) => {

  const {menu_list} = useContext(StoreContext);
  
  return (
    <div className='explore-menu' id='explore-menu'>
      <h1>Khám Phá Cửa Hàng </h1>
      <p className='explore-menu-text'>Khám phá bộ sưu tập vật phẩm phong thủy được tuyển chọn kỹ lưỡng, mang lại tài lộc, hòa hợp và năng lượng tích cực. Sứ mệnh của chúng tôi là giúp bạn kiến tạo không gian thịnh vượng và an yên – từng vật phẩm, một giá trị bền lâu.</p>
      <div className="explore-menu-list">
        {menu_list.map((item,index)=>{
            return (
                <div onClick={()=>setCategory(prev=>prev===item.menu_name?"All":item.menu_name)} key={index} className='explore-menu-list-item'>
                    <img src={item.menu_image} className={category===item.menu_name?"active":""} alt="" />
                    <p>{item.menu_name}</p>
                </div>
            )
        })}
      </div>
      <hr />
    </div>
  )
}

export default ExploreMenu
