<?php

namespace App\Notifications;

use App\Models\Vehicle;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VehicleVerificationNotification extends Notification
{
    use Queueable;

    public function __construct(public Vehicle $vehicle, public string $status)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $vehicleName = "{$this->vehicle->brand} {$this->vehicle->model} ({$this->vehicle->license_plate})";
        $isVerified = $this->status === 'verified';

        $title = $isVerified ? 'Vehicle Approved!' : 'Vehicle Documents Rejected';
        $message = $isVerified
            ? "Your vehicle {$vehicleName} has been approved by administration and is now eligible for offering trips."
            : "The registration/insurance papers for {$vehicleName} were rejected. Please review them in your profile.";

        return [
            'type'       => 'vehicle_verification',
            'status'     => $this->status,
            'vehicle_id' => $this->vehicle->id,
            'title'      => $title,
            'message'    => $message,
            'link'       => $isVerified ? '/create-trip' : '/profile',
        ];
    }
}