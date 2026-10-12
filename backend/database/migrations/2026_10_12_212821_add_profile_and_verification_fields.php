<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->text('bio')->nullable()->after('phone');
            $table->string('avatar_path')->nullable()->after('bio');
            $table->string('cin_number')->nullable()->after('avatar_path');
            $table->string('cin_document_path')->nullable()->after('cin_number');
            $table->enum('verification_status', ['unverified', 'pending', 'verified', 'rejected'])
                  ->default('unverified')
                  ->after('cin_document_path');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('photo_path')->nullable()->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'bio',
                'avatar_path',
                'cin_number',
                'cin_document_path',
                'verification_status',
            ]);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });
    }
};