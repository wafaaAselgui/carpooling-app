<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop the foreign key using its exact MySQL constraint name
        DB::statement('ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_booking_id_foreign`;');

        // 2. Drop the restrictive single-review unique index
        DB::statement('ALTER TABLE `reviews` DROP INDEX `reviews_booking_id_unique`;');

        // 3. Add the two-way composite unique key (1 review per person per booking)
        DB::statement('ALTER TABLE `reviews` ADD UNIQUE KEY `reviews_booking_reviewer_unique` (`booking_id`, `reviewer_id`);');

        // 4. Re-attach the foreign key with cascade delete
        DB::statement('ALTER TABLE `reviews` ADD CONSTRAINT `reviews_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_booking_id_foreign`;');
        DB::statement('ALTER TABLE `reviews` DROP INDEX `reviews_booking_reviewer_unique`;');
        DB::statement('ALTER TABLE `reviews` ADD UNIQUE KEY `reviews_booking_id_unique` (`booking_id`);');
        DB::statement('ALTER TABLE `reviews` ADD CONSTRAINT `reviews_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE;');
    }
};