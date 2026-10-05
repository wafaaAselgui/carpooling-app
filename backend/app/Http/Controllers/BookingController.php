<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function store(Request $request){

        $validated = $request->validate([
            'trip_id'=>'required|exists:trips,id',
            'seats'=>'required|integer|min:1',
        ]);

        $user = $request->user();

        $booking = DB::transaction(function() use ($validated, $user){
            
            $trip = Trip::where('id', $validated['trip_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($trip->driver_id === $user->id) {
                abort(422, 'You cannot book your own trip.');
            }

            if ($trip->available_seats < $validated['seats']) {
                abort(422, 'Not enough available seats.');
            }
        
            $alreadyBooked = Booking::where('user_id', $user->id)
                ->where('trip_id', $trip->id)
                ->exists();

            if ($alreadyBooked) {
                abort(422, 'You have already booked this trip.');
            }

            $trip->decrement('available_seats', $validated['seats']);

            return Booking::create([
                'user_id' => $user->id,
                'trip_id' => $trip->id,
                'seats' => $validated['seats'],
                'status' => 'confirmed',
            ]);
        });

        return response()->json([
            'message' => 'Trip booked successfully',
            'booking' => $booking->load(['user', 'trip']),
        ], 201);


    }


    public function index(Request $request){
        $bookings = Booking::with(['trip' , 'trip.vehicle'])
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json($bookings);
    }


    public function destroy(Request $request, $id){
        $booking = DB::transaction(function () use ($request, $id){
            $booking = Booking::where('id' , $id)
                ->where('user_id' , $request->user()->id)
                ->firstOrFail();

            $trip = Trip::where('id',$booking->trip_id)
                ->lockForUpdate()
                ->firstOrFail();

            $trip->increment('available_seats',$booking->seats);

            $booking->delete();

            return $booking;
        });

        return response()->json([
            'message'=>'Booking cancelled successfully',
        ]);
    }
}
