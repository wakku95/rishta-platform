<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SocialMediaPublicationRequest;

class SocialMediaPublicationRequestController extends Controller
{
    public function index()
    {
        $requests = SocialMediaPublicationRequest::with(['user', 'profile', 'assistedListing'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
            
        return response()->json($requests);
    }

    public function show($id)
    {
        $req = SocialMediaPublicationRequest::with(['user', 'profile', 'assistedListing'])->findOrFail($id);
        return response()->json($req);
    }

    public function approve(Request $request, $id)
    {
        $req = SocialMediaPublicationRequest::findOrFail($id);
        
        if ($req->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved.'], 422);
        }

        $req->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Request approved successfully.',
            'request' => $req
        ]);
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => ['required', 'string']
        ]);

        $req = SocialMediaPublicationRequest::findOrFail($id);
        
        if ($req->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected.'], 422);
        }

        $req->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $request->rejection_reason
        ]);

        return response()->json([
            'message' => 'Request rejected successfully.',
            'request' => $req
        ]);
    }

    public function markPublished(Request $request, $id)
    {
        $req = SocialMediaPublicationRequest::findOrFail($id);
        
        if ($req->status !== 'approved') {
            return response()->json(['message' => 'Only approved requests can be marked as published.'], 422);
        }

        $req->update([
            'status' => 'published',
            'published_by' => $request->user()->id,
            'published_at' => now(),
        ]);

        return response()->json([
            'message' => 'Request marked as published successfully.',
            'request' => $req
        ]);
    }

    public function markRemoved(Request $request, $id)
    {
        $req = SocialMediaPublicationRequest::findOrFail($id);

        $req->update([
            'status' => 'removed',
            'removed_by' => $request->user()->id,
            'removed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Request marked as removed successfully.',
            'request' => $req
        ]);
    }
}