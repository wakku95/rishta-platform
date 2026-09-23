<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AssistedListing;
use App\Http\Resources\AssistedListingAdminResource;
use App\Http\Requests\Admin\CreateAssistedListingRequest;
use App\Http\Requests\Admin\UpdateAssistedListingRequest;
use App\Contracts\SmsServiceInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Profile;

class AdminAssistedListingController extends Controller
{
    public function __construct(
        protected SmsServiceInterface $smsService
    ) {}

    public function index(Request $request)
    {
        $listings = AssistedListing::query()
            ->when($request->search, function ($query, $search) {
                $query->where('listing_code', 'like', "%{$search}%")
                      ->orWhere('full_name', 'like', "%{$search}%")
                      ->orWhere('contact_number', 'like', "%{$search}%");
            })
            ->when($request->status, function ($query, $status) {
                $query->where('listing_status', $status);
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return AssistedListingAdminResource::collection($listings);
    }

    public function show(AssistedListing $assistedListing)
    {
        return new AssistedListingAdminResource($assistedListing);
    }

    public function store(CreateAssistedListingRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by_admin_id'] = $request->user()->id;

        if (!empty($validated['consent_given'])) {
            $validated['consent_given_at'] = now();
        }

        if (isset($validated['listing_status']) && $validated['listing_status'] === 'published') {
            if (empty($validated['consent_given_at']) && empty($validated['consent_given'])) {
                return response()->json([
                    'message' => 'Cannot publish a listing without consent.'
                ], 422);
            }
        }

        unset($validated['consent_given']);

        $listing = AssistedListing::create($validated);

        return response()->json([
            'message' => 'Listing created successfully',
            'data' => new AssistedListingAdminResource($listing)
        ], 201);
    }

    public function update(UpdateAssistedListingRequest $request, AssistedListing $assistedListing)
    {
        $validated = $request->validated();

        if (array_key_exists('consent_given', $validated)) {
            if ($validated['consent_given']) {
                $validated['consent_given_at'] = $assistedListing->consent_given_at ?? now();
            } else {
                $validated['consent_given_at'] = null;
            }
        }
        unset($validated['consent_given']);
        
        $newStatus = $validated['listing_status'] ?? $assistedListing->listing_status;
        $consentAt = $validated['consent_given_at'] ?? $assistedListing->consent_given_at;

        if ($newStatus === 'published' && !$consentAt) {
            return response()->json([
                'message' => 'Cannot publish a listing without consent.'
            ], 422);
        }

        $assistedListing->update($validated);

        return response()->json([
            'message' => 'Listing updated successfully',
            'data' => new AssistedListingAdminResource($assistedListing)
        ]);
    }

    public function destroy(AssistedListing $assistedListing)
    {
        $assistedListing->delete();
        
        return response()->json([
            'message' => 'Listing deleted successfully'
        ]);
    }

    public function unpublish(AssistedListing $assistedListing)
    {
        $assistedListing->update([
            'listing_status' => 'unpublished'
        ]);

        return response()->json([
            'message' => 'Listing unpublished successfully',
            'data' => new AssistedListingAdminResource($assistedListing)
        ]);
    }

    public function sendOtp(Request $request, AssistedListing $assistedListing)
    {
        $request->validate([
            'contact_number' => ['required', 'string', 'regex:/^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/'],
        ]);

        if ($assistedListing->contact_number_verified_at && $assistedListing->contact_number === $request->contact_number) {
            return response()->json(['message' => 'Contact number is already verified.'], 400);
        }

        $cooldown = config('rishta.otp.resend_cooldown_seconds', 60);
        if ($assistedListing->contact_otp_sent_at && $assistedListing->contact_otp_sent_at->addSeconds($cooldown)->isFuture()) {
            return response()->json(['message' => 'Please wait before requesting another OTP.'], 429);
        }

        $otp = sprintf('%06d', random_int(100000, 999999));
        $expiryMinutes = config('rishta.otp.expiry_minutes', 10);

        $assistedListing->update([
            'contact_number' => $request->contact_number,
            'contact_otp_hash' => Hash::make($otp),
            'contact_otp_expires_at' => now()->addMinutes($expiryMinutes),
            'contact_otp_attempts' => 0,
            'contact_otp_sent_at' => now(),
            'contact_number_verified_at' => null, // reset verification if sending new OTP
        ]);

        $message = "Your RaabtaNow Mobile Verification Code is: {$otp}";
        $this->smsService->sendSms($request->contact_number, $message);

        return response()->json(['message' => 'OTP sent successfully']);
    }

    public function verifyOtp(Request $request, AssistedListing $assistedListing)
    {
        $request->validate([
            'otp' => ['required', 'string', 'size:6'],
        ]);

        if (!$assistedListing->contact_otp_hash) {
            return response()->json(['message' => 'No OTP request found.'], 400);
        }

        if ($assistedListing->contact_otp_expires_at && $assistedListing->contact_otp_expires_at->isPast()) {
            return response()->json(['message' => 'OTP has expired. Please request a new one.'], 400);
        }

        $maxAttempts = config('rishta.otp.max_attempts', 5);
        if ($assistedListing->contact_otp_attempts >= $maxAttempts) {
            return response()->json(['message' => 'Maximum verification attempts exceeded. Please request a new OTP.'], 400);
        }

        if (!Hash::check($request->otp, $assistedListing->contact_otp_hash)) {
            $assistedListing->increment('contact_otp_attempts');
            return response()->json(['message' => 'Invalid OTP.'], 400);
        }

        $assistedListing->update([
            'contact_number_verified_at' => now(),
            'contact_otp_hash' => null,
            'contact_otp_expires_at' => null,
            'contact_otp_attempts' => 0,
        ]);

        return response()->json(['message' => 'Contact number verified successfully']);
    }

    public function convert(Request $request, AssistedListing $assistedListing)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($assistedListing->user_id) {
            return response()->json(['message' => 'Listing is already converted and linked to a user.'], 400);
        }

        if (User::where('email', $request->email)->exists()) {
            return response()->json([
                'message' => 'An account with this email already exists. Please resolve manually.'
            ], 400);
        }

        try {
            DB::beginTransaction();

            // 1. Create User
            $user = User::create([
                'name' => $assistedListing->full_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'user',
                'status' => 'active',
            ]);

            // 2. Map allowed fields to Profile
            // Only map fields that safely match the standard profile schema.
            $profile = Profile::create([
                'user_id' => $user->id,
                'gender' => $assistedListing->gender,
                'date_of_birth' => $assistedListing->date_of_birth,
                'religion' => $assistedListing->religion,
                'sect' => $assistedListing->sect,
                'city' => $assistedListing->city,
                'education' => $assistedListing->education,
                'profession' => $assistedListing->profession,
                'marital_status' => $assistedListing->marital_status,
                'height' => $assistedListing->height,
                'about' => $assistedListing->public_about, // Maps public_about -> about
                'family_background' => $assistedListing->family_background,
                'managed_by' => $assistedListing->managed_by,
                // Do NOT copy OTP state, admin_notes, etc.
                'status' => 'draft',
                'created_by_admin_id' => $request->user()->id,
            ]);

            // 3. Link back and mark listing as converted
            $assistedListing->update([
                'user_id' => $user->id,
                'listing_status' => 'converted',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Successfully converted to user account.',
                'user_id' => $user->id,
                'profile_code' => $profile->profile_code
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Conversion failed. Rolled back.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
