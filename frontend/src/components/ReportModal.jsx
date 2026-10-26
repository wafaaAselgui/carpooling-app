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
      <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
        <Modal.Title className="fs-6 fw-semibold d-flex align-items-center gap-2" style={{ color: "var(--color-danger)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <span>Report {targetType?.toUpperCase()}: {targetName}</span>
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4">
          {success ? (
            <Alert
              className="mb-0 text-center py-3 border-0 d-flex align-items-center justify-content-center gap-2"
              style={{
                backgroundColor: "var(--color-secondary-subtle)",
                color: "var(--color-primary)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Report received. Thank you for maintaining community safety.</span>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert
                  variant="danger"
                  dismissible
                  onClose={() => setError(null)}
                  style={{
                    backgroundColor: "var(--color-danger-subtle)",
                    borderColor: "transparent",
                    color: "var(--color-danger)",
                  }}
                >
                  {error}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted">Reason for report</Form.Label>
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
                <Form.Label className="small fw-semibold text-muted">
                  {selectedReason === "Other" ? "Explain the issue (Required)" : "Additional context (Optional)"}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required={selectedReason === "Other"}
                  placeholder="Provide any relevant details or context..."
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        {!success && (
          <Modal.Footer style={{ borderColor: "var(--color-border-subtle)" }}>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onHide}
              disabled={loading}
              style={{ borderColor: "var(--color-border)" }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)", color: "#ffffff" }}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </Modal.Footer>
        )}
      </Form>
    </Modal>
  );
}