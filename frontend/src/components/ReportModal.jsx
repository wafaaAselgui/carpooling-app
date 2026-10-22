import { useState } from "react";
import { Modal, Form, Button, Alert } from "react-bootstrap";
import api from "../services/api";

const PRESET_REASONS = {
  user: [
    "No-show / Abandoned trip",
    "Harassment or rude behavior",
    "Dangerous or erratic driving",
    "Asked for off-platform payment",
    "Fake account or identity mismatch",
    "Other",
  ],
  trip: [
    "Suspicious or fake ride listing",
    "Exorbitant or unreasonable pricing",
    "Inappropriate pickup or drop-off location",
    "Other",
  ],
  review: [
    "Profanity, offensive or hateful language",
    "False accusations / Defamation",
    "Spam or advertising",
    "Other",
  ],
};

export default function ReportModal({ show, onHide, targetType, targetId, targetName }) {
  const reasons = PRESET_REASONS[targetType] || PRESET_REASONS.user;
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [customDetails, setCustomDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
      await api.post(
        "/reports",
        {
          reportable_type: targetType,
          reportable_id: targetId,
          reason: selectedReason,
          details: customDetails,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCustomDetails("");
        setSelectedReason(reasons[0]);
        onHide();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold text-danger">
          🚨 Report {targetType.toUpperCase()}: {targetName}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {success ? (
            <Alert variant="success" className="mb-0 text-center py-3">
              ✓ Report received. Thank you for keeping the community safe!
            </Alert>
          ) : (
            <>
              {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Select reason</Form.Label>
                <Form.Select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">
                  {selectedReason === "Other" ? "Explain the issue (Required)" : "Additional Details (Optional)"}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required={selectedReason === "Other"}
                  placeholder="Provide context or description of what happened..."
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        {!success && (
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </Modal.Footer>
        )}
      </Form>
    </Modal>
  );
}