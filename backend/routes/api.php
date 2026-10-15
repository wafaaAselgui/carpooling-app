<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\VehicleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Trips discovery
Route::get('/trips', [TripController::class, 'index']);
Route::get('/trips/{id}', [TripController::class, 'show']);

// Driver reviews
Route::get('/drivers/{id}/reviews', [ReviewController::class, 'driverReviews']);

/*
|--------------------------------------------------------------------------
| Authenticated User Routes (Guarded against banned users)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'check.banned'])->group(function () {
    // Current user base info & logout
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile & Identity Verification (CIN)
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/profile/verify', [ProfileController::class, 'submitVerification']);

    // Vehicles
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::delete('/vehicles/{id}', [VehicleController::class, 'destroy']);
    Route::post('/vehicles/{id}/documents', [VehicleController::class, 'uploadDocuments']);

    // Trips
    Route::post('/trips', [TripController::class, 'store']);

    // Driver trip management
    Route::get('/driver/trips', [TripController::class, 'driverTrips']);
    Route::patch('/driver/trips/{id}/status', [TripController::class, 'updateStatus']);

   // Bookings
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);
    Route::patch('/bookings/{id}/respond', [BookingController::class, 'respond']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/trips', [AdminController::class, 'trips']);
    Route::patch('/trips/{id}/cancel', [AdminController::class, 'cancelTrip']);
    Route::patch('/users/{id}/toggle-ban', [AdminController::class, 'toggleBanUser']);

    // Moderation & Verifications
    Route::get('/verifications/pending', [AdminController::class, 'pendingVerifications']);
    Route::patch('/users/{id}/verify', [AdminController::class, 'reviewVerification']);
    Route::patch('/vehicles/{id}/verify', [AdminController::class, 'reviewVehicle']);
});