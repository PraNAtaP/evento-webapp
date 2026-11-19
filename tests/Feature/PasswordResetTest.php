<?php

namespace Tests\Feature;

use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_password_reset_link_and_receives_email(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'email' => 'client.reset@evento.test',
        ]);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'client.reset@evento.test',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['message']);

        Mail::assertSent(ResetPasswordMail::class, function ($mail) use ($user) {
            return $mail->hasTo($user->email)
                && str_contains($mail->resetUrl, '/reset-password?token=')
                && str_contains($mail->resetUrl, urlencode($user->email));
        });

        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'client.reset@evento.test',
        ]);
    }

    public function test_non_existent_email_returns_error_notifying_unregistered_account(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'nonexistent@evento.test',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Alamat email belum terdaftar di sistem kami. Silakan lakukan pendaftaran akun terlebih dahulu.',
                'not_registered' => true,
            ]);

        Mail::assertNothingSent();

        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'nonexistent@evento.test',
        ]);
    }

    public function test_forgot_password_requires_valid_email(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_reset_password_with_valid_token_and_revokes_active_tokens(): void
    {
        Event::fake([PasswordReset::class]);

        $user = User::factory()->create([
            'email' => 'user.change@evento.test',
            'password' => Hash::make('oldpassword123'),
        ]);

        // Simulasikan user memiliki token Sanctum aktif sebelumnya
        $user->createToken('device_1');
        $user->createToken('device_2');
        $this->assertCount(2, $user->tokens);

        $token = Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'user.change@evento.test',
            'password' => 'newbrandpassword123',
            'password_confirmation' => 'newbrandpassword123',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.',
            ]);

        // Pastikan password di database sudah berubah
        $this->assertTrue(Hash::check('newbrandpassword123', $user->fresh()->password));
        $this->assertFalse(Hash::check('oldpassword123', $user->fresh()->password));

        // Pastikan token Sanctum sebelumnya dicabut (Hardening)
        $this->assertCount(0, $user->fresh()->tokens);

        // Pastikan token reset dihapus dari database (single-use)
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'user.change@evento.test',
        ]);

        Event::assertDispatched(PasswordReset::class);
    }

    public function test_cannot_reset_password_with_invalid_token(): void
    {
        $user = User::factory()->create([
            'email' => 'user.invalid@evento.test',
            'password' => Hash::make('originalpassword'),
        ]);

        $response = $this->postJson('/api/reset-password', [
            'token' => 'invalid-token-string-123456',
            'email' => 'user.invalid@evento.test',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permohonan baru.',
            ]);

        $this->assertTrue(Hash::check('originalpassword', $user->fresh()->password));
    }

    public function test_reset_password_validates_password_confirmation_and_minimum_length(): void
    {
        $response = $this->postJson('/api/reset-password', [
            'token' => 'some-token',
            'email' => 'user@evento.test',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_token_cannot_be_reused_after_successful_reset(): void
    {
        $user = User::factory()->create([
            'email' => 'singleuse@evento.test',
            'password' => Hash::make('firstpassword'),
        ]);

        $token = Password::broker()->createToken($user);

        // Reset pertama (sukses)
        $firstResponse = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'singleuse@evento.test',
            'password' => 'secondpassword123',
            'password_confirmation' => 'secondpassword123',
        ]);
        $firstResponse->assertOk();

        // Reset kedua dengan token yang sama (harus ditolak)
        $secondResponse = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'singleuse@evento.test',
            'password' => 'thirdpassword123',
            'password_confirmation' => 'thirdpassword123',
        ]);
        $secondResponse->assertStatus(422);

        // Password tetap yang kedua
        $this->assertTrue(Hash::check('secondpassword123', $user->fresh()->password));
    }
}
