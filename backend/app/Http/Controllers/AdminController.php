<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Report;
use App\Models\Review;
use App\Models\Trip;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\DriverVerificationNotification;
use App\Notifications\VehicleVerificationNotification;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Platform-wide analytics and key performance metrics
     */
    public function stats()
    {
        $totalUsers = User::count();
        $totalTrips = Trip::count();
        $completedTrips = Trip::where('status', 'completed')->count();
        $totalBookings = Booking::count();
        $totalReviews = Review::count();
        $avgRating = Review::avg('rating');

        // Gross volume generated from confirmed bookings (seats * price_per_seat)
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
            'pending_users'           => User::where('verification_status', 'pending')->count(),
            'pending_vehicles'        => Vehicle::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Queues for pending user IDs (CIN) and vehicle documentation
     */
    public function pendingVerifications()
    {
        $users = User::where('verification_status', 'pending')
            ->select('id', 'name', 'email', 'phone', 'cin_number', 'cin_document_path', 'verification_status', 'created_at')
            ->get();

        $vehicles = Vehicle::with('user:id,name,email')
            ->where('status', 'pending')
            ->get();

        return response()->json([
            'users'    => $users,
            'vehicles' => $vehicles,
        ]);
    }

    /**
     * Moderate user identity verification (CIN)
     */
    public function reviewVerification(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:verified,rejected',
        ]);

        $user = User::findOrFail($id);
        $user->verification_status = $validated['status'];
        $user->save();

        // Notify user about ID verification decision
        $user->notify(new DriverVerificationNotification($validated['status']));

        return response()->json([
            'message' => "User identity status updated to {$validated['status']}.",
            'user'    => $user,
        ]);
    }

    /**
     * Moderate vehicle registration & insurance documentation
     */
    public function reviewVehicle(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:verified,rejected',
        ]);

        $vehicle = Vehicle::with('user')->findOrFail($id);
        $vehicle->status = $validated['status'];
        $vehicle->save();

        // Notify vehicle owner about vehicle approval/rejection
        if ($vehicle->user) {
            $vehicle->user->notify(new VehicleVerificationNotification($vehicle, $validated['status']));
        }

        return response()->json([
            'message' => "Vehicle status updated to {$validated['status']}.",
            'vehicle' => $vehicle,
        ]);
    }

    /**
     * Paginated user list with associated vehicle & review counts
     */
    public function users()
    {
        $users = User::withCount(['vehicles', 'reviewsReceived'])
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Paginated trip list for ride moderation
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
     * Force-cancel a trip and invalidate related active reservations
     */
    public function cancelTrip($id)
    {
        $trip = Trip::findOrFail($id);

        if ($trip->status === 'cancelled') {
            return response()->json([
                'message' => 'This trip is already cancelled.'
            ], 422);
        }

        $trip->status = 'cancelled';
        $trip->save();

        $trip->bookings()->where('status', '!=', 'cancelled')->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => "Trip #{$trip->id} was cancelled by the administrator.",
            'trip'    => $trip,
        ]);
    }

    /**
     * Ban or unban a user account and immediately invalidate auth tokens
     */
    public function toggleBanUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot suspend your own account.'
            ], 422);
        }

        $user->is_banned = !$user->is_banned;

        if ($user->is_banned) {
            $user->tokens()->delete();
        } else {
            $user->banned_until = null;
            $user->moderation_reason = null;
        }

        $user->save();

        $statusMessage = $user->is_banned ? 'suspended' : 'reactivated';

        return response()->json([
            'message' => "User {$user->name} has been {$statusMessage}.",
            'user'    => $user,
        ]);
    }

    /**
     * Retrieve complete report history for a specific user (both received and filed)
     */
    public function userReportHistory($id)
    {
        $user = User::findOrFail($id);

        // Reports submitted against this user (matches string 'user' or class name)
        $receivedReports = Report::with('reporter:id,name,email')
            ->where('reportable_id', $id)
            ->where(function ($q) {
                $q->where('reportable_type', 'user')
                  ->orWhere('reportable_type', User::class);
            })
            ->latest()
            ->get();

        // Reports submitted by this user
        $submittedReports = Report::where('reporter_id', $id)
            ->latest()
            ->get();

        return response()->json([
            'user'              => $user,
            'received_reports'  => $receivedReports,
            'submitted_reports' => $submittedReports,
        ]);
    }

    /**
     * Apply timed or permanent suspension with mandatory reason
     */
    public function suspendUser(Request $request, $id)
    {
        $request->validate([
            'duration' => 'required|in:24h,3d,7d,permanent',
            'reason'   => 'required|string|max:500',
        ]);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot suspend your own account.'
            ], 422);
        }

        $bannedUntil = match ($request->duration) {
            '24h'       => now()->addHours(24),
            '3d'        => now()->addDays(3),
            '7d'        => now()->addDays(7),
            'permanent' => null,
        };

        $user->is_banned = true;
        $user->banned_until = $bannedUntil;
        $user->moderation_reason = $request->reason;
        $user->save();

        // Invalidate active sessions immediately
        $user->tokens()->delete();

        return response()->json([
            'message' => "User {$user->name} has been suspended ({$request->duration}).",
            'user'    => $user,
        ]);
    }

    /**
     * Toggle administrative account freeze
     */
    public function toggleFreezeUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot freeze your own account.'
            ], 422);
        }

        $user->is_frozen = !$user->is_frozen;
        $user->save();

        $action = $user->is_frozen ? 'frozen' : 'unfrozen';

        return response()->json([
            'message' => "User {$user->name} account has been {$action}.",
            'user'    => $user,
        ]);
    }
}