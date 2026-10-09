<?php
return [
 'admin_hash' => '', // Générer avec password_hash : voir README.
 'poll_ms' => 2000, 'max_participants' => 150, 'expiry_days' => 30,
 'max_text' => 80, 'rate_ip' => 1000, 'rate_token' => 40,
 'forbidden_words' => [], 'data_dir' => __DIR__.'/data',
 'rate_salt' => '', // Secret aléatoire local, requis pour hacher les adresses IP.
];
