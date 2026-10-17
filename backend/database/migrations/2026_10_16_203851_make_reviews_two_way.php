<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->unsignedBigInteger('reviewee_id')->nullable()->after('reviewer_id');
        });

        // Transfer any existing driver_id data to the generic reviewee_id column
        DB::statement('UPDATE reviews SET reviewee_id = driver_id WHERE reviewee_id IS NULL');
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn('reviewee_id');
        });
    }
};