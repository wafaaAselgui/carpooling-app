<?php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\Trip;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a known test driver
        $driver = User::factory()->create([
            'name' => 'Amine Bennani',
            'email' => 'driver@carpool.ma',
            'password' => bcrypt('password123'),
            'verification_status' => 'verified',
            'phone' => '+212 661-234567',
            'cin_number' => 'BE892341',
        ]);

        $vehicle = Vehicle::factory()->create([
            'user_id' => $driver->id,
            'brand' => 'Dacia',
            'model' => 'Duster',
            'color' => 'Silver',
            'license_plate' => '24152-A-6',
            'status' => 'verified',
        ]);

        // 2. Create sample upcoming trips for this driver
        Trip::factory()->count(4)->create([
            'driver_id' => $driver->id,
            'vehicle_id' => $vehicle->id,
            'status' => 'scheduled',
        ]);

        // 3. Create mock passengers and sample bookings
        $passengers = User::factory()->count(8)->create([
            'verification_status' => 'verified',
        ]);

        // 4. Generate random trips with active passenger requests
        Trip::all()->each(function ($trip) use ($passengers) {
            $passengers->random(2)->each(function ($passenger) use ($trip) {
                Booking::create([
                    'trip_id' => $trip->id,
                    'user_id' => $passenger->id,
                    'seats' => rand(1, 2),
                    'status' => fake()->randomElement(['confirmed', 'pending']),
                ]);
            });
        });
    }
}