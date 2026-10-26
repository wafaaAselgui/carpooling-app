import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, Button, Container, Row, Col, Badge, Alert, Spinner, Image } from "react-bootstrap";
import { getTripById } from "../services/trip";
import { createBooking } from "../services/booking";
import { getDriverReviews } from "../services/review";
import { useAuth } from "../context/AuthContext";
import ReportModal from "../components/ReportModal";
import TripRouteMap from "../components/TripRouteMap";

function TripDetails() {
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

    // Dynamic Report Modal State
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

    const isDriver = user && Number(user.id) === Number(trip.driver_id);
    const isTripOpen = trip.status === "scheduled";
    const isSoldOut = trip.available_seats <= 0;
    const isDriverVerified = trip.driver?.verification_status === "verified";
    const isCarVerified = trip.vehicle?.status === "verified";

    const backendBase = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:8000";

    const driverAvatar = trip.driver?.avatar_url || (trip.driver?.avatar_path 
        ? `${backendBase}/storage/${trip.driver.avatar_path}` 
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.driver?.name || "Driver")}&background=random`);

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
                message: data.message || "Booking request submitted! Waiting for driver confirmation.",
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
        <Container className="py-4" style={{ maxWidth: "880px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button as={Link} to="/" variant="outline-secondary" size="sm">
                    ← Back to trips
                </Button>

                {user && !isDriver && (
                    <Button variant="outline-danger" size="sm" onClick={handleOpenReportTrip}>
                        🚩 Report this Ride
                    </Button>
                )}
            </div>

            <Card className="shadow-sm border-0 mb-4">
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
                        {/* Route Details */}
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

                        {/* Driver & Vehicle */}
                        <Col md={6}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold mb-0">Driver & Trust</h5>
                                {user && !isDriver && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-danger p-0 text-decoration-none small"
                                        onClick={handleOpenReportDriver}
                                    >
                                        🚩 Report Driver
                                    </Button>
                                )}
                            </div>

                            <div className="d-flex align-items-center gap-3 p-3 border rounded mb-3 bg-light">
                                <Link to={`/users/${trip.driver_id}/profile`}>
                                    <Image
                                        src={driverAvatar}
                                        roundedCircle
                                        width={56}
                                        height={56}
                                        className="object-fit-cover border shadow-sm"
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

                    {/* Booking Action */}
                    <div className="mt-4 pt-3 border-top">
                        {bookingFeedback.message && (
                            <Alert variant={bookingFeedback.type} className="mb-3" dismissible>
                                {bookingFeedback.message}
                            </Alert>
                        )}

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
                                        max={trip.available_seats}
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
                                            ? "Requesting..."
                                            : booked
                                            ? "Request Sent ✓"
                                            : `Request ${seats} Seat${seats > 1 ? "s" : ""} (${seats * trip.price_per_seat} MAD)`}
                                    </Button>
                                </Col>
                            </Row>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Interactive Driving Route Map */}
            <TripRouteMap
                departureCity={trip.departure_city}
                destinationCity={trip.destination_city}
                departureAddress={trip.departure_address}
                destinationAddress={trip.destination_address}
            />

            {/* Public Driver Reviews Section */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">Passenger Reviews for {trip.driver?.name}</h5>
                    {driverReviews.length === 0 ? (
                        <p className="text-muted small mb-0">No reviews written for this driver yet.</p>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {driverReviews.map((rev) => {
                                const isOwnReview = user && Number(user.id) === Number(rev.reviewer_id);

                                return (
                                    <div key={rev.id} className="border-bottom pb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div className="fw-semibold small">{rev.reviewer?.name || "Passenger"}</div>
                                            <div className="text-warning small">
                                                {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                                <span className="text-muted ms-1">({rev.rating}/5)</span>
                                            </div>
                                        </div>
                                        {rev.comment ? (
                                            <p className="small text-muted mb-1">{rev.comment}</p>
                                        ) : (
                                            <p className="small text-muted fst-italic mb-1">No written comment provided.</p>
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
                                                    🚩 Report
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

            {/* Reusable Report Modal */}
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

export default TripDetails;