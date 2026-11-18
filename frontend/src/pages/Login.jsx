import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Card, Container, Row, Col, Alert } from "react-bootstrap";
import { login } from "../services/auth";
import { useAuth } from "../context/AuthContext";
import { getFriendlyError } from "../utils/errorHandler";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const data = await login(formData);
      loginUser(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(getFriendlyError(err, "Invalid email or password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4 py-md-5 px-3">
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={6} lg={4}>
          <Card className="shadow-sm border-0" style={{ backgroundColor: "var(--color-surface)" }}>
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <h3 className="fw-bold mb-1" style={{ color: "var(--color-text-main)" }}>
                  Welcome Back
                </h3>
                <p className="text-muted small mb-0">
                  Sign in to coordinate and manage your journeys
                </p>
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

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-semibold text-muted">Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </Form>

              <div
                className="text-center mt-4 pt-3 border-top"
                style={{ borderColor: "var(--color-border-subtle)" }}
              >
                <span className="small text-muted">Don't have an account? </span>
                <Link to="/register" className="small fw-semibold">
                  Register here
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;