import {useEffect , useState} from 'react';
import Login from './pages/Login';

function App(){
  const [trips , setTrips] = useState([]);

  useEffect(()=>{
    fetch("http://127.0.0.1:8000/api/trips")
    .then((response)=>response.json())
    .then((data)=>setTrips(data))
    .catch((error)=> console.error(error));
  },[]);

  // return(
  //   <div>
  //     <h1>Carpooling App</h1>
  //     {trips.map((trip)=>(
  //       <div key={trip.id}>
  //         <h2>{trip.departure_city} → {trip.destination_city}</h2>

  //         <p>Driver: {trip.driver?.name}</p>

  //         <p>Vehicle: {trip.vehicle?.brad}{" "}{trip.vehicle?.model}</p>

  //         <p>Price: {trip.price_per_seat} MAD</p>
        
        
  //       </div>
  //     ))}
  //   </div>



  return <Login/>;
  
}

export default App;

