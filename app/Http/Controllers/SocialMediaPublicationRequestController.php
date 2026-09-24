<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SocialMediaPublicationRequest;
use App\Http\Resources\PublicProfileResource;
use Illuminate\Support\Facades\Auth;

class SocialMediaPublicationRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $requests = SocialMediaPublicationRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($requests);
    }

    public function latest(Request $request)
    {
        $user = $request->user();
        $req = SocialMediaPublicationRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();
            
        return response()->json($req);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;

        if (!$profile || $profile->profile_status !== 'active') {
            return response()->json(['message' => 'Your profile needs to be active before you can request Facebook or Instagram publication.'], 403);
        }

        // Prevent duplicates if already pending or approved
        $existing = SocialMediaPublicationRequest::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved', 'published'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You already have an active publication request or publication.'], 422);
        }

        $validated = $request->validate([
            'requested_platforms' => ['required', 'array', 'min:1'],
            'requested_platforms.*' => ['in:facebook,instagram'],
            'consent_given' => ['required', 'accepted'],
        ]);

        $snapshot = PublicProfileResource::make($profile)->resolve();
        
        $pubRequest = SocialMediaPublicationRequest::create([
            'user_id' => $user->id,
            'profile_id' => $profile->id,
            'status' => 'pending',
            'requested_platforms' => $validated['requested_platforms'],
            'consent_given' => true,
            'consent_version' => 'v1.0',
            'consented_at' => now(),
            'submitted_at' => now(),
            'public_profile_snapshot' => $snapshot,
        ]);

        return response()->json([
            'message' => 'Your social-media publication request has been submitted for admin review. Your profile will not be published until it is reviewed and approved.',
            'request' => $pubRequest
        ], 201);
    }

    public function remove(Request $request, $id)
    {
        $pubRequest = SocialMediaPublicationRequest::where('user_id', $request->user()->id)
            ->findOrFail($id);

        if ($pubRequest->status === 'removed' || $pubRequest->status === 'removal_requested') {
            return response()->json(['message' => 'Removal already requested or completed.'], 422);
        }

        if ($pubRequest->status === 'published') {
            $pubRequest->update([
                'status' => 'removal_requested',
                'removal_requested_at' => now(),
            ]);
        } else {
            // If it's pending or approved, we can just cancel it directly
            $pubRequest->update([
                'status' => 'removed',
                'removed_at' => now(),
                'removed_by' => $request->user()->id,
                'removal_reason' => 'Cancelled by user before publication'
            ]);
        }

        return response()->json([
            'message' => 'Your request to remove the social-media publication has been received.',
            'request' => $pubRequest
        ]);
    }
}