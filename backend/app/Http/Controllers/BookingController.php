<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /**
     * Get bookings for the authenticated passenger
     */
    public function index(Request $request)
    {
        $bookings = Booking::with([
            'reviews',
            'trip.vehicle',
            'trip.driver:id,name,phone,avatar_path,verification_status',
        ])
        ->where('user_id', $request->user()->id)
        ->latest()
        ->get();

        return response()->json($bookings);
    }

    /**
     * Passenger books seats on a trip (created as 'pending')
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'trip_id' => 'required|exists:trips,id',
            'seats'   => 'required|integer|min:1|max:8',
        ]);

        $trip = Trip::findOrFail($validated['trip_id']);

        // Prevent driver from booking their own ride
        if ($trip->driver_id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot book seats on your own ride.'
            ], 422);
        }

        // Check if trip is open
        if ($trip->status !== 'scheduled') {
            return response()->json([
                'message' => 'This trip is no longer accepting bookings.'
            ], 422);
        }

        // Check remaining seats
        if ($trip->available_seats < $validated['seats']) {
            return response()->json([
                'message' => 'Not enough available seats left.'
            ], 422);
        }

        // Check if user already has an active booking for this trip
        $existing = Booking::where('trip_id', $trip->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'You already have an active booking request for this trip.'
            ], 422);
        }

        $booking = Booking::create([
            'trip_id' => $trip->id,
            'user_id' => $request->user()->id,
            'seats'   => $validated['seats'],
            'status'  => 'pending',
        ]);

        return response()->json([
            'message' => 'Booking request sent! Waiting for driver approval.',
            'booking' => $booking->load('trip'),
        ], 201);
    }

    /**
     * Driver responds to a booking request (accept / reject)
     */
    public function respond(Request $request, $id)
    {
        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
        ]);

        $booking = Booking::with('trip')->findOrFail($id);
        $trip = $booking->trip;

        // Verify that the authenticated user is the driver of the trip
        if ($trip->driver_id !== $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized action.'
            ], 403);
        }

        if ($booking->status !== 'pending') {
            return response()->json([
                'message' => "This booking request has already been {$booking->status}."
            ], 422);
        }

        if ($validated['action'] === 'accept') {
            if ($trip->available_seats < $booking->seats) {
                return response()->json([
                    'message' => 'Cannot accept: not enough available seats remaining on this trip.'
                ], 422);
            }

            DB::transaction(function () use ($booking, $trip) {
                $booking->status = 'confirmed';
                $booking->save();

                $trip->decrement('available_seats', $booking->seats);
            });

            return response()->json([
                'message' => 'Booking request accepted.',
                'booking' => $booking->fresh('user'),
            ]);
        }

        // If action is reject
        $booking->status = 'rejected';
        $booking->save();

        return response()->json([
            'message' => 'Booking request rejected.',
            'booking' => $booking->fresh('user'),
        ]);
    }

    /**
     * Passenger cancels their booking
     */
    public function destroy(Request $request, $id)
    {
        $booking = Booking::with('trip')->findOrFail($id);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'This booking is already cancelled.'], 422);
        }

        DB::transaction(function () use ($booking) {
            // If it was already confirmed, restore the seats to the trip
            if ($booking->status === 'confirmed') {
                $booking->trip->increment('available_seats', $booking->seats);
            }

            $booking->status = 'cancelled';
            $booking->save();
        });

        return response()->json([
            'message' => 'Booking cancelled successfully.',
            'booking' => $booking,
        ]);
    }
}