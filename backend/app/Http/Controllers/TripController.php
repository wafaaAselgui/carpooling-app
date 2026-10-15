<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $query = Trip::with([
            'driver:id,name,avatar_path,verification_status',
            'vehicle:id,brand,model,color,license_plate,photo,status'
        ])
        ->where('status', 'scheduled')
        ->where('available_seats', '>', 0);

        // Departure city filter
        if ($request->filled('departure_city')) {
            $query->where('departure_city', 'like', '%' . $request->departure_city . '%');
        }

        // Destination city filter
        if ($request->filled('destination_city')) {
            $query->where('destination_city', 'like', '%' . $request->destination_city . '%');
        }

        // Departure date filter
        if ($request->filled('date')) {
            $query->whereDate('departure_time', $request->date);
        }

        // Minimum seats filter
        if ($request->filled('seats')) {
            $query->where('available_seats', '>=', (int) $request->seats);
        }

        // Maximum price filter
        if ($request->filled('max_price')) {
            $query->where('price_per_seat', '<=', (float) $request->max_price);
        }

        // Sorting options
        $sortBy = $request->get('sort_by', 'departure_time');
        $sortDirection = $request->get('sort_dir', 'asc');

        if (in_array($sortBy, ['departure_time', 'price_per_seat', 'available_seats'])) {
            $query->orderBy($sortBy, $sortDirection === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('departure_time', 'asc');
        }

        return response()->json($query->paginate(15));
    }

    public function show($id)
    {
        $trip = Trip::with([
            'vehicle',
            'driver' => function ($query) {
                $query->select('id', 'name', 'phone', 'bio', 'avatar_path', 'verification_status')
                    ->withAvg('reviewsReceived as average_rating', 'rating')
                    ->withCount('reviewsReceived as reviews_count');
            },
        ])->findOrFail($id);

        return response()->json($trip);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'departure_city'      => 'required|string|max:100',
            'destination_city'    => 'required|string|max:100',
            'departure_address'   => 'nullable|string|max:255',
            'destination_address' => 'nullable|string|max:255',
            'departure_time'      => 'required|date|after:now',
            'available_seats'     => 'required|integer|min:1|max:8',
            'price_per_seat'      => 'required|numeric|min:10',
            'vehicle_id'          => 'required|exists:vehicles,id',
        ]);

        // Ensure the vehicle belongs to the driver
        $vehicle = $request->user()->vehicles()->findOrFail($validated['vehicle_id']);

        // Block unverified vehicles
        if ($vehicle->status !== 'verified') {
            return response()->json([
                'message' => 'You cannot publish a ride with this vehicle. Its registration and insurance documents must be verified by an administrator first.'
            ], 403);
        }

        $trip = $request->user()->trips()->create([
            'vehicle_id'          => $vehicle->id,
            'departure_city'      => $validated['departure_city'],
            'destination_city'    => $validated['destination_city'],
            'departure_address'   => $validated['departure_address'] ?? $validated['departure_city'],
            'destination_address' => $validated['destination_address'] ?? $validated['destination_city'],
            'departure_time'      => $validated['departure_time'],
            'total_seats'         => $validated['available_seats'],
            'available_seats'     => $validated['available_seats'],
            'price_per_seat'      => $validated['price_per_seat'],
            'status'              => 'scheduled',
        ]);

        return response()->json([
            'message' => 'Trip published successfully.',
            'trip'    => $trip->load(['vehicle', 'driver']),
        ], 201);
    }

    /**
     * Get all trips published by the authenticated driver,
     * including passenger bookings.
     */
    public function driverTrips(Request $request)
    {
        $trips = Trip::with([
            'vehicle',
            'bookings.user'
        ])
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