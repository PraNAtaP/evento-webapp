<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAccountManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Pengguna tanpa autentikasi tidak dapat mengakses endpoint kelola admin.
     */
    public function test_unauthenticated_user_cannot_access_admin_endpoints(): void
    {
        $this->getJson('/api/admin/admins')->assertUnauthorized();
        $this->postJson('/api/admin/admins', [])->assertUnauthorized();
    }

    /**
     * Pengguna dengan role non-EO (klien & vendor) dilarang mengakses endpoint kelola admin.
     */
    public function test_non_eo_cannot_access_admin_endpoints(): void
    {
        $client = User::factory()->client()->create();
        $vendor = User::factory()->vendor()->create();

        $this->actingAs($client, 'sanctum')
            ->getJson('/api/admin/admins')
            ->assertForbidden();

        $this->actingAs($vendor, 'sanctum')
            ->postJson('/api/admin/admins', [
                'name' => 'Admin Baru',
                'email' => 'admin@evento.test',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
            ])
            ->assertForbidden();
    }

    /**
     * EO dapat melihat daftar akun admin dan melakukan filter pencarian.
     */
    public function test_eo_can_list_admin_accounts_and_search(): void
    {
        $eo1 = User::factory()->eo()->create(['name' => 'Budi Santoso', 'email' => 'budi@evento.test']);
        $eo2 = User::factory()->eo()->create(['name' => 'Siti Rahma', 'email' => 'siti@evento.test']);
        User::factory()->client()->create(['name' => 'Client Test']);

        $response = $this->actingAs($eo1, 'sanctum')
            ->getJson('/api/admin/admins');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('total', 2);

        // Uji fitur pencarian berdasarkan nama
        $searchResponse = $this->actingAs($eo1, 'sanctum')
            ->getJson('/api/admin/admins?search=Siti');

        $searchResponse->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Siti Rahma');
    }

    /**
     * EO dapat membuat akun admin baru dengan data valid.
     */
    public function test_eo_can_create_new_admin_account_with_valid_data(): void
    {
        $eo = User::factory()->eo()->create();

        $payload = [
            'name' => 'Dina Kartika',
            'email' => 'dina.admin@evento.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/admins', $payload);

        $response->assertCreated()
            ->assertJsonPath('message', 'Akun admin baru berhasil dibuat.')
            ->assertJsonPath('data.name', 'Dina Kartika')
            ->assertJsonPath('data.email', 'dina.admin@evento.test')
            ->assertJsonPath('data.role', 'eo');

        $this->assertDatabaseHas('users', [
            'name' => 'Dina Kartika',
            'email' => 'dina.admin@evento.test',
            'role' => 'eo',
        ]);

        $created = User::where('email', 'dina.admin@evento.test')->first();
        $this->assertNotNull($created);
        $this->assertTrue(Hash::check('password123', $created->password));
    }

    /**
     * Pembuatan admin baru gagal jika email sudah terdaftar.
     */
    public function test_eo_cannot_create_admin_with_duplicate_email(): void
    {
        $eo = User::factory()->eo()->create(['email' => 'existing@evento.test']);

        $response = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/admins', [
                'name' => 'Admin Kloning',
                'email' => 'existing@evento.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * Pembuatan admin baru gagal jika konfirmasi password tidak cocok atau kurang dari 8 karakter.
     */
    public function test_eo_cannot_create_admin_with_invalid_password(): void
    {
        $eo = User::factory()->eo()->create();

        // Kurang dari 8 karakter
        $responseShort = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/admins', [
                'name' => 'Short Pass',
                'email' => 'short@evento.test',
                'password' => '1234',
                'password_confirmation' => '1234',
            ]);

        $responseShort->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // Password tidak cocok
        $responseMismatch = $this->actingAs($eo, 'sanctum')
            ->postJson('/api/admin/admins', [
                'name' => 'Mismatch Pass',
                'email' => 'mismatch@evento.test',
                'password' => 'password123',
                'password_confirmation' => 'password999',
            ]);

        $responseMismatch->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /**
     * EO dapat melihat detail satu akun admin.
     */
    public function test_eo_can_show_admin_details(): void
    {
        $eo1 = User::factory()->eo()->create();
        $eo2 = User::factory()->eo()->create(['name' => 'Rina Admin']);

        $response = $this->actingAs($eo1, 'sanctum')
            ->getJson("/api/admin/admins/{$eo2->id}");

        $response->assertOk()
            ->assertJsonPath('data.name', 'Rina Admin');
    }

    /**
     * EO dapat memperbarui akun admin, baik tanpa password baru maupun dengan password baru.
     */
    public function test_eo_can_update_admin_account(): void
    {
        $currentEo = User::factory()->eo()->create();
        $targetEo = User::factory()->eo()->create([
            'name' => 'Nama Lama',
            'email' => 'lama@evento.test',
            'password' => Hash::make('oldpassword'),
        ]);

        // Update tanpa ganti password
        $response = $this->actingAs($currentEo, 'sanctum')
            ->putJson("/api/admin/admins/{$targetEo->id}", [
                'name' => 'Nama Baru',
                'email' => 'baru@evento.test',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Akun admin berhasil diperbarui.')
            ->assertJsonPath('data.name', 'Nama Baru')
            ->assertJsonPath('data.email', 'baru@evento.test');

        $this->assertDatabaseHas('users', [
            'id' => $targetEo->id,
            'name' => 'Nama Baru',
            'email' => 'baru@evento.test',
        ]);

        // Password lama tetap valid
        $this->assertTrue(Hash::check('oldpassword', $targetEo->fresh()->password));

        // Update beserta ganti password
        $this->actingAs($currentEo, 'sanctum')
            ->putJson("/api/admin/admins/{$targetEo->id}", [
                'name' => 'Nama Baru Final',
                'email' => 'baru@evento.test',
                'password' => 'newsecret123',
                'password_confirmation' => 'newsecret123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('newsecret123', $targetEo->fresh()->password));
    }

    /**
     * EO tidak diperkenankan menghapus akunnya sendiri yang sedang aktif.
     */
    public function test_eo_cannot_delete_their_own_account(): void
    {
        $eo1 = User::factory()->eo()->create();
        User::factory()->eo()->create(); // ada admin lain

        $response = $this->actingAs($eo1, 'sanctum')
            ->deleteJson("/api/admin/admins/{$eo1->id}");

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');

        $this->assertDatabaseHas('users', ['id' => $eo1->id]);
    }

    /**
     * EO tidak dapat menghapus satu-satunya akun admin yang tersisa.
     */
    public function test_eo_cannot_delete_the_last_remaining_admin(): void
    {
        $eoSingle = User::factory()->eo()->create();

        // Buat EO lain sementara untuk mengeksekusi request, lalu coba hapus eoSingle saat tersisa 1
        $response = $this->actingAs($eoSingle, 'sanctum')
            ->deleteJson("/api/admin/admins/{$eoSingle->id}");

        $response->assertStatus(422);
    }

    /**
     * EO dapat menghapus akun admin lain dengan sukses.
     */
    public function test_eo_can_delete_another_admin(): void
    {
        $currentEo = User::factory()->eo()->create();
        $otherEo = User::factory()->eo()->create();

        $response = $this->actingAs($currentEo, 'sanctum')
            ->deleteJson("/api/admin/admins/{$otherEo->id}");

        $response->assertOk()
            ->assertJsonPath('message', 'Akun admin berhasil dihapus.');

        $this->assertDatabaseMissing('users', ['id' => $otherEo->id]);
    }
}
