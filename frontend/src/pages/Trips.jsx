import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import TripCard from "../components/TripCard";

function Trips() {
    const [trips, setTrips] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        fetch("http://127.0.0.1:8000/api/trips", {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setTrips(data);
            })
            .catch((error) => console.error(error));
    }, []);

    return (
        <Container className="py-4">
            <h1 className="mb-4">Available Trips</h1>

            <Row>
                {trips.map((trip) => (
                    <Col key={trip.id} xs={12} md={6} lg={4}>
                        <TripCard trip={trip} />
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default Trips;