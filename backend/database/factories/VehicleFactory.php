<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        $brands = [
            'Dacia' => ['Logan', 'Duster', 'Sandero'],
            'Renault' => ['Clio 4', 'Megane', 'Captur'],
            'Peugeot' => ['208', '301', '2008'],
            'Volkswagen' => ['Golf 7', 'Polo'],
            'Toyota' => ['Yaris', 'Corolla'],
        ];

        $brand = fake()->randomElement(array_keys($brands));
        $model = fake()->randomElement($brands[$brand]);

        return [
            'user_id' => User::factory(),
            'brand' => $brand,
            'model' => $model,
            'color' => fake()->safeColorName(),
            'license_plate' => fake()->numberBetween(10000, 99999) . '-' . fake()->randomElement(['A', 'B', 'D']) . '-' . fake()->numberBetween(1, 80),
            'seats' => 4,
            'status' => 'verified',
            'insurance_expires_at' => fake()->dateTimeBetween('+3 months', '+1 year'),
        ];
    }
}