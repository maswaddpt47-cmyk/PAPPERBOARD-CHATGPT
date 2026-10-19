<?php
declare(strict_types=1);

// Installation isolée sur le même compte Alwaysdata. Aucun secret n'est affiché.
const WL_TEST_OWNER = "maswaddpt47-cmyk/PAPPERBOARD-CHATGPT\n";
const WL_TEST_URL = 'https://wooclight.alwaysdata.net/test-chatgpt';

function wl_test_read_config(string $file): array
{
    if (!is_file($file) || is_link($file)) {
        throw new RuntimeException('Configuration attendue absente ou liée symboliquement.');
    }
    ob_start();
    try {
        $config = require $file;
    } finally {
        ob_end_clean();
    }
    if (!is_array($config) || password_get_info((string)($config['admin_hash'] ?? ''))['algoName'] === 'unknown') {
        throw new RuntimeException('Configuration animateur invalide.');
    }
    return $config;
}

function wl_test_directory(string $path, int $mode): void
{
    if (is_link($path) || (file_exists($path) && !is_dir($path))) {
        throw new RuntimeException('Chemin de test occupé ou lié symboliquement.');
    }
    $marker = $path . '/.wooclight-chatgpt.json';
    if (is_dir($path)) {
        $files = array_values(array_diff(scandir($path) ?: [], ['.', '..']));
        if ($files && (!is_file($marker) || is_link($marker) || file_get_contents($marker) !== WL_TEST_OWNER)) {
            throw new RuntimeException('Dossier existant non reconnu : installation refusée.');
        }
    } elseif (!mkdir($path, $mode)) {
        throw new RuntimeException('Création du dossier de test impossible.');
    }
    if (file_put_contents($marker, WL_TEST_OWNER, LOCK_EX) === false) {
        throw new RuntimeException('Marquage du dossier de test impossible.');
    }
    chmod($marker, 0600);
}

function wl_install_test(string $home, string $sha): void
{
    if (!preg_match('/^[a-f0-9]{40}$/D', $sha)) {
        throw new RuntimeException('Identifiant de version invalide.');
    }
    $home = realpath($home) ?: '';
    if ($home === '' || !is_dir($home . '/www') || is_link($home . '/www')) {
        throw new RuntimeException('Racine Alwaysdata invalide.');
    }
    $app = $home . '/www/test-chatgpt';
    $data = $home . '/wooclight-chatgpt-data';
    $production = wl_test_read_config($home . '/www/config.php');
    $productionData = (string)($production['data_dir'] ?? '') ?: $home . '/www/data';
    if ($productionData === $data || (realpath($productionData) && realpath($productionData) === realpath($data))) {
        throw new RuntimeException('Les données de test seraient celles de production.');
    }
    // Les contrôles d'appartenance précèdent toute écriture de configuration.
    wl_test_directory($app, 0755);
    wl_test_directory($data, 0700);
    $file = $app . '/config.php';
    if (file_exists($file) || is_link($file)) {
        $config = wl_test_read_config($file);
        if (($config['data_dir'] ?? '') !== $data || ($config['base_url'] ?? '') !== WL_TEST_URL
            || strlen((string)($config['secret'] ?? '')) < 32) {
            throw new RuntimeException('La configuration de test existante est incohérente.');
        }
    } else {
        $config = [
            'admin_hash' => $production['admin_hash'],
            'secret' => bin2hex(random_bytes(32)),
            'data_dir' => $data,
            'base_url' => WL_TEST_URL,
            'purge_days' => max(1, (int)($production['purge_days'] ?? 30)),
        ];
        foreach (['responsable', 'contact', 'base_legale'] as $key) {
            if (isset($production[$key]) && is_string($production[$key])) {
                $config[$key] = $production[$key];
            }
        }
        $temporary = tempnam($app, '.config-');
        if ($temporary === false) {
            throw new RuntimeException('Création de la configuration impossible.');
        }
        chmod($temporary, 0600);
        try {
            if (file_put_contents($temporary, "<?php\nreturn " . var_export($config, true) . ";\n", LOCK_EX) === false
                || !rename($temporary, $file)) {
                throw new RuntimeException('Écriture de la configuration impossible.');
            }
        } finally {
            if (is_file($temporary)) {
                unlink($temporary);
            }
        }
    }
    if (file_put_contents($app . '/version-test.txt', $sha . "\n", LOCK_EX) === false) {
        throw new RuntimeException('Écriture de la version impossible.');
    }
    chmod($app . '/version-test.txt', 0644);
}

if (PHP_SAPI === 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    try {
        wl_install_test((string)getenv('HOME'), (string)($argv[1] ?? ''));
        echo "Configuration de test prête, données séparées.\n";
    } catch (Throwable $error) {
        fwrite(STDERR, $error->getMessage() . "\n");
        exit(1);
    }
}
