<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewBookingRequestNotification extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $passengerName = $this->booking->user->name ?? 'A passenger';
        $seats = $this->booking->seats;
        $seatsLabel = $seats . ' seat' . ($seats > 1 ? 's' : '');
        $departure = $this->booking->trip->departure_city;
        $destination = $this->booking->trip->destination_city;

        return [
            'type'        => 'new_booking_request',
            'title'       => 'New Booking Request',
            'message'     => "{$passengerName} requested {$seatsLabel} on your ride from {$departure} to {$destination}.",
            'booking_id'  => $this->booking->id,
            'trip_id'     => $this->booking->trip_id,
            'link'        => '/driver/trips',
        ];
    }
}