<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            // Polymorphic relation: reportable_type ('user', 'trip', 'review') and reportable_id
            $table->morphs('reportable');
            $table->string('reason'); // e.g. 'Harassment', 'No-show', 'Dangerous Driving', 'Spam', 'Other'
            $table->text('details')->nullable(); // Custom description if "Other" or supplementary notes
            $table->enum('status', ['pending', 'resolved', 'dismissed'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};