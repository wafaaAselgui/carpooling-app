import { useEffect, useState } from "react";
import { Container, Card, Table, Button, Alert, Spinner, Image, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../services/api";
import { respondToBooking } from "../services/booking";
import { submitReview } from "../services/review";
import { useAuth } from "../context/AuthContext";

function StarRatingInputs({ value, onChange }) {
  return (
    <div className="d-flex align-items-center gap-1 justify-content-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="btn p-1 border-0 bg-transparent"
          onClick={() => onChange(star)}
          style={{ color: star <= value ? "var(--color-warning)" : "var(--color-border)" }}
          aria-label={`Rate ${star} star`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={star <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:8000";

  const loadDriverTrips = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      const res = await api.get("/driver/trips", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrips(res.data);
    } catch {
      setError("Failed to load your offered trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverTrips();
  }, []);

  const handleBookingResponse = async (bookingId, action) => {
    setActionLoading(bookingId);
    setFeedback(null);
    setError(null);
    try {
      const res = await respondToBooking(bookingId, action);
      setFeedback(res.message);
      await loadDriverTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process booking request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (tripId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this trip as ${newStatus}?`)) return;
    setFeedback(null);
    setError(null);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      await api.patch(
        `/driver/trips/${tripId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedback(`Trip status updated to ${newStatus}.`);
      await loadDriverTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update trip status.");
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
      alert(err.response?.data?.message || "Failed to submit review.");
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
            style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(138, 90, 0, 0.2)" }}
          >
            Pending Approval
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
            style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(138, 90, 0, 0.2)" }}
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
    if (passenger?.avatar_url) return passenger.avatar_url;
    if (passenger?.avatar_path) return `${backendBase}/storage/${passenger.avatar_path}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(passenger?.name || "Passenger")}&background=e31b6d&color=fff`;
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
    <Container className="py-4 px-lg-5" style={{ maxWidth: "1200px" }}>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Driver Schedule</h2>
        <p className="text-muted small mb-0">Manage passenger booking requests, track available capacity, and review completed journeys.</p>
      </div>

      {feedback && (
        <Alert
          dismissible
          onClose={() => setFeedback(null)}
          style={{ backgroundColor: "var(--color-success-subtle)", color: "var(--color-success)", border: "none" }}
        >
          {feedback}
        </Alert>
      )}

      {error && (
        <Alert
          dismissible
          onClose={() => setError(null)}
          style={{ backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)", border: "none" }}
        >
          {error}
        </Alert>
      )}

      {trips.length === 0 ? (
        <Card className="border-0 shadow-sm p-5 text-center">
          <p className="text-muted mb-3">You have not published any rides yet.</p>
          <div>
            <Button as={Link} to="/create-trip" variant="primary" size="sm">
              Offer a Ride
            </Button>
          </div>
        </Card>
      ) : (
        trips.map((trip) => {
          const isCompleted = trip.status === "completed";

          return (
            <Card key={trip.id} className="shadow-sm border-0 mb-4 overflow-hidden">
              <Card.Header
                className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <div>
                  <h5 className="fw-semibold mb-1 text-capitalize">
                    {trip.departure_city}
                    <span className="mx-2 text-muted" style={{ fontWeight: 300 }}>→</span>
                    {trip.destination_city}
                  </h5>
                  <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
                    <span className="d-inline-flex align-items-center gap-1">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <span>•</span>
                    <span>
                      {trip.vehicle?.brand} {trip.vehicle?.model} ({trip.vehicle?.license_plate})
                    </span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <span className="small text-muted">
                    Capacity: <strong>{trip.available_seats} / {trip.total_seats} seats free</strong>
                  </span>
                  {renderTripBadge(trip.status)}
                </div>
              </Card.Header>

              <Card.Body className="p-4">
                <h6 className="fw-semibold text-uppercase text-muted small mb-3">Passenger Requests</h6>

                {!trip.bookings || trip.bookings.length === 0 ? (
                  <p className="text-muted small mb-0">No booking requests submitted for this ride yet.</p>
                ) : (
                  <Table responsive hover align="middle" className="mb-0 small">
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
                                    className="fw-semibold text-decoration-none hover-primary"
                                    style={{ color: "var(--color-text-main)" }}
                                  >
                                    {passenger?.name || "Anonymous"}
                                  </Link>
                                  {passenger?.verification_status === "verified" && (
                                    <div className="mt-1">
                                      <span className="badge badge-sage py-0 px-1" style={{ fontSize: "10px" }}>
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
                )}
              </Card.Body>

              {trip.status === "scheduled" && (
                <Card.Footer className="bg-white border-top d-flex justify-content-end gap-2 py-3" style={{ borderColor: "var(--color-border-subtle)" }}>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleStatusChange(trip.id, "completed")}
                  >
                    Mark Journey Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleStatusChange(trip.id, "cancelled")}
                  >
                    Cancel Ride
                  </Button>
                </Card.Footer>
              )}
            </Card>
          );
        })
      )}

      {/* Driver -> Passenger Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
        <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
          <Modal.Title className="fs-6 fw-semibold">
            Rate Passenger: {selectedBooking?.user?.name || "Passenger"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReviewSubmit}>
          <Modal.Body className="p-4">
            <Form.Group className="mb-3 text-center">
              <Form.Label className="small fw-semibold text-muted d-block">Passenger Rating</Form.Label>
              <StarRatingInputs
                value={reviewForm.rating}
                onChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-muted">Feedback Comment (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Was the passenger punctual, communicative, and respectful?"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderColor: "var(--color-border-subtle)" }}>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
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