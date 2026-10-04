import {createContext , useContext, useEffect, useState} from "react";
import { getCurrentUser, logout } from "../services/auth";
const AuthContext = createContext();

export function AuthProvider({children}){
    const [user, setUser]=useState(null);
    const [loading, setLoading]=useState(true);
    

    useEffect(()=>{
        const token= localStorage.getItem("token");

        if(!token){
            setLoading(false);
            return;
        }

        getCurrentUser(token)
            .then((userData)=>{
                console.log("Current user from API:", userData);
                setUser(userData);
            })
            .catch((error)=>{
                console.log("getCurrentUser failed:", error.response?.status);
                console.log("Error:", error.response?.data);
                //localStorage.removeItem("token");
                setUser(null);
            })
            .finally(()=>{
                setLoading(false);
            });
    },[]);
    
    const loginUser = (userData , token) => {
        console.log("Token received:", token);
        localStorage.setItem("token",token);
        setUser(userData);
        navigate("/");
    };

    const logoutUser = async () => {
        const token = localStorage.getItem("token");

        try {
            if (token) {
                await logout(token);
            }
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem("token");
            setUser(null);
        }
    };

    return(
        <AuthContext.Provider value={{ user,
                loading,
                loginUser,
                logoutUser,}}
        >
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth(){
    return useContext(AuthContext);
}