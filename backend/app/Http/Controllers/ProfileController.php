<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Récupérer le profil de l'utilisateur connecté avec ses véhicules
     */
    public function show(Request $request)
    {
        return response()->json($request->user()->load('vehicles'));
    }

    /**
     * Mettre à jour les informations de base (nom, téléphone, bio)
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'  => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'bio'   => 'nullable|string|max:500',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user'    => $user,
        ]);
    }

    /**
     * Téléverser l'avatar de profil
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = $request->user();

        // Supprimer l'ancien avatar s'il existe
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar_path = $path;
        $user->save();

        return response()->json([
            'message'    => 'Photo de profil mise à jour.',
            'avatar_url' => $user->avatar_url,
        ]);
    }

    /**
     * Soumettre la pièce d'identité (CIN) pour vérification
     */
    public function submitVerification(Request $request)
    {
        $user = $request->user();

        if ($user->verification_status === 'verified') {
            return response()->json([
                'message' => 'Votre identité est déjà vérifiée.'
            ], 422);
        }

        $validated = $request->validate([
            'cin_number'   => 'required|string|max:20',
            'cin_document' => 'required|file|mimes:jpeg,png,pdf|max:4096',
        ]);

        // Supprimer l'ancien document s'il existe
        if ($user->cin_document_path && Storage::disk('public')->exists($user->cin_document_path)) {
            Storage::disk('public')->delete($user->cin_document_path);
        }

        $path = $request->file('cin_document')->store('verifications', 'public');

        $user->cin_number = $validated['cin_number'];
        $user->cin_document_path = $path;
        $user->verification_status = 'pending';
        $user->save();

        return response()->json([
            'message'             => 'Document soumis avec succès. Vérification en cours.',
            'verification_status' => $user->verification_status,
        ]);
    }
}