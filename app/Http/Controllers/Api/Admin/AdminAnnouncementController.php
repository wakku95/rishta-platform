<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAnnouncementController extends Controller
{
    /**
     * List all announcements with read metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::query()
            ->with('creator:id,name,email')
            ->withCount('reads')
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $announcements->items(),
            'pagination' => [
                'current_page' => $announcements->currentPage(),
                'last_page' => $announcements->lastPage(),
                'total' => $announcements->total(),
                'per_page' => $announcements->perPage(),
            ],
        ]);
    }

    /**
     * Broadcast a new in-app announcement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:3000'],
            'type' => ['required', 'string', Rule::in(['info', 'warning', 'success', 'alert'])],
            'target_audience' => ['required', 'string', Rule::in(Announcement::getAudiences())],
            'action_url' => ['nullable', 'string', 'max:255'],
            'action_label' => ['nullable', 'string', 'max:60'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Announcement broadcasted successfully to targeted users.',
            'data' => $announcement,
        ], 201);
    }

    /**
     * Delete an announcement.
     */
    public function destroy(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully.',
        ]);
    }
}
