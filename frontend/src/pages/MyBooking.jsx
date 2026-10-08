import { useEffect, useState } from "react";
import { getMyBookings, cancelBooking } from "../services/booking";
import { submitReview } from "../services/review";
import { Container, Card, Row, Col, Button, Alert, Badge, Modal, Form, Spinner } from "react-bootstrap";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Review modal state
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
                setError("Failed to load your bookings.");
                setLoading(false);
            });
    };

    useEffect(() => {
        loadBookings();
    }, []);

    const handleCancel = async (bookingId) => {
        const confirmed = window.confirm("Are you sure you want to cancel this booking?");
        if (!confirmed) return;

        try {
            await cancelBooking(bookingId);
            setBookings((prevBookings) =>
                prevBookings.filter((booking) => booking.id !== bookingId)
            );
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
            loadBookings(); // Reload to display the new review state
        } catch (err) {
            console.error("Review submission error:", err);
            alert(err.response?.data?.message || "Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your bookings...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="mb-4">My Bookings</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            {bookings.length === 0 ? (
                <Alert variant="info">You do not have any active bookings.</Alert>
            ) : (
                <Row className="g-4">
                    {bookings.map((booking) => {
                        const trip = booking.trip;
                        const isCompleted = trip?.status === "completed";
                        const canCancel = trip?.status === "scheduled" && booking.status === "confirmed";

                        return (
                            <Col key={booking.id} xs={12} md={6} lg={4}>
                                <Card className="h-100 shadow-sm">
                                    <Card.Header className="d-flex justify-content-between align-items-center bg-white">
                                        <Badge bg={isCompleted ? "success" : "primary"}>
                                            {trip?.status ? trip.status.toUpperCase() : "TRIP"}
                                        </Badge>
                                        <small className="text-muted">
                                            {trip?.departure_time
                                                ? new Date(trip.departure_time).toLocaleDateString()
                                                : "—"}
                                        </small>
                                    </Card.Header>

                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="h5">
                                            {trip?.departure_city} → {trip?.destination_city}
                                        </Card.Title>

                                        <p className="text-muted small mb-3">
                                            <strong>Driver:</strong> {trip?.driver?.name || "Driver"}<br />
                                            <strong>Vehicle:</strong> {trip?.vehicle?.brand} {trip?.vehicle?.model}
                                        </p>

                                        <div className="mb-3">
                                            <div><strong>Seats:</strong> {booking.seats}</div>
                                            <div><strong>Total Paid:</strong> {booking.seats * (trip?.price_per_seat || 0)} MAD</div>
                                            <div><strong>Status:</strong> {booking.status}</div>
                                        </div>

                                        <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                            {canCancel && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleCancel(booking.id)}
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}

                                            {/* Review Trigger or Review Badge */}
                                            {isCompleted && (
                                                booking.review ? (
                                                    <Badge bg="warning" text="dark" className="p-2">
                                                        Reviewed: ★ {booking.review.rating}/5
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => openReviewModal(booking)}
                                                    >
                                                        ★ Rate Driver
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Review Submission Modal */}
            <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Rate Your Trip with {selectedBooking?.trip?.driver?.name}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleReviewSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Rating</Form.Label>
                            <Form.Select
                                value={reviewForm.rating}
                                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                            >
                                <option value="5">★★★★★ - Excellent (5/5)</option>
                                <option value="4">★★★★☆ - Very Good (4/5)</option>
                                <option value="3">★★★☆☆ - Average (3/5)</option>
                                <option value="2">★★☆☆☆ - Poor (2/5)</option>
                                <option value="1">★☆☆☆☆ - Terrible (1/5)</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Feedback Comment (Optional)</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="How was the ride? Punctuality, driving, vehicle comfort..."
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="warning" type="submit" disabled={submittingReview}>
                            {submittingReview ? "Submitting..." : "Submit Review"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default MyBookings;