<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioSetting;
use App\Models\PortfolioItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminPortfolioController extends Controller
{
    // --- Settings Management ---

    public function getSettings(): JsonResponse
    {
        $settings = PortfolioSetting::all()->pluck('value', 'key');
        return response()->json(['success' => true, 'data' => $settings]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => 'required|array'
        ]);

        foreach ($data['settings'] as $key => $value) {
            PortfolioSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['success' => true, 'message' => 'Settings updated successfully.']);
    }

    // --- Items Management ---

    public function getItems(Request $request): JsonResponse
    {
        $type = $request->query('type');
        $query = PortfolioItem::query()->orderBy('sort_order');
        
        if ($type) {
            $query->where('type', $type);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'primary_link' => 'nullable|string',
            'secondary_link' => 'nullable|string',
            'metadata' => 'nullable|array',
            'sort_order' => 'integer',
            'is_active' => 'boolean'
        ]);

        $item = PortfolioItem::create($validated);

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Item created successfully.']);
    }

    public function updateItem(Request $request, $id): JsonResponse
    {
        $item = PortfolioItem::findOrFail($id);

        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string',
            'primary_link' => 'nullable|string',
            'secondary_link' => 'nullable|string',
            'metadata' => 'nullable|array',
            'sort_order' => 'integer',
            'is_active' => 'boolean'
        ]);

        $item->update($validated);

        return response()->json(['success' => true, 'data' => $item, 'message' => 'Item updated successfully.']);
    }

    public function destroyItem($id): JsonResponse
    {
        $item = PortfolioItem::findOrFail($id);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Item deleted successfully.']);
    }
}
