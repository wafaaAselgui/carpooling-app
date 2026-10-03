<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TripController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::get('/trips' , [TripController::class , 'index'])
    ->middleware('auth:sanctum');
Route::get('/trips/{id}',[TripController::class, 'show'])
    ->middleware('auth:sanctum');



Route::post('/register' , [AuthController::class , 'register']);
Route::post('/login',[AuthController::class , 'login']);
Route::post('/logout' , [AuthController::class , 'logout'])
    ->middleware('auth:sanctum');


Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware('auth:sanctum');





