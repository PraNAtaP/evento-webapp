<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Down Payment (DP) Percentage
    |--------------------------------------------------------------------------
    |
    | Persentase default pembayaran uang muka (DP) dari nilai kontrak (agreed_price).
    | Bernilai antara 10 sampai 100 persen (default: 30%).
    |
    */
    'dp_percentage' => (float) env('EVENTO_DP_PERCENTAGE', 30.0),

    /*
    |--------------------------------------------------------------------------
    | Batas Hari Pembatalan (DP Hangus)
    |--------------------------------------------------------------------------
    |
    | Jika sisa hari menuju event_date <= nilai ini, DP dianggap hangus (forfeited)
    | saat klien mengajukan pembatalan. Default: 30 hari.
    |
    */
    'cancellation_dp_forfeit_days' => (int) env('EVENTO_DP_FORFEIT_DAYS', 30),
];
