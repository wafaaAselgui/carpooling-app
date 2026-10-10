<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BookingController;
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
    // Current user profile & logout
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Trips
    Route::post('/trips', [TripController::class, 'store']);

    // Vehicles
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);

    // Driver trip management
    Route::get('/driver/trips', [TripController::class, 'driverTrips']);
    Route::patch('/driver/trips/{id}/status', [TripController::class, 'updateStatus']);

    // Bookings
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::delete('/bookings/{id}', [BookingController::class, 'destroy']);

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
});