<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
                'error_code' => 'UNAUTHENTICATED',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'This action is unauthorized. Admin privileges required.',
                'error_code' => 'UNAUTHORIZED',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
