import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, Alert, Spinner } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import TripCard from "../components/TripCard";
import SearchFilters from "../components/SearchFilters";
import { getTrips } from "../services/trip";
import { MOROCCO_PLACES, findPlaceCoords } from "../data/moroccoPlaces";
import { fetchDrivingRoute, isRouteCompatible } from "../utils/geoUtils";
import { departureIcon, destinationIcon } from "../utils/mapIcons";

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

export default function Trips() {
  const [tripsWithRoutes, setTripsWithRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);

  const [selectedDepCity, setSelectedDepCity] = useState("");
  const [selectedDestCity, setSelectedDestCity] = useState("");
  const [userRouteGeometry, setUserRouteGeometry] = useState(null);

  const [filters, setFilters] = useState({
    date: "",
    seats: "",
    max_price: "",
  });

  const groupedPlaces = useMemo(() => {
    return MOROCCO_PLACES.reduce((acc, place) => {
      const region = place.region || "Other";
      if (!acc[region]) acc[region] = [];
      acc[region].push(place);
      return acc;
    }, {});
  }, []);

  const depCoords = useMemo(() => findPlaceCoords(selectedDepCity), [selectedDepCity]);
  const destCoords = useMemo(() => findPlaceCoords(selectedDestCity), [selectedDestCity]);

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
    if (depCoords && destCoords) {
      fetchDrivingRoute(depCoords, destCoords).then((route) => {
        setUserRouteGeometry(route);
      });
    } else {
      setUserRouteGeometry(null);
    }
  }, [depCoords, destCoords]);

  const handleResetAll = () => {
    setSelectedDepCity("");
    setSelectedDestCity("");
    setUserRouteGeometry(null);
    setFilters({ date: "", seats: "", max_price: "" });
  };

  const matchedTrips = useMemo(() => {
    return tripsWithRoutes.filter((t) => {
      const tDep = (t.departure_city || "").toLowerCase().trim();
      const tDest = (t.destination_city || "").toLowerCase().trim();
      const cDep = (selectedDepCity || "").toLowerCase().trim();
      const cDest = (selectedDestCity || "").toLowerCase().trim();

      if (selectedDepCity || selectedDestCity) {
        const matchDepText = !selectedDepCity || tDep.includes(cDep) || cDep.includes(tDep);
        const matchDestText = !selectedDestCity || tDest.includes(cDest) || cDest.includes(tDest);
        const isDirectTextMatch = matchDepText && matchDestText;

        const isCorridorMatch =
          t.geometry &&
          isRouteCompatible(
            depCoords,
            destCoords,
            t.geometry,
            45
          );

        if (!isDirectTextMatch && !isCorridorMatch) {
          return false;
        }
      }

      if (filters.seats && t.available_seats < parseInt(filters.seats, 10)) return false;
      if (filters.max_price && t.price_per_seat > parseFloat(filters.max_price)) return false;
      if (filters.date && !t.departure_time.startsWith(filters.date)) return false;

      return true;
    });
  }, [tripsWithRoutes, selectedDepCity, selectedDestCity, depCoords, destCoords, filters]);

  return (
    <Container fluid className="py-2 py-md-4 px-3 px-lg-5" style={{ maxWidth: "1600px" }}>
      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between mb-2 mb-md-3">
        <div>
          <h2
            className="fw-bold mb-0 fs-5 fs-md-3"
            style={{ color: "var(--color-text-main)", letterSpacing: "-0.02em" }}
          >
            Discover Rides
          </h2>
          <p className="text-muted small mb-0 d-none d-sm-block">
            Shared journeys matching your corridor across Morocco.
          </p>
        </div>
        <span className="badge bg-light text-muted border d-lg-none small">
          {matchedTrips.length} ride{matchedTrips.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Extracted Search & Filter Bar */}
      <SearchFilters
        groupedPlaces={groupedPlaces}
        selectedDepCity={selectedDepCity}
        setSelectedDepCity={setSelectedDepCity}
        selectedDestCity={selectedDestCity}
        setSelectedDestCity={setSelectedDestCity}
        filters={filters}
        setFilters={setFilters}
        onReset={handleResetAll}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Main Content Layout: Full-width feed on Mobile, Split Grid with Map on Desktop */}
      <Row className="g-3 g-lg-4">
        {/* Trip Feed Column */}
        <Col
          xs={12}
          lg={5}
          className="trip-feed-container"
          style={{ maxHeight: "78vh", overflowY: "auto", paddingRight: "0.5rem" }}
        >
          <div className="d-none d-lg-block mb-2 text-muted fw-medium small">
            {matchedTrips.length} ride{matchedTrips.length === 1 ? "" : "s"} available
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
              <p className="mt-2 text-muted small">Loading journeys...</p>
            </div>
          ) : matchedTrips.length === 0 ? (
            <Card className="border-0 shadow-sm p-4 p-md-5 text-center bg-white">
              <p className="text-muted mb-1">No rides match this route corridor.</p>
              <span className="small text-secondary">
                Try widening your filters or selecting a different arrival city.
              </span>
            </Card>
          ) : (
            <div className="d-flex flex-column gap-2">
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

        {/* Desktop-Only Map Column (Completely hidden on screens < 992px) */}
        <Col lg={7} className="d-none d-lg-block">
          <Card
            className="shadow-sm border-0 sticky-top overflow-hidden responsive-map-container"
            style={{ top: "1rem", borderRadius: "var(--radius-md)" }}
          >
            <div
              className="px-3 py-2 d-flex justify-content-between align-items-center small border-bottom"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border-subtle)",
              }}
            >
              <span className="fw-semibold text-muted text-truncate me-2">
                {selectedDepCity && selectedDestCity
                  ? `Corridor: ${selectedDepCity} ➔ ${selectedDestCity}`
                  : "Moroccan Journey Corridors"}
              </span>
              <span className="text-muted" style={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                OSRM Engine
              </span>
            </div>

            <div style={{ height: "100%", width: "100%", minHeight: "340px" }}>
              <MapContainer
                center={[31.7917, -7.0926]}
                zoom={6}
                scrollWheelZoom={false}
                style={{ width: "100%", height: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {depCoords && (
                  <Marker position={depCoords} icon={departureIcon}>
                    <Popup>
                      <strong>Origin: {selectedDepCity}</strong>
                    </Popup>
                  </Marker>
                )}

                {destCoords && (
                  <Marker position={destCoords} icon={destinationIcon}>
                    <Popup>
                      <strong>Destination: {selectedDestCity}</strong>
                    </Popup>
                  </Marker>
                )}

                {userRouteGeometry && (
                  <Polyline
                    positions={userRouteGeometry}
                    pathOptions={{
                      color: "var(--color-warning)",
                      weight: 5,
                      opacity: 0.85,
                    }}
                  />
                )}

                {matchedTrips.map((trip) => {
                  const routeCoords =
                    trip.geometry || (trip.dep && trip.dest ? [trip.dep, trip.dest] : null);
                  if (!routeCoords) return null;

                  const isHighlighted = activeTripId === trip.id;
                  return (
                    <Polyline
                      key={trip.id}
                      positions={routeCoords}
                      pathOptions={{
                        color: isHighlighted
                          ? "var(--color-primary)"
                          : "var(--color-text-subtle)",
                        weight: isHighlighted ? 5 : 2.5,
                        opacity: isHighlighted ? 1 : 0.45,
                      }}
                    >
                      <Popup>
                        <strong>
                          {trip.departure_city} → {trip.destination_city}
                        </strong>
                        <br />
                        Price: {trip.price_per_seat} MAD / seat
                      </Popup>
                    </Polyline>
                  );
                })}
              </MapContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}