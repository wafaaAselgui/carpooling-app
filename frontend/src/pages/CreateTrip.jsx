import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { getMyVehicles } from "../services/vehicle";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function CreateTrip() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        departure_city: "",
        departure_address: "",
        destination_city: "",
        destination_address: "",
        departure_time: "",
        available_seats: 3,
        price_per_seat: 50,
        vehicle_id: "",
    });

    useEffect(() => {
        // If driver is not verified, don't bother fetching vehicles
        if (user?.verification_status !== "verified") {
            setLoading(false);
            return;
        }

        getMyVehicles()
            .then((data) => {
                setVehicles(data);
                const verified = data.filter((v) => v.status === "verified");
                if (verified.length > 0) {
                    setForm((prev) => ({ ...prev, vehicle_id: verified[0].id }));
                }
            })
            .catch(() => setError("Failed to load your registered vehicles."))
            .finally(() => setLoading(false));
    }, [user]);

    const verifiedVehicles = vehicles.filter((v) => v.status === "verified");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
            await api.post("/trips", form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            navigate("/driver/trips");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to publish trip.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Checking account and vehicle verification...</p>
            </Container>
        );
    }

    // Guard 1: Driver ID verification requirement
    if (user?.verification_status !== "verified") {
        const isPending = user?.verification_status === "pending";

        return (
            <Container className="py-5" style={{ maxWidth: "680px" }}>
                <Card className="shadow-sm border-0 text-center p-4">
                    <Card.Body>
                        <div style={{ fontSize: "3rem" }}>🛡️</div>
                        <h4 className="fw-bold mt-2">Driver Verification Required</h4>
                        <p className="text-muted small mt-2">
                            {isPending
                                ? "Your identity documents are currently under review by our admin team. Once approved, you will be able to publish rides."
                                : "To maintain passenger safety and trust, drivers must verify their government ID or driver's license before offering rides."}
                        </p>
                        <div className="d-flex justify-content-center gap-2 mt-4">
                            <Button as={Link} to="/profile" variant="primary" size="sm">
                                {isPending ? "View Profile Status" : "Upload ID Documents"}
                            </Button>
                            <Button as={Link} to="/" variant="outline-secondary" size="sm">
                                Browse Rides
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    // Guard 2: Verified Vehicle requirement
    return (
        <Container className="py-4" style={{ maxWidth: "720px" }}>
            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <h3 className="fw-bold mb-3">Publish a New Ride</h3>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {verifiedVehicles.length === 0 ? (
                        <Alert variant="warning" className="border-0 shadow-sm p-4">
                            <h5 className="fw-bold text-dark mb-2">Verified Vehicle Required</h5>
                            <p className="small text-muted mb-3">
                                Your driver identity is verified, but you need at least one verified vehicle. 
                                Please make sure your vehicle's registration certificate (Carte Grise) and insurance papers 
                                are uploaded and approved by our administration before publishing rides.
                            </p>
                            <Button as={Link} to="/profile" variant="dark" size="sm">
                                Go to My Profile & Add Vehicle Documents
                            </Button>
                        </Alert>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Row className="g-3">
                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Departure City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Casablanca"
                                        value={form.departure_city}
                                        onChange={(e) => setForm({ ...form, departure_city: e.target.value })}
                                        required
                                    />
                                </Col>
                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Destination City</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Rabat"
                                        value={form.destination_city}
                                        onChange={(e) => setForm({ ...form, destination_city: e.target.value })}
                                        required
                                    />
                                </Col>

                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Pickup Address / Meeting Point</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Casa-Voyageurs Station"
                                        value={form.departure_address}
                                        onChange={(e) => setForm({ ...form, departure_address: e.target.value })}
                                    />
                                </Col>
                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Drop-off Address</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Rabat Agdal Station"
                                        value={form.destination_address}
                                        onChange={(e) => setForm({ ...form, destination_address: e.target.value })}
                                    />
                                </Col>

                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Departure Time</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={form.departure_time}
                                        onChange={(e) => setForm({ ...form, departure_time: e.target.value })}
                                        required
                                    />
                                </Col>
                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Verified Vehicle</Form.Label>
                                    <Form.Select
                                        value={form.vehicle_id}
                                        onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                                        required
                                    >
                                        {verifiedVehicles.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.brand} {v.model} ({v.license_plate}) - {v.color}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>

                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Available Seats</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="8"
                                        value={form.available_seats}
                                        onChange={(e) => setForm({ ...form, available_seats: e.target.value })}
                                        required
                                    />
                                </Col>
                                <Col sm={6}>
                                    <Form.Label className="small fw-semibold">Price per Seat (MAD)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="10"
                                        step="5"
                                        value={form.price_per_seat}
                                        onChange={(e) => setForm({ ...form, price_per_seat: e.target.value })}
                                        required
                                    />
                                </Col>
                            </Row>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-100 mt-4"
                                disabled={submitting}
                            >
                                {submitting ? "Publishing Ride..." : "Publish Ride"}
                            </Button>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}