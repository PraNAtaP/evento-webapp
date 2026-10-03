<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\EventSummaryController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('api.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me'])->name('api.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/admin/event-summary', [EventSummaryController::class, 'index'])->name('api.admin.event-summary');

    // Booking Acara (Modul Klien)
    Route::get('/bookings/booked-dates', [BookingController::class, 'bookedDates'])->name('api.bookings.booked-dates');
    Route::post('/bookings', [BookingController::class, 'store'])->middleware('role:client')->name('api.bookings.store');
});
