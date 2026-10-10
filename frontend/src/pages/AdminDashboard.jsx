import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Table, Badge, Button, Tabs, Tab, Spinner, Alert } from "react-bootstrap";
import { getAdminStats, getAdminUsers, getAdminTrips, adminCancelTrip, toggleBanUser } from "../services/admin";

function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const [statsData, usersData, tripsData] = await Promise.all([
                getAdminStats(),
                getAdminUsers(),
                getAdminTrips(),
            ]);
            setStats(statsData);
            setUsers(usersData.data || usersData);
            setTrips(tripsData.data || tripsData);
        } catch (err) {
            console.error("Erreur admin:", err);
            setError("Impossible de charger les données du tableau de bord.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    const handleCancelTrip = async (tripId) => {
        if (!window.confirm(`Confirmer l'annulation forcée du trajet #${tripId} ?`)) return;

        try {
            await adminCancelTrip(tripId);
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || "Échec de l'annulation.");
        }
    };

    const handleToggleBan = async (user) => {
        const actionLabel = user.is_banned ? "réactiver" : "suspendre";
        if (!window.confirm(`Confirmer la demande : ${actionLabel} le compte de ${user.name} ?`)) return;

        try {
            await toggleBanUser(user.id);
            loadAllData();
        } catch (err) {
            alert(err.response?.data?.message || `Échec lors de l'opération pour ${actionLabel} l'utilisateur.`);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "scheduled":
                return <Badge bg="primary">Scheduled</Badge>;
            case "in_progress":
                return <Badge bg="warning" text="dark">In Progress</Badge>;
            case "completed":
                return <Badge bg="success">Completed</Badge>;
            case "cancelled":
                return <Badge bg="danger">Cancelled</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="dark" />
                <p className="mt-2 text-muted">Chargement du tableau d'administration...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h1 className="mb-4">Admin Dashboard</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* KPI Metrics */}
            {stats && (
                <Row className="g-3 mb-4">
                    <Col xs={6} md={3}>
                        <Card className="text-center shadow-sm border-0 bg-light">
                            <Card.Body>
                                <div className="text-muted small">Total Utilisateurs</div>
                                <h3 className="fw-bold mb-0">{stats.total_users}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={6} md={3}>
                        <Card className="text-center shadow-sm border-0 bg-light">
                            <Card.Body>
                                <div className="text-muted small">Total Trajets</div>
                                <h3 className="fw-bold mb-0">{stats.total_trips}</h3>
                                <small className="text-success">{stats.completed_trips} terminés</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={6} md={3}>
                        <Card className="text-center shadow-sm border-0 bg-light">
                            <Card.Body>
                                <div className="text-muted small">Réservations</div>
                                <h3 className="fw-bold mb-0">{stats.total_bookings}</h3>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={6} md={3}>
                        <Card className="text-center shadow-sm border-0 bg-light">
                            <Card.Body>
                                <div className="text-muted small">Volume d'affaires</div>
                                <h3 className="fw-bold mb-0 text-primary">{stats.gross_volume_mad} MAD</h3>
                                <small className="text-warning">★ {stats.average_platform_rating}/5 ({stats.total_reviews} avis)</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Management Tabs */}
            <Tabs defaultActiveKey="trips" className="mb-3">
                <Tab eventKey="trips" title={`Modération des Trajets (${trips.length})`}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-0">
                            <Table responsive hover className="align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>#</th>
                                        <th>Trajet</th>
                                        <th>Conducteur</th>
                                        <th>Départ</th>
                                        <th>Places</th>
                                        <th>Statut</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.map((t) => (
                                        <tr key={t.id}>
                                            <td>{t.id}</td>
                                            <td>
                                                <strong>{t.departure_city} → {t.destination_city}</strong>
                                                <div className="text-muted small">{t.price_per_seat} MAD / place</div>
                                            </td>
                                            <td>
                                                {t.driver?.name}
                                                <div className="text-muted small">{t.driver?.email}</div>
                                            </td>
                                            <td>{new Date(t.departure_time).toLocaleDateString()}</td>
                                            <td>{t.available_seats} / {t.total_seats} ({t.bookings_count} rés.)</td>
                                            <td>{getStatusBadge(t.status)}</td>
                                            <td>
                                                {t.status !== "cancelled" && t.status !== "completed" ? (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleCancelTrip(t.id)}
                                                    >
                                                        Annuler
                                                    </Button>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="users" title={`Utilisateurs (${users.length})`}>
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-0">
                            <Table responsive hover className="align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Nom</th>
                                        <th>Email</th>
                                        <th>Rôle</th>
                                        <th>Statut</th>
                                        <th>Véhicules</th>
                                        <th>Inscrit le</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} className={u.is_banned ? "table-danger" : ""}>
                                            <td>{u.id}</td>
                                            <td><strong>{u.name}</strong></td>
                                            <td>{u.email}</td>
                                            <td>
                                                {u.is_admin ? (
                                                    <Badge bg="danger">Admin</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Membre</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {u.is_banned ? (
                                                    <Badge bg="danger">Suspendu</Badge>
                                                ) : (
                                                    <Badge bg="success">Actif</Badge>
                                                )}
                                            </td>
                                            <td>{u.vehicles_count ?? 0}</td>
                                            <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {!u.is_admin ? (
                                                    <Button
                                                        variant={u.is_banned ? "outline-success" : "outline-danger"}
                                                        size="sm"
                                                        onClick={() => handleToggleBan(u)}
                                                    >
                                                        {u.is_banned ? "Réactiver" : "Bannir"}
                                                    </Button>
                                                ) : (
                                                    <span className="text-muted small">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
}

export default AdminDashboard;