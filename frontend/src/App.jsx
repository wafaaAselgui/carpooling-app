import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";

import Trips from "./pages/Trips";
import TripDetails from "./pages/TripDetails";
import MyBookings from "./pages/MyBooking";
import CreateTrip from "./pages/CreateTrip";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverTrips from "./pages/DriverTrips";
import Profile from "./pages/Profile";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/AdminRoute";

function App() {
  const { user, logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <BrowserRouter>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">
            Carpooling
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link as={Link} to="/">
                Trips
              </Nav.Link>

              {user ? (
                <>
                  <Nav.Link as={Link} to="/create-trip">
                    Publish Trip
                  </Nav.Link>

                  <Nav.Link as={Link} to="/my-bookings">
                    My Bookings
                  </Nav.Link>

                  <Nav.Link as={Link} to="/driver/trips">
                    My Offered Trips
                  </Nav.Link>

                  <Nav.Link as={Link} to="/profile">
                    Mon Profil
                  </Nav.Link>

                  {user?.is_admin && (
                    <Nav.Link as={Link} to="/admin" className="text-warning fw-bold">
                      Admin Panel
                    </Nav.Link>
                  )}

                  <Nav.Link onClick={handleLogout}>
                    Logout
                  </Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/login">
                    Login
                  </Nav.Link>

                  <Nav.Link as={Link} to="/register">
                    Register
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Trips />} />
        <Route path="/trips/:id" element={<TripDetails />} />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-trip"
          element={
            <ProtectedRoute>
              <CreateTrip />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver/trips"
          element={
            <ProtectedRoute>
              <DriverTrips />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;