import api from "./api";

export const register = async (userData) =>{
    const response = await api.post("/register" , userData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await api.post("/login" , credentials);
    return response.data;
}

export const logout = async (token)=>{
    const response = await api.post(
        "/logout",
        {},
        {
            headers: {
                Authorization:`Bearer ${token}`,
            },
        }
    );

    return response.data;
}

export const getCurrentUser = async (token) =>{
    const response = await api.get("/user",{
        headers:{
            Authorization:`Bearer ${token}`
        },
    });

    return response.data;
}