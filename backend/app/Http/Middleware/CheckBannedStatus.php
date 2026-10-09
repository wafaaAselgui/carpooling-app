<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBannedStatus
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->is_banned) {
            // Révocation de tous les tokens actuels
            $request->user()->tokens()->delete();

            return response()->json([
                'message' => 'Votre compte a été suspendu. Session terminée.'
            ], 403);
        }

        return $next($request);
    }
}