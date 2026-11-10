<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    /**
     * Send a reset link to the given user email address.
     */
    public function sendResetLinkEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ], [
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Alamat email belum terdaftar di sistem kami. Silakan lakukan pendaftaran akun terlebih dahulu.',
                'not_registered' => true,
            ], 404);
        }

        $token = Password::broker()->createToken($user);
        $expireMinutes = (int) config('auth.passwords.users.expire', 60);

        $resetUrl = url('/reset-password?token='.$token.'&email='.urlencode($user->email));

        try {
            Mail::to($user->email)->send(new ResetPasswordMail($user, $resetUrl, $expireMinutes));
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email reset password ke {$user->email}: ".$e->getMessage());
        }

        return response()->json([
            'message' => 'Tautan untuk mengatur ulang kata sandi telah dikirim ke email Anda. Silakan cek kotak masuk atau folder spam Anda.',
        ]);
    }

    /**
     * Reset the given user's password.
     */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'token.required' => 'Token pengaturan ulang kata sandi tidak ditemukan atau tidak valid.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal harus terdiri dari 8 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Hardening: Cabut seluruh token Sanctum yang aktif saat kata sandi diubah
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
            ]);
        }

        return response()->json([
            'message' => 'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permohonan baru.',
        ], 422);
    }
}
