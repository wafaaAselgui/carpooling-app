import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getMyVehicles, createVehicle } from "../services/vehicle";
import { createTrip } from "../services/trip";

function CreateTrip() {
    const navigate = useNavigate();

    // Vehicles state
    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);

    // Trip form state
    const [formData, setFormData] = useState({
        departure_city: "",
        departure_address: "",
        destination_city: "",
        destination_address: "",
        departure_time: "",
        total_seats: 1,
        price_per_seat: "",
        description: "",
        vehicle_id: "",
    });

    // Quick vehicle creation modal state
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        brand: "",
        model: "",
        color: "",
        license_plate: "",
        seats: 4,
    });

    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch user's vehicles on mount
    const fetchVehicles = async () => {
        try {
            const data = await getMyVehicles();
            setVehicles(data);
            if (data.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    vehicle_id: prev.vehicle_id || data[0].id,
                    total_seats: prev.total_seats || data[0].seats,
                }));
            }
        } catch (err) {
            console.error("Error fetching vehicles:", err);
            setError("Could not load your vehicles.");
        } finally {
            setLoadingVehicles(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    // Handle standard trip form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle vehicle selection change
    const handleVehicleChange = (e) => {
        const selectedId = e.target.value;
        const selectedVehicle = vehicles.find((v) => v.id === parseInt(selectedId));

        setFormData((prev) => ({
            ...prev,
            vehicle_id: selectedId,
            total_seats: selectedVehicle ? selectedVehicle.seats : prev.total_seats,
        }));
    };

    // Submit Trip
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await createTrip(formData);
            navigate("/");
        } catch (err) {
            console.error("Trip creation error:", err);
            setError(err.response?.data?.message || "Failed to create trip.");
        } finally {
            setSubmitting(false);
        }
    };

    // Quick Register Vehicle
    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        try {
            const created = await createVehicle(newVehicle);
            setShowVehicleModal(false);
            setNewVehicle({ brand: "", model: "", color: "", license_plate: "", seats: 4 });
            // Refresh list and select the newly created vehicle
            const updatedList = await getMyVehicles();
            setVehicles(updatedList);
            setFormData((prev) => ({
                ...prev,
                vehicle_id: created.vehicle?.id || updatedList[updatedList.length - 1].id,
            }));
        } catch (err) {
            console.error("Vehicle error:", err);
            alert(err.response?.data?.message || "Failed to add vehicle.");
        }
    };

    if (loadingVehicles) {
        return (
            <Container className="py-4">
                <p>Loading your profile details...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="justify-content-center">
                <Col xs={12} lg={8}>
                    <Card className="shadow-sm">
                        <Card.Body className="p-4">
                            <h2 className="mb-4">Publish a New Trip</h2>

                            {error && <Alert variant="danger">{error}</Alert>}

                            {vehicles.length === 0 ? (
                                <Alert variant="warning">
                                    <h5>No vehicle found!</h5>
                                    <p className="mb-3">
                                        You need to register a vehicle before you can offer rides.
                                    </p>
                                    <Button variant="primary" onClick={() => setShowVehicleModal(true)}>
                                        + Register Vehicle Now
                                    </Button>
                                </Alert>
                            ) : (
                                <Form onSubmit={handleSubmit}>
                                    {/* Vehicle Selector */}
                                    <Form.Group className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <Form.Label className="mb-0">Select Vehicle</Form.Label>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-decoration-none"
                                                onClick={() => setShowVehicleModal(true)}
                                            >
                                                + Add Another Vehicle
                                            </Button>
                                        </div>
                                        <Form.Select
                                            name="vehicle_id"
                                            value={formData.vehicle_id}
                                            onChange={handleVehicleChange}
                                            required
                                        >
                                            {vehicles.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.brand} {v.model} ({v.license_plate}) - Max {v.seats} seats
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>

                                    {/* Cities */}
                                    <Row className="g-3 mb-3">
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="departure_city">
                                                <Form.Label>Departure City</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="departure_city"
                                                    placeholder="e.g. Casablanca"
                                                    value={formData.departure_city}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="destination_city">
                                                <Form.Label>Destination City</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="destination_city"
                                                    placeholder="e.g. Rabat"
                                                    value={formData.destination_city}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Specific Addresses / Meeting Points */}
                                    <Row className="g-3 mb-3">
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="departure_address">
                                                <Form.Label>Pickup Spot (Optional)</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="departure_address"
                                                    placeholder="e.g. Casa Voyageurs Station"
                                                    value={formData.departure_address}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={12} md={6}>
                                            <Form.Group controlId="destination_address">
                                                <Form.Label>Drop-off Spot (Optional)</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="destination_address"
                                                    placeholder="e.g. Rabat Agdal Station"
                                                    value={formData.destination_address}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Date, Seats & Price */}
                                    <Row className="g-3 mb-3">
                                        <Col xs={12} md={4}>
                                            <Form.Group controlId="departure_time">
                                                <Form.Label>Departure Date & Time</Form.Label>
                                                <Form.Control
                                                    type="datetime-local"
                                                    name="departure_time"
                                                    value={formData.departure_time}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6} md={4}>
                                            <Form.Group controlId="total_seats">
                                                <Form.Label>Available Seats</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="total_seats"
                                                    min="1"
                                                    max="8"
                                                    value={formData.total_seats}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col xs={6} md={4}>
                                            <Form.Group controlId="price_per_seat">
                                                <Form.Label>Price per Seat (MAD)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="price_per_seat"
                                                    min="0"
                                                    placeholder="50"
                                                    value={formData.price_per_seat}
                                                    onChange={handleChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Additional Notes */}
                                    <Form.Group className="mb-4" controlId="description">
                                        <Form.Label>Trip Notes (Optional)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="description"
                                            placeholder="Mention luggage space, music, no-smoking preferences, etc."
                                            value={formData.description}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    <Button
                                        variant="primary"
                                        type="submit"
                                        size="lg"
                                        className="w-100"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Publishing Trip..." : "Publish Trip"}
                                    </Button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Quick Vehicle Modal */}
            <Modal show={showVehicleModal} onHide={() => setShowVehicleModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Register a Vehicle</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleVehicleSubmit}>
                    <Modal.Body>
                        <Row className="g-2 mb-2">
                            <Col xs={6}>
                                <Form.Group controlId="brand">
                                    <Form.Label>Brand</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Dacia, Renault"
                                        value={newVehicle.brand}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6}>
                                <Form.Group controlId="model">
                                    <Form.Label>Model</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Sandero, Clio"
                                        value={newVehicle.model}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="g-2 mb-2">
                            <Col xs={6}>
                                <Form.Group controlId="color">
                                    <Form.Label>Color</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Grey"
                                        value={newVehicle.color}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={6}>
                                <Form.Group controlId="seats">
                                    <Form.Label>Max Seats</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="8"
                                        value={newVehicle.seats}
                                        onChange={(e) => setNewVehicle({ ...newVehicle, seats: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group controlId="license_plate" className="mb-2">
                            <Form.Label>License Plate</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. 12345-A-6"
                                value={newVehicle.license_plate}
                                onChange={(e) => setNewVehicle({ ...newVehicle, license_plate: e.target.value })}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowVehicleModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit">
                            Save Vehicle
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
}

export default CreateTrip;