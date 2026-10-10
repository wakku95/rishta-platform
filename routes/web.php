<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Models\Profile;
use App\Models\AssistedListing;

// Helper function to resolve route-specific SEO metadata
if (!function_exists('getSeoMetadata')) {
    function getSeoMetadata(string $path): array
    {
        $baseUrl = 'https://raabtanow.com';
        $normalizedPath = trim($path, '/');

    // Public indexable routes dictionary
    $publicRoutes = [
        '' => [
            'title' => 'Online Rishta in Pakistan | Pakistani Matrimonial Website | RaabtaNow',
            'description' => 'RaabtaNow is a privacy-first Pakistani matrimonial platform to discover compatible rishtas online, connect through mutual interest, and build meaningful marriage connections.',
            'canonical' => $baseUrl,
            'is_indexable' => true,
            'schema_type' => 'website',
        ],
        'how-it-works' => [
            'title' => 'How Online Rishta Works | Safe & Private Pakistani Matrimonial | RaabtaNow',
            'description' => 'Learn how RaabtaNow\'s dignified Pakistani matrimonial discovery process works: private biodata, mutual consent proposals, and secure SMS OTP contact verification.',
            'canonical' => $baseUrl . '/how-it-works',
            'is_indexable' => true,
            'schema_type' => 'guide',
        ],
        'pricing' => [
            'title' => 'RaabtaNow Pricing | Transparent Pakistani Online Rishta & Matrimonial Service',
            'description' => 'Completely free registration, browsing, and proposals. Transparent Rs. 300 PKR micro-fee charged only upon mutual acceptance to unlock verified contacts.',
            'canonical' => $baseUrl . '/pricing',
            'is_indexable' => true,
            'schema_type' => 'pricing',
        ],
        'about' => [
            'title' => 'About RaabtaNow | Privacy-First Pakistani Matrimonial Platform',
            'description' => 'Discover the mission behind RaabtaNow: restoring honor, privacy, and family dignity to Pakistani rishta matchmaking through modern technology.',
            'canonical' => $baseUrl . '/about',
            'is_indexable' => true,
            'schema_type' => 'about',
        ],
        'contact' => [
            'title' => 'Contact RaabtaNow | Online Rishta Pakistan & Matrimonial Support',
            'description' => 'Get in touch with RaabtaNow customer care. Head office in Karachi, dedicated support helpline (+92 323 9225450), and respectful family assistance.',
            'canonical' => $baseUrl . '/contact',
            'is_indexable' => true,
            'schema_type' => 'contact',
        ],
        'privacy-policy' => [
            'title' => 'Privacy Policy | Confidential Pakistani Matrimonial Platform | RaabtaNow',
            'description' => 'Read RaabtaNow\'s rigorous data protection protocols. Zero public candidate photo exposure, no public phone numbers, and strict mutual consent requirements.',
            'canonical' => $baseUrl . '/privacy-policy',
            'is_indexable' => true,
            'schema_type' => 'legal',
        ],
        'terms' => [
            'title' => 'Terms & Conditions | Halal Pakistani Matrimonial Service | RaabtaNow',
            'description' => 'Review user agreement and guidelines for RaabtaNow. Solely dedicated to serious matrimonial proposals (Nikah) for Pakistani individuals and families.',
            'canonical' => $baseUrl . '/terms',
            'is_indexable' => true,
            'schema_type' => 'legal',
        ],
        'refund-policy' => [
            'title' => 'Return & Refund Policy | RaabtaNow Matrimonial Services',
            'description' => 'Clear terms regarding our digital contact unlock micro-fee, duplicate transaction refunds, and customer support escalation timelines.',
            'canonical' => $baseUrl . '/refund-policy',
            'is_indexable' => true,
            'schema_type' => 'legal',
        ],
        'delivery-policy' => [
            'title' => 'Service Delivery Policy | Instant Digital Contact Unlock | RaabtaNow',
            'description' => 'Instant electronic fulfillment for contact verification and mutual phone release upon successful mutual consent and payment confirmation.',
            'canonical' => $baseUrl . '/delivery-policy',
            'is_indexable' => true,
            'schema_type' => 'legal',
        ],
        'search' => [
            'title' => 'Search Pakistani Rishta Profiles & Matrimonial Candidates | RaabtaNow',
            'description' => 'Browse verified Pakistani rishta biodata online. Filter candidate profiles by age, city, sect, education, and profession with complete family privacy on RaabtaNow.',
            'canonical' => $baseUrl . '/search',
            'is_indexable' => true,
            'schema_type' => 'website',
        ],
    ];

    if (array_key_exists($normalizedPath, $publicRoutes)) {
        return $publicRoutes[$normalizedPath];
    }

    // Dynamic Candidate Profiles (/profiles/{code} or /candidate/{code})
    if (preg_match('#^(profiles|candidate)/([A-Za-z0-9\-_]+)$#', $normalizedPath, $matches)) {
        $profileCode = $matches[2];
        try {
            $profile = Profile::where('profile_code', $profileCode)
                ->where('profile_status', 'active')
                ->whereHas('user', function ($q) {
                    $q->where('status', '!=', 'suspended')
                      ->whereNotNull('email_verified_at');
                })
                ->first();

            if ($profile) {
                $age = $profile->age ? "{$profile->age} Yrs" : null;
                $gender = $profile->gender ? ucfirst($profile->gender) : 'Candidate';
                $profession = $profile->profession ? ucwords(str_replace('_', ' ', $profile->profession)) : null;
                $city = $profile->city ? ucwords($profile->city) : null;
                $sect = ($profile->religion === 'Islam' && $profile->sect) ? $profile->sect : null;

                $titleParts = array_filter([$age, $sect, $gender, $profession ? "($profession)" : null, $city ? "in $city" : null]);
                $titleDesc = implode(' ', $titleParts);
                $title = "{$titleDesc} | Matrimonial Profile {$profile->profile_code} | RaabtaNow";

                $descParts = array_filter([$age, $sect, $gender, $profession, $city ? "based in $city" : null]);
                $descBio = implode(', ', $descParts);
                $description = "View verified biodata for {$descBio}. Discover compatible Pakistani matrimonial proposals securely on RaabtaNow.";

                return [
                    'title' => $title,
                    'description' => $description,
                    'canonical' => $baseUrl . '/profiles/' . $profile->profile_code,
                    'is_indexable' => true,
                    'schema_type' => 'profile',
                ];
            }
        } catch (\Throwable $e) {
            // Fallback gracefully on DB errors
        }
    }

    // Dynamic Assisted Listings (/listings/{code})
    if (preg_match('#^listings/([A-Za-z0-9\-_]+)$#', $normalizedPath, $matches)) {
        $listingCode = $matches[1];
        try {
            $listing = AssistedListing::where('listing_code', $listingCode)
                ->where('listing_status', 'published')
                ->first();

            if ($listing) {
                $age = $listing->date_of_birth ? "{$listing->date_of_birth->age} Yrs" : null;
                $gender = $listing->gender ? ucfirst($listing->gender) : 'Proposal';
                $profession = $listing->profession ? ucwords(str_replace('_', ' ', $listing->profession)) : null;
                $city = $listing->city ? ucwords($listing->city) : null;
                $sect = ($listing->religion === 'Islam' && $listing->sect) ? $listing->sect : null;

                $titleParts = array_filter([$age, $sect, $gender, $profession ? "($profession)" : null, $city ? "in $city" : null]);
                $titleDesc = implode(' ', $titleParts);
                $title = "{$titleDesc} | Assisted Match {$listing->listing_code} | RaabtaNow";

                $descParts = array_filter([$age, $sect, $gender, $profession, $city ? "in $city" : null]);
                $descBio = implode(', ', $descParts);
                $description = "Assisted matrimonial proposal for {$descBio}. Reviewed and verified by RaabtaNow matchmakers.";

                return [
                    'title' => $title,
                    'description' => $description,
                    'canonical' => $baseUrl . '/listings/' . $listing->listing_code,
                    'is_indexable' => true,
                    'schema_type' => 'listing',
                ];
            }
        } catch (\Throwable $e) {
            // Fallback gracefully on DB errors
        }
    }

    // All other routes (auth, dashboard, private profiles, etc.) are strictly noindex
    return [
        'title' => 'RaabtaNow — Privacy-First Pakistani Matrimonial',
        'description' => 'Private and secure matrimonial discovery in Pakistan.',
        'canonical' => $baseUrl . '/' . $normalizedPath,
        'is_indexable' => false,
        'schema_type' => null,
    ];
}
}

