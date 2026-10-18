import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Row, Col, Badge, Spinner, Alert, Image, Button } from "react-bootstrap";
import { getUserPublicProfile } from "../services/user";

export default function UserProfile() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const backendBase = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : "http://localhost:8000";

    useEffect(() => {
        setLoading(true);
        getUserPublicProfile(id)
            .then((data) => {
                setProfile(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load user profile.");
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading profile...</p>
            </Container>
        );
    }

    if (error || !profile) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="danger">{error || "User not found."}</Alert>
                <Button as={Link} to="/" variant="outline-primary" size="sm">
                    ← Back to Rides
                </Button>
            </Container>
        );
    }

    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`;
    const avatarSrc = profile.avatar_url || defaultAvatar;

    return (
        <Container className="py-4" style={{ maxWidth: "860px" }}>
            <Button as={Link} to={-1} variant="outline-secondary" size="sm" className="mb-3">
                ← Go Back
            </Button>

            {/* Profile Overview Card */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-4">
                    <Row className="align-items-center g-3">
                        <Col xs="auto">
                            <Image
                                src={avatarSrc}
                                roundedCircle
                                width={84}
                                height={84}
                                className="object-fit-cover border shadow-sm"
                                alt={profile.name}
                            />
                        </Col>
                        <Col>
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <h4 className="fw-bold mb-0">{profile.name}</h4>
                                {profile.verification_status === "verified" ? (
                                    <Badge bg="success" className="py-1">
                                        ✓ ID Verified
                                    </Badge>
                                ) : (
                                    <Badge bg="secondary">Unverified ID</Badge>
                                )}
                            </div>
                            <div className="text-muted small mb-2">
                                Member since {profile.member_since}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {profile.average_rating ? (
                                    <Badge bg="warning" text="dark" className="fs-6 py-1 px-2">
                                        ★ {profile.average_rating} / 5
                                    </Badge>
                                ) : (
                                    <Badge bg="light" text="dark" className="border">
                                        No reviews yet
                                    </Badge>
                                )}
                                <span className="small text-muted">
                                    ({profile.total_reviews} review{profile.total_reviews !== 1 ? "s" : ""})
                                </span>
                            </div>
                        </Col>
                    </Row>

                    {profile.bio && (
                        <div className="mt-3 pt-3 border-top">
                            <div className="fw-semibold small text-muted mb-1">About</div>
                            <p className="mb-0 text-dark small">{profile.bio}</p>
                        </div>
                    )}

                    {profile.vehicles && profile.vehicles.length > 0 && (
                        <div className="mt-3 pt-3 border-top">
                            <div className="fw-semibold small text-muted mb-2">Verified Vehicles</div>
                            <div className="d-flex flex-wrap gap-2">
                                {profile.vehicles.map((v) => (
                                    <Badge key={v.id} bg="light" text="dark" className="border py-2 px-3 fw-normal">
                                        🚗 <strong>{v.brand} {v.model}</strong> {v.color && `(${v.color})`}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Reviews History */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3">Community Reviews & Feedback</h5>

                    {profile.reviews.length === 0 ? (
                        <p className="text-muted small mb-0">No ratings or reviews recorded yet.</p>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {profile.reviews.map((rev) => {
                                const revAvatar = rev.reviewer?.avatar_path
                                    ? `${backendBase}/storage/${rev.reviewer.avatar_path}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer?.name || "User")}&background=random`;

                                return (
                                    <div key={rev.id} className="border-bottom pb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                                <Image
                                                    src={revAvatar}
                                                    roundedCircle
                                                    width={30}
                                                    height={30}
                                                    className="object-fit-cover border"
                                                />
                                                <span className="fw-semibold small">
                                                    {rev.reviewer?.name || "Anonymous Member"}
                                                </span>
                                            </div>
                                            <div className="text-warning small fw-bold">
                                                {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                                <span className="text-muted ms-1">({rev.rating}/5)</span>
                                            </div>
                                        </div>

                                        {rev.trip && (
                                            <div className="text-muted small mb-1">
                                                Trip: {rev.trip.departure_city} → {rev.trip.destination_city}
                                            </div>
                                        )}

                                        {rev.comment ? (
                                            <p className="small text-dark mb-1 bg-light p-2 rounded">
                                                "{rev.comment}"
                                            </p>
                                        ) : (
                                            <p className="small text-muted fst-italic mb-1">
                                                No written comment provided.
                                            </p>
                                        )}

                                        <div className="text-muted" style={{ fontSize: "11px" }}>
                                            {new Date(rev.created_at).toLocaleDateString("en-US", {
                                                dateStyle: "medium",
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}