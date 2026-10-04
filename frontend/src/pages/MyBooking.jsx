import { useEffect, useState } from "react";
import { getMyBookings } from "../services/booking";
import { Container, Card, Row, Col } from "react-bootstrap";


function MyBookings(){
    const [bookings, setBookings]=useState([]);

    useEffect(()=>{
        getMyBookings()
        .then((data)=>{
            setBookings(data);
        })
        .catch((error)=>{
            console.error(error);
        });
    },[]);


    return(
       <Container className="py-4">
            <h1 className="mb-4">My Bookings</h1>

            <Row>
                {bookings.map((booking) => (
                    <Col key={booking.id} xs={12} md={6} lg={4}>
                        <Card className="mb-3 shadow-sm">
                            <Card.Body>
                                <Card.Title>
                                    {booking.trip?.departure_city} →{" "}
                                    {booking.trip?.destination_city}
                                </Card.Title>

                                <Card.Text>
                                    <strong>Seats:</strong>{" "}
                                    {booking.seats}
                                </Card.Text>

                                <Card.Text>
                                    <strong>Status:</strong>{" "}
                                    {booking.status}
                                </Card.Text>

                                <Card.Text>
                                    <strong>Price per seat:</strong>{" "}
                                    {booking.trip?.price_per_seat} MAD
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default MyBookings;