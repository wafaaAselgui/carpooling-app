<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;

class TripController extends Controller
{
    public function index(Request $request)
    {
        $trips = Trip::with(['driver', 'vehicle'])
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
            // Optional: hide fully-booked trips from public discovery
            ->where('available_seats', '>', 0)
            ->orderBy('departure_time', 'asc')
            ->get();

        return response()->json($trips);
    }

    public function show($id)
    {
        $trip = Trip::with(['driver', 'vehicle'])->findOrFail($id);

        return response()->json($trip);
    }
}