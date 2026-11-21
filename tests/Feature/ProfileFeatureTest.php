<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_their_profile(): void
    {
        $user = User::factory()->create([
            'role' => 'client',
            'phone' => '08123456789',
        ]);

        $response = $this->actingAs($user)->getJson('/api/profile');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.phone', '08123456789');
    }

    public function test_user_can_update_their_profile(): void
    {
        $user = User::factory()->create([
            'role' => 'client',
            'name' => 'Nama Awal',
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile', [
            'name' => 'Nama Baru Diperbarui',
            'phone' => '08987654321',
            'address' => 'Jl. Pengujian No. 123',
            'bio' => 'Ini bio pengujian.',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Nama Baru Diperbarui')
            ->assertJsonPath('data.phone', '08987654321');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nama Baru Diperbarui',
            'phone' => '08987654321',
            'address' => 'Jl. Pengujian No. 123',
        ]);
    }

    public function test_user_can_change_their_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('passwordLama123'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile/change-password', [
            'current_password' => 'passwordLama123',
            'password' => 'passwordBaru123',
            'password_confirmation' => 'passwordBaru123',
        ]);

        $response->assertOk()
            ->assertJsonPath('status', 'success');

        $user->refresh();
        $this->assertTrue(Hash::check('passwordBaru123', $user->password));
    }

    public function test_user_cannot_change_password_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('passwordBenar123'),
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile/change-password', [
            'current_password' => 'passwordSalah123',
            'password' => 'passwordBaru123',
            'password_confirmation' => 'passwordBaru123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('current_password');
    }
}
