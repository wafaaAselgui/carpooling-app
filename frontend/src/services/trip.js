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

/**
 * Fetch all trips published by the logged-in driver with passenger bookings.
 */
export const getDriverTrips = async () => {
    const token = localStorage.getItem("token");

    const response = await api.get("/driver/trips", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

/**
 * Update the status of a driver's trip (e.g. in_progress, completed, cancelled).
 * @param {number|string} tripId
 * @param {string} status
 */
export const updateTripStatus = async (tripId, status) => {
    const token = localStorage.getItem("token");

    const response = await api.patch(
        `/driver/trips/${tripId}/status`,
        { status },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};