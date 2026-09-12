<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class AdminUserController extends Controller
{
    use ApiResponse;

    /**
     * List paginated users with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('profile:id,user_id,profile_code,gender,city,profile_status');

        // Search name or email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Status filter (active, suspended)
        if ($status = $request->input('status')) {
            if (in_array($status, ['active', 'suspended'])) {
                $query->where('status', $status);
            }
        }

        // Role filter (user, admin)
        if ($role = $request->input('role')) {
            if (in_array($role, ['user', 'admin'])) {
                $query->where('role', $role);
            }
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $users = $query->latest()->paginate($perPage);

        return $this->successResponse($users, 'Users list retrieved.');
    }

    /**
     * Get full user detail.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'profile',
            'sentRequests.receiver:id,name,email',
            'receivedRequests.sender:id,name,email',
            'payments',
        ])->find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', [], Response::HTTP_NOT_FOUND, 'USER_NOT_FOUND');
        }

        return $this->successResponse($user, 'User details retrieved.');
    }

    /**
     * Suspend / Block user.
     */
    public function suspend(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', [], Response::HTTP_NOT_FOUND, 'USER_NOT_FOUND');
        }

        // Prevent admin from suspending themselves
        if ($request->user()->id === $user->id) {
            return $this->errorResponse('You cannot suspend your own administrative account.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'SELF_ACTION_FORBIDDEN');
        }

        $user->update(['status' => 'suspended']);

        // Revoke Sanctum tokens if any exist
        $user->tokens()->delete();

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'status' => $user->status,
        ], "User [{$user->name}] has been suspended.");
    }

    /**
     * Activate / Unblock user.
     */
    public function activate(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', [], Response::HTTP_NOT_FOUND, 'USER_NOT_FOUND');
        }

        $user->update(['status' => 'active']);

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'status' => $user->status,
        ], "User [{$user->name}] has been reactivated.");
    }

    /**
     * Toggle or update user role (admin / user).
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|in:admin,user',
        ]);

        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', [], Response::HTTP_NOT_FOUND, 'USER_NOT_FOUND');
        }

        // Prevent removing own admin privileges
        if ($request->user()->id === $user->id && $request->input('role') !== 'admin') {
            return $this->errorResponse('You cannot demote your own account from admin.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'SELF_ACTION_FORBIDDEN');
        }

        $user->update(['role' => $request->input('role')]);

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'role' => $user->role,
        ], "User [{$user->name}] role updated to [{$user->role}].");
    }

    /**
     * Delete user and cascade data.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('User not found.', [], Response::HTTP_NOT_FOUND, 'USER_NOT_FOUND');
        }

        if ($request->user()->id === $user->id) {
            return $this->errorResponse('You cannot delete your own account.', [], Response::HTTP_UNPROCESSABLE_ENTITY, 'SELF_ACTION_FORBIDDEN');
        }

        DB::transaction(function () use ($user) {
            // Delete profile if exists
            if ($user->profile) {
                $user->profile->delete();
            }

            // Remove user shortlists
            $user->shortlists()->delete();

            // Delete requests sent and received
            $user->sentRequests()->delete();
            $user->receivedRequests()->delete();

            // Revoke tokens
            $user->tokens()->delete();

            // Safely delete stored private verification documents to avoid storage leakage
            foreach ($user->verifications as $verification) {
                $verification->deleteStoredDocuments();
            }

            // Finally delete user record (verifications foreign key will set null or cascade according to DB)
            $user->delete();
        });

        return $this->successResponse(null, "User [{$user->name}] has been permanently deleted.");
    }
}
