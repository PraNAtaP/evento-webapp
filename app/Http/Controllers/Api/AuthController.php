<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang Anda masukkan salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $vendorData = null;
        if ($user->vendor) {
            $vendorData = [
                'id' => $user->vendor->id,
                'business_name' => $user->vendor->business_name,
                'category' => $user->vendor->category,
                'contact_number' => $user->vendor->contact_number,
                'address' => $user->vendor->address,
                'status' => $user->vendor->status,
                'rejection_reason' => $user->vendor->rejection_reason,
            ];
        }

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'vendor' => $vendorData,
            ],
        ]);
    }

    /**
     * Get the authenticated User.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $vendorData = null;
        if ($user->vendor) {
            $vendorData = [
                'id' => $user->vendor->id,
                'business_name' => $user->vendor->business_name,
                'category' => $user->vendor->category,
                'contact_number' => $user->vendor->contact_number,
                'address' => $user->vendor->address,
                'status' => $user->vendor->status,
                'rejection_reason' => $user->vendor->rejection_reason,
            ];
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'vendor' => $vendorData,
            ],
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }
}
