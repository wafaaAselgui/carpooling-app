import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="p-4 text-center">Vérification des droits...</div>;
    }

    if (!user || !user.is_admin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default AdminRoute;