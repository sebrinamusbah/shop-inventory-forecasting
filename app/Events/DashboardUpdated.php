<?php
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

    public function broadcastOn()
    {
        return new Channel('dashboard');
    }

    public function broadcastAs()
    {
        return 'dashboard.updated';
    }

    public function broadcastWith()
    {
        return [
            'predictions' => $this->predictions,
            'insights' => $this->insights,
            'alerts' => $this->alerts,
        ];
    }
}