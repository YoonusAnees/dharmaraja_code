import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function ProtectedRoute({ children, role }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return <Navigate to="/login" />;
  }

  return children;
}