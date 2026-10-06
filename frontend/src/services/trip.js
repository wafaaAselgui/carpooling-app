import api from "./api";

/**
 * Fetch trips with optional filter parameters.
 * @param {Object} filters - { departure_city, destination_city, date }
 */
export const getTrips = async (filters = {}) => {
    // Axios converts the `params` object into query string parameters automatically:
    // e.g. { departure_city: 'Casablanca' } -> /trips?departure_city=Casablanca
    const response = await api.get("/trips", {
        params: filters,
    });

    return response.data;
};

/**
 * Fetch a single trip by ID with its driver and vehicle relations.
 */
export const getTripById = async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
};