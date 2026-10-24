import api from "./api";

const getHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const getAdminStats = async () => {
    const res = await api.get("/admin/stats", getHeaders());
    return res.data;
};

export const getPendingVerifications = async () => {
    const res = await api.get("/admin/verifications/pending", getHeaders());
    return res.data;
};

export const reviewUserVerification = async (userId, status) => {
    const res = await api.patch(`/admin/users/${userId}/verify`, { status }, getHeaders());
    return res.data;
};

export const reviewVehicleVerification = async (vehicleId, status) => {
    const res = await api.patch(`/admin/vehicles/${vehicleId}/verify`, { status }, getHeaders());
    return res.data;
};

export const getAdminUsers = async () => {
    const res = await api.get("/admin/users", getHeaders());
    return res.data;
};

export const toggleBanUser = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/toggle-ban`, {}, getHeaders());
    return res.data;
};

export const getAdminReports = async () => {
    const res = await api.get("/admin/reports", getHeaders());
    return res.data;
};

export const updateReportStatus = async (reportId, status, notes = "") => {
    const res = await api.patch(
        `/admin/reports/${reportId}/status`,
        {
            status,
            admin_notes: notes,
        },
        getHeaders()
    );
    return res.data;
};

export const adminCancelTrip = async (tripId) => {
    const res = await api.delete(`/admin/trips/${tripId}`, getHeaders());
    return res.data;
};

export const getUserReportHistory = async (userId) => {
    const res = await api.get(`/admin/users/${userId}/reports-history`, getHeaders());
    return res.data;
};

export const suspendUserAccount = async (userId, duration, reason = "") => {
    const res = await api.post(`/admin/users/${userId}/suspend`, { duration, reason }, getHeaders());
    return res.data;
};

export const toggleFreezeUserAccount = async (userId) => {
    const res = await api.patch(`/admin/users/${userId}/toggle-freeze`, {}, getHeaders());
    return res.data;
};