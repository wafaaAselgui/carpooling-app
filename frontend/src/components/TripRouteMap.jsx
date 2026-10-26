import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolvePlaceCoords } from "../data/moroccoPlaces";
import { fetchDrivingRoute, getDistanceKm } from "../utils/geoUtils";

// Fix standard Leaflet default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Green marker for departure
const departureIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Red marker for arrival
const destinationIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function MapAutoBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [45, 45] });
        }
    }, [bounds, map]);
    return null;
}

export default function TripRouteMap({
    departureCity,
    destinationCity,
    departureAddress,
    destinationAddress,
}) {
    const [depCoords, setDepCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [routePolyline, setRoutePolyline] = useState([]);
    const [distanceKm, setDistanceKm] = useState(null);
    const [loadingMap, setLoadingMap] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadRoute() {
            setLoadingMap(true);
            try {
                // Resolve GPS coordinates using your static list & geocoder
                const [start, end] = await Promise.all([
                    resolvePlaceCoords(departureCity),
                    resolvePlaceCoords(destinationCity),
                ]);

                if (!isMounted) return;

                if (start && end) {
                    setDepCoords(start);
                    setDestCoords(end);

                    // Fetch driving trajectory via your geoUtils OSRM helper
                    const polyline = await fetchDrivingRoute(start, end);
                    if (isMounted) {
                        setRoutePolyline(polyline);
                        // Approximate distance in km
                        setDistanceKm(Math.round(getDistanceKm(start, end)));
                    }
                }
            } catch (err) {
                console.error("Map route load error:", err);
            } finally {
                if (isMounted) setLoadingMap(false);
            }
        }

        if (departureCity && destinationCity) {
            loadRoute();
        }

        return () => {
            isMounted = false;
        };
    }, [departureCity, destinationCity]);

    if (loadingMap) {
        return (
            <div className="card shadow-sm border-0 mb-4 p-4 text-center text-muted bg-light">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                <span>Loading route map...</span>
            </div>
        );
    }

    if (!depCoords || !destCoords) {
        return null; // Gracefully hide if either location cannot be resolved
    }

    const bounds = L.latLngBounds([depCoords, destCoords]);

    return (
        <div className="card shadow-sm border-0 mb-4 overflow-hidden">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <div className="fw-semibold text-dark">
                    🛣️ Itinerary: <strong>{departureCity}</strong> ➔ <strong>{destinationCity}</strong>
                </div>
                {distanceKm && (
                    <span className="badge bg-light text-dark border">
                        🚗 ~{distanceKm} km (estimated direct distance)
                    </span>
                )}
            </div>

            <div style={{ height: "300px", width: "100%", position: "relative" }}>
                <MapContainer
                    center={depCoords}
                    zoom={7}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapAutoBounds bounds={bounds} />

                    <Marker position={depCoords} icon={departureIcon}>
                        <Popup>
                            <strong>Departure: {departureCity}</strong>
                            {departureAddress && <div className="small text-muted">{departureAddress}</div>}
                        </Popup>
                    </Marker>

                    <Marker position={destCoords} icon={destinationIcon}>
                        <Popup>
                            <strong>Destination: {destinationCity}</strong>
                            {destinationAddress && <div className="small text-muted">{destinationAddress}</div>}
                        </Popup>
                    </Marker>

                    {routePolyline && routePolyline.length > 0 && (
                        <Polyline
                            positions={routePolyline}
                            pathOptions={{ color: "#0d6efd", weight: 5, opacity: 0.85 }}
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
}