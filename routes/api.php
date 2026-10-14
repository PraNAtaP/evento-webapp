<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\ClientEventController;
use App\Http\Controllers\Api\EventSummaryController;
use App\Http\Controllers\Api\KanbanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\VendorJobController;
use App\Http\Controllers\Api\VendorPackageController;
use App\Http\Controllers\Api\VendorProgressController;
use App\Http\Controllers\SeasonController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('api.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me'])->name('api.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    // Widget Musim (perkiraan musim Open-Meteo)
    Route::post('/musim', SeasonController::class)
        ->middleware('throttle:30,1')
        ->name('api.musim');

    // Dashboard Analitik EO
    Route::get('/admin/event-summary', [EventSummaryController::class, 'index'])
        ->name('api.admin.event-summary');

    // Modul Kanban Acara (EO)
    Route::middleware('role:eo')->group(function () {
        Route::get('/admin/kanban', [KanbanController::class, 'index'])
            ->name('api.admin.kanban.index');
        Route::patch('/admin/kanban/{event}/move', [KanbanController::class, 'move'])
            ->name('api.admin.kanban.move');
    });

    // Booking Acara (Modul Klien - Dian)
    Route::get('/bookings/booked-dates', [BookingController::class, 'bookedDates'])
        ->name('api.bookings.booked-dates');
    Route::post('/bookings', [BookingController::class, 'store'])
        ->middleware('role:client')
        ->name('api.bookings.store');

    // Event & Review Penawaran (Modul Klien)
    Route::middleware('role:client')->group(function () {
        Route::get('/client/events', [ClientEventController::class, 'index'])
            ->name('api.client.events.index');
        Route::get('/client/events/{event}', [ClientEventController::class, 'show'])
            ->name('api.client.events.show');
        Route::post('/client/events/{event}/approve-quotation', [ClientEventController::class, 'approveQuotation'])
            ->name('api.client.events.approve-quotation');
        Route::post('/client/events/{event}/request-revision', [ClientEventController::class, 'requestRevision'])
            ->name('api.client.events.request-revision');
    });

    // Modul Vendor Packages (Agnes)
    Route::get('/vendor/packages', [VendorPackageController::class, 'index'])
        ->name('api.vendor.packages.index');
    Route::post('/vendor/packages', [VendorPackageController::class, 'store'])
        ->name('api.vendor.packages.store');
    Route::put('/vendor/packages/{vendorPackage}', [VendorPackageController::class, 'update'])
        ->name('api.vendor.packages.update');
    Route::delete('/vendor/packages/{vendorPackage}', [VendorPackageController::class, 'destroy'])
        ->name('api.vendor.packages.destroy');

    // Modul Vendor Job Response (Agnes)
    Route::middleware('role:vendor')->group(function () {
        Route::get('/vendor/job-offers', [VendorJobController::class, 'index'])
            ->name('api.vendor.job-offers.index');

        Route::patch('/vendor/job-offers/{assignment}/response', [VendorJobController::class, 'respond'])
            ->name('api.vendor.job-offers.respond');
    });

    // Modul Vendor Progress Update (Agnes)
    Route::middleware('role:vendor')->group(function () {
        Route::get('/vendor/active-jobs', [VendorProgressController::class, 'index'])
            ->name('api.vendor.active-jobs.index');

        Route::post('/vendor/active-jobs/{assignment}/progress', [VendorProgressController::class, 'store'])
            ->name('api.vendor.active-jobs.progress.store');
    });

    // Modul Payment Tracking (Nety)
    Route::get('/payments', [PaymentController::class, 'index'])
        ->name('api.payments.index');
    Route::post('/payments/{payment}/proof', [PaymentController::class, 'uploadProof'])
        ->name('api.payments.upload-proof');
    Route::patch('/payments/{payment}/verify', [PaymentController::class, 'verify'])
        ->name('api.payments.verify');
});
