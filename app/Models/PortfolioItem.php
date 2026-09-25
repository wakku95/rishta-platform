<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioItem extends Model
{
    protected $fillable = [
        'type', 'title', 'subtitle', 'description', 
        'image_url', 'primary_link', 'secondary_link', 
        'metadata', 'sort_order', 'is_active'
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean'
    ];
}
