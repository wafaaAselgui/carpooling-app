import { Card, Image } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function TripCard({ trip }) {
  const isDriverVerified = trip.driver?.verification_status === "verified";
  const isCarVerified = trip.vehicle?.status === "verified";

  const avatarUrl =
    trip.driver?.avatar_url ||
    (trip.driver?.avatar_path
      ? `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000"}/storage/${trip.driver.avatar_path}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.driver?.name || "Driver")}&background=84A282&color=fff`);

  return (
    <Card
      className="shadow-sm border-0 mb-3"
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e8e4dc",
        overflow: "hidden",
      }}
    >
      <Card.Body className="p-3">
        {/* Origin -> Destination & Price */}
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
          <h5 className="fw-semibold mb-0 text-capitalize" style={{ color: "#1f2720", fontSize: "1.05rem" }}>
            {trip.departure_city}
            <span className="mx-2 text-muted" style={{ fontWeight: 300 }}>→</span>
            {trip.destination_city}
          </h5>
          <span
            className="px-2 py-1 fw-semibold rounded-pill"
            style={{
              backgroundColor: "#eef4ec",
              color: "#527050",
              border: "1px solid #b8cfb3",
              fontSize: "0.825rem",
              whiteSpace: "nowrap",
            }}
          >
            {trip.price_per_seat} MAD
          </span>
        </div>

        {/* Departure Date & Time with Vector SVG */}
        <div className="d-flex align-items-center text-muted small mb-3">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="me-1 text-secondary"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>
            {new Date(trip.departure_time).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>

        {/* Driver & Vehicle Row */}
        <div className="d-flex align-items-center justify-content-between border-top pt-2" style={{ borderColor: "#f0ece4" }}>
          <div className="d-flex align-items-center gap-2">
            <Image
              src={avatarUrl}
              roundedCircle
              width={34}
              height={34}
              className="object-fit-cover border"
              style={{ borderColor: "#e3ded6" }}
              alt={trip.driver?.name || "Driver"}
            />
            <div>
              <div className="fw-semibold small leading-tight" style={{ color: "#1f2720" }}>
                {trip.driver?.name}
              </div>
              {isDriverVerified ? (
                <span
                  className="badge py-0 px-1 mt-1 d-inline-flex align-items-center"
                  style={{
                    backgroundColor: "#eef4ec",
                    color: "#527050",
                    border: "1px solid #b8cfb3",
                    fontSize: "10.5px",
                  }}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="me-1"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified ID
                </span>
              ) : (
                <span className="text-muted" style={{ fontSize: "11px" }}>Driver</span>
              )}
            </div>
          </div>

          {trip.vehicle && (
            <div className="text-end">
              <div className="small fw-medium text-muted">
                {trip.vehicle.brand} {trip.vehicle.model}
              </div>
              {isCarVerified && (
                <span
                  className="badge py-0 px-1 mt-1 d-inline-flex align-items-center"
                  style={{
                    backgroundColor: "#f6e2e9",
                    color: "#7a3c53",
                    border: "1px solid rgba(122, 60, 83, 0.2)",
                    fontSize: "10.5px",
                  }}
                >
                  Vehicle Verified
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Seats & Action */}
        <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3" style={{ borderColor: "#f0ece4" }}>
          <span className="small text-muted">
            Available seats:{" "}
            <strong style={{ color: "#1f2720" }}>
              {trip.available_seats}
            </strong>
          </span>
          <Link
            to={`/trips/${trip.id}`}
            className="btn btn-sm text-white px-3"
            style={{
              backgroundColor: "#527050",
              borderColor: "#527050",
              borderRadius: "8px",
              fontWeight: 500,
            }}
          >
            View Trip
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
}