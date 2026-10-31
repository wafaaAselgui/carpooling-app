<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'brand',
        'model',
        'color',
        'license_plate',
        'seats',
        'photo',
        'registration_doc_path',
        'insurance_doc_path',
        'insurance_expires_at',
        'status',
    ];

    /**
     * Attributs virtuels ajoutés automatiquement lors de la sérialisation JSON
     */
    protected $appends = [
        'photo_url',
        'registration_doc_url',
        'insurance_doc_url',
    ];

    /**
     * Accesseur pour récupérer l'URL publique de la photo
     */
    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo 
            ? asset('storage/' . $this->photo) 
            : null;
    }

    public function getRegistrationDocUrlAttribute(): ?string
    {
        return $this->registration_doc_path 
            ? asset('storage/' . $this->registration_doc_path) 
            : null;
    }

    public function getInsuranceDocUrlAttribute(): ?string
    {
        return $this->insurance_doc_path 
            ? asset('storage/' . $this->insurance_doc_path) 
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