import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Form, Card, Alert, Spinner } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import TripCard from "../components/TripCard";
import { getTrips } from "../services/trip";
import { findPlaceCoords } from "../data/moroccoPlaces";
import { fetchDrivingRoute, isRouteCompatible, reverseGeocode } from "../utils/geoUtils";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom clean map icons
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

const dynamicCoordsCache = new Map();

async function getOrFetchCoords(cityName) {
  if (!cityName) return null;
  const cleanName = cityName.trim().toLowerCase();

  const local = findPlaceCoords(cleanName);
  if (local) return local;

  if (dynamicCoordsCache.has(cleanName)) {
    return dynamicCoordsCache.get(cleanName);
  }

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
    // quiet fallback
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

export default function Trips() {
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
        setError("Unable to load scheduled trips.");
        setLoading(false);
      });
  }, []);

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

  const matchedTrips = useMemo(() => {
    return tripsWithRoutes.filter((t) => {
      const tDep = (t.departure_city || "").toLowerCase().trim();
      const tDest = (t.destination_city || "").toLowerCase().trim();
      const cDep = (customDep?.name || "").toLowerCase().trim();
      const cDest = (customDest?.name || "").toLowerCase().trim();

      if (customDep || customDest) {
        const matchDepText = !customDep || tDep.includes(cDep) || cDep.includes(tDep);
        const matchDestText = !customDest || tDest.includes(cDest) || cDest.includes(tDest);
        const isDirectTextMatch = matchDepText && matchDestText;

        const isCorridorMatch =
          t.geometry &&
          isRouteCompatible(
            customDep?.coords,
            customDest?.coords,
            t.geometry,
            45
          );

        if (!isDirectTextMatch && !isCorridorMatch) {
          return false;
        }
      }

      if (filters.seats && t.available_seats < parseInt(filters.seats)) return false;
      if (filters.max_price && t.price_per_seat > parseFloat(filters.max_price)) return false;
      if (filters.date && !t.departure_time.startsWith(filters.date)) return false;

      return true;
    });
  }, [tripsWithRoutes, customDep, customDest, filters]);

  return (
    <Container fluid className="py-4 px-lg-5" style={{ maxWidth: "1600px" }}>
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: "var(--color-text-main)", letterSpacing: "-0.02em" }}>
            Route & Highway Discovery
          </h2>
          <p className="text-muted small mb-0">
            Click points on the map: rides passing through your road corridor will appear automatically.
          </p>
        </div>

        {/* Custom Segmented Mode Control */}
        <div
          className="d-inline-flex p-1 rounded-3 shadow-sm border"
          style={{ backgroundColor: "#ffffff", borderColor: "var(--color-border)" }}
        >
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2 border-0 px-3 py-1 fw-medium"
            style={{
              backgroundColor: pickMode === "dep" ? "var(--color-primary)" : "transparent",
              color: pickMode === "dep" ? "#ffffff" : "var(--color-text-muted)",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            onClick={() => setPickMode("dep")}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: pickMode === "dep" ? "#ffffff" : "var(--color-primary)",
              }}
            />
            Origin {pickMode === "dep" && "(Active)"}
          </button>

          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2 border-0 px-3 py-1 fw-medium"
            style={{
              backgroundColor: pickMode === "dest" ? "var(--color-danger)" : "transparent",
              color: pickMode === "dest" ? "#ffffff" : "var(--color-text-muted)",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            onClick={() => setPickMode("dest")}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: pickMode === "dest" ? "#ffffff" : "var(--color-danger)",
              }}
            />
            Destination {pickMode === "dest" && "(Active)"}
          </button>
        </div>
      </div>

      {/* Selected Route Chips */}
      {(customDep || customDest) && (
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          {customDep && (
            <span
              className="badge px-3 py-2 d-inline-flex align-items-center gap-2 shadow-sm"
              style={{
                backgroundColor: "var(--color-secondary-subtle)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-secondary)",
                fontSize: "0.85rem",
              }}
            >
              <span><strong>Origin:</strong> {customDep.name}</span>
              <button
                type="button"
                className="btn-close btn-close-sm"
                aria-label="Remove origin"
                style={{ fontSize: "0.6rem" }}
                onClick={() => setCustomDep(null)}
              />
            </span>
          )}

          {customDest && (
            <span
              className="badge px-3 py-2 d-inline-flex align-items-center gap-2 shadow-sm"
              style={{
                backgroundColor: "var(--color-accent-blush)",
                color: "var(--color-accent-blush-text)",
                border: "1px solid rgba(122, 60, 83, 0.2)",
                fontSize: "0.85rem",
              }}
            >
              <span><strong>Destination:</strong> {customDest.name}</span>
              <button
                type="button"
                className="btn-close btn-close-sm"
                aria-label="Remove destination"
                style={{ fontSize: "0.6rem" }}
                onClick={() => setCustomDest(null)}
              />
            </span>
          )}

          <button
            type="button"
            className="btn btn-link btn-sm text-muted text-decoration-none p-0 ms-2"
            onClick={handleClearLocations}
          >
            Clear route
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="mb-4 shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}>
        <Card.Body className="py-3 px-4">
          <Row className="g-3 align-items-end">
            <Col xs={12} sm={4} md={3}>
              <Form.Label className="small fw-semibold text-muted mb-1">Departure Date</Form.Label>
              <Form.Control
                size="sm"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </Col>

            <Col xs={6} sm={4} md={2}>
              <Form.Label className="small fw-semibold text-muted mb-1">Min. Seats</Form.Label>
              <Form.Select
                size="sm"
                value={filters.seats}
                onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
              >
                <option value="">Any</option>
                <option value="1">1 seat</option>
                <option value="2">2 seats</option>
                <option value="3">3+ seats</option>
              </Form.Select>
            </Col>

            <Col xs={6} sm={4} md={4}>
              <div className="d-flex justify-content-between small fw-semibold text-muted mb-1">
                <span>Max Price</span>
                <span style={{ color: "var(--color-primary)" }}>
                  {filters.max_price ? `${filters.max_price} MAD` : "Any"}
                </span>
              </div>
              <Form.Range
                min="20"
                max="500"
                step="10"
                value={filters.max_price || 500}
                onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              />
            </Col>

            <Col xs={12} md={3} className="d-flex justify-content-md-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary w-100 w-md-auto px-3"
                onClick={() => setFilters({ date: "", seats: "", max_price: "" })}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                Clear Filters
              </button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Main Grid: Feed + Map */}
      <Row className="g-4">
        {/* Left: Feed */}
        <Col lg={5} className="trip-feed-container" style={{ maxHeight: "78vh", overflowY: "auto", paddingRight: "1rem" }}>
          <div className="mb-2 text-muted fw-medium small">
            {matchedTrips.length} ride{matchedTrips.length === 1 ? "" : "s"} available
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
              <p className="mt-2 text-muted small">Loading journeys...</p>
            </div>
          ) : matchedTrips.length === 0 ? (
            <Card className="border-0 shadow-sm p-5 text-center bg-white">
              <p className="text-muted mb-1">No rides match this route corridor.</p>
              <span className="small text-secondary">
                Try clicking another point along the map or widening your filters.
              </span>
            </Card>
          ) : (
            <div className="d-flex flex-column gap-3">
              {matchedTrips.map((trip) => (
                <div
                  key={trip.id}
                  onMouseEnter={() => setActiveTripId(trip.id)}
                  onMouseLeave={() => setActiveTripId(null)}
                  style={{
                    transform: activeTripId === trip.id ? "translateY(-2px)" : "none",
                    transition: "transform 0.15s ease",
                  }}
                >
                  <TripCard trip={trip} />
                </div>
              ))}
            </div>
          )}
        </Col>

        {/* Right: Map */}
        <Col lg={7}>
          <Card className="shadow-sm border-0 sticky-top overflow-hidden" style={{ top: "1rem", height: "78vh", borderRadius: "var(--radius-md)" }}>
            <div
              className="px-3 py-2 d-flex justify-content-between align-items-center small border-bottom"
              style={{ backgroundColor: "#ffffff", borderColor: "var(--color-border)" }}
            >
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">Click map to select:</span>
                <span
                  className="fw-semibold"
                  style={{ color: pickMode === "dep" ? "var(--color-primary)" : "var(--color-danger)" }}
                >
                  {pickMode === "dep" ? "Departure point" : "Arrival destination"}
                </span>
              </div>
              <span className="text-muted" style={{ fontSize: "11px" }}>
                OSRM Routing Engine
              </span>
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

              {customDep && (
                <>
                  <Marker position={customDep.coords} icon={greenIcon}>
                    <Popup>
                      <strong>Selected Origin</strong>
                      <br />
                      {customDep.name}
                    </Popup>
                  </Marker>
                  <Circle
                    center={customDep.coords}
                    radius={35000}
                    pathOptions={{ color: "#527050", fillColor: "#527050", fillOpacity: 0.12 }}
                  />
                </>
              )}

              {customDest && (
                <>
                  <Marker position={customDest.coords} icon={redIcon}>
                    <Popup>
                      <strong>Selected Destination</strong>
                      <br />
                      {customDest.name}
                    </Popup>
                  </Marker>
                  <Circle
                    center={customDest.coords}
                    radius={35000}
                    pathOptions={{ color: "#b24747", fillColor: "#b24747", fillOpacity: 0.12 }}
                  />
                </>
              )}

              {userRouteGeometry && (
                <Polyline
                  positions={userRouteGeometry}
                  pathOptions={{
                    color: "#946927",
                    weight: 6,
                    opacity: 0.85,
                  }}
                />
              )}

              {matchedTrips.map((trip) => {
                const routeCoords = trip.geometry || (trip.dep && trip.dest ? [trip.dep, trip.dest] : null);
                if (!routeCoords) return null;

                const isHighlighted = activeTripId === trip.id;
                return (
                  <Polyline
                    key={trip.id}
                    positions={routeCoords}
                    pathOptions={{
                      color: isHighlighted ? "#527050" : "#8a968a",
                      weight: isHighlighted ? 5 : 2.5,
                      opacity: isHighlighted ? 1 : 0.45,
                    }}
                  >
                    <Popup>
                      <strong>{trip.departure_city} → {trip.destination_city}</strong>
                      <br />
                      Price: {trip.price_per_seat} MAD / seat
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