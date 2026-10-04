import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {Form , Button , Card , Container , Row , Col , Alert } from "react-bootstrap";
import {login} from "../services/auth";
import { useAuth } from "../context/AuthContext";

function Login(){
    
    const navigate = useNavigate();

    const [formData , setFormData] = useState({
        email:"",
        password:"",
    });
    const { user, loginUser } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event)=>{
        setFormData({
            ...formData,
            [event.target.name]:event.target.value,
        });
    };

    const handleSubmit = async (event)=>{
        event.preventDefault();

        setError("");
        setLoading(true);

        try{
            const data = await login(formData);

            loginUser(data.user, data.token)
            
            navigate("/");
    
        }catch(error){
            setError(
                error.response?.data?.message || "sSomething went wrong."
            );
        }finally{
            setLoading(false);
        }
        
    };
    console.log("Current user:", user);
    return(
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={7} lg={5}>
                    <Card>
                        <Card.Body className="p-4">
                            <h1 className="text-center mb-4">
                                Login
                            </h1>

                            {error && (
                                <Alert variant="danger">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Email
                                    </Form.Label>
                                     <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Password
                                    </Form.Label>

                                    <Form.Control
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                 <Button
                                    type="submit"
                                    className="w-100"
                                    disabled={loading}
                                >
                                    {loading ? "Logging in..." : "Login"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;