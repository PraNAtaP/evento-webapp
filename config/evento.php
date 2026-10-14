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
];
