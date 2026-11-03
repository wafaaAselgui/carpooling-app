import { Card, Image } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function TripCard({ trip }) {
  const isDriverVerified = trip.driver?.verification_status === "verified";
  const isCarVerified = trip.vehicle?.status === "verified";

  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:8000";

  const avatarUrl =
    trip.driver?.avatar_url ||
    (trip.driver?.avatar_path
      ? `${backendBase}/storage/${trip.driver.avatar_path}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.driver?.name || "Driver")}&background=e31b6d&color=fff`);

  return (
    <Card className="shadow-sm border-0 mb-3 overflow-hidden">
      <Card.Body className="p-3">
        {/* Origin -> Destination & Price */}
        <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
          <h5 className="fw-semibold mb-0 text-capitalize" style={{ fontSize: "1.05rem" }}>
            {trip.departure_city}
            <span className="mx-2 text-muted" style={{ fontWeight: 300 }}>→</span>
            {trip.destination_city}
          </h5>
          <span className="badge badge-sage px-2 py-1">
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
            className="me-1"
            style={{ color: "var(--color-text-subtle)" }}
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
        <div className="d-flex align-items-center justify-content-between border-top pt-2" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="d-flex align-items-center gap-2">
            <Image
              src={avatarUrl}
              roundedCircle
              width={34}
              height={34}
              className="object-fit-cover border"
              style={{ borderColor: "var(--color-border)" }}
              alt={trip.driver?.name || "Driver"}
            />
            <div>
              <div className="fw-semibold small leading-tight">
                {trip.driver?.name}
              </div>
              {isDriverVerified ? (
                <span className="badge badge-sage py-0 px-1 mt-1 d-inline-flex align-items-center" style={{ fontSize: "10.5px" }}>
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
              <span className="badge-vehicle-verified">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                Vehicle Verified
              </span>
            )}          
            </div>
          )}
        </div>

        {/* Footer: Seats & Action */}
        <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3" style={{ borderColor: "var(--color-border-subtle)" }}>
          <span className="small text-muted">
            Available seats:{" "}
            <strong>
              {trip.available_seats}
            </strong>
          </span>
          <Link
            to={`/trips/${trip.id}`}
            className="btn btn-sm btn-primary px-3"
          >
            View Trip
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
}