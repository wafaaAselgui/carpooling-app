<?php

namespace App\Http\Controllers;
use App\Models\Trip;


class TripController extends Controller
{
    public function index(){
        $trips = Trip::with(['driver' , 'vehicle'])->get();

        return response()->json($trips);
    }

    public function show($id){
        $trip=Trip::with(['driver' , 'vehicle'])->findOrFail($id);

        return response()->json($trip);
    }
}
