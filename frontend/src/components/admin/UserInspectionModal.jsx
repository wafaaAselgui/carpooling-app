import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Form, Alert, Spinner, Table, Tab, Tabs } from "react-bootstrap";
import { getUserReportHistory, suspendUserAccount, toggleFreezeUserAccount } from "../../services/admin";

export default function UserInspectionModal({ show, onHide, user, onUserUpdated }) {
    const [reportsData, setReportsData] = useState({ received_reports: [], submitted_reports: [] });
    const [loadingReports, setLoadingReports] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Suspension form inputs
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
            setError("Impossible de charger l'historique des signalements.");
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
            setSuccessMessage(res.message || "Utilisateur suspendu.");
            setReason("");
            if (onUserUpdated) onUserUpdated();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de la suspension.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleFreeze = async () => {
        setActionLoading(true);
        setError(null);
        try {
            const res = await toggleFreezeUserAccount(user.id);
            setSuccessMessage(res.message || "Statut de gel mis à jour.");
            if (onUserUpdated) onUserUpdated();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors du gel du compte.");
        } finally {
            setActionLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <span>Inspection Utilisateur : <strong>{user.name}</strong></span>
                    {user.is_banned ? (
                        <Badge bg="danger">Suspendu</Badge>
                    ) : user.is_frozen ? (
                        <Badge bg="warning" text="dark">❄️ Gelé</Badge>
                    ) : (
                        <Badge bg="success">Actif</Badge>
                    )}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {successMessage && <Alert variant="success">{successMessage}</Alert>}

                {/* Profile Overview */}
                <div className="card bg-light p-3 mb-3 border-0">
                    <div className="row g-2">
                        <div className="col-md-6"><strong>Email:</strong> {user.email}</div>
                        <div className="col-md-6"><strong>CIN:</strong> {user.cin_number || "Non renseigné"}</div>
                        <div className="col-md-6"><strong>Vérification:</strong> {user.verification_status}</div>
                        <div className="col-md-6">
                            <strong>Date d'inscription:</strong>{" "}
                            {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {user.banned_until && (
                            <div className="col-12 text-danger">
                                <strong>Fin de suspension:</strong>{" "}
                                {new Date(user.banned_until).toLocaleString()}
                            </div>
                        )}
                        {user.moderation_reason && (
                            <div className="col-12 text-muted">
                                <strong>Motif modération:</strong> {user.moderation_reason}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Tabs */}
                <Tabs defaultActiveKey="reports" className="mb-3">
                    <Tab eventKey="reports" title={`Signalements (${reportsData.received_reports?.length || 0})`}>
                        {loadingReports ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" size="sm" /> Chargement de l'historique...
                            </div>
                        ) : reportsData.received_reports?.length === 0 ? (
                            <p className="text-muted text-center py-3">Aucun signalement reçu pour cet utilisateur.</p>
                        ) : (
                            <Table responsive striped size="sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Motif</th>
                                        <th>Signalé par</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportsData.received_reports.map((r) => (
                                        <tr key={r.id}>
                                            <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td>{r.reason}</td>
                                            <td>{r.reporter?.name || "Anonyme"}</td>
                                            <td>
                                                <Badge bg={r.status === "resolved" ? "success" : "secondary"}>
                                                    {r.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Tab>

                    <Tab eventKey="moderation" title="Actions de Modération">
                        <div className="border rounded p-3 mb-3">
                            <h6 className="fw-bold mb-2">Geler / Dégeler le Compte</h6>
                            <p className="text-muted small">
                                Le gel bloque la création de nouveaux trajets et les réservations, mais permet à l'utilisateur de se connecter et d'accéder à son profil.
                            </p>
                            <Button
                                variant={user.is_frozen ? "outline-success" : "warning"}
                                size="sm"
                                disabled={actionLoading}
                                onClick={handleToggleFreeze}
                            >
                                {user.is_frozen ? "Dégeler le Compte" : "❄️ Geler le Compte"}
                            </Button>
                        </div>

                        <div className="border rounded p-3">
                            <h6 className="fw-bold mb-2 text-danger">Suspension Temporaire / Définitive</h6>
                            <Form onSubmit={handleSuspend}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small">Durée de la suspension</Form.Label>
                                    <Form.Select
                                        size="sm"
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    >
                                        <option value="24h">24 Heures</option>
                                        <option value="3d">3 Jours</option>
                                        <option value="7d">7 Jours</option>
                                        <option value="permanent">Définitive (Permanent)</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small">Motif administratif</Form.Label>
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        placeholder="Ex: Signalements répétés pour conduite dangereuse..."
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
                                >
                                    {actionLoading ? "Traitement..." : "Appliquer la Suspension"}
                                </Button>
                            </Form>
                        </div>
                    </Tab>
                </Tabs>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Fermer</Button>
            </Modal.Footer>
        </Modal>
    );
}