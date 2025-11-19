import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Businesses from './pages/Businesses';
import BusinessDetail from './pages/BusinessDetail';
import CategoryBusinesses from './pages/CategoryBusinesses';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Register from './pages/Register';
import AddBusiness from './pages/AddBusiness';
import WriteReview from './pages/WriteReview';
import Support from './pages/Support';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBusinesses from './pages/admin/AdminBusinesses';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCategories from './pages/admin/AdminCategories';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminContacts from './pages/admin/AdminContacts';
import AdminActivities from './pages/admin/AdminActivities';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public User Routes */}
        <Route path="/*" element={
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/businesses" element={<Businesses />} />
                <Route path="/businesses/:id" element={<BusinessDetail />} />
                <Route path="/category/:slug" element={<CategoryBusinesses />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogDetail />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/add-business" element={<AddBusiness />} />
                <Route path="/write-review" element={<WriteReview />} />
                <Route path="/support" element={<Support />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />

        {/* Admin Routes - Separate Layout */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<Navigate to="/admin" replace />} />
                  <Route path="businesses" element={<AdminBusinesses />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="blogs" element={<AdminBlogs />} />
                  <Route path="contacts" element={<AdminContacts />} />
                  <Route path="activities" element={<AdminActivities />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;

