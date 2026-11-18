import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Image } from "react-bootstrap";
import { getProfile, updateProfile, uploadAvatar, submitVerification } from "../services/profile";
import VehicleManager from "../components/VehicleManager";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const [formData, setFormData] = useState({ name: "", phone: "", bio: "" });
    const [avatarFile, setAvatarFile] = useState(null);
    const [cinNumber, setCinNumber] = useState("");
    const [cinFile, setCinFile] = useState(null);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const data = await getProfile();
            setUser(data);
            setFormData({
                name: data.name || "",
                phone: data.phone || "",
                bio: data.bio || "",
            });
            setCinNumber(data.cin_number || "");
        } catch {
            setErrorMsg("Failed to load profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserData();
    }, []);

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await updateProfile(formData);
            setStatusMsg("Personal information updated successfully.");
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to update profile.");
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await uploadAvatar(avatarFile);
            setAvatarFile(null);
            setStatusMsg("Profile photo updated successfully.");
            loadUserData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to upload photo.");
        }
    };

    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        if (!cinFile) {
            setErrorMsg("Please attach an image or PDF of your National ID (CIN).");
            return;
        }
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await submitVerification(cinNumber, cinFile);
            setStatusMsg("Identification submitted successfully. Pending administrative verification.");
            loadUserData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to submit verification file.");
        }
    };

    const renderVerificationBadge = (status) => {
        switch (status) {
            case "verified":
                return (
                    <span className="badge badge-sage d-inline-flex align-items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Verified Identity
                    </span>
                );
            case "pending":
                return (
                    <span
                        className="badge d-inline-flex align-items-center gap-1"
                        style={{ backgroundColor: "var(--color-warning-subtle)", color: "var(--color-warning)", border: "1px solid rgba(148, 105, 39, 0.2)" }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Pending Review
                    </span>
                );
            case "rejected":
                return (
                    <span className="badge badge-blush d-inline-flex align-items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Verification Declined
                    </span>
                );
            default:
                return <span className="badge bg-light text-muted border">Unverified Profile</span>;
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" style={{ color: "var(--color-primary)" }} />
                <p className="mt-2 text-muted small">Loading profile...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4 px-lg-5">
            <div className="mb-4">
                <h2 className="fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>Account Profile</h2>
                <p className="text-muted small mb-0">Manage personal contact details, identity trust credentials, and registered vehicles.</p>
            </div>

            {statusMsg && (
                <Alert
                    dismissible
                    onClose={() => setStatusMsg(null)}
                    style={{ backgroundColor: "var(--color-secondary-subtle)", color: "var(--color-primary)", border: "none" }}
                >
                    {statusMsg}
                </Alert>
            )}

            {errorMsg && (
                <Alert
                    dismissible
                    onClose={() => setErrorMsg(null)}
                    style={{ backgroundColor: "var(--color-danger-subtle)", color: "var(--color-danger)", border: "none" }}
                >
                    {errorMsg}
                </Alert>
            )}

            <Row className="g-4">
                {/* Left Column: Avatar & Verification status */}
                <Col lg={4}>
                    <Card className="text-center shadow-sm border-0 p-3 mb-4">
                        <Card.Body>
                            <Image
                                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=84A282&color=fff`}
                                roundedCircle
                                width={120}
                                height={120}
                                className="mb-3 border object-fit-cover shadow-sm"
                                style={{ borderColor: "var(--color-border)" }}
                                alt={user?.name || "User profile photo"}
                            />
                            <h5 className="fw-semibold mb-1" style={{ color: "var(--color-text-main)" }}>{user?.name}</h5>
                            <div className="text-muted small mb-3">{user?.email}</div>
                            <div className="mb-4">{renderVerificationBadge(user?.verification_status)}</div>

                            <div className="p-3 rounded text-start" style={{ backgroundColor: "var(--color-canvas)", border: "1px solid var(--color-border-subtle)" }}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-semibold text-muted">Update Avatar</Form.Label>
                                    <Form.Control
                                        type="file"
                                        size="sm"
                                        accept="image/*"
                                        onChange={(e) => setAvatarFile(e.target.files[0])}
                                    />
                                </Form.Group>
                                <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    className="w-100"
                                    disabled={!avatarFile}
                                    onClick={handleAvatarUpload}
                                >
                                    Upload Photo
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column: Personal details, ID verification & Vehicles */}
                <Col lg={8}>
                    {/* Basic Info */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-semibold mb-3" style={{ color: "var(--color-text-main)" }}>Personal Information</h5>
                            <Form onSubmit={handleInfoSubmit}>
                                <Row className="g-3">
                                    <Col sm={6}>
                                        <Form.Label className="small fw-semibold text-muted">Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Label className="small fw-semibold text-muted">Phone Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="+212 6..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold text-muted">About You (Bio)</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="e.g. Regular commuter along the coast, non-smoker, quiet passenger..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </Col>
                                </Row>
                                <Button type="submit" variant="primary" size="sm" className="mt-3 px-3">
                                    Save Profile
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* CIN Identity Verification */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body className="p-4">
                            <h5 className="fw-semibold mb-2" style={{ color: "var(--color-text-main)" }}>Government ID Verification (CIN)</h5>
                            <p className="text-muted small mb-3">
                                Submitting a verified identity attaches a verification badge to your profile and published rides.
                            </p>

                            {user?.verification_status === "verified" ? (
                                <Alert
                                    className="mb-0 d-flex align-items-center gap-2 border-0"
                                    style={{ backgroundColor: "var(--color-secondary-subtle)", color: "var(--color-primary)" }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                    <span>
                                        National Identity Document (CIN: <strong>{user?.cin_number}</strong>) is approved.
                                    </span>
                                </Alert>
                            ) : (
                                <Form onSubmit={handleVerificationSubmit}>
                                    <Row className="g-3">
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">National ID Number (CIN)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. AB123456"
                                                value={cinNumber}
                                                onChange={(e) => setCinNumber(e.target.value)}
                                                required
                                            />
                                        </Col>
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold text-muted">ID Document (Image or PDF)</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setCinFile(e.target.files[0])}
                                                required
                                            />
                                        </Col>
                                    </Row>
                                    <Button
                                        type="submit"
                                        variant="outline-primary"
                                        size="sm"
                                        className="mt-3"
                                        disabled={user?.verification_status === "pending"}
                                    >
                                        {user?.verification_status === "pending"
                                            ? "Under Review..."
                                            : "Submit for Verification"}
                                    </Button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Vehicles Section */}
                    <VehicleManager />
                </Col>
            </Row>
        </Container>
    );
}

export default Profile;