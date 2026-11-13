<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminClientController extends Controller
{
    /**
     * Menampilkan daftar akun Client aktif beserta fitur pencarian.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Client::query()->where('role', 'client');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'data' => $clients,
            'total' => $clients->count(),
        ]);
    }

    /**
     * Menampilkan daftar akun Client yang sudah dihapus sementara.
     */
    public function deletedIndex(Request $request): JsonResponse
    {
        $query = Client::onlyTrashed()->where('role', 'client');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderByDesc('deleted_at')->get();

        $data = $clients->map(function (Client $client) {
            $deadline = $client->deleted_at->copy()->addDays(14);

            return [
                ...$client->toArray(),
                'restore_expires_at' => $deadline->toDateTimeString(),
                'can_restore' => now()->lt($deadline),
            ];
        });

        return response()->json([
            'data' => $data,
            'total' => $data->count(),
        ]);
    }

    /**
     * Menampilkan detail satu akun Client aktif.
     */
    public function show(Client $user): JsonResponse
    {
        if (! $user->isClient()) {
            return response()->json([
                'message' => 'Pengguna ini bukan akun Client.',
            ], 404);
        }

        return response()->json([
            'data' => $user,
        ]);
    }

    /**
     * Memperbarui nama dan email akun Client.
     */
    public function update(Request $request, Client $user): JsonResponse
    {
        if (! $user->isClient()) {
            return response()->json([
                'message' => 'Pengguna ini bukan akun Client.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:100',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
        ]);

        return response()->json([
            'message' => 'Akun Client berhasil diperbarui.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Menghapus akun Client menggunakan Soft Delete.
     */
    public function destroy(Client $user): JsonResponse
    {
        if (! $user->isClient()) {
            return response()->json([
                'message' => 'Pengguna ini bukan akun Client.',
            ], 404);
        }

        // Menghapus token agar Client tidak dapat menggunakan sesi lama.
        $user->tokens()->delete();

        $user->delete();

        return response()->json([
            'message' => 'Akun Client berhasil dinonaktifkan sementara.',
        ]);
    }

    /**
     * Memulihkan akun Client selama belum melewati 14 hari.
     */
    public function restore(string $id): JsonResponse
    {
        $user = Client::withTrashed()
            ->where('role', 'client')
            ->findOrFail($id);

        if (! $user->trashed()) {
            return response()->json([
                'message' => 'Akun Client ini masih aktif.',
            ], 409);
        }

        $restoreDeadline = $user->deleted_at->copy()->addDays(14);

        // Akun tidak dapat dipulihkan jika sudah mencapai batas 14 hari.
        if (now()->greaterThanOrEqualTo($restoreDeadline)) {
            return response()->json([
                'message' => 'Masa pemulihan akun sudah berakhir. Akun tidak dapat dipulihkan.',
                'restore_expires_at' => $restoreDeadline->toDateTimeString(),
            ], 410);
        }

        $user->restore();

        return response()->json([
            'message' => 'Akun Client berhasil dipulihkan. Client dapat login kembali.',
            'data' => $user->fresh(),
        ]);
    }
}