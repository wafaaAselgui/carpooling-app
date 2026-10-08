import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";

function TripCard({ trip }) {
    const avgRating = trip.driver?.average_rating
        ? Number(trip.driver.average_rating).toFixed(1)
        : null;
    const reviewCount = trip.driver?.reviews_count || 0;

    return (
        <Card className="mb-3 h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="h5 mb-0">
                        {trip.departure_city} → {trip.destination_city}
                    </Card.Title>
                    <Badge bg="success" className="fs-6">
                        {trip.price_per_seat} MAD
                    </Badge>
                </div>

                <div className="text-muted small mb-3">
                    {new Date(trip.departure_time).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                    })}
                </div>

                <div className="mb-2 d-flex align-items-center justify-content-between">
                    <div>
                        <strong>Driver:</strong> {trip.driver?.name}
                    </div>
                    <div>
                        {avgRating ? (
                            <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1">
                                <span>★</span>
                                <span>{avgRating}</span>
                                <span className="text-muted">({reviewCount})</span>
                            </Badge>
                        ) : (
                            <Badge bg="light" text="secondary" className="border">
                                New Driver
                            </Badge>
                        )}
                    </div>
                </div>

                <Card.Text className="mb-1 text-muted small">
                    <strong>Vehicle:</strong> {trip.vehicle?.brand} {trip.vehicle?.model}
                </Card.Text>

                <Card.Text className="mb-3 text-muted small">
                    <strong>Seats Left:</strong> {trip.available_seats} / {trip.total_seats}
                </Card.Text>

                <div className="mt-auto pt-2 border-top">
                    <Button
                        variant="primary"
                        className="w-100"
                        as={Link}
                        to={`/trips/${trip.id}`}
                    >
                        View & Book Ride
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default TripCard;