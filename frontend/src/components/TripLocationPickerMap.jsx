import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchDrivingRoute, getDistanceKm } from "../utils/geoUtils";
import { departureIcon, destinationIcon } from "../utils/mapIcons";

function AutoFitBounds({ depCoords, destCoords }) {
  const map = useMap();
  useEffect(() => {
    if (depCoords && destCoords) {
      const bounds = L.latLngBounds([depCoords, destCoords]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (depCoords) {
      map.setView(depCoords, 11);
    } else if (destCoords) {
      map.setView(destCoords, 11);
    }
  }, [depCoords, destCoords, map]);
  return null;
}

export default function TripLocationPickerMap({
  depCoords,
  destCoords,
  departureCity,
  destinationCity,
  departureAddress,
  destinationAddress,
}) {
  const [routePolyline, setRoutePolyline] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function updateRoute() {
      if (depCoords && destCoords) {
        setLoadingRoute(true);
        try {
          const polyline = await fetchDrivingRoute(depCoords, destCoords);
          if (isMounted) {
            setRoutePolyline(polyline);
            setDistanceKm(Math.round(getDistanceKm(depCoords, destCoords)));
          }
        } finally {
          if (isMounted) setLoadingRoute(false);
        }
      } else {
        setRoutePolyline([]);
        setDistanceKm(null);
      }
    }
    updateRoute();
    return () => {
      isMounted = false;
    };
  }, [depCoords, destCoords]);

  const defaultCenter = depCoords || destCoords || [33.5731, -7.5898];

  return (
    <div className="card shadow-sm border-0 h-100 overflow-hidden">
      {/* Top Header info bar */}
      <div
        className="px-3 py-2 d-flex justify-content-between align-items-center border-bottom"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="fw-semibold small d-flex align-items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-primary)" }}>
            <circle cx="6" cy="19" r="3" />
            <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
            <circle cx="18" cy="5" r="3" />
          </svg>
          <span>
            {departureCity && destinationCity ? (
              <span><strong>{departureCity}</strong> ➔ <strong>{destinationCity}</strong></span>
            ) : (
              <span className="text-muted">Route Preview (Select cities on the left)</span>
            )}
          </span>
        </div>

        <div>
          {loadingRoute ? (
            <span className="small text-muted">Calculating path...</span>
          ) : distanceKm ? (
            <span className="badge badge-sage px-2 py-1">
              ~{distanceKm} km direct
            </span>
          ) : null}
        </div>
      </div>

      {/* Map Body */}
      <div style={{ height: "480px", width: "100%", position: "relative" }}>
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoFitBounds depCoords={depCoords} destCoords={destCoords} />

          {depCoords && (
            <Marker position={depCoords} icon={departureIcon}>
              <Popup>
                <strong>Departure: {departureCity}</strong>
                {departureAddress && <div className="small text-muted">{departureAddress}</div>}
              </Popup>
            </Marker>
          )}

          {destCoords && (
            <Marker position={destCoords} icon={destinationIcon}>
              <Popup>
                <strong>Destination: {destinationCity}</strong>
                {destinationAddress && <div className="small text-muted">{destinationAddress}</div>}
              </Popup>
            </Marker>
          )}

          {routePolyline.length > 0 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "var(--color-primary)", weight: 5, opacity: 0.85 }}
            />
          )}
        </MapContainer>
      </div>

      <div
        className="card-footer py-2 text-muted small text-center border-top"
        style={{ backgroundColor: "var(--color-canvas)", borderColor: "var(--color-border-subtle)" }}
      >
        Route is automatically previewed once both departure and destination cities are chosen.
      </div>
    </div>
  );
}