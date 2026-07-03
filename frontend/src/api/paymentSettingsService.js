import axiosInstance from './axiosInstance';

export const getPaymentSettings = async (activeOnly = false) => {
  try {
    const params = activeOnly ? '?action=get_payment_settings&active_only=1' : '?action=get_payment_settings';
    const response = await axiosInstance.get(params);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    throw error;
  }
};

export const addPaymentSetting = async (data) => {
  try {
    const response = await axiosInstance.post('?action=add_payment_setting', data);
    return response.data;
  } catch (error) {
    console.error('Error adding payment setting:', error);
    throw error;
  }
};

export const updatePaymentSetting = async (id, data) => {
  try {
    const response = await axiosInstance.post('?action=update_payment_setting', { id, ...data });
    return response.data;
  } catch (error) {
    console.error('Error updating payment setting:', error);
    throw error;
  }
};

export const deletePaymentSetting = async (id) => {
  try {
    const response = await axiosInstance.post('?action=delete_payment_setting', { id });
    return response.data;
  } catch (error) {
    console.error('Error deleting payment setting:', error);
    throw error;
  }
};

export const togglePaymentSetting = async (id, isActive) => {
  try {
    const response = await axiosInstance.post('?action=toggle_payment_setting', { id, is_active: isActive });
    return response.data;
  } catch (error) {
    console.error('Error toggling payment setting:', error);
    throw error;
  }
};
