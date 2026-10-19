<?php
declare(strict_types=1);
require __DIR__ . '/../scripts/installer-test.php';

$root = sys_get_temp_dir() . '/wl-deploiement-' . bin2hex(random_bytes(6));
mkdir($root, 0700);
$checks = 0;
function install_check(bool $condition, string $label): void
{
    global $checks;
    if (!$condition) {
        throw new RuntimeException('Échec : ' . $label);
    }
    $checks++;
    echo 'OK ' . $label . "\n";
}
function install_fixture(string $home): string
{
    mkdir($home . '/www', 0755, true);
    $hash = password_hash('mot-de-passe-fictif-pour-le-test', PASSWORD_DEFAULT);
    file_put_contents($home . '/www/config.php', '<?php return ' . var_export([
        'admin_hash' => $hash, 'secret' => 'secret-de-production-fictif',
        'data_dir' => $home . '/production-data', 'base_url' => 'https://wooclight.alwaysdata.net',
        'responsable' => 'Test fictif', 'purge_days' => 14,
    ], true) . ';');
    return $hash;
}
function install_refuses(callable $call, string $label): void
{
    $refused = false;
    try {
        $call();
    } catch (RuntimeException $error) {
        $refused = true;
    }
    install_check($refused, $label);
}
function install_remove(string $path): void
{
    if (is_dir($path) && !is_link($path)) {
        foreach (array_diff(scandir($path) ?: [], ['.', '..']) as $name) {
            install_remove($path . '/' . $name);
        }
        rmdir($path);
    } else {
        unlink($path);
    }
}
try {
    $home = $root . '/normal';
    $hash = install_fixture($home);
    $productionBefore = file_get_contents($home . '/www/config.php');
    $sha = str_repeat('a', 40);
    wl_install_test($home, $sha);
    $config = require $home . '/www/test-chatgpt/config.php';
    install_check($config['admin_hash'] === $hash, 'le mot de passe animateur reste celui choisi par l’utilisateur');
    install_check(strlen($config['secret']) === 64 && $config['secret'] !== 'secret-de-production-fictif', 'le secret de test est indépendant');
    install_check($config['data_dir'] === $home . '/wooclight-chatgpt-data', 'les données sont hors du site et séparées');
    install_check($config['base_url'] === WL_TEST_URL, 'les invitations ciblent la copie de test');
    install_check($config['purge_days'] === 14, 'la durée choisie est conservée');
    install_check((fileperms($home . '/www/test-chatgpt/config.php') & 0777) === 0600, 'la configuration reste privée');
    install_check(file_get_contents($home . '/www/config.php') === $productionBefore, 'la production reste inchangée');
    $before = file_get_contents($home . '/www/test-chatgpt/config.php');
    wl_install_test($home, str_repeat('b', 40));
    install_check(file_get_contents($home . '/www/test-chatgpt/config.php') === $before, 'une relance conserve le secret et la configuration');
    install_check(trim(file_get_contents($home . '/www/test-chatgpt/version-test.txt')) === str_repeat('b', 40), 'la version publiée est identifiable');
    $unknown = $root . '/unknown';
    install_fixture($unknown);
    mkdir($unknown . '/www/test-chatgpt');
    file_put_contents($unknown . '/www/test-chatgpt/existant.txt', 'à conserver');
    install_refuses(fn() => wl_install_test($unknown, $sha), 'un dossier existant inconnu est refusé');
    install_check(file_get_contents($unknown . '/www/test-chatgpt/existant.txt') === 'à conserver', 'aucun fichier inconnu n’est écrasé');
    $linked = $root . '/linked';
    install_fixture($linked);
    symlink($linked . '/www', $linked . '/www/test-chatgpt');
    install_refuses(fn() => wl_install_test($linked, $sha), 'un lien vers la production est refusé');
    install_refuses(fn() => wl_install_test($home, 'main'), 'une version non figée est refusée');
    echo "Installation isolée : $checks contrôles réussis.\n";
} finally {
    install_remove($root);
}
