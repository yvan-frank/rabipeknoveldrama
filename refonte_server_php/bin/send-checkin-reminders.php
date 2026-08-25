<?php

declare(strict_types=1);

/**
 * Équivalent CLI du cron node-cron de server.ts ('0 19 * * *' — 19h chaque
 * jour, heure du serveur) : relance les utilisateurs dont la série de
 * check-in est encore "sauvable" avant la fin de journée. À planifier via
 * une tâche cron système (crontab/Planificateur de tâches), ce scaffold PHP
 * n'ayant pas de process persistant capable de porter un scheduler interne.
 *
 * Exemple crontab : 0 19 * * * php /chemin/vers/bin/send-checkin-reminders.php
 *
 * Usage : php bin/send-checkin-reminders.php
 */

use App\Config\Env;
use App\Lib\Logger;
use App\Modules\Notifications\NotificationsService;

require dirname(__DIR__) . '/vendor/autoload.php';

Env::boot(dirname(__DIR__));

$result = NotificationsService::sendCheckInReminders();

Logger::info('Relances check-in envoyées', $result);
fwrite(STDOUT, "{$result['usersNotified']} utilisateur(s) relancé(s).\n");
