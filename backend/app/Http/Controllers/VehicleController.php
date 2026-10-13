<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->vehicles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand'         => 'required|string|max:50',
            'model'         => 'required|string|max:50',
            'color'         => 'required|string|max:30',
            'license_plate' => 'required|string|max:20|unique:vehicles,license_plate',
            'seats'         => 'required|integer|min:1|max:8',
            'photo'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('vehicles', 'public');
        }

        $vehicle = $request->user()->vehicles()->create($validated);

        return response()->json($vehicle, 201);
    }

    /**
     * Upload car registration and insurance documents
     */
    public function uploadDocuments(Request $request, $id)
    {
        $vehicle = $request->user()->vehicles()->findOrFail($id);

        $request->validate([
            'registration_doc'     => 'required|file|mimes:jpeg,png,pdf|max:4096',
            'insurance_doc'        => 'required|file|mimes:jpeg,png,pdf|max:4096',
            'insurance_expires_at' => 'required|date|after:today',
        ]);

        // Clean up previous files if any
        if ($vehicle->registration_doc_path && Storage::disk('public')->exists($vehicle->registration_doc_path)) {
            Storage::disk('public')->delete($vehicle->registration_doc_path);
        }
        if ($vehicle->insurance_doc_path && Storage::disk('public')->exists($vehicle->insurance_doc_path)) {
            Storage::disk('public')->delete($vehicle->insurance_doc_path);
        }

        $regPath = $request->file('registration_doc')->store('vehicle_docs', 'public');
        $insPath = $request->file('insurance_doc')->store('vehicle_docs', 'public');

        $vehicle->update([
            'registration_doc_path' => $regPath,
            'insurance_doc_path'    => $insPath,
            'insurance_expires_at'  => $request->insurance_expires_at,
            'status'                => 'pending',
        ]);

        return response()->json([
            'message' => 'Vehicle documents submitted successfully. Verification pending.',
            'vehicle' => $vehicle,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $vehicle = $request->user()->vehicles()->findOrFail($id);

        if ($vehicle->photo && Storage::disk('public')->exists($vehicle->photo)) {
            Storage::disk('public')->delete($vehicle->photo);
        }
        if ($vehicle->registration_doc_path && Storage::disk('public')->exists($vehicle->registration_doc_path)) {
            Storage::disk('public')->delete($vehicle->registration_doc_path);
        }
        if ($vehicle->insurance_doc_path && Storage::disk('public')->exists($vehicle->insurance_doc_path)) {
            Storage::disk('public')->delete($vehicle->insurance_doc_path);
        }

        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted successfully.']);
    }
}