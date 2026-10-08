<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $trips = Trip::with([
            'vehicle',
            'driver' => function ($query) {
                $query->withAvg('reviewsReceived as average_rating', 'rating')
                    ->withCount('reviewsReceived as reviews_count');
            },
        ])
            // Filter by departure city if provided
            ->when($request->filled('departure_city'), function ($query) use ($request) {
                $query->where('departure_city', 'like', '%' . $request->departure_city . '%');
            })
            // Filter by destination city if provided
            ->when($request->filled('destination_city'), function ($query) use ($request) {
                $query->where('destination_city', 'like', '%' . $request->destination_city . '%');
            })
            // Filter by departure date if provided (expects format YYYY-MM-DD)
            ->when($request->filled('date'), function ($query) use ($request) {
                $query->whereDate('departure_time', $request->date);
            })
            // Hide fully-booked trips and only show open scheduled rides
            ->where('available_seats', '>', 0)
            ->where('status', 'scheduled')
            ->orderBy('departure_time', 'asc')
            ->get();

        return response()->json($trips);
    }

    public function show($id)
    {
        $trip = Trip::with([
            'vehicle',
            'driver' => function ($query) {
                $query->withAvg('reviewsReceived as average_rating', 'rating')
                    ->withCount('reviewsReceived as reviews_count');
            },
        ])->findOrFail($id);

        return response()->json($trip);
    }
    // app/Http/Controllers/TripController.php

    public function store(Request $request)
    {
        $validated = $request->validate([
            'departure_city'      => 'required|string|max:100',
            'departure_address'   => 'required|string|max:255',
            'destination_city'    => 'required|string|max:100',
            'destination_address' => 'required|string|max:255',
            'departure_time'      => 'required|date|after:now',
            'total_seats'         => 'required|integer|min:1|max:8',
            'price_per_seat'      => 'required|numeric|min:0',
            'vehicle_id'          => [
                'required',
                Rule::exists('vehicles', 'id')->where(function ($query) use ($request) {
                    return $query->where('user_id', $request->user()->id);
                }),
            ],
        ]);

        $trip = Trip::create([
            ...$validated,
            'driver_id'       => $request->user()->id,
            'available_seats' => $validated['total_seats'],
            'status'          => 'scheduled', // Matches the migration enum
        ]);

        $trip->load(['driver', 'vehicle']);

        return response()->json([
            'message' => 'Trip created successfully.',
            'trip'    => $trip,
        ], 201);
    }

    /**
     * Get all trips published by the authenticated driver,
     * including passenger bookings.
     */
    public function driverTrips(Request $request)
    {
        $trips = Trip::with(['vehicle', 'bookings.user'])
            ->where('driver_id', $request->user()->id)
            ->orderBy('departure_time', 'desc')
            ->get();

        return response()->json($trips);
    }

    /**
     * Update the status of a driver's trip (e.g., mark completed or cancelled).
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => ['required', Rule::in(['scheduled', 'in_progress', 'completed', 'cancelled'])],
        ]);

        // Ensure the trip exists and belongs to the authenticated driver
        $trip = Trip::where('driver_id', $request->user()->id)->findOrFail($id);

        // Business rule: Cannot change status of an already completed or cancelled trip
        if (in_array($trip->status, ['completed', 'cancelled'])) {
            return response()->json([
                'message' => "Cannot modify a trip that is already {$trip->status}."
            ], 422);
        }

        $newStatus = $request->status;
        $trip->status = $newStatus;
        $trip->save();

        // If driver cancels the trip, cancel all active passenger bookings
        if ($newStatus === 'cancelled') {
            $trip->bookings()->where('status', '!=', 'cancelled')->update([
                'status' => 'cancelled'
            ]);
        }

        return response()->json([
            'message' => "Trip status updated to {$newStatus}.",
            'trip'    => $trip->load(['vehicle', 'bookings.user']),
        ]);
    }
}