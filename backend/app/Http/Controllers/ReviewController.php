<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Submit a verified review for a completed booking.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:1000',
        ]);

        // 1. Fetch booking with its trip relation and verify ownership
        $booking = Booking::with('trip')->where('user_id', $request->user()->id)
            ->findOrFail($validated['booking_id']);

        // 2. Guard: Must be a confirmed booking
        if ($booking->status !== 'confirmed') {
            return response()->json([
                'message' => 'You can only review confirmed bookings.'
            ], 422);
        }

        // 3. Guard: Trip must be completed
        if ($booking->trip->status !== 'completed') {
            return response()->json([
                'message' => 'You can only leave a review after the trip is completed.'
            ], 422);
        }

        // 4. Guard: Check if review already exists for this booking
        if (Review::where('booking_id', $booking->id)->exists()) {
            return response()->json([
                'message' => 'You have already reviewed this trip.'
            ], 422);
        }

        // 5. Create the review
        $review = Review::create([
            'booking_id'  => $booking->id,
            'reviewer_id' => $request->user()->id,
            'driver_id'   => $booking->trip->driver_id,
            'trip_id'     => $booking->trip_id,
            'rating'      => $validated['rating'],
            'comment'     => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Thank you! Your review has been submitted.',
            'review'  => $review->load(['reviewer', 'driver']),
        ], 201);
    }

    /**
     * Get public reviews and average rating for a specific driver.
     */
    public function driverReviews($driverId)
    {
        $driver = User::findOrFail($driverId);

        $reviews = Review::with(['reviewer:id,name', 'trip:id,departure_city,destination_city,departure_time'])
            ->where('driver_id', $driverId)
            ->latest()
            ->get();

        $averageRating = $reviews->avg('rating');
        $totalReviews = $reviews->count();

        return response()->json([
            'driver_id'      => (int)$driverId,
            'driver_name'    => $driver->name,
            'average_rating' => $totalReviews > 0 ? round($averageRating, 1) : null,
            'total_reviews'  => $totalReviews,
            'reviews'        => $reviews,
        ]);
    }
}