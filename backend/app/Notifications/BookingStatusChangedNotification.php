<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingStatusChangedNotification extends Notification
{
    use Queueable;

    public function __construct(public Booking $booking, public string $status)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $driverName = $this->booking->trip->driver->name ?? 'The driver';
        $departure = $this->booking->trip->departure_city;
        $destination = $this->booking->trip->destination_city;

        switch ($this->status) {
            case 'confirmed':
                $title = 'Booking Accepted!';
                $message = "{$driverName} accepted your booking for the trip from {$departure} to {$destination}.";
                break;

            case 'cancelled':
                $title = 'Trip Cancelled by Driver';
                $message = "{$driverName} cancelled the scheduled ride from {$departure} to {$destination}. Your booking has been cancelled.";
                break;

            case 'rejected':
            default:
                $title = 'Booking Declined';
                $message = "{$driverName} declined your booking request for the trip from {$departure} to {$destination}.";
                break;
        }

        return [
            'type'       => 'booking_status',
            'status'     => $this->status,
            'title'      => $title,
            'message'    => $message,
            'booking_id' => $this->booking->id,
            'trip_id'    => $this->booking->trip_id,
            'link'       => '/my-bookings',
        ];
    }
}