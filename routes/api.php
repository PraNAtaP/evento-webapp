    <?php

    use App\Http\Controllers\Api\AuthController;
    use App\Http\Controllers\Api\EventSummaryController;
    use App\Http\Controllers\Api\PaymentController;
    use Illuminate\Support\Facades\Route;

    Route::post('/login', [AuthController::class, 'login'])->name('api.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'me'])->name('api.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

        Route::get('/admin/event-summary', [EventSummaryController::class, 'index'])
            ->name('api.admin.event-summary');

        // Payment Tracking
        Route::get('/payments', [PaymentController::class, 'index'])
            ->name('api.payments.index');

        Route::post('/payments/{payment}/proof', [PaymentController::class, 'uploadProof'])
            ->name('api.payments.upload-proof');

        Route::patch('/payments/{payment}/verify', [PaymentController::class, 'verify'])
            ->name('api.payments.verify');
    });