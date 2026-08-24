import { LegalPage, type LegalBlock } from '../../src/components/LegalPage';

// Contenu repris à l'identique de refonte_rabi_frontend
// (app/politique-confidentialite/page.js).
const blocks: LegalBlock[] = [
  {
    type: 'paragraph',
    text: "Toute personne qui accède au site www.rabipeknovel.com s'engage à respecter les présentes conditions d'utilisation, qui pourront pour certains services être complétées par des conditions particulières. Les données diffusées sur le réseau internet et extranet peuvent être réglementées en termes d'usage ou être protégées par un droit de propriété. Toute personne est responsable des données qu'elle diffuse, utilise et/ou transfère et s'engage à ce titre à respecter la réglementation en vigueur, notamment celle relative aux contenus manifestement illicites (pédophilie, incitation à la haine raciale...) ou la protection des droits des tiers (droits de propriété intellectuelle...). Rabipeknovel n'est pas responsable de l'usage des données, du contenu diffusé ou des prestations d'une autre personne et qui, notamment, ne respecterait pas la réglementation en vigueur.",
  },
  { type: 'heading', text: 'Accès au site' },
  {
    type: 'paragraph',
    text: "Le site www.rabipeknovel.com est accessible à l'utilisateur 24h/24, 7j/7 sauf précisions contraires. La responsabilité de RabipekNovel ne peut être engagée en raison d'une indisponibilité technique de la connexion, qu'elle soit due notamment à un cas de force majeure, à une maintenance, à une mise à jour, à une modification du site, à une intervention de l'hébergeur, à une grève interne ou externe, à une panne de réseau, à une coupure d'alimentation électrique, ou encore à une mauvaise configuration ou utilisation de l'ordinateur de l'utilisateur.",
  },
  { type: 'heading', text: "Droits d'auteur" },
  {
    type: 'paragraph',
    text: "La totalité des éléments du site www.rabipeknovel.com, notamment les textes, présentations, illustrations, photographies, documents téléchargeables, représentations iconographiques, marques commerciales (déposés par RabipekNovel ou éventuellement par un de ses partenaires), arborescences et mises en forme sont, sauf documents publics et précisions complémentaires, la propriété intellectuelle exclusive de RabipekNovel ou de ses partenaires. A ce titre, leurs représentations, reproductions, imbrications, diffusions et rediffusions, partielles ou totales, sont interdites conformément aux dispositions de l'article L. 122-4 du Code de la propriété intellectuelle. Toute personne y procédant sans pouvoir justifier d'une autorisation préalable et expresse du détenteur de ces droits encourt les peines relatives au délit de contrefaçon prévues aux articles L. 335-2 et suivants du Code de la propriété intellectuelle. En outre, les représentations, reproductions, imbrications, diffusions et rediffusions, partielles ou totales, de la base de données contenue dans le site www.rabipeknovel.com sont interdites en vertu des dispositions de la règlementation en vigueur en la matière relative à la protection juridique des bases de données. En tout état de cause, sur toute copie autorisée de tout ou partie du contenu du site, devra figurer la mention « Copyright 2024 - RabipekNovel - tous droits réservés ».",
  },
  { type: 'heading', text: 'Validité des informations fournies' },
  { type: 'paragraph', text: "Dans l'hypothèse où l'utilisateur serait amené à fournir des informations, il s'engage à :" },
  {
    type: 'list',
    items: [
      "délivrer des informations réelles, exactes, à jour au moment de leur saisie dans le formulaire d'inscription du service, et notamment à ne pas utiliser de faux noms ou adresses, ou encore des noms ou adresses sans y être autorisé",
      "maintenir à jour les données d'inscriptions en vue de garantir en permanence leur caractère réel, exact et à jour",
      'ne pas rendre disponible ou distribuer des informations illégales, répréhensibles (telles que des informations diffamatoires ou obscènes) ou encore nuisibles (telles que les virus)',
    ],
  },
  {
    type: 'paragraph',
    text: "En cas de violation de ces dispositions, RabipekNovel sera en mesure de suspendre ou de résilier l'accès de l'utilisateur aux services à ses torts exclusifs.",
  },
  { type: 'heading', text: "Limitation de responsabilité - Conduite de l'utilisateur" },
  {
    type: 'paragraph',
    text: "L'utilisateur admet expressément utiliser le site www.rabipeknovel.com à ses propres risques et sous sa responsabilité exclusive. Le site www.rabipeknovel.com fournit à l'utilisateur des informations à titre indicatif, en l'état, avec toutes leurs imperfections. En outre, ces informations doivent être prises en considération au moment de leur mise en ligne et non au moment de la consultation du site. En tout état de cause, RabipekNovel ne pourra en aucun cas être tenue responsable :",
  },
  {
    type: 'list',
    items: [
      "de tout dommage direct ou indirect, notamment en ce qui concerne les pertes de profits, le manque à gagner, les pertes de clientèle, de données pouvant entre autres résulter de l'utilisation du site www.rabipeknovel.com, ou au contraire de l'impossibilité de son utilisation",
      "d'un dysfonctionnement, d'une indisponibilité d'accès, d'une mauvaise utilisation, d'une mauvaise configuration de l'ordinateur de l'utilisateur, ou encore de l'emploi d'un navigateur peu usité par l'utilisateur",
      "du contenu des publicités et autres liens ou sources externes accessibles par l'utilisateur à partir du site www.rabipeknovel.com",
    ],
  },
  {
    type: 'paragraph',
    text: "L'utilisateur s'engage à ne pas diffuser des propos, opinions ou informations à caractère diffamatoire, obscène, violent, raciste et plus généralement contrevenant aux textes en vigueur, aux droits des personnes et aux bonnes mœurs.",
  },
  { type: 'heading', text: 'Liens hypertexte' },
  {
    type: 'paragraph',
    text: "Tout webmaster qui souhaiterait établir un lien à partir de son site vers le site www.rabipeknovel.com est tenu d'obtenir une autorisation expresse préalable en la sollicitant à l'adresse électronique. En tout état de cause, le webmaster qui créerait un lien hypertexte s'engage à ne pas utiliser la technique du lien profond (« deep linking »), technique selon laquelle les pages du site www.rabipeknovel.com sont imbriquées à l'intérieur des pages du site du webmaster. L'utilisateur qui serait redirigé vers une tierce page Internet par l'intermédiaire d'un lien hypertexte figurant sur le site www.rabipeknovel.com reconnaît que RabipekNovel ne maîtrise pas le contenu des sites de redirection. En conséquence, RabipekNovel ne pourra en aucun cas être tenue responsable d'éventuels dommages directs ou indirects du fait de l'utilisation de sites accessibles via les liens hypertextes contenus sur le site www.rabipeknovel.com.",
  },
  { type: 'heading', text: 'Nature publicitaire du contenu' },
  {
    type: 'paragraph',
    text: "En tout état de cause, RabipekNovel informe le cas échéant l'internaute de la nature publicitaire des contenus du site www.rabipeknovel.com. Le site www.rabipeknovel.com peut contenir des publicités. RabipekNovel ne pourra en aucun cas être tenue responsable ni du contenu des publicités ni des conséquences d'une éventuelle relation contractuelle entre l'utilisateur du www.rabipeknovel.com et la personne ayant diffusé la publicité.",
  },
  { type: 'heading', text: 'Utilisations des coordonnées figurant dans le site' },
  {
    type: 'paragraph',
    text: "RabipekNovel interdit l'utilisation des coordonnées figurant sur le site www.rabipeknovel.com en vue d'un démarchage, d'une sollicitation publicitaire ou à toute autre fin commerciale.",
  },
  { type: 'heading', text: "Droits d'auteur" },
  {
    type: 'paragraph',
    text: "Ce site respecte le droit d'auteur. Tous les droits des auteurs des Œuvres protégées reproduites et communiquées sur ce site, sont réservés. Sauf autorisation, toute utilisation des œuvres autres que la reproduction et la consultation individuelles et privées sont interdites.",
  },
];

export default function PolitiqueConfidentialiteScreen() {
  return <LegalPage title="Politique de confidentialité & Conditions d'utilisation" blocks={blocks} />;
}
