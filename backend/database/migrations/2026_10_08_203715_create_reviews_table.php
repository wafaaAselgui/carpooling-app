<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            // Link to the specific booking that verified the ride
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            
            // The passenger leaving the review
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            
            // The driver receiving the review
            $table->foreignId('driver_id')->constrained('users')->cascadeOnDelete();
            
            // Associated trip
            $table->foreignId('trip_id')->constrained('trips')->cascadeOnDelete();

            // Rating: 1 to 5 stars
            $table->unsignedTinyInteger('rating');
            
            // Written review
            $table->text('comment')->nullable();

            $table->timestamps();

            // Strict rule: only ONE review per booking
            $table->unique('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};