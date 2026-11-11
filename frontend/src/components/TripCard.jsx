import { Card, Image } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function TripCard({ trip }) {
  if (!trip) return null;

  const isDriverVerified = trip.driver?.verification_status === "verified";
  const isCarVerified = trip.vehicle?.status === "verified";

  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:8000";

  const driverName = trip.driver?.name || "Driver";

  const avatarUrl =
    trip.driver?.avatar_url?.trim() ||
    (trip.driver?.avatar_path?.trim()
      ? `${backendBase}/storage/${trip.driver.avatar_path.replace(/^\/+/, "")}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=0b7f70&color=fff`);

  // Safe date formatting
  let formattedDate = "Upcoming";
  let formattedTime = "";
  if (trip.departure_time) {
    const d = new Date(trip.departure_time);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      formattedTime = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const seatsLeft = parseInt(trip.available_seats ?? 0, 10);
  const price = trip.price_per_seat != null ? Number(trip.price_per_seat).toFixed(2) : "0.00";

  return (
    <Card className="trip-card border-0 shadow-sm mb-3 position-relative overflow-hidden">
      <Card.Body className="p-3 p-sm-4 d-flex flex-column gap-3">
        {/* Header: Origin -> Destination & Price */}
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <h5 className="fw-bold mb-1 text-capitalize text-truncate" style={{ fontSize: "1.05rem" }}>
              <span>{trip.departure_city || "Origin"}</span>
              <span className="mx-2 text-muted fw-light">→</span>
              <span>{trip.destination_city || "Destination"}</span>
            </h5>

            {/* Date & Time */}
            <div className="d-flex align-items-center text-muted small gap-2 flex-wrap">
              <span className="d-inline-flex align-items-center gap-1">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: "var(--color-primary)" }}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formattedDate}
              </span>
              {formattedTime && (
                <>
                  <span>•</span>
                  <span className="fw-semibold text-dark">{formattedTime}</span>
                </>
              )}
            </div>
          </div>

          {/* Price Badge */}
          <div className="text-end flex-shrink-0">
            <div className="fw-bold fs-5 text-nowrap" style={{ color: "var(--color-primary-text)" }}>
              {price}
              <span className="small fs-6 fw-normal text-muted ms-1">MAD</span>
            </div>
            <div className="text-muted" style={{ fontSize: "11px" }}>per seat</div>
          </div>
        </div>

        {/* Middle Section: Driver profile + Vehicle details */}
        <div
          className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 p-2 rounded-3"
          style={{ backgroundColor: "var(--color-surface-tint, #e9f6f4)" }}
        >
          {/* Driver */}
          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
            <Image
              src={avatarUrl}
              roundedCircle
              width={38}
              height={38}
              className="object-fit-cover border flex-shrink-0"
              style={{ borderColor: "var(--color-border)" }}
              alt={driverName}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=0b7f70&color=fff`;
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div className="fw-semibold small text-truncate text-dark">
                {driverName}
              </div>
              <div>
                {isDriverVerified ? (
                  <span
                    className="badge badge-sage py-0 px-1 d-inline-flex align-items-center"
                    style={{ fontSize: "10.5px" }}
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
                  <span className="text-muted" style={{ fontSize: "11px" }}>
                    Driver
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          {trip.vehicle && (
            <div
              className="d-flex flex-row flex-sm-column align-items-center align-items-sm-end justify-content-between w-100 w-sm-auto pt-1 pt-sm-0 border-top border-sm-0"
              style={{ minWidth: 0 }}
            >
              <span className="small fw-medium text-dark text-truncate">
                {trip.vehicle.brand} {trip.vehicle.model}
              </span>
              {isCarVerified && (
                <span className="badge-vehicle-verified mt-sm-1">
                  <svg
                    width="11"
                    height="11"
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
                  Car Verified
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Seats availability & Action CTA */}
        <div className="d-flex align-items-center justify-content-between pt-1">
          <div className="d-flex align-items-center gap-1 small">
            <span
              className="status-dot"
              style={{
                backgroundColor:
                  seatsLeft === 1
                    ? "var(--color-warning-dot)"
                    : seatsLeft > 1
                    ? "var(--color-success)"
                    : "var(--color-text-subtle)",
              }}
            />
            <span className="text-muted">
              {seatsLeft === 1 ? (
                <strong className="text-danger">Only 1 seat left!</strong>
              ) : seatsLeft > 1 ? (
                <>
                  <strong className="text-dark">{seatsLeft}</strong> seats left
                </>
              ) : (
                <strong className="text-muted">Fully Booked</strong>
              )}
            </span>
          </div>

          <Link
            to={trip.id ? `/trips/${trip.id}` : "#"}
            className="btn btn-sm btn-primary px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
          >
            <span>View Trip</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
}