import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner, Image } from "react-bootstrap";
import { getProfile, updateProfile, uploadAvatar, submitVerification } from "../services/profile";
import VehicleManager from "../components/VehicleManager";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Champs de mise à jour du profil
    const [formData, setFormData] = useState({ name: "", phone: "", bio: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [cinNumber, setCinNumber] = useState("");
    const [cinFile, setCinFile] = useState(null);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const data = await getProfile();
            setUser(data);
            setFormData({
                name: data.name || "",
                phone: data.phone || "",
                bio: data.bio || "",
            });
            setCinNumber(data.cin_number || "");
        } catch {
            setErrorMsg("Impossible de charger les données du profil.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await updateProfile(formData);
            setStatusMsg("Informations personnelles mises à jour avec succès.");
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Erreur lors de la mise à jour.");
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await uploadAvatar(avatarFile);
            setAvatarFile(null);
            setStatusMsg("Photo de profil mise à jour.");
            loadUserData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Échec de l'envoi de la photo.");
        }
    };

    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        if (!cinFile) {
            setErrorMsg("Veuillez sélectionner une image ou un PDF de votre CIN.");
            return;
        }
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await submitVerification(cinNumber, cinFile);
            setStatusMsg("Document envoyé avec succès. En attente de validation par un administrateur.");
            loadUserData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Échec de la soumission du document.");
        }
    };

    const renderVerificationBadge = (status) => {
        switch (status) {
            case "verified":
                return <Badge bg="success">✓ Compte Vérifié</Badge>;
            case "pending":
                return <Badge bg="warning" text="dark">⏳ En attente de vérification</Badge>;
            case "rejected":
                return <Badge bg="danger">✕ Document Rejeté</Badge>;
            default:
                return <Badge bg="secondary">Non Vérifié</Badge>;
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Chargement de votre profil...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4">Mon Profil</h2>

            {statusMsg && <Alert variant="success">{statusMsg}</Alert>}
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <Row className="g-4">
                {/* Colonne Gauche : Avatar & Statut */}
                <Col lg={4}>
                    <Card className="text-center shadow-sm border-0 p-3 mb-4">
                        <Card.Body>
                            <Image
                                src={user?.avatar_url || "https://placehold.co/150x150?text=Avatar"}
                                roundedCircle
                                width={130}
                                height={130}
                                className="mb-3 border object-fit-cover shadow-sm"
                            />
                            <h5 className="fw-bold mb-1">{user?.name}</h5>
                            <div className="text-muted small mb-2">{user?.email}</div>
                            <div className="mb-3">{renderVerificationBadge(user?.verification_status)}</div>

                            <Form.Group className="mb-2">
                                <Form.Control
                                    type="file"
                                    size="sm"
                                    accept="image/*"
                                    onChange={(e) => setAvatarFile(e.target.files[0])}
                                />
                            </Form.Group>
                            <Button
                                size="sm"
                                variant="outline-primary"
                                className="w-100"
                                disabled={!avatarFile}
                                onClick={handleAvatarUpload}
                            >
                                Changer la photo
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Colonne Droite : Formulaire Infos, CIN, et Véhicules */}
                <Col lg={8}>
                    {/* Informations de base */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Informations Personnelles</h5>
                            <Form onSubmit={handleInfoSubmit}>
                                <Row className="g-3">
                                    <Col sm={6}>
                                        <Form.Label className="small fw-semibold">Nom complet</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Label className="small fw-semibold">Téléphone</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="+212 6..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold">Mini Bio</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="Ex: Voyage régulièrement entre Casablanca et Rabat..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </Col>
                                </Row>
                                <Button type="submit" variant="primary" size="sm" className="mt-3">
                                    Enregistrer les modifications
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Section Vérification CIN */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-2">Vérification de l'Identité (CIN)</h5>
                            <p className="text-muted small mb-3">
                                Faites vérifier votre identité pour obtenir le badge de confiance sur vos trajets.
                            </p>

                            {user?.verification_status === "verified" ? (
                                <Alert variant="success" className="mb-0">
                                    Votre numéro CIN <strong>{user?.cin_number}</strong> est validé. Votre profil est certifié.
                                </Alert>
                            ) : (
                                <Form onSubmit={handleVerificationSubmit}>
                                    <Row className="g-3">
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold">Numéro de CIN</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ex: AB123456"
                                                value={cinNumber}
                                                onChange={(e) => setCinNumber(e.target.value)}
                                                required
                                            />
                                        </Col>
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold">Document (Photo Recto CIN / PDF)</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setCinFile(e.target.files[0])}
                                                required
                                            />
                                        </Col>
                                    </Row>
                                    <Button
                                        type="submit"
                                        variant="dark"
                                        size="sm"
                                        className="mt-3"
                                        disabled={user?.verification_status === "pending"}
                                    >
                                        {user?.verification_status === "pending"
                                            ? "⏳ En cours de vérification..."
                                            : "Soumettre pour validation"}
                                    </Button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Gestionnaire de véhicules */}
                    <VehicleManager />
                </Col>
            </Row>
        </Container>
    );
}

export default Profile;