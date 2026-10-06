import api from "./api";

/**
 * Fetch all vehicles owned by the logged-in user.
 */
export const getMyVehicles = async () => {
    const token = localStorage.getItem("token");

    const response = await api.get("/vehicles", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

/**
 * Register a new vehicle.
 * @param {Object} vehicleData - { brand, model, color, license_plate, seats }
 */
export const createVehicle = async (vehicleData) => {
    const token = localStorage.getItem("token");

    const response = await api.post("/vehicles", vehicleData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};