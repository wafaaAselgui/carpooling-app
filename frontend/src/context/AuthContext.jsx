import {createContext , useContext, useState} from "react";

const AuthContext = createContext();

export function AuthProvider({children}){
    const [user, setUser] = useState(null);

    const loginUser = (userData , token) => {
        localStorage.setItem("token",token);
        setUser(userData);

        console.log("AuthContext user:", userData);
    };

    const logoutUser = ()=>{
        localStorage.removeItem("token");
        setUser(null);
    };

    return(
        <AuthContext.Provider value={{user,
            loginUser,
            logoutUser}}
        >
            {children}
        </AuthContext.Provider>
    );

}

export function useAuth(){
    return useContext(AuthContext);
}