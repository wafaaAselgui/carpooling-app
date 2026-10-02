import { Card, Button } from "react-bootstrap";
import {Link} from "react-router-dom";

function TripCard({ trip }) {
    return (
        <Card className="mb-3 h-100 shadow-sm">
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


                <div className="d-flex gap-2">
                    <Button variant="outline-primary"
                        as={Link}
                        to={`/trips/${trip.id}`}
                    >
                        View trip
                    </Button>

                    <Button variant="primary">
                        Book
                    </Button>
                </div>

            </Card.Body>
        </Card>
    );
}

export default TripCard;