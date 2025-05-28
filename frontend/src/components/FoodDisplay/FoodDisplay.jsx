import React, { useContext, useEffect } from 'react'
import './FoodDisplay.css'
import FoodItem from '../FoodItem/FoodItem'
import { StoreContext } from '../../Context/StoreContext'

const FoodDisplay = ({category}) => {

  const {food_list} = useContext(StoreContext);

  // Kiểm tra xem food_list có tồn tại và có phải là mảng không
  const validFoodList = Array.isArray(food_list) ? food_list : [];

  return (
    <div className='food-display' id='food-display'>
      <h2>Sản Phẩm Nổi Bật</h2>
      <div className='food-display-list'>
        {validFoodList.length > 0 ? (
          validFoodList.map((item) => {
            if (category === "All" || category === item.category) {
              return <FoodItem key={item._id} image={item.image} name={item.name} desc={item.description} price={item.price} id={item._id} />
            }
            return null;
          })
        ) : (
          <p className="no-products">Đang cập nhật!</p>
        )}
      </div>
    </div>
  )
}

export default FoodDisplay
