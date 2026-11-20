<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\CustomerVerificationMail;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class EmailVerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(Request $request, int|string $id, string $hash): JsonResponse|RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Tautan verifikasi tidak valid atau telah kedaluwarsa.',
                    'verified' => false,
                ], 403);
            }

            return redirect('/login?verified=invalid');
        }

        $user = User::findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Hash verifikasi email tidak valid.',
                    'verified' => false,
                ], 403);
            }

            return redirect('/login?verified=invalid');
        }

        if ($user->hasVerifiedEmail()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Alamat email sudah diverifikasi sebelumnya.',
                    'verified' => true,
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            $redirectPath = $user->role === 'vendor' ? '/vendor/dashboard' : '/client/dashboard';

            return redirect("{$redirectPath}?verified=already&token={$token}");
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Alamat email berhasil diverifikasi.',
                'verified' => true,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $redirectPath = $user->role === 'vendor' ? '/vendor/dashboard' : '/client/dashboard';

        return redirect("{$redirectPath}?verified=1&token={$token}");
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            $validated = $request->validate([
                'email' => ['required', 'string', 'email', 'exists:users,email'],
            ], [
                'email.required' => 'Alamat email wajib diisi.',
                'email.email' => 'Format alamat email tidak valid.',
                'email.exists' => 'Akun dengan alamat email tersebut tidak ditemukan.',
            ]);

            $user = User::where('email', $validated['email'])->first();
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Alamat email ini sudah terverifikasi sebelumnya.',
            ], 400);
        }

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        try {
            Mail::to($user->email)->send(new CustomerVerificationMail($user, $verificationUrl));
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim ulang email verifikasi ke {$user->email}: ".$e->getMessage());

            return response()->json([
                'message' => 'Gagal mengirim email verifikasi. Server email SMTP mengalami kendala koneksi atau autentikasi.',
            ], 500);
        }

        return response()->json([
            'message' => 'Tautan verifikasi baru berhasil dikirim ke alamat email Anda.',
        ]);
    }

    /**
     * Check verification status for the authenticated user or by email query.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user && $request->filled('email')) {
            $user = User::where('email', $request->query('email'))->first();
        }

        if (! $user) {
            return response()->json([
                'verified' => false,
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        $isVerified = $user->hasVerifiedEmail();
        $token = null;

        if ($isVerified && ! $request->user()) {
            $token = $user->createToken('auth_token')->plainTextToken;
        }

        return response()->json([
            'verified' => $isVerified,
            'email' => $user->email,
            'role' => $user->role,
            'token' => $token,
        ]);
    }
}
