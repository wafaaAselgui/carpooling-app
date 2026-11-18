import { useEffect, useState, useRef } from "react";
import { Card, Button, Form, Row, Col, Alert, Spinner, Modal } from "react-bootstrap";
import {
  getMyVehicles,
  createVehicle,
  deleteVehicle,
  uploadVehicleDocuments,
  updateVehiclePhoto,
} from "../services/vehicle";
import { getFriendlyError } from "../utils/errorHandler";

export default function VehicleManager() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Instant photo replacement state
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [photoTargetId, setPhotoTargetId] = useState(null);
  const fileInputRef = useRef(null);

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
      setVehicles(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(getFriendlyError(err, "Unable to load your registered vehicles."));
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
      setError(getFriendlyError(err, "Failed to register vehicle."));
    }
  };

  const triggerPhotoPicker = (vehicleId) => {
    setPhotoTargetId(vehicleId);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleQuickPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetId) return;

    setUploadingPhotoId(photoTargetId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await updateVehiclePhoto(photoTargetId, file);
      const updatedVehicle = res.vehicle || res;

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === photoTargetId
            ? {
                ...v,
                ...updatedVehicle,
                // Cache-bust photo_url so the browser renders the new image immediately
                photo_url: updatedVehicle.photo_url
                  ? `${updatedVehicle.photo_url}?t=${Date.now()}`
                  : v.photo_url,
              }
            : v
        )
      );
      setSuccessMsg("Vehicle photo updated successfully.");
      // Refresh list to ensure backend-generated accessors stay in sync
      loadVehicles();
    } catch (err) {
      setError(getFriendlyError(err, "Failed to update vehicle photo. Max size is 2MB."));
    } finally {
      setUploadingPhotoId(null);
      setPhotoTargetId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this vehicle?")) return;
    try {
      await deleteVehicle(id);
      setVehicles(vehicles.filter((v) => v.id !== id));
      setSuccessMsg("Vehicle removed successfully.");
    } catch (err) {
      setError(getFriendlyError(err, "Failed to delete vehicle."));
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
      setError(getFriendlyError(err, "Failed to upload vehicle documents."));
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
            style={{
              backgroundColor: "var(--color-warning-subtle)",
              color: "var(--color-warning)",
              border: "1px solid rgba(148, 105, 39, 0.2)",
            }}
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
      <Card.Body className="p-3 p-md-4">
        {/* Hidden shared file input for instant car photo replacement */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          className="d-none"
          onChange={handleQuickPhotoChange}
        />

        <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
          <h5 className="fw-semibold mb-0" style={{ color: "var(--color-text-main)" }}>
            Registered Vehicles
          </h5>
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
            style={{
              backgroundColor: "var(--color-secondary-subtle)",
              color: "var(--color-primary)",
              border: "none",
            }}
          >
            {successMsg}
          </Alert>
        )}

        {error && (
          <Alert
            dismissible
            onClose={() => setError(null)}
            style={{
              backgroundColor: "var(--color-danger-subtle)",
              color: "var(--color-danger)",
              border: "none",
            }}
          >
            {error}
          </Alert>
        )}

        {showForm && (
          <Form
            onSubmit={handleSubmit}
            className="p-3 rounded mb-3"
            style={{
              backgroundColor: "var(--color-canvas)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <Row className="g-2">
              <Col xs={12} sm={6}>
                <Form.Label className="small fw-semibold text-muted">Brand</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Dacia"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  required
                />
              </Col>
              <Col xs={12} sm={6}>
                <Form.Label className="small fw-semibold text-muted">Model</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Duster"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  required
                />
              </Col>
              <Col xs={6} sm={4}>
                <Form.Label className="small fw-semibold text-muted">Color</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Silver"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  required
                />
              </Col>
              <Col xs={6} sm={4}>
                <Form.Label className="small fw-semibold text-muted">License Plate</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. 12345-A-6"
                  value={form.license_plate}
                  onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                  required
                />
              </Col>
              <Col xs={12} sm={4}>
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
            <Spinner animation="border" size="sm" style={{ color: "var(--color-primary)" }} />{" "}
            Loading vehicles...
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-muted small mb-0">
            No vehicles registered yet. Add a vehicle and its papers to offer rides.
          </p>
        ) : (
          <Row className="g-3">
            {vehicles.map((v) => {
              const isUploadingThis = uploadingPhotoId === v.id;

              return (
                <Col key={v.id} xs={12} sm={6} md={4}>
                  <Card
                    className="h-100 border overflow-hidden"
                    style={{ borderColor: "var(--color-border-subtle)" }}
                  >
                    {/* Vehicle Image Wrapper with Instant Change Photo Button */}
                    <div className="position-relative" style={{ height: "145px" }}>
                      {v.photo_url ? (
                        <Card.Img
                          variant="top"
                          src={v.photo_url}
                          style={{ height: "100%", width: "100%", objectFit: "cover" }}
                          alt={`${v.brand} ${v.model}`}
                        />
                      ) : (
                        <div
                          className="text-muted small d-flex flex-column align-items-center justify-content-center h-100 gap-1"
                          style={{ backgroundColor: "var(--color-canvas)" }}
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ opacity: 0.5 }}
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>No photo provided</span>
                        </div>
                      )}

                      {/* Floating Change Photo Button */}
                      <button
                        type="button"
                        disabled={isUploadingThis}
                        onClick={() => triggerPhotoPicker(v.id)}
                        className="btn btn-sm position-absolute bottom-0 end-0 m-2 px-2 py-1 d-inline-flex align-items-center gap-1 shadow-sm"
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.94)",
                          color: "var(--color-text-main)",
                          border: "1px solid var(--color-border)",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          borderRadius: "var(--radius-sm)",
                          backdropFilter: "blur(4px)",
                        }}
                        title="Change vehicle photo"
                      >
                        {isUploadingThis ? (
                          <>
                            <Spinner animation="border" size="sm" style={{ width: 11, height: 11 }} />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                            <span>Change Photo</span>
                          </>
                        )}
                      </button>
                    </div>

                    <Card.Body className="p-3 d-flex flex-column justify-content-between">
                      <div>
                        <h6
                          className="fw-semibold mb-1 text-capitalize"
                          style={{ color: "var(--color-text-main)" }}
                        >
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
              );
            })}
          </Row>
        )}
      </Card.Body>

      {/* Document Upload Modal */}
      <Modal show={Boolean(docModalVehicle)} onHide={() => setDocModalVehicle(null)} centered>
        <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
          <Modal.Title className="fs-6 fw-semibold text-dark">
            Upload Papers — {docModalVehicle?.brand} {docModalVehicle?.model} (
            {docModalVehicle?.license_plate})
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUploadDocuments}>
          <Modal.Body className="p-3 p-md-4">
            <p className="small text-muted mb-3">
              Please attach clear copies of your vehicle registration certificate (Carte Grise) and
              insurance document.
            </p>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                Registration Certificate (Carte Grise)
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocForm({ ...docForm, registrationDoc: e.target.files[0] })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                Insurance Certificate
              </Form.Label>
              <Form.Control
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setDocForm({ ...docForm, insuranceDoc: e.target.files[0] })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-muted">
                Insurance Expiration Date
              </Form.Label>
              <Form.Control
                type="date"
                value={docForm.insuranceExpiresAt}
                onChange={(e) => setDocForm({ ...docForm, insuranceExpiresAt: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer
            className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2"
            style={{ borderColor: "var(--color-border-subtle)" }}
          >
            <Button
              variant="outline-secondary"
              size="sm"
              className="m-0"
              onClick={() => setDocModalVehicle(null)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="m-0"
              disabled={submittingDocs}
            >
              {submittingDocs ? "Submitting..." : "Submit Documents"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
}