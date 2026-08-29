import { LegalPage, type LegalBlock } from '../../src/components/LegalPage';

// Contenu repris à l'identique de refonte_frontend_php
// (resources/views/static/terms-of-use.php) — distinctes des CGV (achat,
// cf. cgv.tsx) et des mentions légales (identité de l'éditeur).
const blocks: LegalBlock[] = [
  { type: 'heading', text: 'ARTICLE 1 - OBJET' },
  {
    type: 'paragraph',
    text: "Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'usage du site et de l'application RabipekNovel (le « Service »), édités par RABIPEKNOVEL. Elles sont distinctes des conditions générales de vente, qui régissent spécifiquement les achats de livres et de points, et des mentions légales, qui identifient l'éditeur du site. Toute utilisation du Service implique l'acceptation pleine et entière des présentes CGU.",
  },
  { type: 'heading', text: 'ARTICLE 2 - ACCÈS AU SERVICE' },
  {
    type: 'list',
    items: [
      "Une partie du catalogue et des fonctionnalités (lecture de certains contenus, accumulation de points de bonus) est accessible sans création de compte, via une identité « invité » attribuée automatiquement.",
      "L'accès à certaines fonctionnalités (bibliothèque personnelle, achats, publication en tant qu'auteur, conservation durable de la progression) nécessite la création d'un compte, par email/mot de passe ou via un fournisseur d'identité tiers (Google).",
      "RABIPEKNOVEL se réserve le droit de suspendre ou restreindre temporairement l'accès au Service pour des raisons de maintenance, de sécurité ou de force majeure, sans que cela n'engage sa responsabilité.",
    ],
  },
  { type: 'heading', text: 'ARTICLE 3 - COMPTE UTILISATEUR' },
  {
    type: 'list',
    items: [
      "L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à les maintenir à jour. Il est seul responsable de la confidentialité de ses identifiants et de toute activité effectuée depuis son compte.",
      "Un compte invité peut être converti en compte permanent (inscription) sans perte des points déjà acquis.",
      "RABIPEKNOVEL se réserve le droit de suspendre ou de supprimer tout compte en cas de manquement aux présentes CGU, d'usage frauduleux, ou à la demande de son titulaire.",
    ],
  },
  { type: 'heading', text: 'ARTICLE 4 - SYSTÈME DE POINTS ET BONUS' },
  {
    type: 'list',
    items: [
      "Le Service propose un système de points gagnés par certaines actions (connexion quotidienne, lecture d'articles, temps de lecture, visionnage de publicités) et utilisables pour débloquer des chapitres payants.",
      "Les points n'ont aucune valeur monétaire, ne sont ni cessibles ni remboursables, et RABIPEKNOVEL se réserve le droit d'en modifier les règles d'acquisition ou d'usage à tout moment, sans effet rétroactif sur le solde déjà acquis.",
      "Toute tentative de contournement automatisé ou frauduleux du système de points entraîne la suspension du compte concerné et l'annulation des points obtenus de manière illégitime.",
    ],
  },
  { type: 'heading', text: 'ARTICLE 5 - CONTENUS ET PROPRIÉTÉ INTELLECTUELLE' },
  {
    type: 'list',
    items: [
      "Les œuvres publiées sur RabipekNovel (textes, couvertures, illustrations) sont protégées par le droit d'auteur et restent la propriété de leurs auteurs respectifs ou de RABIPEKNOVEL selon les accords conclus avec les auteurs de la plateforme.",
      "Toute reproduction, extraction, diffusion ou exploitation commerciale des contenus, en tout ou partie, sans autorisation préalable écrite, est strictement interdite.",
      "L'accès à un chapitre (gratuit, payant, ou débloqué par des points) confère un droit de lecture personnel, non transférable, et ne constitue en aucun cas un transfert de droits sur l'œuvre.",
    ],
  },
  { type: 'heading', text: 'ARTICLE 6 - COMPORTEMENT DE L\'UTILISATEUR' },
  {
    type: 'list',
    items: [
      'Publier ou transmettre des contenus illicites, diffamatoires, haineux ou portant atteinte aux droits de tiers.',
      "Usurper l'identité d'un tiers ou fournir de fausses informations.",
      'Perturber le fonctionnement du Service (tentative d\'intrusion, extraction automatisée de contenu, contournement des mesures de protection).',
      'Utiliser le Service à des fins commerciales non autorisées.',
    ],
  },
  {
    type: 'paragraph',
    text: 'Tout manquement peut entraîner, sans préavis, la suppression du contenu concerné et/ou la suspension du compte de l\'utilisateur.',
  },
  { type: 'heading', text: 'ARTICLE 7 - COMPTE AUTEUR' },
  {
    type: 'paragraph',
    text: "Les auteurs publiant sur RabipekNovel restent seuls responsables du contenu qu'ils mettent en ligne et garantissent détenir les droits nécessaires à sa publication. La vérification d'identité (KYC) préalable à la publication vise à limiter les usages frauduleux et ne constitue pas une validation éditoriale du contenu par RABIPEKNOVEL.",
  },
  { type: 'heading', text: 'ARTICLE 8 - RESPONSABILITÉ' },
  {
    type: 'paragraph',
    text: "RABIPEKNOVEL met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du Service, sans garantie de continuité absolue. RABIPEKNOVEL ne saurait être tenu responsable des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le Service, ni du contenu publié par des tiers (auteurs, autres utilisateurs).",
  },
  { type: 'heading', text: 'ARTICLE 9 - MODIFICATION DES CGU' },
  {
    type: 'paragraph',
    text: "RABIPEKNOVEL se réserve le droit de modifier les présentes CGU à tout moment. La version applicable est celle publiée sur le site à la date de connexion de l'utilisateur. Une utilisation continue du Service après modification vaut acceptation des nouvelles conditions.",
  },
  { type: 'heading', text: 'ARTICLE 10 - DROIT APPLICABLE - LITIGES' },
  {
    type: 'paragraph',
    text: 'Les présentes CGU sont soumises au droit camerounais. En cas de litige, et à défaut de résolution amiable, les tribunaux camerounais seront seuls compétents.',
  },
];

export default function CguScreen() {
  return <LegalPage title="Conditions générales d'utilisation" blocks={blocks} />;
}
