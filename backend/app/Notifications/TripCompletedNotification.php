<?php

namespace App\Notifications;

use App\Models\Trip;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TripCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(public Trip $trip, public string $role)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $route = "{$this->trip->departure_city} → {$this->trip->destination_city}";

        return [
            'type'    => 'trip_completed',
            'title'   => 'Trip Completed!',
            'message' => "Your ride ({$route}) has ended. Leave a review to share your feedback!",
            'trip_id' => $this->trip->id,
            'link'    => $this->role === 'driver' ? '/driver/trips' : '/my-bookings',
        ];
    }
}