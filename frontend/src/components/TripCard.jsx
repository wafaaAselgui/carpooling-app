import { Card, Badge, Button, Image } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function TripCard({ trip }) {
    const isDriverVerified = trip.driver?.verification_status === "verified";
    const isCarVerified = trip.vehicle?.status === "verified";

    const avatarUrl = trip.driver?.avatar_url || (trip.driver?.avatar_path 
        ? `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8000"}/storage/${trip.driver.avatar_path}` 
        : "https://placehold.co/100x100?text=Driver");

    return (
        <Card className="shadow-sm border-0 h-100">
            <Card.Body className="d-flex flex-column justify-content-between p-3">
                <div>
                    {/* Header: Origin -> Destination and Price */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="fw-bold mb-0 text-capitalize text-dark">
                            {trip.departure_city} → {trip.destination_city}
                        </h5>
                        <Badge bg="success" className="fs-6 px-2 py-1">
                            {trip.price_per_seat} MAD
                        </Badge>
                    </div>

                    <div className="text-muted small mb-3">
                        📅 {new Date(trip.departure_time).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        })}
                    </div>

                    {/* Driver & Badges */}
                    <div className="d-flex align-items-center justify-content-between border-top pt-2">
                        <div className="d-flex align-items-center gap-2">
                            <Image
                                src={avatarUrl}
                                roundedCircle
                                width={38}
                                height={38}
                                className="object-fit-cover border"
                            />
                            <div>
                                <div className="fw-semibold small leading-tight">{trip.driver?.name}</div>
                                {isDriverVerified ? (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-1" style={{ fontSize: "11px" }}>
                                        ✓ ID Verified
                                    </span>
                                ) : (
                                    <span className="text-muted" style={{ fontSize: "11px" }}>Driver</span>
                                )}
                            </div>
                        </div>

                        {/* Vehicle details */}
                        {trip.vehicle && (
                            <div className="text-end">
                                <div className="small fw-semibold text-muted">
                                    {trip.vehicle.brand} {trip.vehicle.model}
                                </div>
                                {isCarVerified && (
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-0 px-1" style={{ fontSize: "11px" }}>
                                        ✓ Car Verified
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
                    <span className="small text-muted">
                        Available seats: <strong>{trip.available_seats}</strong>
                    </span>
                    <Button as={Link} to={`/trips/${trip.id}`} variant="primary" size="sm">
                        View Trip
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}