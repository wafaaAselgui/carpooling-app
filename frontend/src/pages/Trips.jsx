import { useEffect, useState } from "react";
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
                console.log("Trips:", data);
                setTrips(data);
            })
            .catch((error) => console.error(error));
    }, []);

    return (
        <div>
            <h1>Carpooling App</h1>

            {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
            ))}
        </div>
    );
}

export default Trips;