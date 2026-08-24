import { LegalPage, type LegalBlock } from '../../src/components/LegalPage';

// Contenu repris à l'identique de refonte_rabi_frontend (app/mentions-legales/page.js)
// pour rester juridiquement cohérent entre le web et le mobile.
const blocks: LegalBlock[] = [
  {
    type: 'paragraph',
    text: "En vertu de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique, il est précisé aux utilisateurs du site www.rabipeknovel.com l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :",
  },
  {
    type: 'callout',
    blocks: [
      { type: 'heading', text: 'Propriétaire et/ou éditeur' },
      {
        type: 'paragraph',
        text: 'Propriétaire et/ou éditeur du site : RabipekNovel SARL. Capital Social : neuf cent cinquante mille francs (950 000) FCFA. RCCM : CM-DLA-03-2024-B12-00323. Durée : 99 ans. Nom de l’actionnaire majoritaire (Gérante) : PEKA RABIATOU. Code de l’activité : G470206.',
      },
      { type: 'paragraph', text: 'Adresse éditeur : Logpom, derrière station Neptune.' },
      { type: 'paragraph', text: 'Présidente Fondatrice : PEKA RABIATOU' },
    ],
  },
  {
    type: 'callout',
    blocks: [
      { type: 'heading', text: 'Informations personnelles' },
      {
        type: 'paragraph',
        text: "Conformément à la règlementation en vigueur en la matière, RabipekNovel a effectué auprès de la juridiction camerounaise une déclaration du site internet www.rabipeknovel.com. Cette déclaration a été enregistrée sous le numéro de récépissé : CM-DLA-03-2024-B12-00323",
      },
      { type: 'heading', text: 'Rectification des informations nominatives collectées' },
      { type: 'paragraph', text: 'Au Cameroun, les données personnelles sont notamment protégées par la loi n°. Ci-après :' },
      {
        type: 'list',
        items: [
          'L’utilisateur désigne « l’internaute se connectant, utilisant le site www.rabipeknovel.com ».',
          "Les informations personnelles désignent « les informations qui permettent, sous quelque forme que ce soit, directement ou non, l'identification des personnes physiques auxquelles elles s'appliquent »",
        ],
      },
      { type: 'paragraph', text: "Les informations personnelles de l'utilisateur du site www.rabipeknovel.com :" },
      {
        type: 'list',
        items: [
          "ne sont ni collectées ni publiées à l'insu de l'utilisateur",
          "ne sont pas échangées, transférées, cédées ou vendues sur un support quelconque à des tiers. Seule l'hypothèse du rachat de Les Editions du Net et de ses droits permettrait la transmission desdites informations à l'éventuel acquéreur qui serait à son tour tenu de la même obligation de conservation et de modification des données vis à vis de l'utilisateur du site",
        ],
      },
      {
        type: 'paragraph',
        text: "Au demeurant RabipekNovel est autorisé à effectuer des études et analyses statistiques sur l'utilisation et la typologie des utilisateurs du site www.rabipeknovel.com, sous réserve de confirmer l'anonymat de ces derniers.",
      },
      { type: 'paragraph', text: "A l'occasion de l'utilisation du site www.rabipeknovel.com, sont notamment recueillies les données suivantes :" },
      {
        type: 'list',
        items: [
          "l'adresse Internet URL des liens par l'intermédiaire desquels l'utilisateur a accédé au site www.rabipeknovel.com",
          "Le fournisseur d'accès de l'utilisateur",
          'La configuration technique du navigateur',
        ],
      },
      {
        type: 'paragraph',
        text: "En tout état de cause RabipekNovel ne collecte des informations personnelles relatives à l'utilisateur (nom, adresse électronique, coordonnées téléphoniques) que pour le besoin des services proposés par le site www.rabipeknovel.com. L'utilisateur fournit ces informations en toute connaissance de cause, notamment lorsqu'il procède par lui-même à leur saisie. Il est alors précisé à l'utilisateur du site www.rabipeknovel.com le caractère obligatoire ou non des informations qu'il serait amené à fournir.",
      },
      { type: 'heading', text: 'Rectification des informations nominatives collectées' },
      {
        type: 'paragraph',
        text: 'Conformément à la loi dite "Informatique et Libertés" (art. 34 de la loi n° 48-87 du 6 janvier 1978), l\'utilisateur dispose d\'un droit de modification des données nominatives collectées le concernant. Pour ce faire, l\'utilisateur envoie à RabipekNovel :',
      },
      { type: 'contactEmails', intro: 'Un courrier électronique à l’adresse :', emails: ['rabipek@yahoo.fr', 'rabipeknovel@gmail.com'] },
      {
        type: 'paragraph',
        text: "La modification interviendra dans des délais raisonnables à compter de la réception de la demande de l'utilisateur.",
      },
      { type: 'heading', text: "Utilisation de l'adresse électronique" },
      {
        type: 'paragraph',
        text: 'Si vous souhaitez utiliser le courrier électronique mis à votre disposition sur ce site, vous êtes informés, que le secret des correspondances transmises sur le réseau Internet n’est pas garanti.',
      },
    ],
  },
];

export default function MentionsLegalesScreen() {
  return <LegalPage title="Mentions légales" blocks={blocks} />;
}
