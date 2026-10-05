<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\EventSummaryController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\VendorPackageController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('api.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me'])->name('api.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    // Dashboard Analitik EO
    Route::get('/admin/event-summary', [EventSummaryController::class, 'index'])
        ->name('api.admin.event-summary');

    // Booking Acara (Modul Klien - Dian)
    Route::get('/bookings/booked-dates', [BookingController::class, 'bookedDates'])
        ->name('api.bookings.booked-dates');
    Route::post('/bookings', [BookingController::class, 'store'])
        ->middleware('role:client')
        ->name('api.bookings.store');

    // Modul Vendor Packages (Agnes)
    Route::get('/vendor/packages', [VendorPackageController::class, 'index'])
        ->name('api.vendor.packages.index');
    Route::post('/vendor/packages', [VendorPackageController::class, 'store'])
        ->name('api.vendor.packages.store');
    Route::put('/vendor/packages/{vendorPackage}', [VendorPackageController::class, 'update'])
        ->name('api.vendor.packages.update');
    Route::delete('/vendor/packages/{vendorPackage}', [VendorPackageController::class, 'destroy'])
        ->name('api.vendor.packages.destroy');

    // Modul Payment Tracking (Nety)
    Route::get('/payments', [PaymentController::class, 'index'])
        ->name('api.payments.index');
    Route::post('/payments/{payment}/proof', [PaymentController::class, 'uploadProof'])
        ->name('api.payments.upload-proof');
    Route::patch('/payments/{payment}/verify', [PaymentController::class, 'verify'])
        ->name('api.payments.verify');
});