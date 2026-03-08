import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CaretakerAuthProvider } from './context/CaretakerAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CaretakerProtectedRoute from './components/CaretakerProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';

// Pages
import CreateAdmin from './pages/auth/createAdmin';
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import Profile from './pages/auth/Profile';
import GetBookings from './components/Bookings/GetBookings';
import AddEditBooking from './components/Bookings/AddEditBooking';
import { Dashboard, Locations, Review, Memories, LocationForm, GetPoolParties, GetPoolPartyBookings, AddEditPoolPartyBooking, AdminBookingModal, AdminCreatePoolPartyBookingPage } from "./pages";
import { AddLocation, GetLocations } from "./components/Locations";
import { AddReview, GetReviews } from "./components/Reviews";
import { AddImage, GetImages } from "./components/Memories";
import { GetOffers, OfferForm } from "./components/Offers";
import HomepageHeroManagement from "./components/HomepageHeroManagement";
import {CreateCaretaker, CaretakerBookings, CaretakerDashboard, CaretakerLogin, CaretakerProfile, CaretakerRegister, GetCaretakers } from './pages/Caretaker';
import { TermList, TermsForm, TermsView } from './components/TermsAndConditions';

function App() {
  return (
    <AuthProvider>
      <CaretakerAuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/caretaker/login" element={<CaretakerLogin />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/create" element={
              <ProtectedRoute>
                <AdminLayout>
                  <CreateAdmin />
                </AdminLayout>
              </ProtectedRoute> 
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/change-password" element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            } />

            <Route path="/hero-image-management" element={
              <ProtectedRoute>
                <AdminLayout>
                  <HomepageHeroManagement />
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Locations */}
            <Route path="/locations" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Locations />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/locations/new" element={
              <ProtectedRoute>
                <AdminLayout>
                  <LocationForm />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/locations/edit/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <LocationForm />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/get-locations" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetLocations />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Reviews */}
            <Route path="/reviews" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Review />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/get-reviews" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetReviews />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/reviews/new" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AddReview />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/reviews/edit/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AddReview />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Terms and Conditions */}
            {/* Reviews */}
            <Route path="/admin/terms" element={
              <ProtectedRoute>
                <AdminLayout>
                  <TermList />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/terms/create" element={
              <ProtectedRoute>
                <AdminLayout>
                  <TermsForm />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/terms/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <TermsView />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/terms/:id/edit" element={
              <ProtectedRoute>
                <AdminLayout>
                  <TermsForm />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Memories */}
            <Route path="/memories" element={
              <ProtectedRoute>
                <AdminLayout>
                  <Memories />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/get-memories" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetImages />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/images/new" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AddImage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/images/edit/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AddImage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Bookings */}
            <Route path="/bookings" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetBookings />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/bookings/new" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminBookingModal />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/bookings/edit/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AddEditBooking />
                </AdminLayout>
              </ProtectedRoute>
            } />

             <Route path="/pool-parties" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetPoolParties />
                </AdminLayout>
              </ProtectedRoute>
            } />

             <Route path="/pool-party-bookings" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetPoolPartyBookings />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/pool-party-bookings/new" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminCreatePoolPartyBookingPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/pool-party-bookings/edit/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AddEditPoolPartyBooking />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Offers */}
            <Route path="/admin/offers" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetOffers />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/offers/create" element={
              <ProtectedRoute>
                <AdminLayout>
                  <OfferForm />
                </AdminLayout>
              </ProtectedRoute>
            } />

            <Route path="/admin/offers/edit/:offerId" element={
              <ProtectedRoute>
                <AdminLayout>
                  <OfferForm />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Caretaker Protected Routes */}
            <Route path="/caretaker/dashboard" element={
              <CaretakerProtectedRoute>
                <CaretakerDashboard />
              </CaretakerProtectedRoute>
            } />

            <Route path="/caretaker/bookings" element={
              <CaretakerProtectedRoute>
                <CaretakerDashboard>
                  <CaretakerBookings />
                </CaretakerDashboard>
              </CaretakerProtectedRoute>
            } />

            <Route path="/caretaker/profile" element={
              <CaretakerProtectedRoute>
                <CaretakerDashboard>
                  <CaretakerProfile />
                </CaretakerDashboard>
              </CaretakerProtectedRoute>
            } />

            {/* Admin-only Caretaker Registration */}
            <Route path="/caretaker/register" element={
              <ProtectedRoute>
                <AdminLayout>
                  <CaretakerRegister />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Admin-only Caretaker Registration */}
            <Route path="/caretakers/create" element={
              <ProtectedRoute>
                <AdminLayout>
                  <CreateCaretaker />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Admin-only Caretaker Registration */}
            <Route path="/caretakers/edit/:id" element={
              <ProtectedRoute>
                <AdminLayout>
                  <CreateCaretaker />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Admin-only Caretaker Registration */}
            <Route path="/caretaker/all" element={
              <ProtectedRoute>
                <AdminLayout>
                  <GetCaretakers />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CaretakerAuthProvider>
    </AuthProvider>
  );
}

export default App;