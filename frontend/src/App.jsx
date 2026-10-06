import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";

import Trips from "./pages/Trips";
import TripDetails from "./pages/TripDetails";
import MyBookings from "./pages/MyBooking";
import CreateTrip from "./pages/CreateTrip";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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

          <Nav className="ms-auto">
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
        </Container>
      </Navbar>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Trips />} />
        <Route path="/trips/:id" element={<TripDetails />} />

        {/* Protected Routes */}
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;