// XML Sitemap Route
Route::get('/sitemap.xml', function () {
    $baseUrl = 'https://raabtanow.com';
    $pages = [
        ['loc' => $baseUrl . '/', 'priority' => '1.0', 'changefreq' => 'weekly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/search', 'priority' => '0.9', 'changefreq' => 'daily', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/how-it-works', 'priority' => '0.9', 'changefreq' => 'monthly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/pricing', 'priority' => '0.8', 'changefreq' => 'monthly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/about', 'priority' => '0.8', 'changefreq' => 'monthly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/contact', 'priority' => '0.7', 'changefreq' => 'monthly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/privacy-policy', 'priority' => '0.5', 'changefreq' => 'yearly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/terms', 'priority' => '0.5', 'changefreq' => 'yearly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/refund-policy', 'priority' => '0.4', 'changefreq' => 'yearly', 'lastmod' => date('Y-m-d')],
        ['loc' => $baseUrl . '/delivery-policy', 'priority' => '0.4', 'changefreq' => 'yearly', 'lastmod' => date('Y-m-d')],
    ];

    try {
        // Active registered candidate profiles
        $activeProfiles = Profile::where('profile_status', 'active')
            ->whereHas('user', function ($q) {
                $q->where('status', '!=', 'suspended')
                  ->whereNotNull('email_verified_at');
            })
            ->select(['profile_code', 'updated_at'])
            ->get();

        foreach ($activeProfiles as $p) {
            $pages[] = [
                'loc' => $baseUrl . '/profiles/' . $p->profile_code,
                'priority' => '0.8',
                'changefreq' => 'weekly',
                'lastmod' => $p->updated_at ? $p->updated_at->format('Y-m-d') : date('Y-m-d'),
            ];
        }

        // Published assisted listings
        $assistedListings = AssistedListing::where('listing_status', 'published')
            ->select(['listing_code', 'updated_at'])
            ->get();

        foreach ($assistedListings as $l) {
            $pages[] = [
                'loc' => $baseUrl . '/listings/' . $l->listing_code,
                'priority' => '0.8',
                'changefreq' => 'weekly',
                'lastmod' => $l->updated_at ? $l->updated_at->format('Y-m-d') : date('Y-m-d'),
            ];
        }
    } catch (\Throwable $e) {
        // Fallback gracefully on any DB issue
    }

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($pages as $page) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>{$page['loc']}</loc>\n";
        $xml .= "    <lastmod>{$page['lastmod']}</lastmod>\n";
        $xml .= "    <changefreq>{$page['changefreq']}</changefreq>\n";
        $xml .= "    <priority>{$page['priority']}</priority>\n";
        $xml .= "  </url>\n";
    }
    $xml .= '</urlset>';

    return response($xml, 200, [
        'Content-Type' => 'application/xml; charset=utf-8',
        'X-Robots-Tag' => 'noindex', // Google recommends sitemaps themselves not be indexed in search results
    ]);
});

