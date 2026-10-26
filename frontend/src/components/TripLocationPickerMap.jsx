import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchDrivingRoute, getDistanceKm, reverseGeocode } from "../utils/geoUtils";

import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Custom clean map icons
const departureIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ activeTarget, onLocationSelected }) {
  useMapEvents({
    click(e) {
      if (!activeTarget) return;
      const { lat, lng } = e.latlng;
      onLocationSelected(activeTarget, [lat, lng]);
    },
  });
  return null;
}

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
  onCoordsChange,
  departureCity,
  destinationCity,
}) {
  const [activeTarget, setActiveTarget] = useState("departure");
  const [routePolyline, setRoutePolyline] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function updateRoute() {
      if (depCoords && destCoords) {
        const polyline = await fetchDrivingRoute(depCoords, destCoords);
        if (isMounted) {
          setRoutePolyline(polyline);
          setDistanceKm(Math.round(getDistanceKm(depCoords, destCoords)));
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

  const handlePinSelected = async (target, coords) => {
    setGeocoding(true);
    try {
      const rawAddress = await reverseGeocode(coords[0], coords[1]);
      onCoordsChange(target, coords, rawAddress);
    } finally {
      setGeocoding(false);
    }
  };

  const depMarkerHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        const { lat, lng } = marker.getLatLng();
        handlePinSelected("departure", [lat, lng]);
      },
    }),
    []
  );

  const destMarkerHandlers = useMemo(
    () => ({
      dragend(e) {
        const marker = e.target;
        const { lat, lng } = marker.getLatLng();
        handlePinSelected("destination", [lat, lng]);
      },
    }),
    []
  );

  const defaultCenter = depCoords || destCoords || [33.5731, -7.5898];

  return (
    <div
      className="card shadow-sm border-0 h-100 overflow-hidden"
      style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e8e4dc" }}
    >
      {/* Top Header with Segmented Buttons */}
      <div
        className="px-3 py-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom"
        style={{ backgroundColor: "#ffffff", borderColor: "#f0ece4" }}
      >
        <div
          className="d-inline-flex p-1 rounded-3 border"
          style={{ backgroundColor: "#fefaf3", borderColor: "#ede9e1" }}
        >
          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2 border-0 px-3 py-1 fw-medium"
            style={{
              backgroundColor: activeTarget === "departure" ? "#527050" : "transparent",
              color: activeTarget === "departure" ? "#ffffff" : "#5e6c5f",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            onClick={() => setActiveTarget("departure")}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: activeTarget === "departure" ? "#ffffff" : "#527050",
              }}
            />
            Set Departure {activeTarget === "departure" && "(Active)"}
          </button>

          <button
            type="button"
            className="btn btn-sm d-flex align-items-center gap-2 border-0 px-3 py-1 fw-medium"
            style={{
              backgroundColor: activeTarget === "destination" ? "#b24747" : "transparent",
              color: activeTarget === "destination" ? "#ffffff" : "#5e6c5f",
              borderRadius: "6px",
              transition: "all 0.15s ease",
            }}
            onClick={() => setActiveTarget("destination")}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: activeTarget === "destination" ? "#ffffff" : "#b24747",
              }}
            />
            Set Destination {activeTarget === "destination" && "(Active)"}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          {geocoding && <span className="small text-muted">Resolving location...</span>}
          {distanceKm && (
            <span
              className="badge px-2 py-1"
              style={{ backgroundColor: "#eef4ec", color: "#527050", border: "1px solid #b8cfb3" }}
            >
              ~{distanceKm} km direct
            </span>
          )}
        </div>
      </div>

      {/* Map Body */}
      <div style={{ height: "460px", width: "100%", position: "relative" }}>
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            activeTarget={activeTarget}
            onLocationSelected={handlePinSelected}
          />

          <AutoFitBounds depCoords={depCoords} destCoords={destCoords} />

          {depCoords && (
            <Marker
              position={depCoords}
              icon={departureIcon}
              draggable={true}
              eventHandlers={depMarkerHandlers}
            >
              <Popup>
                <strong>Departure</strong>
                <br />
                {departureCity || "Selected pickup point"}
                <div className="small text-muted">(Drag to adjust)</div>
              </Popup>
            </Marker>
          )}

          {destCoords && (
            <Marker
              position={destCoords}
              icon={destinationIcon}
              draggable={true}
              eventHandlers={destMarkerHandlers}
            >
              <Popup>
                <strong>Destination</strong>
                <br />
                {destinationCity || "Selected drop-off point"}
                <div className="small text-muted">(Drag to adjust)</div>
              </Popup>
            </Marker>
          )}

          {routePolyline.length > 0 && (
            <Polyline
              positions={routePolyline}
              pathOptions={{ color: "#527050", weight: 5, opacity: 0.85 }}
            />
          )}
        </MapContainer>
      </div>

      <div
        className="card-footer py-2 text-muted small text-center border-top"
        style={{ backgroundColor: "#fefaf3", borderColor: "#f0ece4" }}
      >
        Click directly on the map to place pins, or drag existing markers to adjust.
      </div>
    </div>
  );
}