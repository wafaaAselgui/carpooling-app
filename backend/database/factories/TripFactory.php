<?php

namespace Database\Factories;

use App\Models\Trip;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        $moroccanCities = [
            'Casablanca', 'Rabat', 'Marrakech', 'Tangier', 
            'Fes', 'Agadir', 'Meknes', 'Oujda', 'Kenitra', 'Tetouan'
        ];

        $depCity = fake()->randomElement($moroccanCities);
        do {
            $destCity = fake()->randomElement($moroccanCities);
        } while ($destCity === $depCity);

        return [
            'driver_id' => User::factory(),
            'vehicle_id' => Vehicle::factory(),
            'departure_city' => $depCity,
            'departure_address' => fake()->streetAddress() . ', ' . $depCity,
            'destination_city' => $destCity,
            'destination_address' => fake()->streetAddress() . ', ' . $destCity,
            'departure_time' => fake()->dateTimeBetween('+1 days', '+3 weeks'),
            'total_seats' => 4,
            'available_seats' => fake()->numberBetween(1, 4),
            'price_per_seat' => fake()->randomElement([30, 40, 50, 70, 80, 100, 120]),
            'status' => 'scheduled',
            'description' => fake()->sentence(10),
        ];
    }
}