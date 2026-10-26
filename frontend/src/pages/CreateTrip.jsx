import { useEffect, useState } from "react";
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { getMyVehicles } from "../services/vehicle";
import { createTrip } from "../services/trip";
import { useAuth } from "../context/AuthContext";
import { MOROCCO_PLACES, findPlaceCoords, resolvePlaceCoords } from "../data/moroccoPlaces";
import TripLocationPickerMap from "../components/TripLocationPickerMap";

export default function CreateTrip() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Map coordinates state
    const [depCoords, setDepCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);

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

    const handleCityInputChange = async (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        if (!value || value.trim().length < 2) return;

        const coords = findPlaceCoords(value) || (await resolvePlaceCoords(value));
        if (coords) {
            if (field === "departure_city") {
                setDepCoords(coords);
            } else if (field === "destination_city") {
                setDestCoords(coords);
            }
        }
    };

    const handleMapCoordsChange = (target, coords, resolvedAddress) => {
        if (target === "departure") {
            setDepCoords(coords);
            setForm((prev) => ({
                ...prev,
                departure_address: resolvedAddress || prev.departure_address,
                departure_city: prev.departure_city || resolvedAddress.split(",")[0],
            }));
        } else {
            setDestCoords(coords);
            setForm((prev) => ({
                ...prev,
                destination_address: resolvedAddress || prev.destination_address,
                destination_city: prev.destination_city || resolvedAddress.split(",")[0],
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await createTrip(form);
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
                <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
                <p className="mt-2 text-muted small">Checking driver verification status...</p>
            </Container>
        );
    }

    if (user?.verification_status !== "verified") {
        const isPending = user?.verification_status === "pending";

        return (
            <Container className="py-5" style={{ maxWidth: "600px" }}>
                <Card className="shadow-sm border-0 text-center p-4">
                    <Card.Body>
                        <div
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                backgroundColor: "var(--color-secondary-subtle)",
                                color: "var(--color-primary)",
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h4 className="fw-semibold mb-2" style={{ color: "var(--color-text-main)" }}>
                            Driver Verification Required
                        </h4>
                        <p className="text-muted small mb-4">
                            {isPending
                                ? "Your government identification documents are currently under administrative review. You will be able to publish rides once verified."
                                : "To preserve safety and platform trust, drivers must verify their identity credentials before offering seats."}
                        </p>
                        <div className="d-flex justify-content-center gap-2">
                            <Button as={Link} to="/profile" variant="primary" size="sm">
                                {isPending ? "View Profile Status" : "Upload Verification Documents"}
                            </Button>
                            <Button as={Link} to="/" variant="outline-secondary" size="sm">
                                Back to Discovery
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-lg-5">
            <div className="mb-4">
                <h3 className="fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>Publish a New Ride</h3>
                <p className="text-muted small mb-0">Fill in the journey details or pick your route directly on the map.</p>
            </div>

            {error && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setError(null)}
                    style={{
                        backgroundColor: "var(--color-danger-subtle)",
                        borderColor: "rgba(178, 71, 71, 0.2)",
                        color: "var(--color-danger)",
                    }}
                >
                    {error}
                </Alert>
            )}

            {verifiedVehicles.length === 0 ? (
                <Alert
                    className="border-0 shadow-sm p-4"
                    style={{
                        backgroundColor: "var(--color-warning-subtle)",
                        color: "var(--color-warning)",
                    }}
                >
                    <h5 className="fw-semibold mb-2">Verified Vehicle Required</h5>
                    <p className="small mb-3" style={{ color: "var(--color-text-muted)" }}>
                        Your driver identity is approved, but you need at least one verified vehicle.
                        Please ensure your registration certificate (Carte Grise) and insurance papers
                        are reviewed before offering journeys.
                    </p>
                    <Button as={Link} to="/profile" variant="outline-secondary" size="sm">
                        Go to My Profile & Add Vehicle
                    </Button>
                </Alert>
            ) : (
                <Row className="g-4">
                    {/* Left Column: Form Inputs */}
                    <Col lg={6}>
                        <Card className="shadow-sm border-0 h-100">
                            <Card.Body className="p-4">
                                <Form onSubmit={handleSubmit}>
                                    <datalist id="moroccan-cities-list">
                                        {MOROCCO_PLACES.map((p) => (
                                            <option key={p.name} value={p.name} />
                                        ))}
                                    </datalist>

                                    <Row className="g-3">
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted d-flex align-items-center gap-1">
                                                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-primary)" }} />
                                                Departure City
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                list="moroccan-cities-list"
                                                placeholder="e.g. Casablanca"
                                                value={form.departure_city}
                                                onChange={(e) =>
                                                    handleCityInputChange("departure_city", e.target.value)
                                                }
                                                required
                                            />
                                        </Col>

                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted d-flex align-items-center gap-1">
                                                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-danger)" }} />
                                                Destination City
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                list="moroccan-cities-list"
                                                placeholder="e.g. Rabat"
                                                value={form.destination_city}
                                                onChange={(e) =>
                                                    handleCityInputChange("destination_city", e.target.value)
                                                }
                                                required
                                            />
                                        </Col>

                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">
                                                Pickup Meeting Point
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. Casa-Voyageurs Station"
                                                value={form.departure_address}
                                                onChange={(e) =>
                                                    setForm({ ...form, departure_address: e.target.value })
                                                }
                                            />
                                        </Col>

                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">
                                                Drop-off Point
                                            </Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. Rabat Agdal Station"
                                                value={form.destination_address}
                                                onChange={(e) =>
                                                    setForm({ ...form, destination_address: e.target.value })
                                                }
                                            />
                                        </Col>

                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">
                                                Departure Date & Time
                                            </Form.Label>
                                            <Form.Control
                                                type="datetime-local"
                                                value={form.departure_time}
                                                onChange={(e) =>
                                                    setForm({ ...form, departure_time: e.target.value })
                                                }
                                                required
                                            />
                                        </Col>

                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">
                                                Assigned Vehicle
                                            </Form.Label>
                                            <Form.Select
                                                value={form.vehicle_id}
                                                onChange={(e) =>
                                                    setForm({ ...form, vehicle_id: e.target.value })
                                                }
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
                                            <Form.Label className="small fw-semibold text-muted">
                                                Available Seats
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                max="8"
                                                value={form.available_seats}
                                                onChange={(e) =>
                                                    setForm({ ...form, available_seats: e.target.value })
                                                }
                                                required
                                            />
                                        </Col>

                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">
                                                Price per Seat (MAD)
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="10"
                                                step="5"
                                                value={form.price_per_seat}
                                                onChange={(e) =>
                                                    setForm({ ...form, price_per_seat: e.target.value })
                                                }
                                                required
                                            />
                                        </Col>
                                    </Row>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100 mt-4 py-2 text-white fw-medium"
                                        disabled={submitting}
                                        style={{
                                            backgroundColor: "#527050",
                                            borderColor: "#527050",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        {submitting ? "Publishing Ride..." : "Publish Ride"}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column: Interactive Location Picker Map */}
                    <Col lg={6}>
                        <TripLocationPickerMap
                            depCoords={depCoords}
                            destCoords={destCoords}
                            onCoordsChange={handleMapCoordsChange}
                            departureCity={form.departure_city}
                            destinationCity={form.destination_city}
                        />
                    </Col>
                </Row>
            )}
        </Container>
    );
}