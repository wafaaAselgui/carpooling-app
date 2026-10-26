import { useEffect, useState } from "react";
import { Card, Button, Form, Row, Col, Alert, Spinner, Modal } from "react-bootstrap";
import { getMyVehicles, createVehicle, deleteVehicle, uploadVehicleDocuments } from "../services/vehicle";

export default function VehicleManager() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [form, setForm] = useState({
        brand: "",
        model: "",
        color: "",
        license_plate: "",
        seats: 4,
    });
    const [photoFile, setPhotoFile] = useState(null);

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
            setError("Unable to load your registered vehicles.");
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
            setSuccessMsg("Vehicle successfully added.");
            loadVehicles();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to register vehicle.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this vehicle?")) return;
        try {
            await deleteVehicle(id);
            setVehicles(vehicles.filter((v) => v.id !== id));
            setSuccessMsg("Vehicle removed successfully.");
        } catch {
            setError("Failed to delete vehicle.");
        }
    };

    const handleUploadDocuments = async (e) => {
        e.preventDefault();
        if (!docForm.registrationDoc || !docForm.insuranceDoc || !docForm.insuranceExpiresAt) {
            setError("Please attach both certificates and specify the insurance expiry date.");
            return;
        }

        try {
            setSubmittingDocs(true);
            setError(null);
            await uploadVehicleDocuments(docModalVehicle.id, docForm);
            setSuccessMsg("Vehicle papers uploaded. Under review by administration.");
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
                return <span className="badge badge-sage">Verified Documents</span>;
            case "pending":
                return (
                    <span
                        className="badge"
                        style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(148, 105, 39, 0.2)" }}
                    >
                        Papers Pending Review
                    </span>
                );
            case "rejected":
                return <span className="badge badge-blush">Papers Declined</span>;
            default:
                return <span className="badge bg-light text-muted border">Unverified Documents</span>;
        }
    };

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-semibold mb-0" style={{ color: "var(--color-text-main)" }}>Registered Vehicles</h5>
                    <Button
                        size="sm"
                        variant={showForm ? "outline-secondary" : "primary"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "Cancel" : "Add Vehicle"}
                    </Button>
                </div>

                {successMsg && (
                    <Alert
                        dismissible
                        onClose={() => setSuccessMsg(null)}
                        style={{ backgroundColor: "var(--color-secondary-subtle)", color: "var(--color-primary)", border: "none" }}
                    >
                        {successMsg}
                    </Alert>
                )}

                {error && (
                    <Alert
                        dismissible
                        onClose={() => setError(null)}
                        style={{ backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)", border: "none" }}
                    >
                        {error}
                    </Alert>
                )}

                {showForm && (
                    <Form
                        onSubmit={handleSubmit}
                        className="p-3 rounded mb-3"
                        style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}
                    >
                        <Row className="g-2">
                            <Col sm={6}>
                                <Form.Label className="small fw-semibold text-muted">Brand</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Dacia"
                                    value={form.brand}
                                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={6}>
                                <Form.Label className="small fw-semibold text-muted">Model</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Duster"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold text-muted">Color</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Silver"
                                    value={form.color}
                                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold text-muted">License Plate</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. 12345-A-6"
                                    value={form.license_plate}
                                    onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold text-muted">Seats</Form.Label>
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
                                <Form.Label className="small fw-semibold text-muted">Vehicle Photo</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhotoFile(e.target.files[0])}
                                />
                            </Col>
                        </Row>
                        <Button type="submit" size="sm" variant="primary" className="mt-3 px-3">
                            Save Vehicle
                        </Button>
                    </Form>
                )}

                {loading ? (
                    <div className="text-center py-3 text-muted small">
                        <Spinner animation="border" size="sm" style={{ color: "var(--color-primary)" }} /> Loading vehicles...
                    </div>
                ) : vehicles.length === 0 ? (
                    <p className="text-muted small mb-0">No vehicles registered yet. Add a vehicle and its papers to offer rides.</p>
                ) : (
                    <Row className="g-3">
                        {vehicles.map((v) => (
                            <Col key={v.id} sm={6} md={4}>
                                <Card className="h-100 border overflow-hidden" style={{ borderColor: "var(--color-border-subtle)" }}>
                                    {v.photo_url ? (
                                        <Card.Img
                                            variant="top"
                                            src={v.photo_url}
                                            style={{ height: "130px", objectFit: "cover" }}
                                            alt={`${v.brand} ${v.model}`}
                                        />
                                    ) : (
                                        <div
                                            className="text-muted small d-flex align-items-center justify-content-center"
                                            style={{ height: "130px", backgroundColor: "var(--color-canvas)" }}
                                        >
                                            No photo provided
                                        </div>
                                    )}
                                    <Card.Body className="p-3 d-flex flex-column justify-content-between">
                                        <div>
                                            <h6 className="fw-semibold mb-1" style={{ color: "var(--color-text-main)" }}>
                                                {v.brand} {v.model}
                                            </h6>
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
                                                    variant="outline-secondary"
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
                <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
                    <Modal.Title className="fs-6 fw-semibold text-dark">
                        Upload Papers — {docModalVehicle?.brand} {docModalVehicle?.model} ({docModalVehicle?.license_plate})
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUploadDocuments}>
                    <Modal.Body className="p-4">
                        <p className="small text-muted mb-3">
                            Please attach clear copies of your vehicle registration certificate (Carte Grise) and insurance document.
                        </p>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold text-muted">Registration Certificate (Carte Grise)</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setDocForm({ ...docForm, registrationDoc: e.target.files[0] })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-semibold text-muted">Insurance Certificate</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setDocForm({ ...docForm, insuranceDoc: e.target.files[0] })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-semibold text-muted">Insurance Expiration Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={docForm.insuranceExpiresAt}
                                onChange={(e) => setDocForm({ ...docForm, insuranceExpiresAt: e.target.value })}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer style={{ borderColor: "var(--color-border-subtle)" }}>
                        <Button variant="outline-secondary" size="sm" onClick={() => setDocModalVehicle(null)}>
                            Close
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={submittingDocs}>
                            {submittingDocs ? "Submitting..." : "Submit Documents"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Card>
    );
}