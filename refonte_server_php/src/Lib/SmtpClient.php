<?php

declare(strict_types=1);

namespace App\Lib;

use RuntimeException;

/**
 * Client SMTP minimal par socket brut (EHLO/STARTTLS/AUTH LOGIN + envoi de
 * message) — pas de librairie mailer (aucune n'est installée, cf.
 * composer.json). Partagé par SmtpTester (diagnostic admin, cf.
 * Modules/System) et Mailer (envoi réel, ex. réinitialisation de mot de
 * passe).
 */
final class SmtpClient
{
    private const TIMEOUT_SECONDS = 10;

    /** @var resource|null */
    private $socket = null;

    /** @var string[] */
    private array $log = [];

    /** @param array{host:string,port:int,user:string,password:string,secure:bool} $config */
    public function __construct(private readonly array $config)
    {
    }

    /** @return string[] */
    public function getLog(): array
    {
        return $this->log;
    }

    /** Connexion + EHLO + STARTTLS (si configuré) + AUTH LOGIN. */
    public function connectAndAuthenticate(): void
    {
        if ($this->config['host'] === '' || $this->config['user'] === '' || $this->config['password'] === '') {
            throw new RuntimeException('Configuration SMTP incomplète (host, user ou password manquant dans .env).');
        }

        // Port 465 : TLS implicite dès la connexion. Tout autre port (587
        // typiquement) : connexion en clair puis upgrade via STARTTLS si
        // SMTP_SECURE=true, comme le fait n'importe quel client mail.
        $useImplicitTls = $this->config['port'] === 465;
        $transport = $useImplicitTls ? 'ssl' : 'tcp';

        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            "{$transport}://{$this->config['host']}:{$this->config['port']}",
            $errno,
            $errstr,
            self::TIMEOUT_SECONDS,
            STREAM_CLIENT_CONNECT,
        );
        if ($socket === false) {
            throw new RuntimeException("Connexion impossible : {$errstr} ({$errno})");
        }
        $this->socket = $socket;
        stream_set_timeout($this->socket, self::TIMEOUT_SECONDS);

        $this->expectCode($this->readResponse(), 220);

        $this->send('EHLO ' . $this->config['host']);
        $this->expectCode($this->readResponse(), 250);

        if (!$useImplicitTls && $this->config['secure']) {
            $this->send('STARTTLS');
            $this->expectCode($this->readResponse(), 220);
            if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Échec de la négociation TLS (STARTTLS).');
            }
            // Un nouveau EHLO est requis après STARTTLS : le serveur peut
            // annoncer des capacités différentes une fois le canal chiffré.
            $this->send('EHLO ' . $this->config['host']);
            $this->expectCode($this->readResponse(), 250);
        }

        $this->send('AUTH LOGIN');
        $this->expectCode($this->readResponse(), 334);

        $this->send(base64_encode($this->config['user']), mask: true);
        $this->expectCode($this->readResponse(), 334);

        $this->send(base64_encode($this->config['password']), mask: true);
        $this->expectCode($this->readResponse(), 235);
    }

    /**
     * Envoie un message texte simple (pas de pièce jointe/HTML — suffisant
     * pour des e-mails transactionnels courts type réinitialisation de mot
     * de passe). Doit être appelé après connectAndAuthenticate().
     */
    public function sendMessage(string $fromAddress, string $fromName, string $to, string $subject, string $textBody): void
    {
        if ($this->socket === null) {
            throw new RuntimeException('sendMessage() appelé avant connectAndAuthenticate().');
        }

        $this->send('MAIL FROM:<' . $fromAddress . '>');
        $this->expectCode($this->readResponse(), 250);

        $this->send('RCPT TO:<' . $to . '>');
        $this->expectCode($this->readResponse(), 250);

        $this->send('DATA');
        $this->expectCode($this->readResponse(), 354);

        $headers = [
            'From: ' . self::encodeHeader($fromName) . ' <' . $fromAddress . '>',
            'To: <' . $to . '>',
            'Subject: ' . self::encodeHeader($subject),
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: 8bit',
            'Date: ' . date('r'),
        ];

        // Un "." seul en début de ligne termine la commande DATA côté
        // protocole SMTP — doublé ici pour qu'une ligne de contenu commençant
        // réellement par un point ne soit jamais interprétée comme la fin.
        $escapedBody = preg_replace('/^\./m', '..', $textBody) ?? $textBody;

        fwrite($this->socket, implode("\r\n", $headers) . "\r\n\r\n" . $escapedBody . "\r\n.\r\n");
        $this->log[] = '> [DATA] ' . $subject;
        $this->expectCode($this->readResponse(), 250);
    }

    public function quit(): void
    {
        if ($this->socket === null) {
            return;
        }
        $this->send('QUIT');
        $this->readResponse();
    }

    public function close(): void
    {
        if (is_resource($this->socket)) {
            fclose($this->socket);
        }
        $this->socket = null;
    }

    private function readLine(): string
    {
        $line = fgets($this->socket, 515);
        if ($line === false) {
            throw new RuntimeException('Connexion interrompue par le serveur SMTP (délai dépassé ou fermeture inattendue).');
        }
        return rtrim($line, "\r\n");
    }

    private function readResponse(): string
    {
        $line = $this->readLine();
        $this->log[] = "< {$line}";
        // Réponse multi-ligne SMTP : "250-..." pour chaque ligne intermédiaire,
        // "250 ..." (espace) pour la dernière — on lit jusqu'à cette dernière.
        while (isset($line[3]) && $line[3] === '-') {
            $line = $this->readLine();
            $this->log[] = "< {$line}";
        }
        return $line;
    }

    private function send(string $line, bool $mask = false): void
    {
        fwrite($this->socket, $line . "\r\n");
        // AUTH LOGIN fait transiter user/password en base64 (pas chiffré en
        // soi, juste encodé) — jamais loggé en clair même si la connexion
        // elle-même est déjà en TLS à ce stade.
        $this->log[] = '> ' . ($mask ? '***' : $line);
    }

    private function expectCode(string $response, int $expected): void
    {
        $code = (int) substr($response, 0, 3);
        if ($code !== $expected) {
            throw new RuntimeException("Réponse inattendue du serveur SMTP (attendu {$expected}) : {$response}");
        }
    }

    // Encodé en MIME "encoded-word" dès qu'un caractère non-ASCII est présent
    // (ex. accents dans "RABIPEKNOVEL"/sujets en français) — sinon un header
    // brut en UTF-8 est invalide au sens RFC 5322 et certains clients mail
    // l'affichent mal.
    private static function encodeHeader(string $value): string
    {
        if (preg_match('/[^\x20-\x7E]/', $value) !== 1) {
            return $value;
        }
        return '=?UTF-8?B?' . base64_encode($value) . '?=';
    }
}
