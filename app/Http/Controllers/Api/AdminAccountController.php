<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminAccountRequest;
use App\Http\Requests\UpdateAdminAccountRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAccountController extends Controller
{
    /**
     * Menampilkan daftar seluruh akun admin EO beserta fitur pencarian.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->where('role', 'eo');

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $admins = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'data' => $admins,
            'total' => $admins->count(),
        ]);
    }

    /**
     * Membuat dan mendaftarkan akun admin EO baru.
     */
    public function store(StoreAdminAccountRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $admin = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => $validated['password'],
            'role' => 'eo',
        ]);

        return response()->json([
            'message' => 'Akun admin baru berhasil dibuat.',
            'data' => $admin,
        ], 201);
    }

    /**
     * Menampilkan data satu akun admin EO.
     */
    public function show(User $user): JsonResponse
    {
        if (! $user->isEo()) {
            return response()->json([
                'message' => 'Pengguna ini bukan akun admin EO.',
            ], 404);
        }

        return response()->json([
            'data' => $user,
        ]);
    }

    /**
     * Memperbarui profil dan kata sandi akun admin EO.
     */
    public function update(UpdateAdminAccountRequest $request, User $user): JsonResponse
    {
        if (! $user->isEo()) {
            return response()->json([
                'message' => 'Pengguna ini bukan akun admin EO.',
            ], 404);
        }

        $validated = $request->validated();

        $data = [
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
        ];

        if (! empty($validated['password'])) {
            $data['password'] = $validated['password'];
        }

        $user->update($data);

        return response()->json([
            'message' => 'Akun admin berhasil diperbarui.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Menghapus akun admin EO dengan proteksi akun aktif & admin terakhir.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if (! $user->isEo()) {
            return response()->json([
                'message' => 'Pengguna ini bukan akun admin EO.',
            ], 404);
        }

        $currentUser = $request->user();

        if ($currentUser && $user->id === $currentUser->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.',
            ], 422);
        }

        if (User::query()->where('role', 'eo')->count() <= 1) {
            return response()->json([
                'message' => 'Tidak dapat menghapus admin terakhir. Minimal harus ada satu akun admin EO aktif.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'Akun admin berhasil dihapus.',
        ]);
    }
}
