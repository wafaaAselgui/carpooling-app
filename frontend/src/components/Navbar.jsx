import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function AppNavbar() {
  const { user, logoutUser } = useAuth();

  return (
    <Navbar expand="lg" className="app-navbar-glass">
      <Container>
        {/* Brand Logo with geometric route icon */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold text-dark me-4">
          <span className="brand-mark">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="19" r="3" />
              <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
              <circle cx="18" cy="5" r="3" />
            </svg>
          </span>
          <span style={{ letterSpacing: "-0.02em", color: "var(--color-text-main)" }}>Carpool</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar-nav" className="border-0 shadow-none" />

        <Navbar.Collapse id="main-navbar-nav">
          <Nav className="me-auto align-items-lg-center gap-1">
            <Nav.Link as={Link} to="/">
              Browse Rides
            </Nav.Link>

            {user && (
              <>
                <Nav.Link as={Link} to="/create-trip" className="d-flex align-items-center gap-1">
                  Offer a Ride
                  {user.verification_status === "verified" ? (
                    <span className="badge badge-sage ms-1" style={{ fontSize: "11px" }}>
                      Verified
                    </span>
                  ) : user.verification_status === "pending" ? (
                    <span className="badge badge-blush ms-1" style={{ fontSize: "11px" }}>
                      Under Review
                    </span>
                  ) : (
                    <span className="badge bg-light text-muted border ms-1" style={{ fontSize: "11px" }}>
                      Unverified
                    </span>
                  )}
                </Nav.Link>

                <Nav.Link as={Link} to="/my-bookings">
                  My Bookings
                </Nav.Link>

                <Nav.Link as={Link} to="/driver/trips">
                  Driver Schedule
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="ms-auto align-items-lg-center gap-2 mt-2 mt-lg-0">
            {user ? (
              <>
                {user.is_admin && (
                  <Nav.Link
                    as={Link}
                    to="/admin"
                    className="fw-semibold px-2"
                    style={{ color: "var(--color-primary-text)" }}
                  >
                    Admin Console
                  </Nav.Link>
                )}

                {/* Notification Bell Component */}
                <NotificationBell />

                <Nav.Link as={Link} to="/profile" className="fw-medium">
                  My Profile
                </Nav.Link>

                <Button
                  // variant="outline-secondary"
                  size="sm"
                  onClick={logoutUser}
                  className="ms-lg-2"
                  style={{
                    borderColor: "var(--brand-navy)",
                    color: "var(--brand-teal-mist)",
                  }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="fw-medium">
                  Log In
                </Nav.Link>
                <Button as={Link} to="/register" variant="primary" size="sm">
                  Sign Up
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}