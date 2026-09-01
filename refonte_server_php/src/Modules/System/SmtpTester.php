<?php

declare(strict_types=1);

namespace App\Modules\System;

use App\Config\Env;
use App\Lib\SmtpClient;
use Throwable;

/**
 * Test de connexion SMTP (POST /system/smtp-test, admin-only) : rejoue le
 * handshake EHLO/STARTTLS/AUTH LOGIN via SmtpClient sans envoyer de message,
 * et renvoie le détail échange par échange pour diagnostic.
 */
final class SmtpTester
{
    /** @return array{ok:bool, log:string[], error?:string} */
    public static function test(): array
    {
        $config = Env::smtp();
        if ($config['host'] === '' || $config['user'] === '' || $config['password'] === '') {
            return ['ok' => false, 'log' => [], 'error' => 'Configuration SMTP incomplète (host, user ou password manquant dans .env).'];
        }

        $client = new SmtpClient($config);
        try {
            $client->connectAndAuthenticate();
            $client->quit();
            return ['ok' => true, 'log' => $client->getLog()];
        } catch (Throwable $e) {
            return ['ok' => false, 'log' => $client->getLog(), 'error' => $e->getMessage()];
        } finally {
            $client->close();
        }
    }
}
