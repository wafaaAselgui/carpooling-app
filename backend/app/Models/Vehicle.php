<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'user_id',
        'brand',
        'model',
        'color',
        'license_plate',
        'seats',
        'photo',
    ];

    /**
     * Attributs virtuels ajoutés automatiquement lors de la sérialisation JSON
     */
    protected $appends = ['photo_url'];

    /**
     * Accesseur pour récupérer l'URL publique de la photo
     */
    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo 
            ? asset('storage/' . $this->photo) 
            : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }
}