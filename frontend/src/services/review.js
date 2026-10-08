// frontend/src/services/review.js
import api from "./api";

/**
 * Submit a review for a completed trip booking.
 * @param {Object} reviewData - { booking_id, rating, comment }
 */
export const submitReview = async (reviewData) => {
    const token = localStorage.getItem("token");

    const response = await api.post("/reviews", reviewData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

/**
 * Fetch reviews and average rating for a driver.
 * @param {number|string} driverId
 */
export const getDriverReviews = async (driverId) => {
    const response = await api.get(`/drivers/${driverId}/reviews`);
    return response.data;
};