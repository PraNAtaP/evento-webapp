<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mengatur tipe data atribut pada model User.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Memeriksa apakah email pengguna sudah diverifikasi.
     */
    public function isEmailVerified(): bool
    {
        return ! is_null($this->email_verified_at);
    }

    /**
     * Memeriksa apakah pengguna memiliki peran Client.
     */
    public function isClient(): bool
    {
        return $this->role === 'client';
    }

    /**
     * Memeriksa apakah pengguna memiliki peran EO.
     */
    public function isEo(): bool
    {
        return $this->role === 'eo';
    }

    /**
     * Memeriksa apakah pengguna memiliki peran Vendor.
     */
    public function isVendor(): bool
    {
        return $this->role === 'vendor';
    }

    /**
     * Mengambil seluruh event yang dimiliki Client.
     *
     * @return HasMany<Event, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'client_id');
    }

    /**
     * Mengambil profil Vendor yang dimiliki pengguna.
     *
     * @return HasOne<Vendor, $this>
     */
    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class);
    }
}