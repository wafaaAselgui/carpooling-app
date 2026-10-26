import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Table, Button, Alert, Spinner, Tabs, Tab } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
    getAdminStats,
    getPendingVerifications,
    reviewUserVerification,
    reviewVehicleVerification,
    getAdminUsers,
    toggleBanUser,
    getAdminReports,
    updateReportStatus,
    adminCancelTrip,
} from "../services/admin";
import UserInspectionModal from "../components/admin/UserInspectionModal";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingVehicles, setPendingVehicles] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

    const [selectedUserForInspection, setSelectedUserForInspection] = useState(null);
    const [showInspectionModal, setShowInspectionModal] = useState(false);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, verifData, usersData, reportsData] = await Promise.all([
                getAdminStats(),
                getPendingVerifications(),
                getAdminUsers(),
                getAdminReports().catch(() => ({ data: [] })),
            ]);
            setStats(statsData);
            setPendingUsers(verifData.users || []);
            setPendingVehicles(verifData.vehicles || []);

            const usersList = Array.isArray(usersData) ? usersData : (usersData?.data || []);
            setAllUsers(usersList);

            const reportsList = Array.isArray(reportsData) ? reportsData : (reportsData?.data || []);
            setReports(reportsList);
        } catch {
            setError("Unable to load administration records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleInspectUser = (user) => {
        if (!user) return;
        setSelectedUserForInspection(user);
        setShowInspectionModal(true);
    };

    const handleInspectUserById = (userId) => {
        const numericId = Number(userId);
        const found = allUsers.find((u) => u.id === numericId);
        if (found) {
            handleInspectUser(found);
        } else {
            handleInspectUser({ id: numericId, name: `User #${numericId}`, verification_status: "unverified" });
        }
    };

    const handleReviewUser = async (userId, status) => {
        setError(null);
        setFeedback(null);
        try {
            await reviewUserVerification(userId, status);
            setFeedback(`User identity marked as ${status}.`);
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update identity status.");
        }
    };

    const handleReviewVehicle = async (vehicleId, status) => {
        setError(null);
        setFeedback(null);
        try {
            await reviewVehicleVerification(vehicleId, status);
            setFeedback(`Vehicle documents marked as ${status}.`);
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update vehicle status.");
        }
    };

    const handleToggleBan = async (userId) => {
        setError(null);
        setFeedback(null);
        try {
            const res = await toggleBanUser(userId);
            setFeedback(res.message);
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update user ban status.");
        }
    };

    const handleModerateReport = async (reportId, status) => {
        setError(null);
        setFeedback(null);
        try {
            const res = await updateReportStatus(reportId, status);
            setFeedback(res.message);
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update report status.");
        }
    };

    const handleCancelReportedTrip = async (tripId, reportId) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel Trip #${tripId}? All passenger reservations for this trip will be cancelled.`
        );
        if (!confirmed) return;

        setError(null);
        setFeedback(null);
        try {
            const res = await adminCancelTrip(tripId);
            if (reportId) {
                await updateReportStatus(reportId, "resolved", "Trip cancelled by administrator due to report.");
            }
            setFeedback(res.message || `Trip #${tripId} has been successfully cancelled.`);
            loadDashboardData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel the trip.");
        }
    };

    const getStorageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith("http")) return path;
        const backendBase = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace("/api", "")
            : "http://localhost:8000";
        return `${backendBase}/storage/${path}`;
    };

    const isUserReport = (type) => type === "user" || type === "App\\Models\\User";
    const isTripReport = (type) => type === "trip" || type === "App\\Models\\Trip";

    const pendingReportsCount = reports.filter((r) => r.status === "pending").length;

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
                <p className="mt-2 text-muted small">Loading Administrator Control Center...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-lg-5">
            <div className="mb-4">
                <h2 className="fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>Admin Dashboard</h2>
                <p className="text-muted small mb-0">Platform overview, safety reports, document verification, and account moderation.</p>
            </div>

            {feedback && <Alert variant="success" onClose={() => setFeedback(null)} dismissible>{feedback}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {/* Quick Metrics */}
            <Row className="g-3 mb-4">
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm p-2" style={{ backgroundColor: "var(--color-surface)", borderLeft: "4px solid var(--color-primary)" }}>
                        <Card.Body>
                            <span className="small text-uppercase text-muted fw-semibold">Registered Users</span>
                            <h3 className="fw-bold mt-2 mb-0" style={{ color: "var(--color-text-main)" }}>{stats?.total_users || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm p-2" style={{ backgroundColor: "var(--color-surface)", borderLeft: "4px solid var(--color-primary-light)" }}>
                        <Card.Body>
                            <span className="small text-uppercase text-muted fw-semibold">Total Rides</span>
                            <h3 className="fw-bold mt-2 mb-0" style={{ color: "var(--color-text-main)" }}>{stats?.total_trips || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm p-2" style={{ backgroundColor: "var(--color-surface)", borderLeft: "4px solid var(--color-warning)" }}>
                        <Card.Body>
                            <span className="small text-uppercase text-muted fw-semibold">Pending Verifications</span>
                            <h3 className="fw-bold mt-2 mb-0" style={{ color: "var(--color-warning)" }}>
                                {(stats?.pending_users || 0) + (stats?.pending_vehicles || 0)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm p-2" style={{ backgroundColor: "var(--color-surface)", borderLeft: "4px solid var(--color-danger)" }}>
                        <Card.Body>
                            <span className="small text-uppercase text-muted fw-semibold">Open Reports</span>
                            <h3 className="fw-bold mt-2 mb-0" style={{ color: "var(--color-danger)" }}>{pendingReportsCount}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Management Tabs */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4">
                    <Tabs defaultActiveKey="reports" className="mb-3">
                        {/* Tab 1: User & Trip Reports */}
                        <Tab
                            eventKey="reports"
                            title={
                                <span className="d-flex align-items-center gap-1">
                                    Safety Reports
                                    {pendingReportsCount > 0 && (
                                        <span className="badge badge-blush ms-1">{pendingReportsCount}</span>
                                    )}
                                </span>
                            }
                        >
                            {reports.length === 0 ? (
                                <div className="text-center py-5 text-muted small">
                                    No safety or community reports submitted yet.
                                </div>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0 small">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>Target Entity</th>
                                            <th>Reason</th>
                                            <th>Details / Context</th>
                                            <th>Reporter</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map((r) => {
                                            const isPending = r.status === "pending";
                                            const isUser = isUserReport(r.reportable_type);
                                            const isTrip = isTripReport(r.reportable_type);

                                            return (
                                                <tr key={r.id}>
                                                    <td>
                                                        <span className="badge badge-sage text-capitalize">
                                                            {isUser ? "User" : isTrip ? "Trip" : "Review"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isUser ? (
                                                            <Link to={`/users/${r.reportable_id}/profile`} className="fw-semibold">
                                                                User #{r.reportable_id}
                                                            </Link>
                                                        ) : isTrip ? (
                                                            <Link to={`/trips/${r.reportable_id}`} className="fw-semibold">
                                                                Trip #{r.reportable_id}
                                                            </Link>
                                                        ) : (
                                                            <span>Review #{r.reportable_id}</span>
                                                        )}
                                                    </td>
                                                    <td className="fw-medium text-danger">{r.reason}</td>
                                                    <td>
                                                        {r.details ? (
                                                            <span className="p-1 px-2 rounded" style={{ backgroundColor: "var(--color-canvas)" }}>
                                                                {r.details}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="fw-medium">{r.reporter?.name || "Unknown"}</div>
                                                        <div className="text-muted" style={{ fontSize: "11px" }}>{r.reporter?.email}</div>
                                                    </td>
                                                    <td className="text-muted" style={{ fontSize: "11px" }}>
                                                        {new Date(r.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge ${
                                                                r.status === "resolved"
                                                                    ? "badge-sage"
                                                                    : r.status === "dismissed"
                                                                    ? "bg-light text-muted border"
                                                                    : "badge-blush"
                                                            }`}
                                                        >
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1 align-items-center">
                                                            {isUser && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-primary"
                                                                    onClick={() => handleInspectUserById(r.reportable_id)}
                                                                    className="d-flex align-items-center gap-1"
                                                                >
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <circle cx="11" cy="11" r="8" />
                                                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                                    </svg>
                                                                    Inspect
                                                                </Button>
                                                            )}

                                                            {isTrip && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    onClick={() => handleCancelReportedTrip(r.reportable_id, r.id)}
                                                                >
                                                                    Cancel Trip
                                                                </Button>
                                                            )}

                                                            {isPending && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-success"
                                                                        onClick={() => handleModerateReport(r.id, "resolved")}
                                                                    >
                                                                        Resolve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline-secondary"
                                                                        onClick={() => handleModerateReport(r.id, "dismissed")}
                                                                    >
                                                                        Dismiss
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            )}
                        </Tab>

                        {/* Tab 2: Pending Identity Verifications */}
                        <Tab
                            eventKey="identity"
                            title={`Identity Verifications (${pendingUsers.length})`}
                        >
                            {pendingUsers.length === 0 ? (
                                <div className="text-center py-5 text-muted small">
                                    No pending user identity verification requests.
                                </div>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0 small">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email / Phone</th>
                                            <th>ID Number (CIN)</th>
                                            <th>Document</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map((u) => (
                                            <tr key={u.id}>
                                                <td className="fw-semibold">{u.name}</td>
                                                <td>
                                                    <div>{u.email}</div>
                                                    <div className="text-muted" style={{ fontSize: "11px" }}>{u.phone || "No phone"}</div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-dark border">{u.cin_number}</span>
                                                </td>
                                                <td>
                                                    {u.cin_document_path ? (
                                                        <a
                                                            href={getStorageUrl(u.cin_document_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-secondary"
                                                        >
                                                            View Document
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">None</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleReviewUser(u.id, "verified")}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => handleReviewUser(u.id, "rejected")}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Tab>

                        {/* Tab 3: Pending Vehicle Papers */}
                        <Tab
                            eventKey="vehicles"
                            title={`Vehicle Documents (${pendingVehicles.length})`}
                        >
                            {pendingVehicles.length === 0 ? (
                                <div className="text-center py-5 text-muted small">
                                    No pending vehicle verification requests.
                                </div>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0 small">
                                    <thead>
                                        <tr>
                                            <th>Driver</th>
                                            <th>Vehicle</th>
                                            <th>Registration</th>
                                            <th>Insurance Certificate</th>
                                            <th>Expiry</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingVehicles.map((v) => (
                                            <tr key={v.id}>
                                                <td>
                                                    <div className="fw-semibold">{v.user?.name}</div>
                                                    <div className="text-muted" style={{ fontSize: "11px" }}>{v.user?.email}</div>
                                                </td>
                                                <td>
                                                    <div className="fw-medium">{v.brand} {v.model}</div>
                                                    <div className="text-muted" style={{ fontSize: "11px" }}>
                                                        {v.license_plate} - {v.color}
                                                    </div>
                                                </td>
                                                <td>
                                                    {v.registration_doc_path ? (
                                                        <a
                                                            href={getStorageUrl(v.registration_doc_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-secondary"
                                                        >
                                                            View Paper
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">Missing</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {v.insurance_doc_path ? (
                                                        <a
                                                            href={getStorageUrl(v.insurance_doc_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-secondary"
                                                        >
                                                            View Paper
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted">Missing</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge bg-light text-muted border">
                                                        {v.insurance_expires_at || "Not specified"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => handleReviewVehicle(v.id, "verified")}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() => handleReviewVehicle(v.id, "rejected")}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Tab>

                        {/* Tab 4: User Accounts & Moderation */}
                        <Tab eventKey="users" title={`All Accounts (${allUsers?.length || 0})`}>
                            <Table responsive hover align="middle" className="mb-0 small">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>ID Status</th>
                                        <th>Vehicles</th>
                                        <th>Account Standing</th>
                                        <th>Moderation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(allUsers) ? allUsers : []).map((u) => (
                                        <tr key={u.id}>
                                            <td className="fw-semibold">
                                                <Link to={`/users/${u.id}/profile`} className="text-decoration-none text-dark hover-primary">
                                                    {u.name}
                                                </Link>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span
                                                    className={`badge ${
                                                        u.verification_status === "verified"
                                                            ? "badge-sage"
                                                            : u.verification_status === "pending"
                                                            ? "badge-blush"
                                                            : "bg-light text-muted border"
                                                    }`}
                                                >
                                                    {u.verification_status}
                                                </span>
                                            </td>
                                            <td>{u.vehicles_count ?? u.vehicles?.length ?? 0}</td>
                                            <td>
                                                {u.is_banned ? (
                                                    <span className="badge badge-blush">
                                                        {u.banned_until ? "Suspended (Timed)" : "Banned"}
                                                    </span>
                                                ) : u.is_frozen ? (
                                                    <span
                                                        className="badge d-inline-flex align-items-center gap-1"
                                                        style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(148, 105, 39, 0.2)" }}
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                                            </td>
                                            <td>
                                                {!u.is_admin && (
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-secondary"
                                                            onClick={() => handleInspectUser(u)}
                                                            className="d-flex align-items-center gap-1"
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="11" cy="11" r="8" />
                                                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                            </svg>
                                                            Inspect
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={u.is_banned ? "outline-primary" : "outline-danger"}
                                                            onClick={() => handleToggleBan(u.id)}
                                                        >
                                                            {u.is_banned ? "Reactivate" : "Ban"}
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            <UserInspectionModal
                show={showInspectionModal}
                onHide={() => setShowInspectionModal(false)}
                user={selectedUserForInspection}
                onUserUpdated={() => {
                    loadDashboardData();
                }}
            />
        </Container>
    );
}