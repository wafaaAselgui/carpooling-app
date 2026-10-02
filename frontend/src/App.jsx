import {BrowserRouter, Routes , Route} from "react-router-dom";
import Trips from "./pages/Trips";
import TripDetails from "./pages/TripDetails";

function App() {
  return(
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Trips/>}/>
          <Route path="/trips/:id" element={<TripDetails/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;