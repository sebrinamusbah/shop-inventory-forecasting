<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $predictions;
    public $insights;
    public $alerts;

    public function __construct($predictions = null, $insights = null, $alerts = null)
    {
        $this->predictions = $predictions;
        $this->insights = $insights;
        $this->alerts = $alerts;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'dashboard.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'predictions' => $this->predictions,
            'insights' => $this->insights,
            'alerts' => $this->alerts,
        ];
    }
}