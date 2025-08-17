import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// screens
import AdminLogin from "../routes/admin-routes/AdminLogin";
import Login from "../routes/user-routes/Login";
import Register from "../routes/user-routes/Register";
import HomePage from "../routes/user-routes/HomePage";
import MainHome from "../routes/user-routes/MainHome";
import GeoLocation from "../routes/user-routes/GeolocationWithMap";
import SendEmail from "../routes/user-routes/SendEmail";
import Success from "../routes/user-routes/Success";
import MyTicket from "../routes/user-routes/MyTicket";
import ReportPage from "../routes/user-routes/ReportPage";
import Profile from "@/routes/user-routes/Profile";
import ContactUs from "@/routes/user-routes/Contact";
import AboutUniClaim from "@/routes/user-routes/AboutUniClaim";

// wrappers
import ProtectedRoute from "../components/ProtectedRoute";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";
import PageWrapper from "@/components/PageWrapper";
import ScrollToTop from "@/context/ScrollTop";

export default function PageRoutes() {
  // ✅ No need for local posts state anymore - using custom hooks

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PageWrapper title="User Login">
                <Login />
              </PageWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <PageWrapper title="Register">
                <Register />
              </PageWrapper>
            }
          />
          <Route
            path="/adminlogin"
            element={
              <PageWrapper title="Admin Login">
                <AdminLogin />
              </PageWrapper>
            }
          />

          {/* Protected routes using MainHome as layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainHome />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <PageWrapper title="Home">
                  <HomePage />
                </PageWrapper>
              }
            />
            <Route
              path="report"
              element={
                <PageWrapper title="Report ">
                  <ReportPage />
                </PageWrapper>
              }
            />
            <Route
              path="ticket"
              element={
                <PageWrapper title="My Ticket">
                  <MyTicket />
                </PageWrapper>
              }
            />
            <Route
              path="sendemail"
              element={
                <PageWrapper title="Send Email">
                  <SendEmail />
                </PageWrapper>
              }
            />
            <Route
              path="success"
              element={
                <PageWrapper title="Success">
                  <Success />
                </PageWrapper>
              }
            />
            <Route
              path="geolocation"
              element={
                <PageWrapper title="Geolocation">
                  <GeoLocation />
                </PageWrapper>
              }
            />
            <Route
              path="profile"
              element={
                <PageWrapper title="My Profile">
                  <Profile />
                </PageWrapper>
              }
            />
            <Route
              path="contact_us"
              element={
                <PageWrapper title="Contact Us">
                  <ContactUs />
                </PageWrapper>
              }
            />
            <Route
              path="aboutuniclaim"
              element={
                <PageWrapper title="About UniClaim">
                  <AboutUniClaim />
                </PageWrapper>
              }
            />
          </Route>

          {/* Catch-all: redirect unknown or unauthenticated routes to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
    </AuthProvider>
  );
}
