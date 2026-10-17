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

        $booking = Booking::with('trip')->findOrFail($validated['booking_id']);
        $user = $request->user();

        $isPassenger = $booking->user_id === $user->id;
        $isDriver = $booking->trip->driver_id === $user->id;

        if (!$isPassenger && !$isDriver) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($booking->status !== 'confirmed') {
            return response()->json(['message' => 'You can only review confirmed bookings.'], 422);
        }

        if ($booking->trip->status !== 'completed') {
            return response()->json(['message' => 'Trips must be completed before rating.'], 422);
        }

        // Prevent duplicate review from the same person for this booking
        if (Review::where('booking_id', $booking->id)->where('reviewer_id', $user->id)->exists()) {
            return response()->json(['message' => 'You have already submitted a review for this booking.'], 422);
        }

        $revieweeId = $isPassenger ? $booking->trip->driver_id : $booking->user_id;

        $review = Review::create([
            'booking_id'  => $booking->id,
            'reviewer_id' => $user->id,
            'reviewee_id' => $revieweeId,
            'driver_id'   => $booking->trip->driver_id, // keeps legacy compatibility
            'trip_id'     => $booking->trip_id,
            'rating'      => $validated['rating'],
            'comment'     => $validated['comment'] ?? null,
        ]);

        return response()->json([
            'message' => 'Thank you! Your review has been submitted.',
            'review'  => $review->load(['reviewer', 'reviewee']),
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