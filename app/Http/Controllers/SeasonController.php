<?php

namespace App\Http\Controllers;

use App\Services\SeasonalForecastService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class SeasonController extends Controller
{
    /**
     * Mengembalikan perkiraan musim untuk titik lokasi dan tanggal acara.
     */
    public function __invoke(Request $request, SeasonalForecastService $service): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-11.5,6.5'],
            'longitude' => ['required', 'numeric', 'between:94,141.5'],
            'tanggal' => ['required', 'date_format:Y-m-d'],
        ]);

        try {
            $forecast = $service->forEvent(
                (float) $validated['latitude'],
                (float) $validated['longitude'],
                $validated['tanggal'],
            );
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (RequestException|ConnectionException $e) {
            report($e);

            return response()->json([
                'message' => 'Layanan perkiraan musim sedang tidak tersedia. Coba lagi nanti.',
            ], 502);
        }

        return response()->json($forecast);
    }
}
