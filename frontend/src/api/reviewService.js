import axiosInstance from './axiosInstance';

export const submitReview = async (productId, orderId, rating, review) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await axiosInstance.post('?action=add_review', {
      product_id: productId,
      user_id: user.id,
      order_id: orderId,
      rating,
      review,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

export const getProductReviews = async (productId) => {
  try {
    const response = await axiosInstance.get(`?action=get_product_reviews&product_id=${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

export const getProductRating = async (productId) => {
  try {
    const response = await axiosInstance.get(`?action=get_product_rating&product_id=${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rating:', error);
    throw error;
  }
};

export const checkUserReview = async (productId, orderId) => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const response = await axiosInstance.get(
      `?action=check_user_review&user_id=${user.id}&product_id=${productId}&order_id=${orderId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error checking review:', error);
    throw error;
  }
};
