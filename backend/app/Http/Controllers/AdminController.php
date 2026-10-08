<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Statistiques globales de la plateforme
     */
    public function stats()
    {
        $totalUsers = User::count();
        $totalTrips = Trip::count();
        $completedTrips = Trip::where('status', 'completed')->count();
        $totalBookings = Booking::count();
        $totalReviews = Review::count();
        $avgRating = Review::avg('rating');

        // Volume financier brut estimé (réservations confirmées)
        $grossVolume = Booking::where('bookings.status', 'confirmed')
            ->join('trips', 'bookings.trip_id', '=', 'trips.id')
            ->selectRaw('SUM(bookings.seats * trips.price_per_seat) as total')
            ->value('total') ?? 0;

        return response()->json([
            'total_users'             => $totalUsers,
            'total_trips'             => $totalTrips,
            'completed_trips'         => $completedTrips,
            'total_bookings'          => $totalBookings,
            'total_reviews'           => $totalReviews,
            'average_platform_rating' => round($avgRating ?? 0, 1),
            'gross_volume_mad'        => round($grossVolume, 2),
        ]);
    }

    /**
     * Liste des utilisateurs avec métriques
     */
    public function users()
    {
        $users = User::withCount(['vehicles', 'reviewsReceived'])
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Liste de tous les trajets pour modération
     */
    public function trips()
    {
        $trips = Trip::with(['driver:id,name,email', 'vehicle'])
            ->withCount('bookings')
            ->latest()
            ->paginate(20);

        return response()->json($trips);
    }

    /**
     * Forcer l'annulation d'un trajet par l'admin
     */
    public function cancelTrip($id)
    {
        $trip = Trip::findOrFail($id);

        if ($trip->status === 'cancelled') {
            return response()->json([
                'message' => 'Ce trajet est déjà annulé.'
            ], 422);
        }

        $trip->status = 'cancelled';
        $trip->save();

        // Annulation des réservations actives liées
        $trip->bookings()->where('status', '!=', 'cancelled')->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => "Trajet #{$trip->id} annulé par l'administrateur.",
            'trip'    => $trip,
        ]);
    }
}