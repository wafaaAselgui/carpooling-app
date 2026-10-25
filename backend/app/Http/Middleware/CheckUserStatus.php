<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // 1. Check Suspension (Ban)
        if ($user->is_banned) {
            // Check if ban was temporary and has now expired
            if ($user->banned_until && now()->greaterThan($user->banned_until)) {
                // Ban expired: auto-reactivate account
                $user->is_banned = false;
                $user->banned_until = null;
                $user->moderation_reason = null;
                $user->save();
            } else {
                // Account is actively banned: revoke current token and block
                $user->tokens()->delete();

                $banInfo = $user->banned_until
                    ? "suspended until " . $user->banned_until->toDayDateTimeString()
                    : "permanently suspended";

                return response()->json([
                    'status'     => 'banned',
                    'message'    => "Your account has been {$banInfo}.",
                    'reason'     => $user->moderation_reason ?? 'Violation of community terms.',
                    'expires_at' => $user->banned_until,
                ], 403);
            }
        }

        // 2. Check Frozen Account (Block state-altering actions: publishing trips & booking)
        if ($user->is_frozen) {
            $blockedRoutes = [
                'trips.store',      // POST /api/trips (publish trip)
                'bookings.store',   // POST /api/bookings (book seat)
                'reviews.store',    // POST /api/reviews
            ];

            // If the route name matches or the request attempts to write (POST/PUT/PATCH/DELETE)
            if (in_array($request->route()?->getName(), $blockedRoutes) || 
                ($request->is('api/trips*') && $request->isMethod('post')) || 
                ($request->is('api/bookings*') && $request->isMethod('post'))) {
                
                return response()->json([
                    'status'  => 'frozen',
                    'message' => 'Your account is currently frozen under administrative review. You cannot publish rides or reserve seats.',
                ], 403);
            }
        }

        return $next($request);
    }
}