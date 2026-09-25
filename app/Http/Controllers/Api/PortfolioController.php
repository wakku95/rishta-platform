<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortfolioSetting;
use App\Models\PortfolioItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class PortfolioController extends Controller
{
    /**
     * Get the full portfolio structure for the external React app.
     */
    public function index(): JsonResponse
    {
        $settings = PortfolioSetting::all()->pluck('value', 'key')->toArray();

        $items = PortfolioItem::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $groupedItems = [];
        foreach ($items as $item) {
            $pluralType = Str::plural($item->type);
            $groupedItems[$pluralType][] = $item;
        }

        return response()->json([
            'success' => true,
            'data' => array_merge(
                ['settings' => $settings],
                $groupedItems
            )
        ]);
    }
}
