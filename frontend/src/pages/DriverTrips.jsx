import { useEffect, useState } from "react";
import { Container, Card, Table, Badge, Button, Alert, Spinner, Image } from "react-bootstrap";
import api from "../services/api";
import { respondToBooking } from "../services/booking";

export default function DriverTrips() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

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

    const getBookingBadge = (status) => {
        switch (status) {
            case "confirmed":
                return <Badge bg="success">Confirmed</Badge>;
            case "pending":
                return <Badge bg="warning" text="dark">Pending Approval</Badge>;
            case "rejected":
                return <Badge bg="danger">Rejected</Badge>;
            case "cancelled":
                return <Badge bg="secondary">Cancelled</Badge>;
            default:
                return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    const getTripBadge = (status) => {
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

    const getPassengerAvatar = (passenger) => {
        if (passenger?.avatar_url) return passenger.avatar_url;
        if (passenger?.avatar_path) return `${backendBase}/storage/${passenger.avatar_path}`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(passenger?.name || "Passenger")}&background=random`;
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your offered rides...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4">My Offered Trips</h2>

            {feedback && <Alert variant="success" dismissible onClose={() => setFeedback(null)}>{feedback}</Alert>}
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {trips.length === 0 ? (
                <Alert variant="light" className="text-center py-4 border text-muted">
                    You have not published any rides yet.
                </Alert>
            ) : (
                trips.map((trip) => (
                    <Card key={trip.id} className="shadow-sm border-0 mb-4">
                        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold mb-0 text-capitalize">
                                    {trip.departure_city} → {trip.destination_city}
                                </h5>
                                <div className="text-muted small">
                                    📅 {new Date(trip.departure_time).toLocaleString("en-US", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}{" "}
                                    • {trip.vehicle?.brand} {trip.vehicle?.model} ({trip.vehicle?.license_plate})
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="small text-muted me-2">
                                    Remaining Seats: <strong>{trip.available_seats} / {trip.total_seats}</strong>
                                </span>
                                {getTripBadge(trip.status)}
                            </div>
                        </Card.Header>

                        <Card.Body>
                            <h6 className="fw-bold text-dark mb-3">Passenger Booking Requests</h6>

                            {!trip.bookings || trip.bookings.length === 0 ? (
                                <p className="text-muted small mb-0">No booking requests received for this trip yet.</p>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0 small">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Passenger</th>
                                            <th>Contact Details</th>
                                            <th>Seats Requested</th>
                                            <th>Total Price</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trip.bookings.map((booking) => {
                                            const passenger = booking.user;

                                            return (
                                                <tr key={booking.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Image
                                                                src={getPassengerAvatar(passenger)}
                                                                roundedCircle
                                                                width={36}
                                                                height={36}
                                                                className="object-fit-cover border shadow-sm"
                                                                alt={passenger?.name || "Passenger"}
                                                            />
                                                            <div>
                                                                <div className="fw-bold">
                                                                    {passenger?.name || "Anonymous Passenger"}
                                                                </div>
                                                                {passenger?.verification_status === "verified" && (
                                                                    <span
                                                                        className="badge bg-success-subtle text-success border border-success-subtle py-0 px-1"
                                                                        style={{ fontSize: "10px" }}
                                                                    >
                                                                        ✓ ID Verified
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div>{passenger?.email || "No email"}</div>
                                                        <div className="text-muted">
                                                            📞 {passenger?.phone || "No phone provided"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <strong>{booking.seats}</strong> seat{booking.seats > 1 ? "s" : ""}
                                                    </td>
                                                    <td className="fw-bold text-success">
                                                        {booking.seats * trip.price_per_seat} MAD
                                                    </td>
                                                    <td>{getBookingBadge(booking.status)}</td>
                                                    <td>
                                                        {booking.status === "pending" ? (
                                                            <div className="d-flex gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    variant="success"
                                                                    disabled={
                                                                        actionLoading === booking.id ||
                                                                        trip.available_seats < booking.seats
                                                                    }
                                                                    onClick={() =>
                                                                        handleBookingResponse(booking.id, "accept")
                                                                    }
                                                                >
                                                                    Accept
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    disabled={actionLoading === booking.id}
                                                                    onClick={() =>
                                                                        handleBookingResponse(booking.id, "reject")
                                                                    }
                                                                >
                                                                    Decline
                                                                </Button>
                                                            </div>
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

                        {/* Trip Status Controls */}
                        {trip.status === "scheduled" && (
                            <Card.Footer className="bg-light d-flex justify-content-end gap-2 py-2">
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => handleStatusChange(trip.id, "completed")}
                                >
                                    Mark as Completed
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
                ))
            )}
        </Container>
    );
}