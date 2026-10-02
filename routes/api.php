<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventSummaryController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('api.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me'])->name('api.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/admin/event-summary', [EventSummaryController::class, 'index'])->name('api.admin.event-summary');
});
