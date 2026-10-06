import { useEffect, useState } from "react";
import { getMyBookings, cancelBooking } from "../services/booking";
import { Container, Card, Row, Col, Button, Alert } from "react-bootstrap";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
    }, []);

    const handleCancel = async (bookingId) => {
        const confirmed = window.confirm("Are you sure you want to cancel this booking?");
        if (!confirmed) return;

        try {
            await cancelBooking(bookingId);
            // Remove the cancelled booking from state immediately
            setBookings((prevBookings) =>
                prevBookings.filter((booking) => booking.id !== bookingId)
            );
        } catch (err) {
            console.error("Cancellation error:", err);
            alert(err.response?.data?.message || "Failed to cancel booking. Please try again.");
        }
    };

    if (loading) {
        return (
            <Container className="py-4">
                <p>Loading your bookings...</p>
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
                <Row>
                    {bookings.map((booking) => (
                        <Col key={booking.id} xs={12} md={6} lg={4}>
                            <Card className="mb-3 shadow-sm">
                                <Card.Body>
                                    <Card.Title>
                                        {booking.trip?.departure_city} →{" "}
                                        {booking.trip?.destination_city}
                                    </Card.Title>

                                    <Card.Text className="mb-1">
                                        <strong>Seats:</strong> {booking.seats}
                                    </Card.Text>

                                    <Card.Text className="mb-1">
                                        <strong>Status:</strong> {booking.status}
                                    </Card.Text>

                                    <Card.Text className="mb-3">
                                        <strong>Price per seat:</strong>{" "}
                                        {booking.trip?.price_per_seat} MAD
                                    </Card.Text>

                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleCancel(booking.id)}
                                    >
                                        Cancel Booking
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default MyBookings;