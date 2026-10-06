<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class VehicleController extends Controller
{
    /**
     * Get all vehicles belonging to the authenticated driver.
     */
    public function index(Request $request)
    {
        return response()->json($request->user()->vehicles);
    }

    /**
     * Register a new vehicle for the authenticated driver.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand'         => 'required|string|max:50',
            'model'         => 'required|string|max:50',
            'color'         => 'nullable|string|max:30',
            'license_plate' => 'required|string|max:20|unique:vehicles,license_plate',
            'seats'         => 'required|integer|min:1|max:8',
        ]);

        $vehicle = $request->user()->vehicles()->create($validated);

        return response()->json([
            'message' => 'Vehicle registered successfully.',
            'vehicle' => $vehicle,
        ], 201);
    }
}