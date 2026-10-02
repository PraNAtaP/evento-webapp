<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventSummaryController;
use App\Http\Controllers\Api\VendorPackageController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->name('api.login');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me'])->name('api.me');
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
    Route::get('/admin/event-summary', [EventSummaryController::class, 'index'])->name('api.admin.event-summary');

    Route::get('/vendor/packages', [VendorPackageController::class, 'index'])
    ->name('api.vendor.packages.index');

    Route::post('/vendor/packages', [VendorPackageController::class, 'store'])
    ->name('api.vendor.packages.store');

    Route::put('/vendor/packages/{vendorPackage}', [VendorPackageController::class, 'update'])
    ->name('api.vendor.packages.update');

    Route::delete('/vendor/packages/{vendorPackage}', [VendorPackageController::class, 'destroy'])
    ->name('api.vendor.packages.destroy');
});
