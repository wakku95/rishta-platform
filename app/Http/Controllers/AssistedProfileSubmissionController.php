<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\AssistedProfileSubmission;
use App\Http\Requests\StoreAssistedProfileSubmissionRequest;

class AssistedProfileSubmissionController extends Controller
{
    public function store(StoreAssistedProfileSubmissionRequest $request)
    {
        $validated = $request->validated();
        
        $submission = AssistedProfileSubmission::create([
            'submitter_name' => $validated['submitter_name'],
            'submitter_contact' => $validated['submitter_contact'],
            'public_biodata' => $validated['public_biodata'],
            'terms_accepted' => true,
            'terms_accepted_at' => now(),
            'social_publication_consent' => $validated['social_publication_consent'] ?? false,
            'social_publication_consent_at' => ($validated['social_publication_consent'] ?? false) ? now() : null,
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Your Assisted Profile request has been submitted successfully.',
            'submission' => $submission
        ], 201);
    }
}
