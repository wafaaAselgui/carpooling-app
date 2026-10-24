import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Tabs, Tab } from "react-bootstrap";
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

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingVehicles, setPendingVehicles] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

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

    const pendingReportsCount = reports.filter((r) => r.status === "pending").length;

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="warning" />
                <p className="mt-2 text-muted">Loading Administrator Control Center...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 px-lg-5">
            <h2 className="fw-bold mb-4">Admin Dashboard</h2>

            {feedback && <Alert variant="success" onClose={() => setFeedback(null)} dismissible>{feedback}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

            {/* Quick Metrics */}
            <Row className="g-3 mb-4">
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm bg-primary text-white">
                        <Card.Body>
                            <h6 className="small text-uppercase">Total Registered Users</h6>
                            <h3 className="fw-bold mb-0">{stats?.total_users || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm bg-success text-white">
                        <Card.Body>
                            <h6 className="small text-uppercase">Total Trips Published</h6>
                            <h3 className="fw-bold mb-0">{stats?.total_trips || 0}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm bg-warning text-dark">
                        <Card.Body>
                            <h6 className="small text-uppercase">Pending Verifications</h6>
                            <h3 className="fw-bold mb-0">
                                {(stats?.pending_users || 0) + (stats?.pending_vehicles || 0)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col sm={6} md={3}>
                    <Card className="border-0 shadow-sm bg-danger text-white">
                        <Card.Body>
                            <h6 className="small text-uppercase">Open Reports</h6>
                            <h3 className="fw-bold mb-0">{pendingReportsCount}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Management Tabs */}
            <Card className="border-0 shadow-sm">
                <Card.Body>
                    <Tabs defaultActiveKey="reports" className="mb-3">
                        {/* Tab 1: User & Trip Reports */}
                        <Tab
                            eventKey="reports"
                            title={
                                <span>
                                    🚨 Reports {pendingReportsCount > 0 && <Badge bg="danger" pill className="ms-1">{pendingReportsCount}</Badge>}
                                </span>
                            }
                        >
                            {reports.length === 0 ? (
                                <Alert variant="light" className="text-center py-4 text-muted">
                                    No safety or community reports submitted yet.
                                </Alert>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0 small">
                                    <thead className="table-light">
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
                                            return (
                                                <tr key={r.id}>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                r.reportable_type === "user"
                                                                    ? "info"
                                                                    : r.reportable_type === "trip"
                                                                    ? "primary"
                                                                    : "secondary"
                                                            }
                                                            className="text-capitalize"
                                                        >
                                                            {r.reportable_type}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {r.reportable_type === "user" ? (
                                                            <Link to={`/users/${r.reportable_id}/profile`} className="fw-semibold">
                                                                User #{r.reportable_id} ↗
                                                            </Link>
                                                        ) : r.reportable_type === "trip" ? (
                                                            <Link to={`/trips/${r.reportable_id}`} className="fw-semibold">
                                                                Trip #{r.reportable_id} ↗
                                                            </Link>
                                                        ) : (
                                                            <span>Review #{r.reportable_id}</span>
                                                        )}
                                                    </td>
                                                    <td className="fw-semibold text-danger">{r.reason}</td>
                                                    <td>
                                                        {r.details ? (
                                                            <span className="text-dark bg-light px-2 py-1 rounded d-inline-block">
                                                                {r.details}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted italic">—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div>{r.reporter?.name || "Unknown"}</div>
                                                        <div className="text-muted" style={{ fontSize: "11px" }}>
                                                            {r.reporter?.email}
                                                        </div>
                                                    </td>
                                                    <td className="text-muted" style={{ fontSize: "11px" }}>
                                                        {new Date(r.created_at).toLocaleDateString("en-US", {
                                                            dateStyle: "medium",
                                                        })}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={
                                                                r.status === "resolved"
                                                                    ? "success"
                                                                    : r.status === "dismissed"
                                                                    ? "secondary"
                                                                    : "warning"
                                                            }
                                                            text={r.status === "pending" ? "dark" : undefined}
                                                        >
                                                            {r.status}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {/* Cancel Trip button for trip-targeted reports */}
                                                            {r.reportable_type === "trip" && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-danger"
                                                                    title="Cancel trip & drop bookings"
                                                                    onClick={() => handleCancelReportedTrip(r.reportable_id, r.id)}
                                                                >
                                                                    🗑️ Cancel Trip
                                                                </Button>
                                                            )}

                                                            {isPending ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="success"
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
                                                            ) : (
                                                                <span className="text-muted align-self-center">—</span>
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
                                <Alert variant="light" className="text-center py-4 text-muted">
                                    No pending user identity verification requests.
                                </Alert>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>User</th>
                                            <th>Email / Phone</th>
                                            <th>CIN Number</th>
                                            <th>Document</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map((u) => (
                                            <tr key={u.id}>
                                                <td className="fw-bold">{u.name}</td>
                                                <td>
                                                    <div className="small">{u.email}</div>
                                                    <div className="text-muted small">{u.phone || "No phone"}</div>
                                                </td>
                                                <td>
                                                    <Badge bg="dark">{u.cin_number}</Badge>
                                                </td>
                                                <td>
                                                    {u.cin_document_path ? (
                                                        <a
                                                            href={getStorageUrl(u.cin_document_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            View Document ↗
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted small">None</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => handleReviewUser(u.id, "verified")}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
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
                            title={`Vehicle Papers (${pendingVehicles.length})`}
                        >
                            {pendingVehicles.length === 0 ? (
                                <Alert variant="light" className="text-center py-4 text-muted">
                                    No pending vehicle verification requests.
                                </Alert>
                            ) : (
                                <Table responsive hover align="middle" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Driver</th>
                                            <th>Vehicle</th>
                                            <th>Registration (Carte Grise)</th>
                                            <th>Insurance Certificate</th>
                                            <th>Insurance Expiry</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingVehicles.map((v) => (
                                            <tr key={v.id}>
                                                <td>
                                                    <div className="fw-semibold">{v.user?.name}</div>
                                                    <div className="text-muted small">{v.user?.email}</div>
                                                </td>
                                                <td>
                                                    <div className="fw-bold">{v.brand} {v.model}</div>
                                                    <div className="small text-muted">
                                                        {v.license_plate} • {v.color}
                                                    </div>
                                                </td>
                                                <td>
                                                    {v.registration_doc_path ? (
                                                        <a
                                                            href={getStorageUrl(v.registration_doc_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            View Carte Grise ↗
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted small">Missing</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {v.insurance_doc_path ? (
                                                        <a
                                                            href={getStorageUrl(v.insurance_doc_path)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-primary"
                                                        >
                                                            View Insurance ↗
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted small">Missing</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Badge bg="secondary">
                                                        {v.insurance_expires_at || "Not specified"}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => handleReviewVehicle(v.id, "verified")}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
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
                        <Tab eventKey="users" title={`All Users (${allUsers?.length || 0})`}>
                            <Table responsive hover align="middle" className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Identity Status</th>
                                        <th>Vehicles</th>
                                        <th>Account Status</th>
                                        <th>Moderation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(Array.isArray(allUsers) ? allUsers : []).map((u) => (
                                        <tr key={u.id}>
                                            <td className="fw-bold">
                                                <Link to={`/users/${u.id}/profile`} className="text-decoration-none text-dark hover-primary">
                                                    {u.name}
                                                </Link>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>
                                                <Badge
                                                    bg={
                                                        u.verification_status === "verified"
                                                            ? "success"
                                                            : u.verification_status === "pending"
                                                            ? "warning"
                                                            : "secondary"
                                                    }
                                                    text={u.verification_status === "pending" ? "dark" : "white"}
                                                >
                                                    {u.verification_status}
                                                </Badge>
                                            </td>
                                            <td>{u.vehicles_count ?? u.vehicles?.length ?? 0}</td>
                                            <td>
                                                {u.is_banned ? (
                                                    <Badge bg="danger">Banned</Badge>
                                                ) : (
                                                    <Badge bg="success">Active</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {!u.is_admin && (
                                                    <Button
                                                        size="sm"
                                                        variant={u.is_banned ? "outline-success" : "outline-danger"}
                                                        onClick={() => handleToggleBan(u.id)}
                                                    >
                                                        {u.is_banned ? "Unban User" : "Ban User"}
                                                    </Button>
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
        </Container>
    );
}