import { useState } from "react";
import { Form, Button, Card, Container, Row, Col, Alert } from "react-bootstrap";
import { register } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

function Register() {
    const { loginUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await register(formData);
            loginUser(data.user, data.token);
            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message || "Registration failed. Please check your details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={7} lg={5}>
                    <Card className="shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}>
                        <Card.Body className="p-4 p-md-5">
                            <div className="text-center mb-4">
                                <h3 className="fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
                                    Create Your Account
                                </h3>
                                <p className="text-muted small">Join verified Moroccan drivers and passengers</p>
                            </div>

                            {error && (
                                <Alert
                                    dismissible
                                    onClose={() => setError("")}
                                    style={{
                                        backgroundColor: "var(--color-danger-subtle)",
                                        color: "var(--color-danger)",
                                        border: "none",
                                        fontSize: "0.875rem",
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-semibold text-muted">Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Youssef El Mansouri"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-semibold text-muted">Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-semibold text-muted">Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password"
                                        placeholder="Minimum 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="small fw-semibold text-muted">Confirm Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="password_confirmation"
                                        placeholder="Repeat your password"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? "Registering..." : "Create Account"}
                                </Button>
                            </Form>

                            <div className="text-center mt-4 pt-2 border-top" style={{ borderColor: "var(--color-border-subtle)" }}>
                                <span className="small text-muted">Already have an account? </span>
                                <Link to="/login" className="small fw-semibold">
                                    Sign in
                                </Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Register;