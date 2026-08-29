import { LegalPage, type LegalBlock } from '../../src/components/LegalPage';

// Contenu identique à refonte_frontend_php
// (resources/views/static/privacy-policy.php).
const blocks: LegalBlock[] = [
  {
    type: 'paragraph',
    text: "Cette politique explique quelles données personnelles RabipekNovel collecte via le site et l'application mobile RabipekNovel (le « Service »), pourquoi, combien de temps elles sont conservées, avec qui elles sont partagées, et comment les consulter, corriger ou supprimer. Elle est distincte des conditions générales d'utilisation, qui régissent l'usage du Service, et des mentions légales, qui identifient l'éditeur du site.",
  },
  { type: 'heading', text: 'Article 1 — Responsable du traitement' },
  {
    type: 'paragraph',
    text: "Le responsable du traitement des données décrites ci-dessous est RabipekNovel SARL (RCCM CM-DLA-03-2024-B12-00323), Logpom, derrière station Neptune. Pour toute question relative à vos données personnelles, vous pouvez écrire à rabipeknovel@gmail.com ou rabipek@yahoo.fr.",
  },
  { type: 'heading', text: 'Article 2 — Données collectées' },
  { type: 'paragraph', text: 'Selon la façon dont vous utilisez le Service, RabipekNovel collecte :' },
  {
    type: 'list',
    items: [
      'Compte créé par email : nom affiché, adresse email, mot de passe (stocké sous forme chiffrée, jamais en clair), adresse IP au moment de l\'inscription.',
      "Connexion avec Google : nom et adresse email transmis par Google au moment de la connexion. RabipekNovel ne reçoit ni ne conserve votre mot de passe Google, ni votre photo de profil Google.",
      "Compte invité : une partie du catalogue est accessible sans inscription. Un identifiant « invité » est alors généré côté serveur, sans email ni mot de passe, uniquement pour mémoriser votre progression et vos points de bonus le temps de votre visite ou jusqu'à ce que vous créiez un vrai compte.",
      "Compte auteur et vérification d'identité (KYC) : pour publier un livre, un auteur doit fournir nom complet, civilité, pays, adresse, numéro de téléphone, un document d'identité (carte nationale, passeport ou équivalent) et, le cas échéant, une photo de ce document. Cette vérification sert uniquement à limiter les usages frauduleux du compte auteur et n'est jamais utilisée à d'autres fins.",
      "Notifications : si vous autorisez les notifications sur l'application mobile, un identifiant technique (« jeton push ») fourni par votre appareil est associé à votre compte pour vous envoyer des notifications (nouveau chapitre, réponse à un avis, etc.).",
      "Données techniques et de lecture : pages et livres consultés, pays et type d'appareil approximatifs, horodatage — utilisées de façon agrégée pour mesurer l'audience et améliorer le catalogue, sans profil publicitaire ni revente à des tiers.",
    ],
  },
  {
    type: 'paragraph',
    text: "RabipekNovel ne collecte aucune donnée bancaire ou de paiement : les fonctionnalités d'achat de points et d'abonnement affichées dans l'application ne sont pas encore actives.",
  },
  { type: 'heading', text: 'Article 3 — Finalités et base du traitement' },
  { type: 'paragraph', text: 'Ces données sont utilisées pour :' },
  {
    type: 'list',
    items: [
      'créer et sécuriser votre compte, et vous permettre de vous reconnecter (exécution du contrat de service) ;',
      'mémoriser votre progression de lecture et votre solde de points ;',
      "vérifier l'identité des auteurs avant publication, pour limiter la fraude et l'usurpation d'identité ;",
      'vous envoyer des notifications que vous avez autorisées ;',
      "mesurer l'audience et améliorer le Service ;",
      "répondre à nos obligations légales, notamment en cas de demande d'une autorité compétente.",
    ],
  },
  { type: 'heading', text: 'Article 4 — Durée de conservation' },
  {
    type: 'list',
    items: [
      "Les données d'un compte actif sont conservées tant que le compte existe.",
      "Un compte invité inactif et non converti en compte permanent est purgé automatiquement après une période d'inactivité prolongée.",
      "En cas de suppression de compte (voir Article 7), les données sont désactivées immédiatement puis supprimées définitivement à l'issue d'un délai limité, sauf obligation légale de conservation plus longue (par exemple en cas de litige en cours).",
      "Les documents d'identité fournis pour la vérification KYC sont conservés le temps nécessaire à cette vérification et à la lutte contre la fraude, puis supprimés.",
    ],
  },
  { type: 'heading', text: 'Article 5 — Partage des données' },
  {
    type: 'paragraph',
    text: 'RabipekNovel ne vend ni ne loue vos données personnelles. Elles peuvent être partagées uniquement avec :',
  },
  {
    type: 'list',
    items: [
      'notre hébergeur, qui stocke les données sur ses serveurs pour le fonctionnement technique du Service ;',
      'Google, uniquement pour vérifier votre identité lorsque vous utilisez « Continuer avec Google » ;',
      'une autorité compétente, si la loi nous y oblige.',
    ],
  },
  {
    type: 'paragraph',
    text: 'En cas de rachat de RabipekNovel, les données pourraient être transmises au repreneur, qui resterait tenu par la présente politique.',
  },
  { type: 'heading', text: 'Article 6 — Cookies et identifiants techniques' },
  {
    type: 'paragraph',
    text: "Le site utilise un unique cookie de session, strictement nécessaire pour vous garder connecté ; il n'est ni lu ni transmis à des régies publicitaires. RabipekNovel n'utilise aucun cookie de mesure d'audience tiers ni de traceur publicitaire. L'application mobile utilise l'équivalent technique (jeton stocké sur l'appareil) pour la même finalité.",
  },
  { type: 'heading', text: 'Article 7 — Vos droits' },
  { type: 'paragraph', text: 'Vous pouvez à tout moment :' },
  {
    type: 'list',
    items: [
      'consulter et corriger les informations de votre profil depuis votre tableau de bord ;',
      "supprimer votre compte et les données associées, directement depuis l'application (Paramètres → Supprimer mon compte) ou depuis le site, sans avoir besoin d'installer l'application, via rabipeknovel.com/supprimer-mon-compte ;",
      'demander une copie de vos données ou poser toute question en écrivant à rabipeknovel@gmail.com.',
    ],
  },
  { type: 'paragraph', text: 'Nous répondons à toute demande dans un délai raisonnable.' },
  { type: 'heading', text: 'Article 8 — Contenu réservé aux adultes' },
  {
    type: 'paragraph',
    text: "Certains livres sont marqués comme réservés à un public adulte. L'accès à ces livres nécessite de confirmer son année de naissance ; cette confirmation est mémorisée sur l'appareil et n'est jamais transmise à RabipekNovel ni associée à votre compte.",
  },
  { type: 'heading', text: 'Article 9 — Sécurité' },
  {
    type: 'paragraph',
    text: "RabipekNovel met en œuvre des mesures raisonnables pour protéger vos données (mots de passe chiffrés, accès restreint aux données sensibles, connexions chiffrées). Aucun système n'étant infaillible, nous vous invitons à utiliser un mot de passe unique et à nous signaler tout usage suspect de votre compte.",
  },
  { type: 'heading', text: 'Article 10 — Modification de cette politique' },
  {
    type: 'paragraph',
    text: 'Cette politique peut être mise à jour pour refléter une évolution du Service ou de la réglementation. La version applicable est celle publiée sur cette page à la date de votre utilisation du Service.',
  },
];

export default function PolitiqueConfidentialiteScreen() {
  return <LegalPage title="Politique de confidentialité" blocks={blocks} />;
}
