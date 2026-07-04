import axiosInstance from './axiosInstance';

export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post(
      '?action=create_order',
      orderData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrders = async (userId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const id = userId || user.id;
    
    if (!id) {
      throw new Error('User ID tidak ditemukan');
    }
    
    const response = await axiosInstance.get(
      '?action=get_user_orders&user_id=' + id
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const getOrderDetail = async (orderId) => {
  try {
    const response = await axiosInstance.get(
      '?action=get_order&id=' + orderId
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching order detail:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status, rejectionReason = null) => {
  try {
    const response = await axiosInstance.post(
      '?action=update_order_status',
      { order_id: orderId, status, rejection_reason: rejectionReason }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const getOrderStatus = async (orderId) => {
  try {
    const response = await axiosInstance.get(
      '?action=get_order&id=' + orderId
    );
    const data = response.data;
    if (data.status === 'success' && data.data) {
      return {
        status: data.data.status,
        rejection_reason: data.data.rejection_reason ?? null,
        payment_proof: data.data.payment_proof ?? null,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching order status:', error);
    return null;
  }
};

export const uploadPaymentProof = async (orderId, file) => {
  try {
    const formData = new FormData();
    formData.append('payment_proof', file);
    formData.append('order_id', orderId);

    const response = await axiosInstance.post(
      '?action=upload_payment_proof',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    throw error;
  }
};
