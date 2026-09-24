<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\AssistedProfileSubmission;
use App\Models\AssistedListing;
use Illuminate\Support\Facades\DB;

class AssistedProfileSubmissionController extends Controller
{
    public function index()
    {
        $submissions = AssistedProfileSubmission::orderBy('created_at', 'desc')->paginate(20);
        return response()->json($submissions);
    }

    public function show($id)
    {
        $submission = AssistedProfileSubmission::findOrFail($id);
        return response()->json($submission);
    }

    public function approve(Request $request, $id)
    {
        $submission = AssistedProfileSubmission::findOrFail($id);
        
        if ($submission->status !== 'pending') {
            return response()->json(['message' => 'Only pending submissions can be approved.'], 422);
        }

        DB::beginTransaction();
        try {
            // Create the resulting Assisted Listing
            $listing = AssistedListing::create([
                'full_name' => $submission->submitter_name,
                'contact_number' => $submission->submitter_contact,
                'gender' => $submission->public_biodata['gender'],
                'date_of_birth' => $submission->public_biodata['date_of_birth'],
                'religion' => $submission->public_biodata['religion'],
                'sect' => $submission->public_biodata['sect'] ?? null,
                'city' => $submission->public_biodata['city'],
                'education' => $submission->public_biodata['education'],
                'profession' => $submission->public_biodata['profession'],
                'marital_status' => $submission->public_biodata['marital_status'],
                'height' => $submission->public_biodata['height'],
                'public_about' => $submission->public_biodata['public_about'] ?? null,
                'managed_by' => $submission->public_biodata['managed_by'],
                'listing_status' => 'published',
                'created_by_admin_id' => $request->user()->id,
                'consent_given_at' => $submission->terms_accepted_at,
            ]);

            // Update submission status
            $submission->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'resulting_assisted_listing_id' => $listing->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Submission approved successfully.',
                'listing' => $listing
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve submission.', 'error' => $e->getMessage()], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000']
        ]);

        $submission = AssistedProfileSubmission::findOrFail($id);
        
        if ($submission->status !== 'pending') {
            return response()->json(['message' => 'Only pending submissions can be rejected.'], 422);
        }

        $submission->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Submission rejected successfully.',
            'submission' => $submission
        ]);
    }
}
