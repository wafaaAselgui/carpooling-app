import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert, Spinner, Table, Tab, Tabs } from "react-bootstrap";
import { getUserReportHistory, suspendUserAccount, toggleFreezeUserAccount } from "../../services/admin";

export default function UserInspectionModal({ show, onHide, user, onUserUpdated }) {
    const [reportsData, setReportsData] = useState({ received_reports: [], submitted_reports: [] });
    const [loadingReports, setLoadingReports] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const [duration, setDuration] = useState("24h");
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (show && user?.id) {
            fetchReports();
            setError(null);
            setSuccessMessage(null);
        }
    }, [show, user?.id]);

    const fetchReports = async () => {
        setLoadingReports(true);
        try {
            const data = await getUserReportHistory(user.id);
            setReportsData(data);
        } catch (err) {
            setError("Unable to load report history for this user.");
        } finally {
            setLoadingReports(false);
        }
    };

    const handleSuspend = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        try {
            const res = await suspendUserAccount(user.id, duration, reason);
            setSuccessMessage(res.message || "User account suspended.");
            setReason("");
            if (onUserUpdated) onUserUpdated();
        } catch (err) {
            setError(err.response?.data?.message || "Error applying suspension.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFreeze = async () => {
        setActionLoading(true);
        setError(null);
        try {
            const res = await toggleFreezeUserAccount(user.id);
            setSuccessMessage(res.message || "Account freeze status updated.");
            if (onUserUpdated) onUserUpdated();
        } catch (err) {
            setError(err.response?.data?.message || "Error updating freeze state.");
        } finally {
            setActionLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton style={{ borderColor: "var(--color-border-subtle)" }}>
                <Modal.Title className="d-flex align-items-center gap-2 fs-6">
                    <span className="fw-semibold text-dark">User Inspection: <strong>{user.name}</strong></span>
                    {user.is_banned ? (
                        <span className="badge badge-blush">Suspended</span>
                    ) : user.is_frozen ? (
                        <span
                            className="badge d-inline-flex align-items-center gap-1"
                            style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(148, 105, 39, 0.2)" }}
                        >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="2" y1="12" x2="22" y2="12" />
                                <line x1="12" y1="2" x2="12" y2="22" />
                                <path d="m20 16-4-4 4-4" />
                                <path d="m4 8 4 4-4 4" />
                                <path d="m16 4-4 4-4-4" />
                                <path d="m8 20 4-4 4 4" />
                            </svg>
                            Frozen
                        </span>
                    ) : (
                        <span className="badge badge-sage">Active</span>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-4">
                {error && (
                    <Alert
                        variant="danger"
                        dismissible
                        onClose={() => setError(null)}
                        style={{ backgroundColor: "var(--color-danger-subtle)", borderColor: "transparent", color: "var(--color-danger)" }}
                    >
                        {error}
                    </Alert>
                )}
                {successMessage && (
                    <Alert
                        className="border-0"
                        style={{ backgroundColor: "var(--color-secondary-subtle)", color: "var(--color-primary)" }}
                    >
                        {successMessage}
                    </Alert>
                )}

                {/* Profile Overview Card */}
                <div className="card p-3 mb-3 border-0" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}>
                    <div className="row g-2 small">
                        <div className="col-md-6"><strong className="text-muted">Email:</strong> {user.email}</div>
                        <div className="col-md-6"><strong className="text-muted">National ID (CIN):</strong> {user.cin_number || "Not provided"}</div>
                        <div className="col-md-6">
                            <strong className="text-muted">Verification Status:</strong>{" "}
                            <span className="text-capitalize">{user.verification_status}</span>
                        </div>
                        <div className="col-md-6">
                            <strong className="text-muted">Registered Since:</strong>{" "}
                            {new Date(user.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </div>
                        {user.banned_until && (
                            <div className="col-12 text-danger">
                                <strong>Suspension Active Until:</strong>{" "}
                                {new Date(user.banned_until).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                            </div>
                        )}
                        {user.moderation_reason && (
                            <div className="col-12 text-muted">
                                <strong>Moderation Note:</strong> {user.moderation_reason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <Tabs defaultActiveKey="reports" className="mb-3">
                    <Tab eventKey="reports" title={`Reports Received (${reportsData.received_reports?.length || 0})`}>
                        {loadingReports ? (
                            <div className="text-center py-4 text-muted small">
                                <Spinner animation="border" size="sm" style={{ color: "var(--color-primary)" }} /> Loading report records...
                            </div>
                        ) : reportsData.received_reports?.length === 0 ? (
                            <p className="text-muted text-center py-3 small">No reports filed against this user.</p>
                        ) : (
                            <Table responsive hover size="sm" className="mb-0 small align-middle">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Reason</th>
                                        <th>Reported By</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportsData.received_reports.map((r) => (
                                        <tr key={r.id}>
                                            <td className="text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td className="fw-medium text-danger">{r.reason}</td>
                                            <td>{r.reporter?.name || "Anonymous"}</td>
                                            <td>
                                                <span className={`badge ${r.status === "resolved" ? "badge-sage" : "bg-light text-muted border"}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Tab>

                    <Tab eventKey="moderation" title="Administrative Actions">
                        {/* Freeze Section */}
                        <div className="p-3 mb-3 rounded" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}>
                            <h6 className="fw-semibold mb-1" style={{ color: "var(--color-text-main)" }}>
                                {user.is_frozen ? "Unfreeze Account" : "Freeze Account"}
                            </h6>
                            <p className="text-muted small mb-3">
                                Freezing temporarily blocks publishing rides and booking seats, but permits the user to view their history and profile.
                            </p>
                            <Button
                                variant={user.is_frozen ? "outline-primary" : "outline-secondary"}
                                size="sm"
                                disabled={actionLoading}
                                onClick={handleToggleFreeze}
                            >
                                {user.is_frozen ? "Lift Account Freeze" : "Freeze Account Access"}
                            </Button>
                        </div>

                        {/* Timed Suspension Section */}
                        <div className="p-3 rounded" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}>
                            <h6 className="fw-semibold mb-1 text-danger">Apply Account Suspension</h6>
                            <p className="text-muted small mb-3">
                                Immediately terminates active sessions and blocks authentication until the period expires.
                            </p>
                            <Form onSubmit={handleSuspend}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small text-muted fw-medium">Duration</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    >
                                        <option value="24h">24 Hours</option>
                                        <option value="3d">3 Days</option>
                                        <option value="7d">7 Days</option>
                                        <option value="permanent">Permanent Suspension</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted fw-medium">Administrative Reason (Required)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        placeholder="e.g. Repeated cancellation without passenger notification..."
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </Form.Group>

                                <Button
                                    variant="danger"
                                    type="submit"
                                    size="sm"
                                    disabled={actionLoading || !reason.trim()}
                                    style={{ backgroundColor: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                                >
                                    {actionLoading ? "Processing..." : "Confirm Suspension"}
                                </Button>
                            </Form>
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>

            <Modal.Footer style={{ borderColor: "var(--color-border-subtle)" }}>
                <Button variant="outline-secondary" size="sm" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}