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
      <Container>
        {/* Brand Logo */}
        <Navbar.Brand
          as={Link}
          to="/"
          onClick={closeMenu}
          className="d-flex align-items-center fw-bold text-dark me-2 me-lg-4"
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

        {/* Mobile Header Bell (Quick access before opening menu) */}
        <div className="d-flex align-items-center gap-2 ms-auto me-2 d-lg-none">
          {user && <NotificationBell />}
        </div>

        {/* Hamburger Toggle */}
        <Navbar.Toggle
          aria-controls="main-offcanvas-navbar"
          className="border-0 shadow-none p-1"
        />

        {/* Offcanvas Drawer */}
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

          <Offcanvas.Body className="p-4 p-lg-0">
            {/* Primary Nav Links */}
            <Nav className="flex-column flex-lg-row align-items-stretch align-items-lg-center me-lg-auto gap-1 w-100 w-lg-auto">
              <Nav.Link as={Link} to="/" onClick={closeMenu} className="drawer-nav-item">
                Browse Rides
              </Nav.Link>

              {user && (
                <>
                  <Nav.Link
                    as={Link}
                    to="/create-trip"
                    onClick={closeMenu}
                    className="drawer-nav-item d-flex align-items-center justify-content-between justify-content-lg-start gap-2"
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

                  <Nav.Link as={Link} to="/my-bookings" onClick={closeMenu} className="drawer-nav-item">
                    My Bookings
                  </Nav.Link>

                  <Nav.Link as={Link} to="/driver/trips" onClick={closeMenu} className="drawer-nav-item">
                    Driver Schedule
                  </Nav.Link>

                  {user.is_admin && (
                    <Nav.Link
                      as={Link}
                      to="/admin"
                      onClick={closeMenu}
                      className="drawer-nav-item fw-semibold"
                      style={{ color: "var(--color-primary-text)" }}
                    >
                      Admin Console
                    </Nav.Link>
                  )}
                </>
              )}
            </Nav>

            {/* Auth / Profile Links (Sticks to bottom of drawer on mobile) */}
            <div className="w-100 w-lg-auto mt-4 mt-lg-0 pt-3 pt-lg-0 border-top border-lg-0">
              {user ? (
                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2">
                  {/* Desktop Bell */}
                  <div className="d-none d-lg-block me-2">
                    <NotificationBell />
                  </div>

                  <Nav.Link
                    as={Link}
                    to="/profile"
                    onClick={closeMenu}
                    className="drawer-nav-item"
                  >
                    My Profile
                  </Nav.Link>

                  <Button
                    onClick={handleLogout}
                    variant="outline-danger"
                    size="sm"
                    className="drawer-btn ms-lg-2"
                  >
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 w-100">
                  <Button
                    as={Link}
                    to="/login"
                    onClick={closeMenu}
                    variant="outline-secondary"
                    size="sm"
                    className="drawer-btn"
                  >
                    Log In
                  </Button>
                  <Button
                    as={Link}
                    to="/register"
                    onClick={closeMenu}
                    variant="primary"
                    size="sm"
                    className="drawer-btn"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
}