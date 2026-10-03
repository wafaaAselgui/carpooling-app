import { useEffect, useState } from "react";
import {Link,useParams} from "react-router-dom";
import { Card, Button, Container, Row, Col } from "react-bootstrap";
import { createBooking } from "../services/booking";


function TripDetails(){
    const {id} = useParams();

    const [trip, setTrip]= useState(null);
    const [seats, setSeats]=useState(1);
    const [bookingMessage, setBookingMessage] = useState("");
    const [booked, setBooked] = useState(false);

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


    const handleBooking = async()=>{
        try{
            const data=await createBooking(trip.id , seats);

            setBookingMessage(data.message);
            setBooked(true);
            
            setTrip({
                ...trip,
                available_seats: trip.available_seats - seats,
            });
        } catch (error){
            setBookingMessage(
                error.response?.data?.message || "Booking failed."
            );
        }
    };


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

                            <div className="mb-3">
                                <label className="form-label">
                                    Number of seats
                                </label>

                                <input
                                    type="number"
                                    className="form-control"
                                    min="1"
                                    max={trip.available_seats}
                                    value={seats}
                                    onChange={(event) => setSeats(Number(event.target.value))}
                                />
                            </div>
                            
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

                    
                    {bookingMessage && (
                        <div className="alert alert-info mt-3">
                            {bookingMessage}
                        </div>
                    )}
                    
                    <Button
                        variant={booked ? "success" : "primary"}
                        onClick={handleBooking}
                        disabled={booked || trip.available_seats === 0}
                    >
                        {booked ? "Booked ✓" : "Book this trip"}
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    )
}


export default TripDetails;