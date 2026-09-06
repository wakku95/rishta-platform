<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponse
{
    /**
     * Return a standardized success JSON response.
     *
     * @param mixed $data
     * @param string $message
     * @param int $status
     * @return JsonResponse
     */
    public function successResponse(
        mixed $data = null,
        string $message = 'Operation successful.',
        int $status = Response::HTTP_OK
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Return a standardized error JSON response.
     *
     * @param string $message
     * @param array $errors
     * @param int $status
     * @param string|null $errorCode
     * @return JsonResponse
     */
    public function errorResponse(
        string $message = 'An error occurred.',
        array $errors = [],
        int $status = Response::HTTP_BAD_REQUEST,
        ?string $errorCode = null
    ): JsonResponse {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if (!empty($errors)) {
            $payload['errors'] = $errors;
        }

        if ($errorCode !== null) {
            $payload['error_code'] = $errorCode;
        }

        return response()->json($payload, $status);
    }
}
