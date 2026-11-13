<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends User
{
    use SoftDeletes;

    /**
     * Menggunakan tabel users untuk menyimpan data akun Client.
     */
    protected $table = 'users';

    /**
     * Mengatur tipe data atribut akun Client.
     */
    protected function casts(): array
    {
        return [
            ...parent::casts(),
            'deleted_at' => 'datetime',
        ];
    }
}