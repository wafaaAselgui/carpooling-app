import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge, ButtonGroup } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import TripCard from "../components/TripCard";
import { getTrips } from "../services/trip";
import { findPlaceCoords } from "../data/moroccoPlaces";
import {
    fetchDrivingRoute,
    isRouteCompatible,
    reverseGeocode,
} from "../utils/geoUtils";

// Fix Leaflet marker icons
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const greenIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Cache mémoire pour éviter les requêtes de géocodage répétées
const dynamicCoordsCache = new Map();

async function getOrFetchCoords(cityName) {
    if (!cityName) return null;
    const cleanName = cityName.trim().toLowerCase();

    // 1. Chercher d'abord dans le dictionnaire local
    const local = findPlaceCoords(cleanName);
    if (local) return local;

    // 2. Vérifier le cache mémoire
    if (dynamicCoordsCache.has(cleanName)) {
        return dynamicCoordsCache.get(cleanName);
    }

    // 3. Fallback en ligne Nominatim
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                cityName + ", Morocco"
            )}&format=json&limit=1`
        );
        const data = await res.json();
        if (data && data[0]) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            dynamicCoordsCache.set(cleanName, coords);
            return coords;
        }
    } catch {
        // En cas d'échec ou hors ligne
    }
    return null;
}

function MapClickHandler({ pickMode, onLocationSelected }) {
    useMapEvents({
        async click(e) {
            const { lat, lng } = e.latlng;
            const placeName = await reverseGeocode(lat, lng);
            onLocationSelected([lat, lng], placeName);
        },
    });
    return null;
}

function Trips() {
    const [tripsWithRoutes, setTripsWithRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTripId, setActiveTripId] = useState(null);

    const [pickMode, setPickMode] = useState("dep");
    const [customDep, setCustomDep] = useState(null);
    const [customDest, setCustomDest] = useState(null);
    const [userRouteGeometry, setUserRouteGeometry] = useState(null);

    const [filters, setFilters] = useState({
        date: "",
        seats: "",
        max_price: "",
    });

    // 1. Chargement et enrichissement des trajets
    useEffect(() => {
        setLoading(true);
        getTrips({})
            .then(async (data) => {
                const list = Array.isArray(data) ? data : data.data || [];

                const enriched = await Promise.all(
                    list.map(async (trip) => {
                        const dep = await getOrFetchCoords(trip.departure_city);
                        const dest = await getOrFetchCoords(trip.destination_city);
                        let geometry = null;
                        if (dep && dest) {
                            geometry = await fetchDrivingRoute(dep, dest);
                        }
                        return { ...trip, dep, dest, geometry };
                    })
                );

                setTripsWithRoutes(enriched);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading trips:", err);
                setError("Impossible de charger les trajets.");
                setLoading(false);
            });
    }, []);

    // 2. Tracé de l'itinéraire sélectionné par l'utilisateur
    useEffect(() => {
        if (customDep && customDest) {
            fetchDrivingRoute(customDep.coords, customDest.coords).then((route) => {
                setUserRouteGeometry(route);
            });
        } else {
            setUserRouteGeometry(null);
        }
    }, [customDep, customDest]);

    const handleLocationSelected = (coords, name) => {
        if (pickMode === "dep") {
            setCustomDep({ coords, name });
            setPickMode("dest");
        } else {
            setCustomDest({ coords, name });
            setPickMode("dep");
        }
    };

    const handleClearLocations = () => {
        setCustomDep(null);
        setCustomDest(null);
        setUserRouteGeometry(null);
        setPickMode("dep");
    };

    // 3. Filtrage précis (Texte + Axe Routier)
    const matchedTrips = useMemo(() => {
        return tripsWithRoutes.filter((t) => {
            const tDep = (t.departure_city || "").toLowerCase().trim();
            const tDest = (t.destination_city || "").toLowerCase().trim();
            const cDep = (customDep?.name || "").toLowerCase().trim();
            const cDest = (customDest?.name || "").toLowerCase().trim();

            if (customDep || customDest) {
                // Test 1: Correspondance textuelle directe ou partielle
                const matchDepText = !customDep || tDep.includes(cDep) || cDep.includes(tDep);
                const matchDestText = !customDest || tDest.includes(cDest) || cDest.includes(tDest);
                const isDirectTextMatch = matchDepText && matchDestText;

                // Test 2: Correspondance par géométrie de corridor routier
                const isCorridorMatch =
                    t.geometry &&
                    isRouteCompatible(
                        customDep?.coords,
                        customDest?.coords,
                        t.geometry,
                        45 // Tolérance de 45 km pour couvrir les axes périphériques
                    );

                // Rejet si aucun des deux critères n'est rempli
                if (!isDirectTextMatch && !isCorridorMatch) {
                    return false;
                }
            }

            // Filtres secondaires
            if (filters.seats && t.available_seats < parseInt(filters.seats)) {
                return false;
            }
            if (filters.max_price && t.price_per_seat > parseFloat(filters.max_price)) {
                return false;
            }
            if (filters.date && !t.departure_time.startsWith(filters.date)) {
                return false;
            }

            return true;
        });
    }, [tripsWithRoutes, customDep, customDest, filters]);

    return (
        <Container fluid className="py-4 px-lg-5">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                    <h2 className="fw-bold mb-1">Recherche par Itinéraire Routier</h2>
                    <p className="text-muted small mb-0">
                        Cliquez sur la carte : les trajets empruntant la même autoroute ou passant par votre zone apparaîtront automatiquement.
                    </p>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="small fw-semibold text-muted">Action :</span>
                    <ButtonGroup size="sm">
                        <Button
                            variant={pickMode === "dep" ? "success" : "outline-secondary"}
                            onClick={() => setPickMode("dep")}
                        >
                            📍 Choisir Départ {pickMode === "dep" && "✓"}
                        </Button>
                        <Button
                            variant={pickMode === "dest" ? "danger" : "outline-secondary"}
                            onClick={() => setPickMode("dest")}
                        >
                            🏁 Choisir Arrivée {pickMode === "dest" && "✓"}
                        </Button>
                    </ButtonGroup>

                    {(customDep || customDest) && (
                        <Button variant="outline-dark" size="sm" onClick={handleClearLocations}>
                            Réinitialiser
                        </Button>
                    )}
                </div>
            </div>

            {/* Badges des points choisis */}
            {(customDep || customDest) && (
                <div className="d-flex gap-2 mb-3">
                    {customDep && (
                        <Badge bg="success" className="p-2 fs-6">
                            Départ : {customDep.name}{" "}
                            <span style={{ cursor: "pointer" }} onClick={() => setCustomDep(null)}>✕</span>
                        </Badge>
                    )}
                    {customDest && (
                        <Badge bg="danger" className="p-2 fs-6">
                            Arrivée : {customDest.name}{" "}
                            <span style={{ cursor: "pointer" }} onClick={() => setCustomDest(null)}>✕</span>
                        </Badge>
                    )}
                </div>
            )}

            {/* Barre de filtres */}
            <Card className="mb-4 shadow-sm border-0 bg-light">
                <Card.Body className="py-2">
                    <Row className="g-3 align-items-center">
                        <Col xs={12} sm={4} md={3}>
                            <Form.Label className="small fw-semibold mb-1">Date</Form.Label>
                            <Form.Control
                                size="sm"
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </Col>
                        <Col xs={6} sm={4} md={2}>
                            <Form.Label className="small fw-semibold mb-1">Places min.</Form.Label>
                            <Form.Select
                                size="sm"
                                value={filters.seats}
                                onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
                            >
                                <option value="">Toutes</option>
                                <option value="1">1 place</option>
                                <option value="2">2 places</option>
                                <option value="3">3+ places</option>
                            </Form.Select>
                        </Col>
                        <Col xs={6} sm={4} md={3}>
                            <Form.Label className="small fw-semibold mb-1">
                                Prix max : {filters.max_price ? `${filters.max_price} MAD` : "Tous"}
                            </Form.Label>
                            <Form.Range
                                min="20"
                                max="500"
                                step="10"
                                value={filters.max_price || 500}
                                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                            />
                        </Col>
                        <Col xs={12} md={4} className="d-flex justify-content-end align-items-end">
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => setFilters({ date: "", seats: "", max_price: "" })}
                            >
                                Réinitialiser filtres
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row className="g-4">
                {/* Colonne Liste */}
                <Col lg={5} style={{ maxHeight: "78vh", overflowY: "auto" }}>
                    <div className="mb-2 text-muted fw-semibold small">
                        {matchedTrips.length} trajet(s) compatible(s) avec l'axe routier
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                        </div>
                    ) : matchedTrips.length === 0 ? (
                        <Alert variant="info" className="mt-2">
                            Aucun trajet ne correspond à cet itinéraire. Cliquez sur un autre point de la carte ou ajustez vos critères.
                        </Alert>
                    ) : (
                        <Row className="g-3">
                            {matchedTrips.map((trip) => (
                                <Col
                                    key={trip.id}
                                    xs={12}
                                    onMouseEnter={() => setActiveTripId(trip.id)}
                                    onMouseLeave={() => setActiveTripId(null)}
                                    className={`transition-all rounded ${
                                        activeTripId === trip.id ? "bg-light shadow-sm" : ""
                                    }`}
                                >
                                    <TripCard trip={trip} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>

                {/* Colonne Carte */}
                <Col lg={7}>
                    <Card className="shadow-sm border-0 sticky-top" style={{ top: "1rem", height: "78vh" }}>
                        <div className="p-2 bg-light border-bottom d-flex justify-content-between align-items-center small text-muted">
                            <span>
                                🧭 Mode :{" "}
                                {pickMode === "dep" ? (
                                    <strong className="text-success">Cliquez pour le DÉPART</strong>
                                ) : (
                                    <strong className="text-danger">Cliquez pour l'ARRIVÉE</strong>
                                )}
                            </span>
                            <span>Tracés réels des autoroutes & routes (OSRM)</span>
                        </div>

                        <MapContainer
                            center={[31.7917, -7.0926]}
                            zoom={6}
                            scrollWheelZoom={true}
                            style={{ width: "100%", height: "100%" }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapClickHandler pickMode={pickMode} onLocationSelected={handleLocationSelected} />

                            {/* Départ sélectionné */}
                            {customDep && (
                                <>
                                    <Marker position={customDep.coords} icon={greenIcon}>
                                        <Popup>
                                            <strong>Départ choisi</strong>
                                            <br />
                                            {customDep.name}
                                        </Popup>
                                    </Marker>
                                    <Circle
                                        center={customDep.coords}
                                        radius={35000}
                                        pathOptions={{ color: "#198754", fillColor: "#198754", fillOpacity: 0.12 }}
                                    />
                                </>
                            )}

                            {/* Arrivée sélectionnée */}
                            {customDest && (
                                <>
                                    <Marker position={customDest.coords} icon={redIcon}>
                                        <Popup>
                                            <strong>Arrivée choisie</strong>
                                            <br />
                                            {customDest.name}
                                        </Popup>
                                    </Marker>
                                    <Circle
                                        center={customDest.coords}
                                        radius={35000}
                                        pathOptions={{ color: "#dc3545", fillColor: "#dc3545", fillOpacity: 0.12 }}
                                    />
                                </>
                            )}

                            {/* Tracé utilisateur (Jaune) */}
                            {userRouteGeometry && (
                                <Polyline
                                    positions={userRouteGeometry}
                                    pathOptions={{
                                        color: "#ffc107",
                                        weight: 6,
                                        opacity: 0.85,
                                    }}
                                />
                            )}

                            {/* Tracés réels des trajets trouvés */}
                            {matchedTrips.map((trip) => {
                                const routeCoords = trip.geometry || (trip.dep && trip.dest ? [trip.dep, trip.dest] : null);
                                if (!routeCoords) return null;

                                const isHighlighted = activeTripId === trip.id;
                                return (
                                    <Polyline
                                        key={trip.id}
                                        positions={routeCoords}
                                        pathOptions={{
                                            color: isHighlighted ? "#0d6efd" : "#495057",
                                            weight: isHighlighted ? 5 : 2.5,
                                            opacity: isHighlighted ? 1 : 0.45,
                                        }}
                                    >
                                        <Popup>
                                            <strong>{trip.departure_city} ➔ {trip.destination_city}</strong>
                                            <br />
                                            Prix : {trip.price_per_seat} MAD / place
                                        </Popup>
                                    </Polyline>
                                );
                            })}
                        </MapContainer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Trips;