import { useState } from "react";
import { Navbar, Nav, Container, Button, Offcanvas } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function AppNavbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const closeMenu = () => setExpanded(false);

  const handleLogout = () => {
    closeMenu();
    logoutUser();
    navigate("/");
  };

  return (
    <Navbar
      expand="lg"
      expanded={expanded}
      onToggle={setExpanded}
      className="app-navbar-glass sticky-top"
    >
      {/* Fluid container matching the 1600px page grid */}
      <Container fluid className="px-3 px-lg-5" style={{ maxWidth: "1600px" }}>
        
        {/* Brand Logo */}
        <Navbar.Brand
          as={Link}
          to="/"
          onClick={closeMenu}
          className="d-flex align-items-center fw-bold text-dark me-3 me-lg-4"
        >
          <span className="brand-mark me-2">
            <svg
              width="20"
              height="20"
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
          <span style={{ letterSpacing: "-0.02em", color: "var(--color-text-main)" }}>
            Carpool
          </span>
        </Navbar.Brand>

        {/* Mobile Header Bell (Quick access before opening drawer) */}
        <div className="d-flex align-items-center gap-2 ms-auto me-2 d-lg-none">
          {user && <NotificationBell />}
        </div>

        {/* Mobile Hamburger Toggle */}
        <Navbar.Toggle
          aria-controls="main-offcanvas-navbar"
          className="border-0 shadow-none p-1"
        />

        {/* Offcanvas Drawer on Mobile, Inline Bar on Desktop */}
        <Navbar.Offcanvas
          id="main-offcanvas-navbar"
          aria-labelledby="main-offcanvas-label"
          placement="end"
          className="app-mobile-drawer"
        >
          <Offcanvas.Header closeButton className="border-bottom px-4 py-3">
            <Offcanvas.Title id="main-offcanvas-label" className="fw-bold d-flex align-items-center gap-2 fs-5">
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
              <span>Menu</span>
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body className="d-flex flex-column flex-lg-row justify-content-between p-4 p-lg-0 w-100">
            {/* Left / Primary Nav */}
            <Nav className="flex-column flex-lg-row align-items-stretch align-items-lg-center me-lg-auto gap-1">
              <Nav.Link as={Link} to="/" onClick={closeMenu} className="drawer-nav-item py-2 py-lg-1">
                Browse Rides
              </Nav.Link>

              {user && (
                <>
                  <Nav.Link
                    as={Link}
                    to="/create-trip"
                    onClick={closeMenu}
                    className="drawer-nav-item d-flex align-items-center justify-content-between justify-content-lg-start gap-2 py-2 py-lg-1"
                  >
                    <span>Offer a Ride</span>
                    {user.verification_status === "verified" ? (
                      <span className="badge badge-sage">Verified</span>
                    ) : user.verification_status === "pending" ? (
                      <span className="badge badge-blush">Under Review</span>
                    ) : (
                      <span className="badge bg-light text-muted border">Unverified</span>
                    )}
                  </Nav.Link>

                  <Nav.Link as={Link} to="/my-bookings" onClick={closeMenu} className="drawer-nav-item py-2 py-lg-1">
                    My Bookings
                  </Nav.Link>

                  <Nav.Link as={Link} to="/driver/trips" onClick={closeMenu} className="drawer-nav-item py-2 py-lg-1">
                    Driver Schedule
                  </Nav.Link>

                  {user.is_admin && (
                    <Nav.Link
                      as={Link}
                      to="/admin"
                      onClick={closeMenu}
                      className="drawer-nav-item fw-semibold py-2 py-lg-1"
                      style={{ color: "var(--color-primary-text)" }}
                    >
                      Admin Console
                    </Nav.Link>
                  )}
                </>
              )}
            </Nav>

            {/* Right / Auth & Account Nav */}
            <Nav className="flex-column flex-lg-row align-items-stretch align-items-lg-center ms-lg-auto gap-2 gap-lg-3 drawer-auth-section">
              {user ? (
                <>
                  <div className="d-none d-lg-block me-1">
                    <NotificationBell />
                  </div>

                  <Nav.Link
                    as={Link}
                    to="/profile"
                    onClick={closeMenu}
                    className="drawer-nav-item fw-medium py-2 py-lg-1 text-nowrap"
                  >
                    My Profile
                  </Nav.Link>

                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={handleLogout}
                    className="w-100 w-lg-auto py-2 py-lg-1 text-nowrap"
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 gap-lg-3 w-100 w-lg-auto">
                  {/* Clean text link on desktop */}
                  <Nav.Link
                    as={Link}
                    to="/login"
                    onClick={closeMenu}
                    className="d-none d-lg-inline-flex align-items-center fw-medium text-dark px-2 text-nowrap"
                  >
                    Log In
                  </Nav.Link>

                  {/* Button on mobile drawer */}
                  <Button
                    as={Link}
                    to="/login"
                    onClick={closeMenu}
                    variant="outline-secondary"
                    size="sm"
                    className="d-lg-none w-100 py-2 fw-medium"
                  >
                    Log In
                  </Button>

                  {/* Sign Up CTA Button */}
                  <Button
                    as={Link}
                    to="/register"
                    onClick={closeMenu}
                    variant="primary"
                    size="sm"
                    className="w-100 w-lg-auto px-3 py-2 py-lg-1 fw-semibold text-nowrap"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
}