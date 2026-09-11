<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Rishta Platform') }} — Privacy-First Pakistani Matrimonial</title>
        <meta name="description" content="A privacy-first, culturally respectful Pakistani matrimonial discovery platform. Search privately. Connect with mutual consent.">

        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="alternate icon" href="/favicon.ico">
        <meta name="theme-color" content="#0B0F19">

        <!-- Preconnect Google Fonts for Inter and Playfair -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

        <!-- Early Theme Initialization Script (Prevent Flash) -->
        <script>
            (function() {
                try {
                    var theme = localStorage.getItem('raabtanow_theme');
                    if (theme === 'light') {
                        document.documentElement.classList.add('light');
                        document.documentElement.setAttribute('data-theme', 'light');
                    } else {
                        document.documentElement.classList.remove('light');
                        document.documentElement.setAttribute('data-theme', 'dark');
                    }
                } catch (e) {}
            })();
        </script>

        <!-- Vite Scripts & Styles -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/main.jsx'])
    </head>
    <body class="bg-navy-900 text-slate-100 min-h-screen antialiased">
        <div id="app">
            <div id="rn-preloader" style="position:fixed;inset:0;background:#0B0F19;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,-apple-system,sans-serif;">
                <style>
                    @keyframes rn-pulse {
                        0%, 100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 16px rgba(225,29,116,0.45)); }
                        50% { transform: scale(1.08); opacity: 0.85; filter: drop-shadow(0 0 26px rgba(139,92,246,0.65)); }
                    }
                    @keyframes rn-shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .rn-logo-glow {
                        animation: rn-pulse 1.8s ease-in-out infinite;
                    }
                    .rn-progress-track {
                        width: 140px;
                        height: 3px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 9999px;
                        overflow: hidden;
                        margin-top: 20px;
                        position: relative;
                    }
                    .rn-progress-bar {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(90deg, #E11D74, #8B5CF6);
                        border-radius: 9999px;
                        animation: rn-shimmer 1.5s ease-in-out infinite;
                    }
                </style>
                <div class="rn-logo-glow" style="width:58px;height:58px;border-radius:18px;background:linear-gradient(135deg, #E11D74, #8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(225,29,116,0.3);border:1px solid rgba(255,255,255,0.25);">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/>
                    </svg>
                </div>
                <div style="margin-top:16px;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.02em;">
                    Raabta<span style="color:#F472B6;">Now</span>
                </div>
                <div style="margin-top:4px;color:#94A3B8;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">
                    Privacy-First Matrimonial
                </div>
                <div class="rn-progress-track">
                    <div class="rn-progress-bar"></div>
                </div>
            </div>
        </div>
    </body>
</html>
