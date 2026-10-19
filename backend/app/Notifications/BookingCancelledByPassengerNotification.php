<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingCancelledByPassengerNotification extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking, public bool $wasConfirmed)
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

        $title = $this->wasConfirmed ? 'Confirmed Booking Cancelled' : 'Booking Request Withdrawn';
        $message = $this->wasConfirmed
            ? "{$passengerName} cancelled their confirmed reservation for {$seatsLabel} on your trip from {$departure} to {$destination}. The seats have been reopened."
            : "{$passengerName} withdrew their booking request for {$seatsLabel} on your trip from {$departure} to {$destination}.";

        return [
            'type'        => 'booking_cancelled_by_passenger',
            'title'       => $title,
            'message'     => $message,
            'booking_id'  => $this->booking->id,
            'trip_id'     => $this->booking->trip_id,
            'link'        => '/driver/trips',
        ];
    }
}