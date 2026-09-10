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

        <!-- Vite Scripts & Styles -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/main.jsx'])
    </head>
    <body class="bg-navy-900 text-slate-100 min-h-screen antialiased">
        <div id="app"></div>
    </body>
</html>
