<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VehicleController extends Controller
{
    /**
     * Liste des véhicules de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        return response()->json($request->user()->vehicles);
    }

    /**
     * Enregistrer un nouveau véhicule avec photo
     */
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
     * Supprimer un véhicule
     */
    public function destroy(Request $request, $id)
    {
        $vehicle = $request->user()->vehicles()->findOrFail($id);

        if ($vehicle->photo && Storage::disk('public')->exists($vehicle->photo)) {
            Storage::disk('public')->delete($vehicle->photo);
        }

        $vehicle->delete();

        return response()->json(['message' => 'Véhicule supprimé.']);
    }
}