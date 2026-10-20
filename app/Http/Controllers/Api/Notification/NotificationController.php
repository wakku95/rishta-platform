<?php

namespace App\Http\Controllers\Api\Notification;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementRead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get in-app notifications/announcements for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('profile');

        // Fetch active announcements (latest 30)
        $announcements = Announcement::query()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->limit(30)
            ->get();

        // Get read announcement IDs for this user
        $readIds = AnnouncementRead::where('user_id', $user->id)
            ->whereIn('announcement_id', $announcements->pluck('id'))
            ->pluck('announcement_id')
            ->flip();

        $notifications = [];
        $unreadCount = 0;

        foreach ($announcements as $announcement) {
            if (!$announcement->matchesUser($user)) {
                continue;
            }

            $isRead = isset($readIds[$announcement->id]);
            if (!$isRead) {
                $unreadCount++;
            }

            $notifications[] = [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'message' => $announcement->message,
                'type' => $announcement->type,
                'action_url' => $announcement->action_url,
                'action_label' => $announcement->action_label,
                'is_read' => $isRead,
                'created_at' => $announcement->created_at->toISOString(),
                'created_at_human' => $announcement->created_at->diffForHumans(),
            ];
        }

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'data' => $notifications,
        ]);
    }

    /**
     * Mark a specific announcement as read for this user.
     */
    public function markAsRead(Request $request, Announcement $announcement): JsonResponse
    {
        $user = $request->user();

        AnnouncementRead::firstOrCreate([
            'announcement_id' => $announcement->id,
            'user_id' => $user->id,
        ], [
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * Mark all active announcements as read for this user.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing('profile');

        $announcements = Announcement::query()
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->get();

        $alreadyRead = AnnouncementRead::where('user_id', $user->id)
            ->pluck('announcement_id')
            ->flip();

        $now = now();
        $records = [];
        foreach ($announcements as $announcement) {
            if ($announcement->matchesUser($user) && !isset($alreadyRead[$announcement->id])) {
                $records[] = [
                    'announcement_id' => $announcement->id,
                    'user_id' => $user->id,
                    'read_at' => $now,
                ];
            }
        }

        if (!empty($records)) {
            AnnouncementRead::insert($records);
        }

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }
}
