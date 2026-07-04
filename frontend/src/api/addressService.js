import axios from 'axios';

const API_URL = 'http://203.194.113.131/api';

/**
 * Get default address for a user
 * @param {number} userId - User ID
 * @returns {Promise} - { status, data: { id, recipient_name, address, city, province, zipCode, label } }
 */
export const getDefaultAddress = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}?action=get_default_address&user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching default address:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Get all addresses for a user
 * @param {number} userId - User ID
 * @returns {Promise} - { status, data: [ { id, recipient_name, address, city, province, zipCode, label, is_default }, ... ] }
 */
export const getUserAddresses = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}?action=get_user_addresses&user_id=${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Create a new address
 * @param {object} addressData - { user_id, recipient_name, address, city, province, zipCode, label, is_default }
 * @returns {Promise} - { status, message, address_id }
 */
export const createAddress = async (addressData) => {
  try {
    const response = await axios.post(`${API_URL}?action=create_address`, addressData);
    return response.data;
  } catch (error) {
    console.error('Error creating address:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Update an existing address
 * @param {object} addressData - { address_id, user_id, recipient_name, address, city, province, zipCode, label, is_default }
 * @returns {Promise} - { status, message }
 */
export const updateAddress = async (addressData) => {
  try {
    const response = await axios.put(`${API_URL}?action=update_address`, addressData);
    return response.data;
  } catch (error) {
    console.error('Error updating address:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Delete an address
 * @param {number} addressId - Address ID
 * @param {number} userId - User ID
 * @returns {Promise} - { status, message }
 */
export const deleteAddress = async (addressId, userId) => {
  try {
    const response = await axios.delete(`${API_URL}?action=delete_address`, {
      data: { address_id: addressId, user_id: userId }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting address:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Set an address as default
 * @param {number} addressId - Address ID
 * @param {number} userId - User ID
 * @returns {Promise} - { status, message }
 */
export const setDefaultAddress = async (addressId, userId) => {
  try {
    const response = await axios.put(`${API_URL}?action=set_default_address`, {
      address_id: addressId,
      user_id: userId
    });
    return response.data;
  } catch (error) {
    console.error('Error setting default address:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * DEPRECATED: Use getDefaultAddress instead
 * Get user address from old system (kept for backward compatibility)
 */
export const getUserAddress = async (userId) => {
  console.warn('getUserAddress is deprecated. Use getDefaultAddress instead.');
  return getDefaultAddress(userId);
};

/**
 * DEPRECATED: Use updateAddress instead
 * Update user address in old system (kept for backward compatibility)
 */
export const updateUserAddress = async (userId, address) => {
  console.warn('updateUserAddress is deprecated. Use createAddress or updateAddress instead.');
  return { status: 'error', message: 'Endpoint deprecated. Use new address management system.' };
};

