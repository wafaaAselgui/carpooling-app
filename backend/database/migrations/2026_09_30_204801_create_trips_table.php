<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->id();

            $table->foreignId('driver_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('vehicle_id')->constrained('vehicles')->cascadeOnUpdate()->cascadeOnDelete();

            $table->string('departure_city');
            $table->string('departure_address');

            $table->string('destination_city');
            $table->string('destination_address');

            $table->dateTime('departure_time');

            $table->unsignedTinyInteger('total_seats');
            $table->unsignedTinyInteger('available_seats');

            $table->decimal('price_per_seat' , 8 , 2);

            $table->enum('status',[
                'scheduled',
                'in_progress',
                'completed',
                'cancelled'
            ])->default('scheduled');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
