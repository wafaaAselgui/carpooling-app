import api from "./api";

export const createBooking = async (tripId , seats) => {
    const token = localStorage.getItem("token");

    const response = await api.post(
        "/bookings",
        {
            trip_id: tripId,
            seats: seats, 
        },
        {
            headers:{
                Authorization : `Bearer ${token}`,
            },
        }
    );

    return response.data;
}

export const getMyBookings = async () => {
    const token = localStorage.getItem("token");

    const response = await api.get("/bookings", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

export const cancelBooking = async (bookingId) => {
    const token = localStorage.getItem("token");

    const response = await api.delete(`/bookings/${bookingId}`,{
        headers: {
            Authorization:`Bearer ${token}`,
        },
    });

    return response.data;

};