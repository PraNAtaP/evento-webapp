<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\AdminAlertNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class AdminNotificationService
{
    /**
     * Send in-app database notification to all active EO admin users.
     *
     * @param  array<string, mixed>  $metadata
     */
    public static function notifyAdmins(
        string $title,
        string $message,
        string $category = 'general',
        ?string $actionUrl = null,
        array $metadata = []
    ): void {
        try {
            $adminUsers = User::where('role', 'eo')->get();
            if ($adminUsers->isEmpty()) {
                return;
            }

            Notification::send($adminUsers, new AdminAlertNotification(
                title: $title,
                message: $message,
                category: $category,
                actionUrl: $actionUrl,
                metadata: $metadata
            ));
        } catch (\Throwable $e) {
            Log::warning('Gagal mendistribusikan notifikasi internal admin: '.$e->getMessage());
        }
    }
}
