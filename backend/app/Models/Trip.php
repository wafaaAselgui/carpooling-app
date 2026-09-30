<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Trip extends Model
{
    protected $fillable=[
        'driver_id',
        'vehicle_id',
        'departure_city',
        'departure_address',
        'destination_city',
        'destination_address',
        'departure_time',
        'total_seats',
        'available_seats',
        'price_per_seat',
        'description',
        'status',
    ];

    public function driver(): BelongsTo{
        return $this->belongsTo(User::class , 'driver_id');
    }

    public function vehicle(): BelongsTo{
        return $this->belongsTo(Vehicle::class);
    }
}
