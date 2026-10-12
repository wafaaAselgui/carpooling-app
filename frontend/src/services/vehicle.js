import api from "./api";

const getHeaders = (isMultipart = false) => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isMultipart ? { "Content-Type": "multipart/form-data" } : {}),
        },
    };
};

export const getMyVehicles = async () => {
    const res = await api.get("/vehicles", getHeaders());
    return res.data;
};

export const createVehicle = async (vehicleData, photoFile) => {
    const formData = new FormData();
    Object.keys(vehicleData).forEach((key) => {
        formData.append(key, vehicleData[key]);
    });
    if (photoFile) {
        formData.append("photo", photoFile);
    }
    const res = await api.post("/vehicles", formData, getHeaders(true));
    return res.data;
};

export const deleteVehicle = async (id) => {
    const res = await api.delete(`/vehicles/${id}`, getHeaders());
    return res.data;
};