import api from "./api";

const getAuthHeaders = (isFormData = false) => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormData ? { "Content-Type": "multipart/form-data" } : {}),
        },
    };
};

export const getProfile = async () => {
    const res = await api.get("/profile", getAuthHeaders());
    return res.data;
};

export const updateProfile = async (data) => {
    const res = await api.put("/profile", data, getAuthHeaders());
    return res.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/profile/avatar", formData, getAuthHeaders(true));
    return res.data;
};

export const submitVerification = async (cinNumber, file) => {
    const formData = new FormData();
    formData.append("cin_number", cinNumber);
    formData.append("cin_document", file);
    const res = await api.post("/profile/verify", formData, getAuthHeaders(true));
    return res.data;
};