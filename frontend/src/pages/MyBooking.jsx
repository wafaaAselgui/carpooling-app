import { useEffect, useState } from "react";
import { getMyBookings, cancelBooking } from "../services/booking";
import { submitReview } from "../services/review";
import { Container, Card, Row, Col, Button, Alert, Modal, Form, Spinner } from "react-bootstrap";

function StarRatingInputs({ value, onChange }) {
    return (
        <div className="d-flex align-items-center gap-1">
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

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);

    const loadBookings = () => {
        setLoading(true);
        getMyBookings()
            .then((data) => {
                setBookings(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to load your reservations.");
                setLoading(false);
            });
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        const confirmed = window.confirm("Are you sure you want to cancel this seat reservation?");
        if (!confirmed) return;

        try {
            await cancelBooking(bookingId);
            setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        } catch (err) {
            console.error("Cancellation error:", err);
            alert(err.response?.data?.message || "Failed to cancel booking. Please try again.");
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
            loadBookings();
        } catch (err) {
            console.error("Review submission error:", err);
            alert(err.response?.data?.message || "Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderTripBadge = (status) => {
        switch (status) {
            case "completed":
                return <span className="badge badge-sage">Completed</span>;
            case "in_progress":
                return (
                    <span
                        className="badge"
                        style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)" }}
                    >
                        In Progress
                    </span>
                );
            case "cancelled":
                return <span className="badge badge-blush">Cancelled</span>;
            default:
                return <span className="badge bg-light text-muted border">Scheduled</span>;
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
                <p className="mt-2 text-muted small">Loading your bookings...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4 px-lg-5">
            <div className="mb-4">
                <h2 className="fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>My Bookings</h2>
                <p className="text-muted small mb-0">Track reservation statuses, manage cancellations, and leave reviews for completed journeys.</p>
            </div>

            {error && (
                <Alert
                    dismissible
                    onClose={() => setError(null)}
                    style={{ backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)", border: "none" }}
                >
                    {error}
                </Alert>
            )}

            {bookings.length === 0 ? (
                <Card className="border-0 shadow-sm p-5 text-center bg-white">
                    <p className="text-muted mb-0">You have no active or completed seat reservations.</p>
                </Card>
            ) : (
                <Row className="g-4">
                    {bookings.map((booking) => {
                        const trip = booking.trip;
                        const isCompleted = trip?.status === "completed";
                        const canCancel = trip?.status === "scheduled" && booking.status === "confirmed";

                        return (
                            <Col key={booking.id} xs={12} md={6} lg={4}>
                                <Card className="h-100 shadow-sm border-0 d-flex flex-column justify-content-between" style={{ backgroundColor: "#ffffff" }}>
                                    <div>
                                        <div
                                            className="d-flex justify-content-between align-items-center p-3 border-bottom"
                                            style={{ borderColor: "var(--color-border-subtle)" }}
                                        >
                                            {renderTripBadge(trip?.status)}
                                            <span className="text-muted small">
                                                {trip?.departure_time
                                                    ? new Date(trip.departure_time).toLocaleDateString("en-US", { dateStyle: "medium" })
                                                    : "—"}
                                            </span>
                                        </div>

                                        <Card.Body className="p-3">
                                            <h5 className="fw-semibold mb-2 text-capitalize" style={{ color: "var(--color-text-main)", fontSize: "1.05rem" }}>
                                                {trip?.departure_city}
                                                <span className="mx-2 text-muted" style={{ fontWeight: 300 }}>→</span>
                                                {trip?.destination_city}
                                            </h5>

                                            <div className="text-muted small mb-3">
                                                <div><strong>Driver:</strong> {trip?.driver?.name || "Driver"}</div>
                                                <div><strong>Vehicle:</strong> {trip?.vehicle?.brand} {trip?.vehicle?.model}</div>
                                            </div>

                                            <div
                                                className="p-2 rounded small mb-2"
                                                style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}
                                            >
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">Seats Reserved:</span>
                                                    <strong style={{ color: "var(--color-text-main)" }}>{booking.seats}</strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">Total Fare:</span>
                                                    <strong style={{ color: "var(--color-primary)" }}>
                                                        {booking.seats * (trip?.price_per_seat || 0)} MAD
                                                    </strong>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <span className="text-muted">Booking State:</span>
                                                    <span className="text-capitalize fw-medium">{booking.status}</span>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </div>

                                    <div
                                        className="p-3 border-top d-flex justify-content-between align-items-center"
                                        style={{ borderColor: "var(--color-border-subtle)" }}
                                    >
                                        {canCancel ? (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleCancel(booking.id)}
                                            >
                                                Cancel Reservation
                                            </Button>
                                        ) : (
                                            <span />
                                        )}

                                        {isCompleted && (
                                            booking.review ? (
                                                <span className="badge badge-sage py-1 px-2 d-inline-flex align-items-center gap-1">
                                                    <span>Reviewed: {booking.review.rating}/5</span>
                                                </span>
                                            ) : (
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => openReviewModal(booking)}
                                                >
                                                    Rate Driver
                                                </Button>
                                            )
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Review Submission Modal */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
                    <Modal.Title className="fs-6 fw-semibold text-dark">
                        Feedback for {selectedBooking?.trip?.driver?.name}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleReviewSubmit}>
                    <Modal.Body className="p-4">
                        <Form.Group className="mb-3 text-center">
                            <Form.Label className="small fw-semibold text-muted d-block">Overall Experience</Form.Label>
                            <div className="d-flex justify-content-center mt-1">
                                <StarRatingInputs
                                    value={reviewForm.rating}
                                    onChange={(r) => setReviewForm({ ...reviewForm, rating: r })}
                                />
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-semibold text-muted">Feedback Comment (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Punctuality, vehicle cleanliness, driving safety..."
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer style={{ borderColor: "var(--color-border-subtle)" }}>
                        <Button variant="outline-secondary" size="sm" onClick={() => setShowReviewModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={submittingReview}>
                            {submittingReview ? "Submitting..." : "Submit Review"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default MyBookings;