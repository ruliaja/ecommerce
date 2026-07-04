import axiosInstance from './axiosInstance';

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const response = await axiosInstance.post('?action=get_user_profile', {
      user_id: userId
    });

    console.log(response.data);

    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat mengambil profil'
    };
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await axiosInstance.post('?action=update_user_profile', {
      user_id: userId,
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: profileData.address,
      profile_image: profileData.profile_image
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat memperbarui profil'
    };
  }
};

// Change password
export const changePassword = async (userId, oldPassword, newPassword) => {
  try {
    const response = await axiosInstance.post('?action=change_password', {
      user_id: userId,
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    return {
      status: 'error',
      message: error.response?.data?.message || 'Terjadi kesalahan saat mengubah password'
    };
  }
};

