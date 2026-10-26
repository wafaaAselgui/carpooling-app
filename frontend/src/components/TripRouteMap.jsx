import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolvePlaceCoords } from "../data/moroccoPlaces";
import { fetchDrivingRoute, getDistanceKm } from "../utils/geoUtils";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Green marker for departure
const departureIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red marker for arrival
const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadow,
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
        const [start, end] = await Promise.all([
          resolvePlaceCoords(departureCity),
          resolvePlaceCoords(destinationCity),
        ]);

        if (!isMounted) return;

        if (start && end) {
          setDepCoords(start);
          setDestCoords(end);

          const polyline = await fetchDrivingRoute(start, end);
          if (isMounted) {
            setRoutePolyline(polyline);
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
      <div className="card shadow-sm border-0 mb-4 p-4 text-center text-muted bg-white" style={{ borderRadius: "12px", border: "1px solid #e8e4dc" }}>
        <div className="spinner-border spinner-border-sm me-2" role="status" style={{ color: "#527050" }} />
        <span className="small">Loading itinerary map...</span>
      </div>
    );
  }

  if (!depCoords || !destCoords) {
    return null;
  }

  const bounds = L.latLngBounds([depCoords, destCoords]);

  return (
    <div
      className="card shadow-sm border-0 mb-4 overflow-hidden"
      style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e8e4dc" }}
    >
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom" style={{ borderColor: "#f0ece4" }}>
        <div className="fw-semibold text-dark small d-flex align-items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#527050" }}>
            <circle cx="6" cy="19" r="3" />
            <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
            <circle cx="18" cy="5" r="3" />
          </svg>
          <span>
            Route Itinerary: <strong>{departureCity}</strong> ➔ <strong>{destinationCity}</strong>
          </span>
        </div>
        {distanceKm && (
          <span
            className="badge px-2 py-1"
            style={{ backgroundColor: "#eef4ec", color: "#527050", border: "1px solid #b8cfb3" }}
          >
            ~{distanceKm} km direct distance
          </span>
        )}
      </div>

      <div style={{ height: "320px", width: "100%", position: "relative" }}>
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
              pathOptions={{ color: "#527050", weight: 5, opacity: 0.85 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}