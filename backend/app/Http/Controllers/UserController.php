<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get public profile and received reviews for any user.
     */
    public function show($id)
    {
        $user = User::select('id', 'name', 'bio', 'avatar_path', 'verification_status', 'created_at')
            ->with([
                'vehicles' => function ($query) {
                    $query->where('status', 'verified')->select('id', 'user_id', 'brand', 'model', 'color');
                },
                'reviewsReceived.reviewer:id,name,avatar_path',
                'reviewsReceived.trip:id,departure_city,destination_city,departure_time'
            ])
            ->findOrFail($id);

        $reviews = $user->reviewsReceived;
        $totalReviews = $reviews->count();
        $averageRating = $totalReviews > 0 ? round($reviews->avg('rating'), 1) : null;

        return response()->json([
            'id'                  => $user->id,
            'name'                => $user->name,
            'bio'                 => $user->bio,
            'avatar_url'          => $user->avatar_url,
            'verification_status' => $user->verification_status,
            'member_since'        => $user->created_at->format('M Y'),
            'vehicles'            => $user->vehicles,
            'total_reviews'       => $totalReviews,
            'average_rating'      => $averageRating,
            'reviews'             => $reviews,
        ]);
    }
}