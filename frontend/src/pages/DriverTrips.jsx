import { useEffect, useState } from "react";
import { Container, Card, Table, Badge, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { getDriverTrips, updateTripStatus } from "../services/trip";

function DriverTrips() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const data = await getDriverTrips();
            setTrips(data);
        } catch (err) {
            console.error("Failed to load driver trips:", err);
            setError("Could not load your trips.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTrips();
    }, []);

    const handleStatusChange = async (tripId, newStatus) => {
        const confirmMsg =
            newStatus === "cancelled"
                ? "Are you sure you want to cancel this trip? All passenger bookings will be cancelled."
                : `Are you sure you want to mark this trip as "${newStatus}"?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            await updateTripStatus(tripId, newStatus);
            // Reload trips to reflect status changes and updated booking states
            loadTrips();
        } catch (err) {
            console.error("Status update error:", err);
            alert(err.response?.data?.message || "Failed to update trip status.");
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

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your published trips...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="mb-4">My Offered Trips</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            {trips.length === 0 ? (
                <Alert variant="info">You haven't published any trips yet.</Alert>
            ) : (
                <Row className="g-4">
                    {trips.map((trip) => (
                        <Col xs={12} key={trip.id}>
                            <Card className="shadow-sm">
                                <Card.Header className="d-flex justify-content-between align-items-center bg-white py-3">
                                    <div>
                                        <h5 className="mb-0">
                                            {trip.departure_city} → {trip.destination_city}
                                        </h5>
                                        <small className="text-muted">
                                            Date: {new Date(trip.departure_time).toLocaleString()} | Vehicle: {trip.vehicle?.brand} {trip.vehicle?.model} ({trip.vehicle?.license_plate})
                                        </small>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        {getStatusBadge(trip.status)}
                                    </div>
                                </Card.Header>

                                <Card.Body>
                                    <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
                                        <div>
                                            <strong>Seats:</strong> {trip.available_seats} / {trip.total_seats} available
                                        </div>
                                        <div>
                                            <strong>Price:</strong> {trip.price_per_seat} MAD / seat
                                        </div>
                                    </div>

                                    {/* Passenger List */}
                                    <h6 className="mt-3 mb-2">Booked Passengers:</h6>
                                    {trip.bookings && trip.bookings.length > 0 ? (
                                        <Table size="sm" responsive hover className="align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Passenger</th>
                                                    <th>Email</th>
                                                    <th>Seats Booked</th>
                                                    <th>Booking Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {trip.bookings.map((booking) => (
                                                    <tr key={booking.id}>
                                                        <td>{booking.user?.name || "Passenger"}</td>
                                                        <td>{booking.user?.email || "—"}</td>
                                                        <td>{booking.seats}</td>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    booking.status === "confirmed"
                                                                        ? "success"
                                                                        : booking.status === "cancelled"
                                                                        ? "danger"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {booking.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <p className="text-muted small mb-3">No passengers have booked this trip yet.</p>
                                    )}

                                    {/* Action Controls based on status */}
                                    <div className="d-flex gap-2 justify-content-end mt-3 pt-2 border-top">
                                        {trip.status === "scheduled" && (
                                            <>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(trip.id, "in_progress")}
                                                >
                                                    Start Trip
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(trip.id, "cancelled")}
                                                >
                                                    Cancel Trip
                                                </Button>
                                            </>
                                        )}

                                        {trip.status === "in_progress" && (
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleStatusChange(trip.id, "completed")}
                                            >
                                                Mark as Completed
                                            </Button>
                                        )}

                                        {(trip.status === "completed" || trip.status === "cancelled") && (
                                            <span className="text-muted small align-self-center">
                                                This trip is closed.
                                            </span>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default DriverTrips;