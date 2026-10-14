import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Button, Container, Row, Col, Badge, Alert, Spinner, Image } from "react-bootstrap";
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

    const isDriverVerified = trip.driver?.verification_status === "verified";
    const isCarVerified = trip.vehicle?.status === "verified";

    const backendBase = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:8000";

    const driverAvatar = trip.driver?.avatar_url || (trip.driver?.avatar_path 
        ? `${backendBase}/storage/${trip.driver.avatar_path}` 
        : "https://placehold.co/120x120?text=Driver");

    const vehiclePhoto = trip.vehicle?.photo_url || (trip.vehicle?.photo 
        ? `${backendBase}/storage/${trip.vehicle.photo}` 
        : null);

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
        <Container className="py-4" style={{ maxWidth: "860px" }}>
            <Button as={Link} to="/" variant="outline-secondary" size="sm" className="mb-3">
                ← Back to trips
            </Button>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 border-bottom pb-3">
                        <div>
                            <h3 className="fw-bold mb-1 text-capitalize">
                                {trip.departure_city} → {trip.destination_city}
                            </h3>
                            <div className="text-muted small">
                                📅 {new Date(trip.departure_time).toLocaleString("en-US", {
                                    dateStyle: "full",
                                    timeStyle: "short",
                                })}
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="fs-3 fw-bold text-success mb-1">
                                {trip.price_per_seat} MAD
                            </div>
                            <div>{getStatusBadge(trip.status)}</div>
                        </div>
                    </div>

                    <Row className="g-4">
                        {/* Trip & Route Specs */}
                        <Col md={6}>
                            <h5 className="fw-bold mb-3">Ride Route</h5>
                            {trip.departure_address && (
                                <p className="mb-2 small">
                                    <strong className="text-dark">Pickup Location:</strong> {trip.departure_address}
                                </p>
                            )}
                            {trip.destination_address && (
                                <p className="mb-2 small">
                                    <strong className="text-dark">Drop-off Location:</strong> {trip.destination_address}
                                </p>
                            )}
                            <p className="mb-2 small">
                                <strong className="text-dark">Remaining Capacity:</strong>{" "}
                                {trip.available_seats > 0 ? (
                                    <span className="text-success fw-bold">
                                        {trip.available_seats} seat{trip.available_seats > 1 ? "s" : ""} left
                                    </span>
                                ) : (
                                    <span className="text-danger fw-bold">Sold Out</span>
                                )}
                            </p>

                            {trip.description && (
                                <div className="mt-3 p-3 bg-light rounded">
                                    <div className="fw-semibold small text-dark mb-1">Driver's Notes:</div>
                                    <div className="small text-muted">{trip.description}</div>
                                </div>
                            )}
                        </Col>

                        {/* Driver Profile & Vehicle Cards */}
                        <Col md={6}>
                            <h5 className="fw-bold mb-3">Driver & Trust</h5>

                            <div className="d-flex align-items-center gap-3 p-3 border rounded mb-3 bg-light">
                                <Image
                                    src={driverAvatar}
                                    roundedCircle
                                    width={56}
                                    height={56}
                                    className="object-fit-cover border shadow-sm"
                                />
                                <div>
                                    <h6 className="fw-bold mb-1">{trip.driver?.name}</h6>
                                    <div className="d-flex flex-wrap gap-1 mb-1">
                                        {isDriverVerified ? (
                                            <Badge bg="success" className="py-1">
                                                ✓ Verified ID
                                            </Badge>
                                        ) : (
                                            <Badge bg="secondary">Unverified ID</Badge>
                                        )}

                                        {trip.driver?.average_rating ? (
                                            <Badge bg="warning" text="dark" className="py-1">
                                                ★ {Number(trip.driver.average_rating).toFixed(1)} ({trip.driver.reviews_count || 0})
                                            </Badge>
                                        ) : (
                                            <Badge bg="light" text="dark" className="border py-1">
                                                New Driver
                                            </Badge>
                                        )}
                                    </div>
                                    {trip.driver?.bio && (
                                        <div className="small text-muted italic">"{trip.driver.bio}"</div>
                                    )}
                                </div>
                            </div>

                            {trip.vehicle && (
                                <div className="p-3 border rounded">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <div className="fw-bold">
                                                {trip.vehicle.brand} {trip.vehicle.model}
                                            </div>
                                            <div className="small text-muted">
                                                Color: {trip.vehicle.color || "N/A"} • Plate: {trip.vehicle.license_plate}
                                            </div>
                                        </div>
                                        {isCarVerified && (
                                            <Badge bg="primary">✓ Car Verified</Badge>
                                        )}
                                    </div>

                                    {vehiclePhoto && (
                                        <Image
                                            src={vehiclePhoto}
                                            rounded
                                            className="w-100 object-fit-cover mt-2"
                                            style={{ maxHeight: "150px" }}
                                            alt="Vehicle"
                                        />
                                    )}
                                </div>
                            )}
                        </Col>
                    </Row>

                    {bookingFeedback.message && (
                        <Alert variant={bookingFeedback.type} className="mt-4" dismissible>
                            {bookingFeedback.message}
                        </Alert>
                    )}

                    {/* Booking Action Bar */}
                    <div className="mt-4 pt-3 border-top">
                        {isDriver ? (
                            <Alert variant="secondary" className="mb-0">
                                <strong>Driver View:</strong> You published this ride. You cannot book seats on your own trip.
                            </Alert>
                        ) : !isTripOpen ? (
                            <Alert variant="warning" className="mb-0">
                                This trip is <strong>{trip.status}</strong> and is not accepting bookings.
                            </Alert>
                        ) : isSoldOut && !booked ? (
                            <Alert variant="danger" className="mb-0">
                                This trip is completely full.
                            </Alert>
                        ) : (
                            <Row className="align-items-end g-3">
                                <Col xs={12} sm={4} md={3}>
                                    <label className="form-label fw-semibold small">Seats to Reserve</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min="1"
                                        max={trip.available_seats + (booked ? seats : 0)}
                                        value={seats}
                                        disabled={booked || submitting}
                                        onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
                                    />
                                </Col>
                                <Col xs={12} sm={8} md={5}>
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