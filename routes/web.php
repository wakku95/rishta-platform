<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

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
    ];

    if (array_key_exists($normalizedPath, $publicRoutes)) {
        return $publicRoutes[$normalizedPath];
    }

        // All other routes (auth, dashboard, profile, candidate search, requests, etc.) are strictly noindex
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
        ['loc' => $baseUrl . '/', 'priority' => '1.0', 'changefreq' => 'weekly'],
        ['loc' => $baseUrl . '/how-it-works', 'priority' => '0.9', 'changefreq' => 'monthly'],
        ['loc' => $baseUrl . '/pricing', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['loc' => $baseUrl . '/about', 'priority' => '0.8', 'changefreq' => 'monthly'],
        ['loc' => $baseUrl . '/contact', 'priority' => '0.7', 'changefreq' => 'monthly'],
        ['loc' => $baseUrl . '/privacy-policy', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['loc' => $baseUrl . '/terms', 'priority' => '0.5', 'changefreq' => 'yearly'],
        ['loc' => $baseUrl . '/refund-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
        ['loc' => $baseUrl . '/delivery-policy', 'priority' => '0.4', 'changefreq' => 'yearly'],
    ];

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    $lastmod = date('Y-m-d');
    foreach ($pages as $page) {
        $xml .= "  <url>\n";
        $xml .= "    <loc>{$page['loc']}</loc>\n";
        $xml .= "    <lastmod>{$lastmod}</lastmod>\n";
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

