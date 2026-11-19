<?php

use App\Http\Controllers\Api\EmailVerificationController;
use Illuminate\Support\Facades\Route;

Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->name('verification.verify');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
