import { toast } from 'react-toastify';

// Toast configuration options
const toastConfig = {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Cart notifications
export const notifyAddedToCart = (productName) => {
  toast.success(`${productName || 'Sản phẩm'} đã được thêm vào giỏ hàng`, toastConfig);
};

export const notifyRemovedFromCart = (productName) => {
  toast.info(`${productName || 'Sản phẩm'} đã được gỡ khỏi giỏ hàng`, toastConfig);
};

// Authentication notifications
export const notifyLogin = (username) => {
  toast.success(`Đăng nhập thành công${username ? `, ${username}` : ''}!`, toastConfig);
};

export const notifyRegistration = () => {
  toast.success('Đăng ký tài khoản thành công!', toastConfig);
};

export const notifyLogout = () => {
  toast.info('Đã đăng xuất khỏi tài khoản', toastConfig);
};

// Error notifications
export const notifyError = (message) => {
  toast.error(message || 'Đã xảy ra lỗi', toastConfig);
};

// Generic success notification
export const notifySuccess = (message) => {
  toast.success(message, toastConfig);
};
