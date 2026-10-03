import { useEffect, useState } from "react";
import {Link,useParams} from "react-router-dom";
import { Card, Button, Container, Row, Col } from "react-bootstrap";


function TripDetails(){
    const {id} = useParams();
    const [trip, setTrip]= useState(null);

    useEffect(()=>{
        const token=localStorage.getItem("token");
        
        if(!token){
            return;
        }
        
        fetch(`http://127.0.0.1:8000/api/trips/${id}`,{
            headers:{
                Accept:"application/json",
                Authorization: `Bearer ${token}`
            },

        })
         .then((response)=>response.json())
         .then((data)=>{
            console.log("Trip:", data);
            setTrip(data);
         })  
         .catch((error)=>console.error(error));

        
    },[id]);

    if(!trip){
        return <p>Loading...</p>
    }
    return(
         <Container className="py-4">
            <Button
                as={Link}
                to="/"
                variant="outline-secondary"
                className="mb-4"
            >
                ← Back to trips
            </Button>

            <Card className="shadow-sm">
                <Card.Body>
                    <Card.Title className="mb-4">
                        {trip.departure_city} → {trip.destination_city}
                    </Card.Title>

                    <Row>
                        <Col md={6}>
                            <h5>Trip information</h5>

                            <p>
                                <strong>Departure:</strong>{" "}
                                {trip.departure_address}
                            </p>

                            <p>
                                <strong>Destination:</strong>{" "}
                                {trip.destination_address}
                            </p>

                            <p>
                                <strong>Available seats:</strong>{" "}
                                {trip.available_seats}
                            </p>

                            <p>
                                <strong>Price:</strong>{" "}
                                {trip.price_per_seat} MAD
                            </p>
                        </Col>

                        <Col md={6}>
                            <h5>Driver & vehicle</h5>

                            <p>
                                <strong>Driver:</strong>{" "}
                                {trip.driver?.name}
                            </p>

                            <p>
                                <strong>Vehicle:</strong>{" "}
                                {trip.vehicle?.brand}{" "}
                                {trip.vehicle?.model}
                            </p>

                            <p>
                                <strong>Color:</strong>{" "}
                                {trip.vehicle?.color}
                            </p>
                        </Col>
                    </Row>

                    <hr />

                    <h5>Description</h5>

                    <p>
                        {trip.description || "No description provided."}
                    </p>

                    <Button variant="primary">
                        Book this trip
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    )
}


export default TripDetails;