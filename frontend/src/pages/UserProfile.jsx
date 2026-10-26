import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Card, Row, Col, Spinner, Alert, Image, Button } from "react-bootstrap";
import { getUserPublicProfile } from "../services/user";
import { useAuth } from "../context/AuthContext";
import ReportModal from "../components/ReportModal";

function StarRating({ rating }) {
    return (
        <span className="d-inline-flex align-items-center gap-1" style={{ color: "var(--color-warning)" }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={star <= rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
            ))}
        </span>
    );
}

export default function UserProfile() {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [reportConfig, setReportConfig] = useState({
        show: false,
        targetType: "user",
        targetId: null,
        targetName: "",
    });

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
                setError("Unable to load member profile.");
                setLoading(false);
            });
    }, [id]);

    const handleOpenReportUser = () => {
        setReportConfig({
            show: true,
            targetType: "user",
            targetId: profile.id,
            targetName: profile.name,
        });
    };

    const handleOpenReportReview = (review) => {
        setReportConfig({
            show: true,
            targetType: "review",
            targetId: review.id,
            targetName: `Review by ${review.reviewer?.name || "User"}`,
        });
    };

    const handleCloseReportModal = () => {
        setReportConfig((prev) => ({ ...prev, show: false }));
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
                <p className="mt-2 text-muted small">Loading member profile...</p>
            </Container>
        );
    }

    if (error || !profile) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="danger">{error || "User not found."}</Alert>
                <Button as={Link} to="/" variant="outline-primary" size="sm">
                    Back to Rides
                </Button>
            </Container>
        );
    }

    const isViewingSelf = currentUser && Number(currentUser.id) === Number(profile.id);
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=84A282&color=fff`;
    const avatarSrc = profile.avatar_url || defaultAvatar;

    return (
        <Container className="py-4 px-lg-5" style={{ maxWidth: "860px" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button as={Link} to="/" variant="outline-secondary" size="sm" className="d-flex align-items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Back to Rides
                </Button>

                {currentUser && !isViewingSelf && (
                    <Button
                        variant="link"
                        size="sm"
                        className="p-0 text-decoration-none small text-danger d-flex align-items-center gap-1"
                        onClick={handleOpenReportUser}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                            <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                        Report Member
                    </Button>
                )}
            </div>

            {/* Profile Overview Card */}
            <Card className="shadow-sm border-0 mb-4" style={{ backgroundColor: "#ffffff" }}>
                <Card.Body className="p-4">
                    <Row className="align-items-center g-3">
                        <Col xs="auto">
                            <Image
                                src={avatarSrc}
                                roundedCircle
                                width={84}
                                height={84}
                                className="object-fit-cover border shadow-sm"
                                style={{ borderColor: "var(--color-border)" }}
                                alt={profile.name}
                            />
                        </Col>
                        <Col>
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <h4 className="fw-bold mb-0" style={{ color: "var(--color-text-main)" }}>{profile.name}</h4>
                                {profile.verification_status === "verified" ? (
                                    <span className="badge badge-sage d-inline-flex align-items-center gap-1">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Verified ID
                                    </span>
                                ) : (
                                    <span className="badge bg-light text-muted border">Unverified ID</span>
                                )}
                            </div>
                            <div className="text-muted small mb-2">
                                Member since {profile.member_since}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {profile.average_rating ? (
                                    <span className="small text-muted d-inline-flex align-items-center gap-1">
                                        <StarRating rating={Math.round(Number(profile.average_rating))} />
                                        <strong className="text-dark">{Number(profile.average_rating).toFixed(1)}</strong>
                                    </span>
                                ) : (
                                    <span className="badge bg-light text-muted border">No ratings yet</span>
                                )}
                                <span className="small text-muted">
                                    ({profile.total_reviews} review{profile.total_reviews !== 1 ? "s" : ""})
                                </span>
                            </div>
                        </Col>
                    </Row>

                    {profile.bio && (
                        <div className="mt-4 pt-3 border-top" style={{ borderColor: "var(--color-border-subtle)" }}>
                            <div className="fw-semibold small text-muted mb-1">About</div>
                            <p className="mb-0 text-dark small">{profile.bio}</p>
                        </div>
                    )}

                    {profile.vehicles && profile.vehicles.length > 0 && (
                        <div className="mt-3 pt-3 border-top" style={{ borderColor: "var(--color-border-subtle)" }}>
                            <div className="fw-semibold small text-muted mb-2">Registered Vehicles</div>
                            <div className="d-flex flex-wrap gap-2">
                                {profile.vehicles.map((v) => (
                                    <span
                                        key={v.id}
                                        className="badge bg-light text-dark border py-2 px-3 fw-normal d-inline-flex align-items-center gap-1"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <line x1="2" y1="10" x2="22" y2="10" />
                                        </svg>
                                        <strong>{v.brand} {v.model}</strong> {v.color && `(${v.color})`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Reviews History */}
            <Card className="shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}>
                <Card.Body className="p-4">
                    <h5 className="fw-bold mb-3" style={{ color: "var(--color-text-main)" }}>
                        Member Feedback & Ratings
                    </h5>

                    {profile.reviews.length === 0 ? (
                        <p className="text-muted small mb-0">No reviews recorded for this member yet.</p>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {profile.reviews.map((rev) => {
                                const revAvatar = rev.reviewer?.avatar_path
                                    ? `${backendBase}/storage/${rev.reviewer.avatar_path}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.reviewer?.name || "User")}&background=84A282&color=fff`;

                                const isOwnReview = currentUser && Number(currentUser.id) === Number(rev.reviewer_id);

                                return (
                                    <div key={rev.id} className="border-bottom pb-3" style={{ borderColor: "var(--color-border-subtle)" }}>
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <div className="d-flex align-items-center gap-2">
                                                <Image
                                                    src={revAvatar}
                                                    roundedCircle
                                                    width={28}
                                                    height={28}
                                                    className="object-fit-cover border"
                                                    style={{ borderColor: "var(--color-border)" }}
                                                    alt={rev.reviewer?.name || "Member"}
                                                />
                                                <span className="fw-semibold small" style={{ color: "var(--color-text-main)" }}>
                                                    {rev.reviewer?.name || "Anonymous Member"}
                                                </span>
                                            </div>
                                            <div className="d-flex align-items-center gap-1 small">
                                                <StarRating rating={rev.rating} />
                                                <span className="text-muted ms-1">({rev.rating}/5)</span>
                                            </div>
                                        </div>

                                        {rev.trip && (
                                            <div className="text-muted small mb-1" style={{ fontSize: "11px" }}>
                                                Route: {rev.trip.departure_city} → {rev.trip.destination_city}
                                            </div>
                                        )}

                                        {rev.comment ? (
                                            <p className="small text-muted mb-1 p-2 rounded" style={{ backgroundColor: "var(--color-canvas)" }}>
                                                "{rev.comment}"
                                            </p>
                                        ) : (
                                            <p className="small text-muted fst-italic mb-1">
                                                No written comment provided.
                                            </p>
                                        )}

                                        <div className="d-flex justify-content-between align-items-center mt-1">
                                            <span className="text-muted" style={{ fontSize: "11px" }}>
                                                {new Date(rev.created_at).toLocaleDateString("en-US", {
                                                    dateStyle: "medium",
                                                })}
                                            </span>

                                            {currentUser && !isOwnReview && (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-muted text-decoration-none p-0"
                                                    style={{ fontSize: "11px" }}
                                                    onClick={() => handleOpenReportReview(rev)}
                                                >
                                                    Report
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <ReportModal
                show={reportConfig.show}
                onHide={handleCloseReportModal}
                targetType={reportConfig.targetType}
                targetId={reportConfig.targetId}
                targetName={reportConfig.targetName}
            />
        </Container>
    );
}