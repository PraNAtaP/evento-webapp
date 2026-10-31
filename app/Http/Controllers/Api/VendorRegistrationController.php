<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class VendorRegistrationController extends Controller
{
    /**
     * Handle public registration for a new vendor account and business profile.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'business_name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'max:50'],
            'contact_number' => ['required', 'string', 'max:20'],
            'address' => ['required', 'string'],
            'social_media' => ['required', 'string', 'max:255'],
            'agreement' => ['accepted'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:255'],
        ], [
            'email.unique' => 'Alamat email ini sudah terdaftar di sistem EVENTO.',
            'password.min' => 'Kata sandi minimal harus terdiri dari 8 karakter.',
            'business_name.required' => 'Nama bisnis atau usaha vendor wajib diisi.',
            'category.required' => 'Kategori layanan vendor wajib dipilih.',
            'contact_number.required' => 'Nomor kontak / WhatsApp vendor wajib diisi.',
            'address.required' => 'Alamat lengkap vendor wajib diisi.',
            'social_media.required' => 'Media sosial (Instagram / TikTok / Website) wajib diisi untuk verifikasi kurator EO.',
            'agreement.accepted' => 'Anda wajib menyetujui syarat & ketentuan kemitraan vendor EVENTO.',
        ]);

        $result = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'vendor',
            ]);

            $vendor = Vendor::create([
                'user_id' => $user->id,
                'business_name' => $validated['business_name'],
                'category' => $validated['category'],
                'contact_number' => $validated['contact_number'],
                'address' => $validated['address'],
                'social_media' => $validated['social_media'],
                'agreement_accepted_at' => now(),
                'description' => $validated['description'] ?? null,
                'image_url' => $validated['image_url'] ?? null,
                'status' => Vendor::STATUS_PENDING,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user,
                'vendor' => $vendor,
                'token' => $token,
            ];
        });

        return response()->json([
            'message' => 'Pendaftaran vendor berhasil diajukan! Profil Anda sedang dalam tahap peninjauan oleh tim EO EVENTO.',
            'token' => $result['token'],
            'user' => [
                'id' => $result['user']->id,
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'role' => $result['user']->role,
                'vendor' => [
                    'id' => $result['vendor']->id,
                    'business_name' => $result['vendor']->business_name,
                    'category' => $result['vendor']->category,
                    'contact_number' => $result['vendor']->contact_number,
                    'address' => $result['vendor']->address,
                    'social_media' => $result['vendor']->social_media,
                    'agreement_accepted_at' => $result['vendor']->agreement_accepted_at,
                    'description' => $result['vendor']->description,
                    'status' => $result['vendor']->status,
                    'rejection_reason' => $result['vendor']->rejection_reason,
                    'created_at' => $result['vendor']->created_at,
                ],
            ],
        ], 201);
    }
}
