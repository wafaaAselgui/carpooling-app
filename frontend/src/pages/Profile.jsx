import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Alert, Spinner, Image } from "react-bootstrap";
import { getProfile, updateProfile, uploadAvatar, submitVerification } from "../services/profile";
import VehicleManager from "../components/VehicleManager";

function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusMsg, setStatusMsg] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Profile form inputs
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
            setStatusMsg("Profile avatar updated successfully.");
            loadUserData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to upload avatar.");
        }
    };

    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        if (!cinFile) {
            setErrorMsg("Please upload an image or PDF of your National ID (CIN).");
            return;
        }
        setStatusMsg(null);
        setErrorMsg(null);
        try {
            await submitVerification(cinNumber, cinFile);
            setStatusMsg("ID submitted successfully. Verification pending administrator review.");
            loadUserData();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Failed to submit verification document.");
        }
    };

    const renderVerificationBadge = (status) => {
        switch (status) {
            case "verified":
                return <Badge bg="success">✓ Verified Identity</Badge>;
            case "pending":
                return <Badge bg="warning" text="dark">⏳ Pending Verification</Badge>;
            case "rejected":
                return <Badge bg="danger">✕ Verification Rejected</Badge>;
            default:
                return <Badge bg="secondary">Unverified Account</Badge>;
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your profile...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="fw-bold mb-4">My Profile</h2>

            {statusMsg && <Alert variant="success" onClose={() => setStatusMsg(null)} dismissible>{statusMsg}</Alert>}
            {errorMsg && <Alert variant="danger" onClose={() => setErrorMsg(null)} dismissible>{errorMsg}</Alert>}

            <Row className="g-4">
                {/* Left Column: Avatar & Verification status */}
                <Col lg={4}>
                    <Card className="text-center shadow-sm border-0 p-3 mb-4">
                        <Card.Body>
                            <Image
                                src={user?.avatar_url || "https://placehold.co/150x150?text=Avatar"}
                                roundedCircle
                                width={130}
                                height={130}
                                className="mb-3 border object-fit-cover shadow-sm"
                            />
                            <h5 className="fw-bold mb-1">{user?.name}</h5>
                            <div className="text-muted small mb-2">{user?.email}</div>
                            <div className="mb-3">{renderVerificationBadge(user?.verification_status)}</div>

                            <Form.Group className="mb-2">
                                <Form.Control
                                    type="file"
                                    size="sm"
                                    accept="image/*"
                                    onChange={(e) => setAvatarFile(e.target.files[0])}
                                />
                            </Form.Group>
                            <Button
                                size="sm"
                                variant="outline-primary"
                                className="w-100"
                                disabled={!avatarFile}
                                onClick={handleAvatarUpload}
                            >
                                Change Photo
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right Column: Personal details, ID verification & Vehicles */}
                <Col lg={8}>
                    {/* Basic Info */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Personal Details</h5>
                            <Form onSubmit={handleInfoSubmit}>
                                <Row className="g-3">
                                    <Col sm={6}>
                                        <Form.Label className="small fw-semibold">Full Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </Col>
                                    <Col sm={6}>
                                        <Form.Label className="small fw-semibold">Phone Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="+212 6..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </Col>
                                    <Col xs={12}>
                                        <Form.Label className="small fw-semibold">Bio</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            placeholder="e.g. Regular commuter between Casablanca and Rabat, non-smoker..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </Col>
                                </Row>
                                <Button type="submit" variant="primary" size="sm" className="mt-3">
                                    Save Changes
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* CIN Identity Verification */}
                    <Card className="shadow-sm border-0 mb-4">
                        <Card.Body>
                            <h5 className="fw-bold mb-2">Identity Verification (CIN)</h5>
                            <p className="text-muted small mb-3">
                                Verifying your identity grants a trust badge on your trips and improves passenger booking rates.
                            </p>

                            {user?.verification_status === "verified" ? (
                                <Alert variant="success" className="mb-0">
                                    Your National ID (CIN: <strong>{user?.cin_number}</strong>) is confirmed. Trust badge active.
                                </Alert>
                            ) : (
                                <Form onSubmit={handleVerificationSubmit}>
                                    <Row className="g-3">
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold">National ID Number (CIN)</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. AB123456"
                                                value={cinNumber}
                                                onChange={(e) => setCinNumber(e.target.value)}
                                                required
                                            />
                                        </Col>
                                        <Col sm={6}>
                                            <Form.Label className="small fw-semibold">ID Document (Front Photo / PDF)</Form.Label>
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
                                        variant="dark"
                                        size="sm"
                                        className="mt-3"
                                        disabled={user?.verification_status === "pending"}
                                    >
                                        {user?.verification_status === "pending"
                                            ? "⏳ Verification Pending..."
                                            : "Submit for Verification"}
                                    </Button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Vehicles & Document Management */}
                    <VehicleManager />
                </Col>
            </Row>
        </Container>
    );
}

export default Profile;