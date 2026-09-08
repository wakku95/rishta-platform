<?php

namespace App\Events;

use App\Models\RishtaRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RishtaRequestDeclined
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public RishtaRequest $request)
    {
    }
}
