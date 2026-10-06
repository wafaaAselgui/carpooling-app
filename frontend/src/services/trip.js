// frontend/src/services/trip.js
import api from "./api";

export const getTrips = async (filters = {}) => {
    const response = await api.get("/trips", {
        params: filters,
    });
    return response.data;
};

export const getTripById = async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
};

/**
 * Create a new trip (driver only).
 * @param {Object} tripData - trip fields including vehicle_id
 */
export const createTrip = async (tripData) => {
    const token = localStorage.getItem("token");

    const response = await api.post("/trips", tripData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};