import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Button, Container, Row, Col, Badge, Alert, Spinner } from "react-bootstrap";
import { getTripById } from "../services/trip";
import { createBooking } from "../services/booking";
import { useAuth } from "../context/AuthContext";

function TripDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [trip, setTrip] = useState(null);
    const [seats, setSeats] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookingFeedback, setBookingFeedback] = useState({ type: null, message: "" });
    const [booked, setBooked] = useState(false);

    useEffect(() => {
        setLoading(true);
        getTripById(id)
            .then((data) => {
                setTrip(data);
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

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading trip details...</p>
            </Container>
        );
    }

    if (!trip) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="danger">Trip not found.</Alert>
                <Button as={Link} to="/" variant="outline-primary">
                    ← Back to Available Trips
                </Button>
            </Container>
        );
    }

    const isDriver = user && user.id === trip.driver_id;
    const isTripOpen = trip.status === "scheduled";
    const isSoldOut = trip.available_seats <= 0;

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
                message: data.message || "Booking confirmed successfully!",
            });
            setBooked(true);

            setTrip((prev) => ({
                ...prev,
                available_seats: prev.available_seats - seats,
            }));
        } catch (error) {
            setBookingFeedback({
                type: "danger",
                message: error.response?.data?.message || "Booking failed. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "scheduled":
                return <Badge bg="primary">Scheduled</Badge>;
            case "in_progress":
                return <Badge bg="warning" text="dark">In Progress</Badge>;
            case "completed":
                return <Badge bg="success">Completed</Badge>;
            case "cancelled":
                return <Badge bg="danger">Cancelled</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <Container className="py-4">
            <Button as={Link} to="/" variant="outline-secondary" className="mb-4">
                ← Back to trips
            </Button>

            <Card className="shadow-sm">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <Card.Title className="h3 mb-0">
                            {trip.departure_city} → {trip.destination_city}
                        </Card.Title>
                        <div>{getStatusBadge(trip.status)}</div>
                    </div>

                    <Row className="g-4">
                        <Col md={6}>
                            <h5 className="border-bottom pb-2">Trip Information</h5>
                            <p className="mb-2">
                                <strong>Departure Date & Time:</strong>{" "}
                                {new Date(trip.departure_time).toLocaleString()}
                            </p>
                            <p className="mb-2">
                                <strong>Pickup Point:</strong> {trip.departure_address}
                            </p>
                            <p className="mb-2">
                                <strong>Drop-off Point:</strong> {trip.destination_address}
                            </p>
                            <p className="mb-2">
                                <strong>Available Seats:</strong>{" "}
                                {trip.available_seats > 0 ? (
                                    <span className="text-success fw-bold">
                                        {trip.available_seats} of {trip.total_seats} remaining
                                    </span>
                                ) : (
                                    <span className="text-danger fw-bold">Sold Out</span>
                                )}
                            </p>
                            <p className="mb-2">
                                <strong>Price per Seat:</strong>{" "}
                                <span className="fs-5 fw-bold text-primary">
                                    {trip.price_per_seat} MAD
                                </span>
                            </p>
                        </Col>

                        <Col md={6}>
                            <h5 className="border-bottom pb-2">Driver & Vehicle</h5>
                            <p className="mb-2">
                                <strong>Driver:</strong> {trip.driver?.name}
                            </p>
                            <p className="mb-2 d-flex align-items-center gap-2">
                                <strong>Driver:</strong> {trip.driver?.name}
                                {trip.driver?.average_rating ? (
                                    <Badge bg="warning" text="dark">
                                        ★ {Number(trip.driver.average_rating).toFixed(1)} ({trip.driver.reviews_count || 0})
                                    </Badge>
                                ) : (
                                    <Badge bg="light" text="secondary" className="border">
                                        New Driver
                                    </Badge>
                                )}
                            </p>                            
                            <p className="mb-2">
                                <strong>Vehicle:</strong> {trip.vehicle?.brand} {trip.vehicle?.model}
                            </p>
                            <p className="mb-2">
                                <strong>Color:</strong> {trip.vehicle?.color || "Not specified"}
                            </p>
                            <p className="mb-2">
                                <strong>License Plate:</strong>{" "}
                                <Badge bg="light" text="dark" className="border">
                                    {trip.vehicle?.license_plate || "N/A"}
                                </Badge>
                            </p>
                        </Col>
                    </Row>

                    <hr className="my-4" />

                    <h5>Trip Notes</h5>
                    <p className="text-muted">
                        {trip.description || "No specific instructions provided by driver."}
                    </p>

                    {bookingFeedback.message && (
                        <Alert variant={bookingFeedback.type} className="mt-3">
                            {bookingFeedback.message}
                        </Alert>
                    )}

                    <div className="mt-4 pt-2 border-top">
                        {isDriver ? (
                            <Alert variant="secondary" className="mb-0">
                                <strong>Driver view:</strong> You are the driver of this trip. You cannot book seats on your own ride.
                            </Alert>
                        ) : !isTripOpen ? (
                            <Alert variant="warning" className="mb-0">
                                This trip is currently <strong>{trip.status}</strong> and is no longer accepting new bookings.
                            </Alert>
                        ) : isSoldOut && !booked ? (
                            <Alert variant="danger" className="mb-0">
                                This trip is fully booked.
                            </Alert>
                        ) : (
                            <Row className="align-items-end g-3">
                                <Col xs={12} sm={4} md={3}>
                                    <label className="form-label fw-semibold">Seats to Reserve</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min="1"
                                        max={trip.available_seats + (booked ? seats : 0)}
                                        value={seats}
                                        disabled={booked || submitting}
                                        onChange={(e) => setSeats(Number(e.target.value))}
                                    />
                                </Col>
                                <Col xs={12} sm={8} md={4}>
                                    <Button
                                        variant={booked ? "success" : "primary"}
                                        className="w-100"
                                        onClick={handleBooking}
                                        disabled={booked || submitting || seats < 1}
                                    >
                                        {submitting
                                            ? "Processing..."
                                            : booked
                                            ? "Booking Confirmed ✓"
                                            : `Book ${seats} Seat${seats > 1 ? "s" : ""} (${seats * trip.price_per_seat} MAD)`}
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
}

export default TripDetails;