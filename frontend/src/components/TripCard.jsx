import { Card, Button } from "react-bootstrap";

function TripCard({ trip }) {
    return (
        <Card className="mb-3">
            <Card.Body>
                <Card.Title>
                    {trip.departure_city} → {trip.destination_city}
                </Card.Title>

                <Card.Text>
                    <strong>Driver:</strong> {trip.driver?.name}
                </Card.Text>

                <Card.Text>
                    <strong>Vehicle:</strong>{" "}
                    {trip.vehicle?.brand} {trip.vehicle?.model}
                </Card.Text>

                <Card.Text>
                    <strong>Price:</strong> {trip.price_per_seat} MAD
                </Card.Text>

                <Button variant="primary">
                    View trip
                </Button>
            </Card.Body>
        </Card>
    );
}

export default TripCard;