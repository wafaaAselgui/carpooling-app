import { useEffect, useState } from "react";
import { Card, Button, Form, Row, Col, Alert, Spinner, Badge, Modal } from "react-bootstrap";
import { getMyVehicles, createVehicle, deleteVehicle, uploadVehicleDocuments } from "../services/vehicle";

export default function VehicleManager() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Vehicle Creation Form
    const [form, setForm] = useState({
        brand: "",
        model: "",
        color: "",
        license_plate: "",
        seats: 4,
    });
    const [photoFile, setPhotoFile] = useState(null);

    // Document Modal State
    const [docModalVehicle, setDocModalVehicle] = useState(null);
    const [docForm, setDocForm] = useState({
        registrationDoc: null,
        insuranceDoc: null,
        insuranceExpiresAt: "",
    });
    const [submittingDocs, setSubmittingDocs] = useState(false);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await getMyVehicles();
            setVehicles(data);
        } catch {
            setError("Unable to load your vehicles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVehicles();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        try {
            await createVehicle(form, photoFile);
            setForm({ brand: "", model: "", color: "", license_plate: "", seats: 4 });
            setPhotoFile(null);
            setShowForm(false);
            setSuccessMsg("Vehicle added successfully!");
            loadVehicles();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add vehicle.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
        try {
            await deleteVehicle(id);
            setVehicles(vehicles.filter((v) => v.id !== id));
            setSuccessMsg("Vehicle deleted successfully.");
        } catch {
            setError("Failed to delete vehicle.");
        }
    };

    const handleUploadDocuments = async (e) => {
        e.preventDefault();
        if (!docForm.registrationDoc || !docForm.insuranceDoc || !docForm.insuranceExpiresAt) {
            setError("Please attach both documents and specify the insurance expiry date.");
            return;
        }

        try {
            setSubmittingDocs(true);
            setError(null);
            await uploadVehicleDocuments(docModalVehicle.id, docForm);
            setSuccessMsg("Vehicle papers submitted successfully. Pending review.");
            setDocModalVehicle(null);
            setDocForm({ registrationDoc: null, insuranceDoc: null, insuranceExpiresAt: "" });
            loadVehicles();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to upload vehicle documents.");
        } finally {
            setSubmittingDocs(false);
        }
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case "verified":
                return <Badge bg="success">✓ Verified Documents</Badge>;
            case "pending":
                return <Badge bg="warning" text="dark">⏳ Documents Pending</Badge>;
            case "rejected":
                return <Badge bg="danger">✕ Documents Rejected</Badge>;
            default:
                return <Badge bg="secondary">Unverified Documents</Badge>;
        }
    };

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">My Vehicles</h5>
                    <Button
                        size="sm"
                        variant={showForm ? "outline-secondary" : "primary"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "Cancel" : "+ Add Vehicle"}
                    </Button>
                </div>

                {successMsg && <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible>{successMsg}</Alert>}
                {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

                {/* Add Vehicle Form */}
                {showForm && (
                    <Form onSubmit={handleSubmit} className="p-3 bg-light rounded mb-3">
                        <Row className="g-2">
                            <Col sm={6}>
                                <Form.Label className="small fw-semibold">Brand</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Dacia"
                                    value={form.brand}
                                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={6}>
                                <Form.Label className="small fw-semibold">Model</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Logan"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold">Color</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. White"
                                    value={form.color}
                                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold">License Plate</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. 12345-A-6"
                                    value={form.license_plate}
                                    onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold">Seats</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={form.seats}
                                    onChange={(e) => setForm({ ...form, seats: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col xs={12}>
                                <Form.Label className="small fw-semibold">Vehicle Photo</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhotoFile(e.target.files[0])}
                                />
                            </Col>
                        </Row>
                        <Button type="submit" size="sm" variant="success" className="mt-3">
                            Save Vehicle
                        </Button>
                    </Form>
                )}

                {/* Existing Vehicles Grid */}
                {loading ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : vehicles.length === 0 ? (
                    <p className="text-muted small mb-0">
                        No vehicles registered yet. Add one to publish carpool rides.
                    </p>
                ) : (
                    <Row className="g-3">
                        {vehicles.map((v) => (
                            <Col key={v.id} sm={6} md={4}>
                                <Card className="h-100 border">
                                    {v.photo_url ? (
                                        <Card.Img
                                            variant="top"
                                            src={v.photo_url}
                                            style={{ height: "135px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div
                                            className="bg-light text-muted d-flex align-items-center justify-content-center"
                                            style={{ height: "135px" }}
                                        >
                                            No photo
                                        </div>
                                    )}
                                    <Card.Body className="p-2 d-flex flex-column justify-content-between">
                                        <div>
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <h6 className="fw-bold mb-0">
                                                    {v.brand} {v.model}
                                                </h6>
                                            </div>
                                            <div className="text-muted small">
                                                {v.color} • {v.seats} seats
                                            </div>
                                            <div className="text-muted small mb-2">{v.license_plate}</div>
                                            <div className="mb-2">{renderStatusBadge(v.status)}</div>
                                        </div>

                                        <div className="d-grid gap-1 mt-2">
                                            {v.status !== "verified" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => setDocModalVehicle(v)}
                                                >
                                                    {v.status === "pending" ? "Update Papers" : "Upload Papers"}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDelete(v.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card.Body>

            {/* Document Upload Modal */}
            <Modal show={Boolean(docModalVehicle)} onHide={() => setDocModalVehicle(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="h6">
                        Upload Papers - {docModalVehicle?.brand} {docModalVehicle?.model} ({docModalVehicle?.license_plate})
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUploadDocuments}>
                    <Modal.Body>
                        <div className="small text-muted mb-3">
                            Please provide clear copies of your vehicle registration certificate (Carte Grise) and valid insurance certificate.
                        </div>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold">Registration Certificate (Carte Grise)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setDocForm({ ...docForm, registrationDoc: e.target.files[0] })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold">Insurance Certificate</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setDocForm({ ...docForm, insuranceDoc: e.target.files[0] })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-semibold">Insurance Expiry Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={docForm.insuranceExpiresAt}
                                onChange={(e) => setDocForm({ ...docForm, insuranceExpiresAt: e.target.value })}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" size="sm" onClick={() => setDocModalVehicle(null)}>
                            Close
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={submittingDocs}>
                            {submittingDocs ? "Submitting..." : "Submit for Verification"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Card>
    );
}