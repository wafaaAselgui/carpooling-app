import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from "react-bootstrap";
import TripCard from "../components/TripCard";
import { getTrips } from "../services/trip";

function Trips() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form inputs state
    const [filters, setFilters] = useState({
        departure_city: "",
        destination_city: "",
        date: "",
    });

    // Reusable function to fetch trips with whatever filters are passed
    const fetchTrips = (activeFilters = {}) => {
        setLoading(true);
        setError(null);

        getTrips(activeFilters)
            .then((data) => {
                setTrips(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching trips:", err);
                setError("Failed to load trips. Please try again.");
                setLoading(false);
            });
    };

    // Initial load: fetch all upcoming trips without filters
    useEffect(() => {
        fetchTrips();
    }, []);

    // Handle input field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Triggered when user clicks "Search"
    const handleSearch = (e) => {
        e.preventDefault();
        fetchTrips(filters);
    };

    // Reset filters back to default and reload all trips
    const handleReset = () => {
        const emptyFilters = {
            departure_city: "",
            destination_city: "",
            date: "",
        };
        setFilters(emptyFilters);
        fetchTrips(emptyFilters);
    };

    return (
        <Container className="py-4">
            <h1 className="mb-4">Available Trips</h1>

            {/* Filter Section */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSearch}>
                        <Row className="g-3 align-items-end">
                            <Col xs={12} md={3}>
                                <Form.Group controlId="departure_city">
                                    <Form.Label>Departure City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Casablanca"
                                        name="departure_city"
                                        value={filters.departure_city}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={3}>
                                <Form.Group controlId="destination_city">
                                    <Form.Label>Destination City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Rabat"
                                        name="destination_city"
                                        value={filters.destination_city}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={3}>
                                <Form.Group controlId="date">
                                    <Form.Label>Departure Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="date"
                                        value={filters.date}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={3} className="d-flex gap-2">
                                <Button variant="primary" type="submit" className="w-100">
                                    Search
                                </Button>
                                <Button variant="outline-secondary" type="button" onClick={handleReset}>
                                    Reset
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* Error Message */}
            {error && <Alert variant="danger">{error}</Alert>}

            {/* Loading Spinner */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Finding available trips...</p>
                </div>
            ) : trips.length === 0 ? (
                /* Empty Results State */
                <Alert variant="info">
                    No trips found matching your criteria. Try adjusting your search filters.
                </Alert>
            ) : (
                /* Trip Cards Grid */
                <Row>
                    {trips.map((trip) => (
                        <Col key={trip.id} xs={12} md={6} lg={4}>
                            <TripCard trip={trip} />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default Trips;