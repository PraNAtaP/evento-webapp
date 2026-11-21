<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    /**
     * Mengambil data profil pengguna yang sedang login beserta data relasi vendor jika ada.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isVendor()) {
            $user->load('vendor');
        }

        return response()->json([
            'status' => 'success',
            'data' => $user,
        ]);
    }

    /**
     * Memperbarui informasi profil pengguna dan data vendor (jika perannya adalah vendor).
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ];

        if ($user->isVendor()) {
            $rules['business_name'] = ['nullable', 'string', 'max:255'];
            $rules['description'] = ['nullable', 'string', 'max:1000'];
            $rules['contact_number'] = ['nullable', 'string', 'max:50'];
            $rules['bank_name'] = ['nullable', 'string', 'max:100'];
            $rules['bank_account_number'] = ['nullable', 'string', 'max:100'];
            $rules['bank_account_holder'] = ['nullable', 'string', 'max:255'];
        }

        $validated = $request->validate($rules);

        // Penanganan upload avatar / foto profil
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = Storage::url($path);
        }

        $user->name = $validated['name'];
        $user->phone = $validated['phone'] ?? $user->phone;
        $user->address = $validated['address'] ?? $user->address;
        $user->bio = $validated['bio'] ?? $user->bio;
        $user->save();

        // Update data profil vendor jika user adalah mitra vendor
        if ($user->isVendor() && $user->vendor) {
            $vendor = $user->vendor;
            if (! empty($validated['business_name'])) {
                $vendor->business_name = $validated['business_name'];
            }
            if (isset($validated['description'])) {
                $vendor->description = $validated['description'];
            }
            if (isset($validated['contact_number'])) {
                $vendor->contact_number = $validated['contact_number'];
            }
            if (isset($validated['address'])) {
                $vendor->address = $validated['address'];
            }
            if (! empty($user->avatar_url)) {
                $vendor->image_url = $user->avatar_url;
            }
            if (isset($validated['bank_name'])) {
                $vendor->bank_name = $validated['bank_name'];
            }
            if (isset($validated['bank_account_number'])) {
                $vendor->bank_account_number = $validated['bank_account_number'];
            }
            if (isset($validated['bank_account_holder'])) {
                $vendor->bank_account_holder = $validated['bank_account_holder'];
            }
            $vendor->save();
        }

        if ($user->isVendor()) {
            $user->load('vendor');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user,
        ]);
    }

    /**
     * Memperbarui kata sandi akun pengguna setelah memverifikasi kata sandi lama.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Kata sandi saat ini yang Anda masukkan salah.'],
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
