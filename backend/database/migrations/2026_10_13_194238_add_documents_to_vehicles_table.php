<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('registration_doc_path')->nullable()->after('photo');
            $table->string('insurance_doc_path')->nullable()->after('registration_doc_path');
            $table->date('insurance_expires_at')->nullable()->after('insurance_doc_path');
            $table->enum('status', ['unverified', 'pending', 'verified', 'rejected'])
                  ->default('unverified')
                  ->after('insurance_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'registration_doc_path',
                'insurance_doc_path',
                'insurance_expires_at',
                'status',
            ]);
        });
    }
};