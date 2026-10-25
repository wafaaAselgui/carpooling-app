<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('banned_until')->nullable()->after('is_banned');
            $table->boolean('is_frozen')->default(false)->after('banned_until');
            $table->string('moderation_reason')->nullable()->after('is_frozen');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['banned_until', 'is_frozen', 'moderation_reason']);
        });
    }
};