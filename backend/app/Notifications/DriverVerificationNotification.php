<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DriverVerificationNotification extends Notification
{
    use Queueable;

    public function __construct(public string $status)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $isVerified = $this->status === 'verified';

        $title = $isVerified ? 'Driver Identity Verified!' : 'Driver Verification Rejected';
        $message = $isVerified
            ? 'Congratulations! Your driver identity documents have been approved. You can now publish rides.'
            : 'Your identity document submission was reviewed and rejected. Please re-check your uploaded documents on your profile.';

        return [
            'type'    => 'driver_verification',
            'status'  => $this->status,
            'title'   => $title,
            'message' => $message,
            'link'    => $isVerified ? '/create-trip' : '/profile',
        ];
    }
}