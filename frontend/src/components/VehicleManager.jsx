import { useEffect, useState } from "react";
import { Card, Button, Form, Row, Col, Alert, Spinner } from "react-bootstrap";
import { getMyVehicles, createVehicle, deleteVehicle } from "../services/vehicle";

export default function VehicleManager() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        brand: "",
        model: "",
        color: "",
        license_plate: "",
        seats: 4,
    });
    const [photoFile, setPhotoFile] = useState(null);

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const data = await getMyVehicles();
            setVehicles(data);
        } catch {
            setError("Impossible de charger vos véhicules.");
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
        try {
            await createVehicle(form, photoFile);
            setForm({ brand: "", model: "", color: "", license_plate: "", seats: 4 });
            setPhotoFile(null);
            setShowForm(false);
            loadVehicles();
        } catch (err) {
            setError(err.response?.data?.message || "Erreur lors de l'ajout du véhicule.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Supprimer ce véhicule ?")) return;
        try {
            await deleteVehicle(id);
            setVehicles(vehicles.filter((v) => v.id !== id));
        } catch {
            setError("Échec de la suppression.");
        }
    };

    return (
        <Card className="shadow-sm border-0 mb-4">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Mes Véhicules</h5>
                    <Button
                        size="sm"
                        variant={showForm ? "outline-secondary" : "primary"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? "Annuler" : "+ Ajouter un véhicule"}
                    </Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                {/* Formulaire d'ajout */}
                {showForm && (
                    <Form onSubmit={handleSubmit} className="p-3 bg-light rounded mb-3">
                        <Row className="g-2">
                            <Col sm={6}>
                                <Form.Label className="small fw-semibold">Marque</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ex: Dacia"
                                    value={form.brand}
                                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={6}>
                                <Form.Label className="small fw-semibold">Modèle</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ex: Logan"
                                    value={form.model}
                                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold">Couleur</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ex: Blanc"
                                    value={form.color}
                                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold">Immatriculation</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Ex: 12345-A-6"
                                    value={form.license_plate}
                                    onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
                                    required
                                />
                            </Col>
                            <Col sm={4}>
                                <Form.Label className="small fw-semibold">Nombre de places</Form.Label>
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
                                <Form.Label className="small fw-semibold">Photo du véhicule</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPhotoFile(e.target.files[0])}
                                />
                            </Col>
                        </Row>
                        <Button type="submit" size="sm" variant="success" className="mt-3">
                            Enregistrer le véhicule
                        </Button>
                    </Form>
                )}

                {/* Liste des véhicules existants */}
                {loading ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : vehicles.length === 0 ? (
                    <p className="text-muted small mb-0">
                        Aucun véhicule enregistré. Ajoutez-en un pour pouvoir publier des trajets.
                    </p>
                ) : (
                    <Row className="g-3">
                        {vehicles.map((v) => (
                            <Col key={v.id} sm={6} md={4}>
                                <Card className="h-100 border">
                                    {v.photo_url ? (
                                        <Card.Img
                                            variant="top"
                                            src={v.photo_url}
                                            style={{ height: "140px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div
                                            className="bg-light text-muted d-flex align-items-center justify-content-center"
                                            style={{ height: "140px" }}
                                        >
                                            Sans photo
                                        </div>
                                    )}
                                    <Card.Body className="p-2">
                                        <h6 className="fw-bold mb-1">
                                            {v.brand} {v.model}
                                        </h6>
                                        <div className="text-muted small">
                                            {v.color} • {v.seats} places
                                        </div>
                                        <div className="text-muted small">{v.license_plate}</div>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            className="w-100 mt-2"
                                            onClick={() => handleDelete(v.id)}
                                        >
                                            Supprimer
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}