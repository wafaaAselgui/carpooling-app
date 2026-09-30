<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Vehicle extends Model
{
    protected $fillable=[
        'user_id',
        'brand',
        'model',
        'color',
        'licence_plate',
        'seats',
        'photo',
    ];

    public function user(): BelongsTo{
        return $this->belongsTo(User::class);
    }
}
