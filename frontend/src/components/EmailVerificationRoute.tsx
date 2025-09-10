import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface EmailVerificationRouteProps {
  children: JSX.Element;
}

export default function EmailVerificationRoute({ children }: EmailVerificationRouteProps) {
  const { isAuthenticated, loading, needsEmailVerification, userData } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user needs email verification, redirect to verification page
  if (needsEmailVerification) {
    return <Navigate to="/email-verification" replace />;
  }

  // User is authenticated and verified, render the protected content
  return children;
}
