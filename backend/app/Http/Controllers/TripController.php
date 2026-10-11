<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $query = Trip::with(['driver:id,name', 'vehicle'])
            ->where('status', 'scheduled')
            ->where('available_seats', '>', 0);

        // Filtre Ville de départ
        if ($request->filled('departure_city')) {
            $query->where('departure_city', 'like', '%' . $request->departure_city . '%');
        }

        // Filtre Ville de destination
        if ($request->filled('destination_city')) {
            $query->where('destination_city', 'like', '%' . $request->destination_city . '%');
        }

        // Filtre Date de départ (même jour ou ultérieur)
        if ($request->filled('date')) {
            $query->whereDate('departure_time', $request->date);
        }

        // Filtre Nombre de places minimum demandées
        if ($request->filled('seats')) {
            $query->where('available_seats', '>=', (int) $request->seats);
        }

        // Filtre Prix maximum
        if ($request->filled('max_price')) {
            $query->where('price_per_seat', '<=', (float) $request->max_price);
        }

        // Options de tri
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