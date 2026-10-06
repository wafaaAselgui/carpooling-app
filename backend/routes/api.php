<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TripController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VehicleController;




Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::get('/trips', [TripController::class, 'index']);
Route::get('/trips/{id}', [TripController::class, 'show']);
Route::middleware('auth:sanctum')->group(function () {
    // Trips
    Route::post('/trips', [TripController::class, 'store']);

    // Vehicles
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);

    // Driver trip management
    Route::get('/driver/trips', [TripController::class, 'driverTrips']);
    Route::patch('/driver/trips/{id}/status', [TripController::class, 'updateStatus']);
});



Route::post('/register' , [AuthController::class , 'register']);
Route::post('/login',[AuthController::class , 'login']);
Route::post('/logout' , [AuthController::class , 'logout'])
    ->middleware('auth:sanctum');


Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware('auth:sanctum');
Route::get('/bookings', [BookingController::class, 'index'])
    ->middleware('auth:sanctum');
Route::delete('/bookings/{id}', [BookingController::class, 'destroy'])
    ->middleware('auth:sanctum');



