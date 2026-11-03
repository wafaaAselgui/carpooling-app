import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Button, Container, Row, Col, Alert, Spinner, Image } from "react-bootstrap";
import { getTripById } from "../services/trip";
import { createBooking } from "../services/booking";
import { getDriverReviews } from "../services/review";
import { useAuth } from "../context/AuthContext";
import ReportModal from "../components/ReportModal";
import TripRouteMap from "../components/TripRouteMap";

function StarRating({ rating }) {
  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ color: "var(--color-warning)" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={star <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [driverReviews, setDriverReviews] = useState([]);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState({ type: null, message: "" });
  const [booked, setBooked] = useState(false);

  const [reportConfig, setReportConfig] = useState({
    show: false,
    targetType: "trip",
    targetId: null,
    targetName: "",
  });

  useEffect(() => {
    setLoading(true);
    getTripById(id)
      .then((data) => {
        setTrip(data);
        if (data.driver_id) {
          getDriverReviews(data.driver_id)
            .then((res) => setDriverReviews(res.reviews || []))
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load trip:", error);
        setBookingFeedback({
          type: "danger",
          message: "Failed to load trip details. It may no longer exist.",
        });
        setLoading(false);
      });
  }, [id]);

  const handleOpenReportTrip = () => {
    setReportConfig({
      show: true,
      targetType: "trip",
      targetId: trip.id,
      targetName: `${trip.departure_city} → ${trip.destination_city}`,
    });
  };

  const handleOpenReportDriver = () => {
    setReportConfig({
      show: true,
      targetType: "user",
      targetId: trip.driver_id,
      targetName: trip.driver?.name || "Driver",
    });
  };

  const handleOpenReportReview = (rev) => {
    setReportConfig({
      show: true,
      targetType: "review",
      targetId: rev.id,
      targetName: `Review by ${rev.reviewer?.name || "User"}`,
    });
  };

  const handleCloseReportModal = () => {
    setReportConfig((prev) => ({ ...prev, show: false }));
  };

  if (loading) {
    return (
      <Container className="py-5 text-center mt-4">
        <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
        <p className="mt-2 text-muted small">Loading trip details...</p>
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container className="py-5 text-center mt-4">
        <Alert variant="danger">Trip not found.</Alert>
        <Button as={Link} to="/" variant="outline-secondary">
          Return to Available Rides
        </Button>
      </Container>
    );
  }

  const isDriver = user && Number(user.id) === Number(trip.driver_id);
  const isTripOpen = trip.status === "scheduled";
  const isSoldOut = trip.available_seats <= 0;
  const isDriverVerified = trip.driver?.verification_status === "verified";
  const isCarVerified = trip.vehicle?.status === "verified";

  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:8000";

  const driverAvatar =
    trip.driver?.avatar_url ||
    (trip.driver?.avatar_path
      ? `${backendBase}/storage/${trip.driver.avatar_path}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.driver?.name || "Driver")}&background=e31b6d&color=fff`);

  const vehiclePhoto =
    trip.vehicle?.photo_url ||
    (trip.vehicle?.photo ? `${backendBase}/storage/${trip.vehicle.photo}` : null);

  const handleBooking = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setBookingFeedback({ type: null, message: "" });

    try {
      const data = await createBooking(trip.id, seats);
      setBookingFeedback({
        type: "success",
        message: data.message || "Booking request sent. Awaiting driver confirmation.",
      });
      setBooked(true);
    } catch (error) {
      setBookingFeedback({
        type: "danger",
        message: error.response?.data?.message || "Booking failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
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

  return (
    <Container className="py-4 px-3 px-md-0" style={{ maxWidth: "860px" }}>
      {/* Top Navigation Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button
          as={Link}
          to="/"
          variant="outline-secondary"
          size="sm"
          className="d-flex align-items-center gap-1 border px-3"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Rides
        </Button>

        {user && !isDriver && (
          <Button
            variant="link"
            size="sm"
            className="p-0 text-decoration-none small d-flex align-items-center gap-1"
            style={{ color: "var(--color-danger)" }}
            onClick={handleOpenReportTrip}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            Report Ride
          </Button>
        )}
      </div>

      {/* Main Trip Card */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 border-bottom pb-3" style={{ borderColor: "var(--color-border-subtle)" }}>
            <div>
              <h3 className="fw-bold mb-1 text-capitalize">
                {trip.departure_city}
                <span className="mx-2 text-muted" style={{ fontWeight: 300 }}>→</span>
                {trip.destination_city}
              </h3>
              <div className="text-muted small d-flex align-items-center gap-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>
                  {new Date(trip.departure_time).toLocaleString("en-US", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="fs-3 fw-bold mb-1" style={{ color: "var(--color-primary)" }}>
                {trip.price_per_seat} MAD
              </div>
              <div>{renderStatusBadge(trip.status)}</div>
            </div>
          </div>

          <Row className="g-4">
            {/* Journey Details */}
            <Col md={6}>
              <h6 className="fw-semibold text-uppercase text-muted small mb-3">Journey Details</h6>
              {trip.departure_address && (
                <p className="mb-2 small">
                  <strong>Pickup Point:</strong> {trip.departure_address}
                </p>
              )}
              {trip.destination_address && (
                <p className="mb-2 small">
                  <strong>Drop-off Point:</strong> {trip.destination_address}
                </p>
              )}
              <p className="mb-2 small">
                <strong>Remaining Capacity:</strong>{" "}
                {trip.available_seats > 0 ? (
                  <span className="fw-semibold" style={{ color: "var(--color-success)" }}>
                    {trip.available_seats} seat{trip.available_seats > 1 ? "s" : ""} left
                  </span>
                ) : (
                  <span className="fw-semibold" style={{ color: "var(--color-danger)" }}>Sold Out</span>
                )}
              </p>

              {trip.description && (
                <div className="mt-3 p-3 rounded" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}>
                  <div className="fw-medium small mb-1">Driver Notes</div>
                  <div className="small text-muted">{trip.description}</div>
                </div>
              )}
            </Col>

            {/* Driver & Vehicle */}
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold text-uppercase text-muted small mb-0">Driver & Vehicle</h6>
                {user && !isDriver && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none small"
                    style={{ color: "var(--color-danger)" }}
                    onClick={handleOpenReportDriver}
                  >
                    Report Driver
                  </Button>
                )}
              </div>

              <div className="d-flex align-items-center gap-3 p-3 border rounded mb-3" style={{ backgroundColor: "var(--color-canvas)", borderColor: "var(--color-border-subtle)" }}>
                <Link to={`/users/${trip.driver_id}/profile`}>
                  <Image
                    src={driverAvatar}
                    roundedCircle
                    width={50}
                    height={50}
                    className="object-fit-cover border"
                    style={{ borderColor: "var(--color-border)" }}
                    alt={trip.driver?.name || "Driver"}
                  />
                </Link>
                <div>
                  <h6 className="fw-bold mb-1">
                    <Link
                      to={`/users/${trip.driver_id}/profile`}
                      className="text-decoration-none text-dark hover-primary"
                    >
                      {trip.driver?.name}
                    </Link>
                  </h6>
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    {isDriverVerified ? (
                      <span className="badge badge-sage py-0 px-1" style={{ fontSize: "10px" }}>
                        Verified ID
                      </span>
                    ) : (
                      <span className="badge bg-light text-muted border py-0 px-1" style={{ fontSize: "10px" }}>
                        Unverified ID
                      </span>
                    )}

                    {trip.driver?.average_rating ? (
                      <span className="small text-muted d-inline-flex align-items-center gap-1">
                        <StarRating rating={Math.round(Number(trip.driver.average_rating))} />
                        <span className="fw-medium text-dark">{Number(trip.driver.average_rating).toFixed(1)}</span>
                        <span>({trip.driver.reviews_count || 0})</span>
                      </span>
                    ) : (
                      <span className="small text-muted">New Driver</span>
                    )}
                  </div>
                  {trip.driver?.bio && (
                    <div className="small text-muted fst-italic">"{trip.driver.bio}"</div>
                  )}
                </div>
              </div>

              {trip.vehicle && (
                <div className="p-3 border rounded" style={{ borderColor: "var(--color-border-subtle)" }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-semibold">
                        {trip.vehicle.brand} {trip.vehicle.model}
                      </div>
                      <div className="small text-muted">
                        Color: {trip.vehicle.color || "Not specified"} • Plate: {trip.vehicle.license_plate}
                      </div>
                    </div>
                    {isCarVerified && (
                      <span className="badge badge-blush py-0 px-1" style={{ fontSize: "10px" }}>
                        Vehicle Verified
                      </span>
                    )}
                  </div>

                  {isCarVerified && (
                  <span className="badge-vehicle-verified">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                    Vehicle Verified
                  </span>
                )}
                </div>
              )}
            </Col>
          </Row>

          {/* Booking Action Bar */}
          <div className="mt-4 pt-3 border-top" style={{ borderColor: "var(--color-border-subtle)" }}>
            {bookingFeedback.message && (
              <Alert
                dismissible
                onClose={() => setBookingFeedback({ type: null, message: "" })}
                style={{
                  backgroundColor: bookingFeedback.type === "success" ? "var(--color-success-subtle)" : "var(--color-danger-subtle)",
                  border: "none",
                  color: bookingFeedback.type === "success" ? "var(--color-success)" : "var(--color-danger)",
                }}
              >
                {bookingFeedback.message}
              </Alert>
            )}

            {isDriver ? (
              <div className="p-3 rounded small text-muted text-center" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}>
                <strong>Driver View:</strong> You published this ride. You cannot reserve seats on your own journey.
              </div>
            ) : !isTripOpen ? (
              <div className="p-3 rounded small text-center" style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)" }}>
                This journey is currently <strong>{trip.status}</strong> and is not open for reservations.
              </div>
            ) : isSoldOut && !booked ? (
              <div className="p-3 rounded small text-center" style={{ backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)" }}>
                All available seats for this journey have been reserved.
              </div>
            ) : (
              <Row className="align-items-end g-3">
                <Col xs={12} sm={4} md={3}>
                  <label className="form-label fw-semibold small text-muted mb-1">Seats to Reserve</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max={trip.available_seats}
                    value={seats}
                    disabled={booked || submitting}
                    onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
                  />
                </Col>
                <Col xs={12} sm={8} md={5}>
                  <Button
                    variant="primary"
                    className="w-100 py-2 fw-medium"
                    onClick={handleBooking}
                    disabled={booked || submitting || seats < 1}
                  >
                    {submitting
                      ? "Submitting..."
                      : booked
                      ? "Request Sent"
                      : `Reserve ${seats} Seat${seats > 1 ? "s" : ""} (${seats * trip.price_per_seat} MAD)`}
                  </Button>
                </Col>
              </Row>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Interactive Route Map */}
      <TripRouteMap
        departureCity={trip.departure_city}
        destinationCity={trip.destination_city}
        departureAddress={trip.departure_address}
        destinationAddress={trip.destination_address}
      />

      {/* Passenger Reviews Section */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <h5 className="fw-semibold mb-3">
            Passenger Reviews for {trip.driver?.name}
          </h5>
          {driverReviews.length === 0 ? (
            <p className="text-muted small mb-0">No reviews published for this driver yet.</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {driverReviews.map((rev) => {
                const isOwnReview = user && Number(user.id) === Number(rev.reviewer_id);

                return (
                  <div key={rev.id} className="border-bottom pb-3" style={{ borderColor: "var(--color-border-subtle)" }}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="fw-semibold small">
                        {rev.reviewer?.name || "Passenger"}
                      </div>
                      <div className="d-flex align-items-center gap-1 small">
                        <StarRating rating={rev.rating} />
                        <span className="text-muted ms-1">({rev.rating}/5)</span>
                      </div>
                    </div>
                    {rev.comment ? (
                      <p className="small text-muted mb-1">{rev.comment}</p>
                    ) : (
                      <p className="small text-muted fst-italic mb-1">No written feedback provided.</p>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <span className="text-muted" style={{ fontSize: "11px" }}>
                        {new Date(rev.created_at).toLocaleDateString("en-US", {
                          dateStyle: "medium",
                        })}
                      </span>
                      {user && !isOwnReview && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-muted text-decoration-none p-0"
                          style={{ fontSize: "11px" }}
                          onClick={() => handleOpenReportReview(rev)}
                        >
                          Report
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      <ReportModal
        show={reportConfig.show}
        onHide={handleCloseReportModal}
        targetType={reportConfig.targetType}
        targetId={reportConfig.targetId}
        targetName={reportConfig.targetName}
      />
    </Container>
  );
}