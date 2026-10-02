import {useParams} from "react-router-dom";

function TripDetails(){
    const {id} = useParams();

    return(
        <div>
            <h1>Trip Details</h1>
            <p>Trip ID: {id}</p>
        </div>
    )
}


export default TripDetails;