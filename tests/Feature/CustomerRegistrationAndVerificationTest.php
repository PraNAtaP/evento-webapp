<?php

namespace Tests\Feature;

use App\Mail\CustomerVerificationMail;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class CustomerRegistrationAndVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_successfully_and_receives_verification_email(): void
    {
        Mail::fake();

        $payload = [
            'name' => 'Maya Anggraini',
            'email' => 'maya@evento.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'token',
                'email_sent',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'email_verified_at',
                    'is_email_verified',
                ],
            ])
            ->assertJsonPath('user.name', 'Maya Anggraini')
            ->assertJsonPath('user.email', 'maya@evento.test')
            ->assertJsonPath('user.role', 'client')
            ->assertJsonPath('user.is_email_verified', false);

        $this->assertDatabaseHas('users', [
            'email' => 'maya@evento.test',
            'role' => 'client',
            'email_verified_at' => null,
        ]);

        Mail::assertSent(CustomerVerificationMail::class, function ($mail) {
            return $mail->hasTo('maya@evento.test')
                && str_contains($mail->verificationUrl, 'email/verify');
        });
    }

    public function test_customer_can_register_via_client_alias_route(): void
    {
        Mail::fake();

        $payload = [
            'name' => 'Rian Sanjaya',
            'email' => 'rian@evento.test',
            'password' => 'secret1234',
            'password_confirmation' => 'secret1234',
        ];

        $response = $this->postJson('/api/register/client', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('user.role', 'client')
            ->assertJsonPath('user.email', 'rian@evento.test');

        $this->assertDatabaseHas('users', [
            'email' => 'rian@evento.test',
            'role' => 'client',
        ]);

        Mail::assertSent(CustomerVerificationMail::class);
    }

    public function test_customer_registration_validates_required_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_customer_registration_validates_password_confirmation_and_minimum_length(): void
    {
        $payload = [
            'name' => 'Doni',
            'email' => 'doni@evento.test',
            'password' => '12345',
            'password_confirmation' => 'mismatch',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_customer_registration_prevents_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'existing@evento.test',
        ]);

        $payload = [
            'name' => 'Existing Person',
            'email' => 'existing@evento.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_customer_can_verify_email_via_valid_signed_url(): void
    {
        Event::fake([Verified::class]);

        $user = User::factory()->unverified()->create([
            'email' => 'unverified@evento.test',
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->get($verificationUrl);

        $response->assertRedirect('/login?verified=1');

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());

        Event::assertDispatched(Verified::class);
    }

    public function test_customer_can_verify_email_via_json_api(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'json@evento.test',
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'api.verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->getJson($verificationUrl);

        $response->assertOk()
            ->assertJson([
                'message' => 'Alamat email berhasil diverifikasi.',
                'verified' => true,
            ]);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_email_verification_fails_with_invalid_signature(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'hacker@evento.test',
        ]);

        $invalidUrl = "/email/verify/{$user->id}/".sha1($user->email).'?signature=invalidsignature';

        $response = $this->get($invalidUrl);

        $response->assertRedirect('/login?verified=invalid');

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_email_verification_fails_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'wronghash@evento.test',
        ]);

        $invalidUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => 'invalid-hash-string',
            ]
        );

        $response = $this->get($invalidUrl);

        $response->assertRedirect('/login?verified=invalid');

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_email_verification_redirects_gracefully_if_already_verified(): void
    {
        $user = User::factory()->create([
            'email' => 'already@evento.test',
            'email_verified_at' => now(),
        ]);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $user->id,
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );

        $response = $this->get($verificationUrl);

        $response->assertRedirect('/login?verified=already');
    }

    public function test_unverified_customer_can_request_resend_verification_email(): void
    {
        Mail::fake();

        $user = User::factory()->unverified()->create([
            'email' => 'resend@evento.test',
        ]);

        $response = $this->postJson('/api/email/verification-notification', [
            'email' => 'resend@evento.test',
        ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Tautan verifikasi baru berhasil dikirim ke alamat email Anda.',
            ]);

        Mail::assertSent(CustomerVerificationMail::class, function ($mail) {
            return $mail->hasTo('resend@evento.test');
        });
    }

    public function test_authenticated_unverified_customer_can_resend_verification_email(): void
    {
        Mail::fake();

        $user = User::factory()->unverified()->create([
            'email' => 'auth-resend@evento.test',
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/email/verification-notification');

        $response->assertOk()
            ->assertJson([
                'message' => 'Tautan verifikasi baru berhasil dikirim ke alamat email Anda.',
            ]);

        Mail::assertSent(CustomerVerificationMail::class, function ($mail) {
            return $mail->hasTo('auth-resend@evento.test');
        });
    }

    public function test_verified_customer_cannot_request_resend_verification_email(): void
    {
        $user = User::factory()->create([
            'email' => 'verified@evento.test',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/email/verification-notification', [
            'email' => 'verified@evento.test',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Alamat email ini sudah terverifikasi sebelumnya.',
            ]);
    }
}