// Machine-readable context for AI Search & LLMs (llmstxt.org standard)
Route::get('/llms.txt', function () {
    $path = public_path('llms.txt');
    if (file_exists($path)) {
        return response(file_get_contents($path), 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'X-Robots-Tag' => 'noindex',
        ]);
    }
    abort(404);
});

Route::get('/', function (Request $request) {
    // If request expects JSON or is accessing the API host/root
    if ($request->expectsJson() || str_starts_with($request->getHost(), 'api.')) {
        return response()->json([
            'success' => true,
            'message' => 'RaabtaNow API is operational.',
            'version' => '1.0.0',
        ]);
    }

    $seo = getSeoMetadata('');
    return view('welcome', ['seo' => $seo]);
});

// Safepay Hosted Checkout Browser Redirect Callback
Route::match(['get', 'post'], '/payments/{payment_uuid}/safepay/callback', [\App\Http\Controllers\Api\Payments\PaymentController::class, 'safepayCallback'])
    ->name('payments.safepay.callback');

// Named route for SPA login page to prevent RouteNotFoundException
Route::get('/login', function (Request $request) {
    if (str_starts_with($request->getHost(), 'api.')) {
        return response()->json([
            'success' => false,
            'message' => 'The requested API resource was not found.',
            'error_code' => 'NOT_FOUND',
        ], 404);
    }

    return view('welcome', ['seo' => getSeoMetadata('login')]);
})->name('login');

Route::get('/{any}', function (Request $request, string $any) {
    // If accessed from an API host, non-API web paths must NOT render Blade/Vite; return 404 JSON
    if (str_starts_with($request->getHost(), 'api.')) {
        return response()->json([
            'success' => false,
            'message' => 'The requested API resource was not found.',
            'error_code' => 'NOT_FOUND',
        ], 404);
    }

    $seo = getSeoMetadata($any);
    return view('welcome', ['seo' => $seo]);
})->where('any', '^(?!api).*$');

