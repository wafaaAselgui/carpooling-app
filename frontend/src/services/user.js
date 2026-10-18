import api from "./api";

export const getUserPublicProfile = async (userId) => {
    const res = await api.get(`/users/${userId}/profile`);
    return res.data;
};