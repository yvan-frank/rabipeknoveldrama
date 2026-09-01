<?php

declare(strict_types=1);

namespace App\Lib;

use App\Config\Env;
use RuntimeException;
use Throwable;

/**
 * Envoi d'e-mails transactionnels via le compte SMTP configuré en .env
 * (SMTP_* / MAIL_FROM_*) — cf. SmtpClient pour le détail du protocole.
 */
final class Mailer
{
    /** @throws RuntimeException si l'envoi échoue (connexion, auth, refus du destinataire...) */
    public static function send(string $to, string $subject, string $textBody): void
    {
        $config = Env::smtp();
        $client = new SmtpClient($config);

        try {
            $client->connectAndAuthenticate();
            $client->sendMessage($config['fromAddress'], $config['fromName'], $to, $subject, $textBody);
            $client->quit();
        } catch (Throwable $e) {
            throw new RuntimeException("Envoi d'e-mail impossible : {$e->getMessage()}", previous: $e);
        } finally {
            $client->close();
        }
    }
}
