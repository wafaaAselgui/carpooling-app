import api from "./api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const getAdminStats = async () => {
    const res = await api.get("/admin/stats", getAuthHeaders());
    return res.data;
};

export const getAdminUsers = async () => {
    const res = await api.get("/admin/users", getAuthHeaders());
    return res.data;
};

export const getAdminTrips = async () => {
    const res = await api.get("/admin/trips", getAuthHeaders());
    return res.data;
};

export const adminCancelTrip = async (tripId) => {
    const res = await api.patch(`/admin/trips/${tripId}/cancel`, {}, getAuthHeaders());
    return res.data;
};