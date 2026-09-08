<?php

namespace App\Events;

use App\Models\RishtaRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RishtaRequestCancelled
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public RishtaRequest $request)
    {
    }
}
