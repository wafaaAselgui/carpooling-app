import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Alert,
  Spinner,
  Image,
  Modal,
  Form,
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../services/api";
import { respondToBooking } from "../services/booking";
import { submitReview } from "../services/review";
import { useAuth } from "../context/AuthContext";

function StarRatingInputs({ value, onChange }) {
  return (
    <div className="d-flex align-items-center gap-2 justify-content-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="btn p-1 border-0 bg-transparent shadow-none"
          onClick={() => onChange(star)}
          style={{
            color: star <= value ? "var(--color-accent)" : "var(--color-border-strong)",
            transition: "transform 0.1s ease",
          }}
          aria-label={`Rate ${star} star`}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={star <= value ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function DriverTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  // Filter tab: 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [activeTab, setActiveTab] = useState("all");

  // Status Confirmation Modal state (replaces window.confirm)
  const [statusModal, setStatusModal] = useState({
    show: false,
    tripId: null,
    newStatus: null,
    routeLabel: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Review Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:8000";

  const loadDriverTrips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      const res = await api.get("/driver/trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      setError("Failed to load your offered trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverTrips();
  }, []);

  // Tab counts & filtered trips
  const counts = useMemo(() => {
    return {
      all: trips.length,
      upcoming: trips.filter((t) => t.status === "scheduled" || t.status === "in_progress").length,
      completed: trips.filter((t) => t.status === "completed").length,
      cancelled: trips.filter((t) => t.status === "cancelled").length,
    };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (activeTab === "all") return trips;
    if (activeTab === "upcoming") {
      return trips.filter((t) => t.status === "scheduled" || t.status === "in_progress");
    }
    return trips.filter((t) => t.status === activeTab);
  }, [trips, activeTab]);

  const handleBookingResponse = async (bookingId, action) => {
    setActionLoading(bookingId);
    setFeedback(null);
    setError(null);
    try {
      const res = await respondToBooking(bookingId, action);
      setFeedback(res.message || `Booking ${action}ed.`);
      await loadDriverTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process booking request.");
    } finally {
      setActionLoading(null);
    }
  };

  const promptStatusChange = (trip, newStatus) => {
    setStatusModal({
      show: true,
      tripId: trip.id,
      newStatus,
      routeLabel: `${trip.departure_city} → ${trip.destination_city}`,
    });
  };

  const confirmStatusChange = async () => {
    const { tripId, newStatus } = statusModal;
    setUpdatingStatus(true);
    setFeedback(null);
    setError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      await api.patch(
        `/driver/trips/${tripId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusModal({ show: false, tripId: null, newStatus: null, routeLabel: "" });
      setFeedback(`Trip status updated to ${newStatus}.`);
      await loadDriverTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update trip status.");
      setStatusModal({ show: false, tripId: null, newStatus: null, routeLabel: "" });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openReviewModal = (booking) => {
    setSelectedBooking(booking);
    setReviewForm({ rating: 5, comment: "" });
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await submitReview({
        booking_id: selectedBooking.id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });
      setShowReviewModal(false);
      setFeedback(`Review submitted for passenger ${selectedBooking?.user?.name || ""}.`);
      await loadDriverTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
      setShowReviewModal(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderBookingBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="badge badge-sage px-2 py-1">Confirmed</span>;
      case "pending":
        return (
          <span
            className="badge px-2 py-1"
            style={{
              backgroundColor: "var(--color-warning-subtle)",
              color: "var(--color-warning)",
              border: "1px solid rgba(138, 90, 0, 0.25)",
            }}
          >
            Pending
          </span>
        );
      case "rejected":
        return <span className="badge badge-blush px-2 py-1">Declined</span>;
      case "cancelled":
        return <span className="badge bg-light text-muted border px-2 py-1">Cancelled</span>;
      default:
        return <span className="badge bg-light text-muted border px-2 py-1">{status}</span>;
    }
  };

  const renderTripBadge = (status) => {
    switch (status) {
      case "scheduled":
        return <span className="badge badge-sage px-2 py-1">Scheduled</span>;
      case "in_progress":
        return (
          <span
            className="badge px-2 py-1"
            style={{
              backgroundColor: "var(--color-warning-subtle)",
              color: "var(--color-warning)",
              border: "1px solid rgba(138, 90, 0, 0.25)",
            }}
          >
            In Progress
          </span>
        );
      case "completed":
        return <span className="badge bg-light text-dark border px-2 py-1">Completed</span>;
      case "cancelled":
        return <span className="badge badge-blush px-2 py-1">Cancelled</span>;
      default:
        return <span className="badge bg-light text-muted border px-2 py-1">{status}</span>;
    }
  };

  const getPassengerAvatar = (passenger) => {
    if (passenger?.avatar_url?.trim()) return passenger.avatar_url;
    if (passenger?.avatar_path?.trim()) {
      return `${backendBase}/storage/${passenger.avatar_path.replace(/^\/+/, "")}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      passenger?.name || "Passenger"
    )}&background=0b7f70&color=fff`;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center mt-3">
        <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
        <p className="mt-2 text-muted small">Loading offered journeys...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3 py-md-4 px-3 px-lg-5" style={{ maxWidth: "1200px" }}>
      {/* Top Header with Quick Action */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3 mb-md-4">
        <div>
          <h2
            className="fw-bold mb-1 fs-4 fs-md-2"
            style={{ color: "var(--color-text-main)", letterSpacing: "-0.02em" }}
          >
            Driver Schedule
          </h2>
          <p className="text-muted small mb-0">
            Manage passenger requests, track capacity, and review completed rides.
          </p>
        </div>

        <Button
          as={Link}
          to="/create-trip"
          size="sm"
          className="btn-accent align-self-stretch align-self-sm-auto px-3 py-2 d-inline-flex align-items-center justify-content-center gap-1 flex-shrink-0"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Offer a Ride</span>
        </Button>
      </div>

      {/* Horizontal Scrollable Status Filter Tabs */}
      {trips.length > 0 && (
        <div className="d-flex align-items-center gap-2 overflow-auto pb-2 mb-3">
          {[
            { key: "all", label: "All Rides", count: counts.all },
            { key: "upcoming", label: "Upcoming", count: counts.upcoming },
            { key: "completed", label: "Completed", count: counts.completed },
            { key: "cancelled", label: "Cancelled", count: counts.cancelled },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 text-nowrap border"
                style={{
                  backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface)",
                  color: isActive ? "#ffffff" : "var(--color-text-muted)",
                  borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span>{tab.label}</span>
                <Badge
                  bg={isActive ? "light" : "secondary"}
                  text={isActive ? "dark" : "light"}
                  pill
                  style={{ fontSize: "10.5px" }}
                >
                  {tab.count}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {feedback && (
        <Alert
          dismissible
          onClose={() => setFeedback(null)}
          className="mb-3"
          style={{
            backgroundColor: "var(--color-success-subtle)",
            color: "var(--color-success)",
            border: "none",
          }}
        >
          {feedback}
        </Alert>
      )}

      {error && (
        <Alert
          dismissible
          onClose={() => setError(null)}
          className="mb-3"
          style={{
            backgroundColor: "var(--color-danger-subtle)",
            color: "var(--color-danger)",
            border: "none",
          }}
        >
          {error}
        </Alert>
      )}

      {trips.length === 0 ? (
        <Card className="border-0 shadow-sm p-4 p-md-5 text-center">
          <p className="text-muted mb-3">You have not published any rides yet.</p>
          <div>
            <Button as={Link} to="/create-trip" variant="primary" size="sm" className="px-4">
              Offer a Ride
            </Button>
          </div>
        </Card>
      ) : filteredTrips.length === 0 ? (
        <Card className="border-0 shadow-sm p-4 text-center">
          <p className="text-muted small mb-0">No rides in this category.</p>
        </Card>
      ) : (
        filteredTrips.map((trip) => {
          const isCompleted = trip.status === "completed";
          const pendingCount = (trip.bookings || []).filter((b) => b.status === "pending").length;

          return (
            <Card key={trip.id} className="shadow-sm border-0 mb-3 mb-md-4 overflow-hidden">
              {/* Trip Header */}
              <Card.Header
                className="bg-white py-3 px-3 px-md-4 border-bottom d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-2"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <div style={{ minWidth: 0 }} className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h5 className="fw-bold mb-1 text-capitalize fs-6 fs-md-5 text-truncate">
                      {trip.departure_city}
                      <span className="mx-2 text-muted fw-light">→</span>
                      {trip.destination_city}
                    </h5>
                    <div className="d-md-none flex-shrink-0">{renderTripBadge(trip.status)}</div>
                  </div>

                  <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                    <span className="d-inline-flex align-items-center gap-1 text-nowrap">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {new Date(trip.departure_time).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    {trip.vehicle && (
                      <>
                        <span>•</span>
                        <span className="text-nowrap">
                          {trip.vehicle.brand} {trip.vehicle.model} ({trip.vehicle.license_plate})
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Capacity & Status */}
                <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-3 mt-1 mt-md-0 flex-shrink-0">
                  <span
                    className="small px-2 py-1 rounded-2 text-nowrap"
                    style={{
                      backgroundColor: "var(--color-surface-tint)",
                      color: "var(--color-primary-text)",
                    }}
                  >
                    Seats: <strong>{trip.available_seats} / {trip.total_seats} free</strong>
                  </span>
                  <div className="d-none d-md-block">{renderTripBadge(trip.status)}</div>
                </div>
              </Card.Header>

              {/* Passenger Requests */}
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-semibold text-uppercase text-muted small mb-0">
                    Passenger Requests ({trip.bookings?.length || 0})
                  </h6>
                  {pendingCount > 0 && (
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: "var(--color-accent-subtle)",
                        color: "var(--color-accent-subtle-text)",
                        fontSize: "11px",
                      }}
                    >
                      {pendingCount} pending action
                    </span>
                  )}
                </div>

                {!trip.bookings || trip.bookings.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No booking requests submitted for this ride yet.
                  </p>
                ) : (
                  <>
                    {/* 1. Mobile Cards View (< 768px) */}
                    <div className="d-flex flex-column gap-2 d-md-none">
                      {trip.bookings.map((booking) => {
                        const passenger = booking.user;
                        const driverAlreadyReviewed = booking.reviews?.some(
                          (r) => r.reviewer_id === user?.id
                        );

                        return (
                          <div
                            key={`mobile-b-${booking.id}`}
                            className="p-3 border rounded-3"
                            style={{
                              backgroundColor:
                                booking.status === "pending"
                                  ? "var(--color-warning-subtle)"
                                  : "var(--color-canvas)",
                              borderColor: "var(--color-border)",
                            }}
                          >
                            {/* Passenger Info + State */}
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                                <Link
                                  to={`/users/${passenger?.id}/profile`}
                                  className="flex-shrink-0"
                                >
                                  <Image
                                    src={getPassengerAvatar(passenger)}
                                    roundedCircle
                                    width={38}
                                    height={38}
                                    className="object-fit-cover border"
                                    style={{ borderColor: "var(--color-border)" }}
                                    alt={passenger?.name || "Passenger"}
                                    onError={(e) => {
                                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        passenger?.name || "Passenger"
                                      )}&background=0b7f70&color=fff`;
                                    }}
                                  />
                                </Link>
                                <div style={{ minWidth: 0 }}>
                                  <Link
                                    to={`/users/${passenger?.id}/profile`}
                                    className="fw-semibold text-decoration-none d-block text-truncate"
                                    style={{ color: "var(--color-text-main)" }}
                                  >
                                    {passenger?.name || "Anonymous"}
                                  </Link>

                                  {/* Direct Tap-to-Call or Email on Mobile */}
                                  {passenger?.phone ? (
                                    <a
                                      href={`tel:${passenger.phone}`}
                                      className="small d-inline-flex align-items-center gap-1 text-decoration-none"
                                      style={{ fontSize: "12px" }}
                                    >
                                      {passenger.phone}
                                    </a>
                                  ) : passenger?.email ? (
                                    <a
                                      href={`mailto:${passenger.email}`}
                                      className="small text-muted text-truncate d-block text-decoration-none"
                                      style={{ fontSize: "11.5px" }}
                                    >
                                      {passenger.email}
                                    </a>
                                  ) : (
                                    <span className="text-muted" style={{ fontSize: "11px" }}>
                                      No contact info
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">{renderBookingBadge(booking.status)}</div>
                            </div>

                            {/* Seats & Total Value */}
                            <div
                              className="d-flex justify-content-between align-items-center py-2 border-top my-2 small"
                              style={{ borderColor: "var(--color-border)" }}
                            >
                              <span className="text-muted">
                                Requested:{" "}
                                <strong className="text-dark">
                                  {booking.seats} seat{booking.seats > 1 ? "s" : ""}
                                </strong>
                              </span>
                              <strong style={{ color: "var(--color-primary-text)" }}>
                                {booking.seats * trip.price_per_seat} MAD
                              </strong>
                            </div>

                            {/* Actions */}
                            {booking.status === "pending" ? (
                              <div className="d-flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="flex-fill"
                                  disabled={
                                    actionLoading === booking.id ||
                                    trip.available_seats < booking.seats
                                  }
                                  onClick={() => handleBookingResponse(booking.id, "accept")}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  className="flex-fill"
                                  disabled={actionLoading === booking.id}
                                  onClick={() => handleBookingResponse(booking.id, "reject")}
                                >
                                  Decline
                                </Button>
                              </div>
                            ) : isCompleted && booking.status === "confirmed" ? (
                              driverAlreadyReviewed ? (
                                <span className="badge bg-light text-muted border py-2 px-2 w-100 text-center">
                                  Feedback Submitted
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  className="w-100 mt-1"
                                  onClick={() => openReviewModal(booking)}
                                >
                                  Rate Passenger
                                </Button>
                              )
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* 2. Desktop Table View (>= 768px) */}
                    <Table responsive hover align="middle" className="mb-0 small d-none d-md-table">
                      <thead>
                        <tr>
                          <th>Passenger</th>
                          <th>Contact Info</th>
                          <th>Seats Requested</th>
                          <th>Total Value</th>
                          <th>Booking State</th>
                          <th>Response</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trip.bookings.map((booking) => {
                          const passenger = booking.user;
                          const driverAlreadyReviewed = booking.reviews?.some(
                            (r) => r.reviewer_id === user?.id
                          );

                          return (
                            <tr key={booking.id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <Link to={`/users/${passenger?.id}/profile`}>
                                    <Image
                                      src={getPassengerAvatar(passenger)}
                                      roundedCircle
                                      width={34}
                                      height={34}
                                      className="object-fit-cover border"
                                      style={{ borderColor: "var(--color-border)" }}
                                      alt={passenger?.name || "Passenger"}
                                    />
                                  </Link>
                                  <div>
                                    <Link
                                      to={`/users/${passenger?.id}/profile`}
                                      className="fw-semibold text-decoration-none"
                                      style={{ color: "var(--color-text-main)" }}
                                    >
                                      {passenger?.name || "Anonymous"}
                                    </Link>
                                    {passenger?.verification_status === "verified" && (
                                      <div className="mt-1">
                                        <span
                                          className="badge badge-sage py-0 px-1"
                                          style={{ fontSize: "10px" }}
                                        >
                                          Verified ID
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>{passenger?.email || "No email"}</div>
                                <div className="text-muted" style={{ fontSize: "11px" }}>
                                  {passenger?.phone || "No phone provided"}
                                </div>
                              </td>
                              <td>
                                <strong>{booking.seats}</strong> seat{booking.seats > 1 ? "s" : ""}
                              </td>
                              <td>
                                <strong style={{ color: "var(--color-primary-text)" }}>
                                  {booking.seats * trip.price_per_seat} MAD
                                </strong>
                              </td>
                              <td>{renderBookingBadge(booking.status)}</td>
                              <td>
                                {booking.status === "pending" ? (
                                  <div className="d-flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      disabled={
                                        actionLoading === booking.id ||
                                        trip.available_seats < booking.seats
                                      }
                                      onClick={() => handleBookingResponse(booking.id, "accept")}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-danger"
                                      disabled={actionLoading === booking.id}
                                      onClick={() => handleBookingResponse(booking.id, "reject")}
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                ) : isCompleted && booking.status === "confirmed" ? (
                                  driverAlreadyReviewed ? (
                                    <span className="badge bg-light text-muted border py-1 px-2">
                                      Feedback Submitted
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline-secondary"
                                      onClick={() => openReviewModal(booking)}
                                    >
                                      Rate Passenger
                                    </Button>
                                  )
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </>
                )}
              </Card.Body>

              {/* Trip Status Actions */}
              {trip.status === "scheduled" && (
                <Card.Footer
                  className="bg-white border-top d-flex flex-column flex-sm-row justify-content-sm-end gap-2 py-3 px-3 px-md-4"
                  style={{ borderColor: "var(--color-border-subtle)" }}
                >
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="align-self-stretch align-self-sm-auto"
                    onClick={() => promptStatusChange(trip, "completed")}
                  >
                    Mark Journey Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="align-self-stretch align-self-sm-auto"
                    onClick={() => promptStatusChange(trip, "cancelled")}
                  >
                    Cancel Ride
                  </Button>
                </Card.Footer>
              )}
            </Card>
          );
        })
      )}

      {/* Status Confirmation Modal */}
      <Modal
        show={statusModal.show}
        onHide={() => !updatingStatus && setStatusModal({ ...statusModal, show: false })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {statusModal.newStatus === "completed" ? "Complete Journey" : "Cancel Ride"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">
          Are you sure you want to mark <strong>{statusModal.routeLabel}</strong> as{" "}
          <strong>{statusModal.newStatus}</strong>?
          {statusModal.newStatus === "cancelled" && (
            <p className="text-danger mt-2 mb-0">
              All confirmed passengers will be notified of the cancellation.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="m-0"
            disabled={updatingStatus}
            onClick={() => setStatusModal({ ...statusModal, show: false })}
          >
            Keep Scheduled
          </Button>
          <Button
            variant={statusModal.newStatus === "cancelled" ? "danger" : "primary"}
            size="sm"
            className="m-0"
            disabled={updatingStatus}
            onClick={confirmStatusChange}
          >
            {updatingStatus
              ? "Updating..."
              : statusModal.newStatus === "completed"
              ? "Yes, Mark Completed"
              : "Yes, Cancel Ride"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Driver -> Passenger Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
          <Modal.Title className="fs-6 fw-semibold">
            Rate Passenger: {selectedBooking?.user?.name || "Passenger"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body className="p-3 p-md-4">
            <Form.Group className="mb-3 text-center">
              <Form.Label className="small fw-semibold text-muted d-block">
                Passenger Rating
              </Form.Label>
              <StarRatingInputs
                value={reviewForm.rating}
                onChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-muted">
                Feedback Comment (Optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Was the passenger punctual, communicative, and respectful?"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer
            className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <Button
              variant="outline-secondary"
              size="sm"
              className="m-0"
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="m-0"
              disabled={submittingReview}
            >
              {submittingReview ? "Submitting..." : "Submit Feedback"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}