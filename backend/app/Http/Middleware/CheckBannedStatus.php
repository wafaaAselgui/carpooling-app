<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBannedStatus
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // 1. Suspension / Ban Check
        if ($user->is_banned) {
            // Check if the suspension period has expired
            if ($user->banned_until && now()->greaterThan($user->banned_until)) {
                // Suspension expired: automatically reactivate account
                $user->is_banned = false;
                $user->banned_until = null;
                $user->moderation_reason = null;
                $user->save();
            } else {
                // Revoke active authentication tokens
                $user->tokens()->delete();

                $banExpiry = $user->banned_until
                    ? 'jusqu\'au ' . $user->banned_until->translatedFormat('d F Y à H:i')
                    : 'définitivement';

                return response()->json([
                    'status'     => 'banned',
                    'message'    => "Votre compte est suspendu {$banExpiry}. Session terminée.",
                    'reason'     => $user->moderation_reason ?? 'Non-respect des règles de la communauté.',
                    'expires_at' => $user->banned_until,
                ], 403);
            }
        }

        // 2. Account Freeze Check (Blocks ride creation, booking, and reviews)
        if ($user->is_frozen) {
            $isTripCreation = (
                $request->is('api/trips*') ||
                $request->is('trips*')
            ) && $request->isMethod('post');

            $isBookingCreation = (
                $request->is('api/bookings*') ||
                $request->is('bookings*')
            ) && $request->isMethod('post');

            $isReviewCreation = (
                $request->is('api/reviews*') ||
                $request->is('reviews*')
            ) && $request->isMethod('post');

            if ($isTripCreation || $isBookingCreation || $isReviewCreation) {
                return response()->json([
                    'status'  => 'frozen',
                    'message' => 'Votre compte est temporairement gelé pour vérification administrative. La publication de trajets et les réservations sont désactivées.',
                ], 403);
            }
        }

        return $next($request);
    }
}