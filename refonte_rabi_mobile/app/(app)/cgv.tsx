import { LegalPage, type LegalBlock } from '../../src/components/LegalPage';

// Contenu repris à l'identique de refonte_rabi_frontend
// (app/conditions-generales-de-vente/page.js).
const blocks: LegalBlock[] = [
  { type: 'heading', text: 'ARTICLE 1 - PRIX' },
  {
    type: 'list',
    items: [
      "1.1 - Les prix de nos produits sont indiqués en FCFA toutes taxes comprises hors participation aux frais de traitement. En ce qui concerne le prix du livre, celui-ci est établi dans le strict respect de la loi N°96/06 du 8 août 1996 sur la promotion des livres et de la lecture au Cameroun.",
      "1.2 - RABIPEKNOVEL se réserve le droit de modifier ses prix à tout moment mais les produits seront facturés sur la base des tarifs en vigueur au moment de l'enregistrement des commandes.",
    ],
  },
  { type: 'heading', text: 'ARTICLE 2 - COMMANDE' },
  {
    type: 'paragraph',
    text: "Les informations contractuelles sont présentées en langue française et peuvent faire l'objet d'une confirmation reprenant ces informations contractuelles au plus tard au moment de la livraison. RABIPEKNOVEL se réserve le droit d'annuler ou de refuser toute commande d'un client avec lequel il existerait un litige relatif au paiement d'une commande antérieure.",
  },
  { type: 'heading', text: 'ARTICLE 3 - VALIDATION' },
  {
    type: 'paragraph',
    text: "Vous déclarez avoir pris connaissance et accepté les présentes Conditions générales de vente avant la passation de votre commande. La validation de votre commande vaut donc acceptation de ces conditions générales de vente. Sauf preuve contraire, les données enregistrées constituent la preuve de l'ensemble des transactions passées par RABIPEKNOVEL et ses clients.",
  },
  { type: 'heading', text: 'ARTICLE 4 - DISPONIBILITÉ' },
  {
    type: 'paragraph',
    text: "Nos offres de produits et prix sont valables tant qu'ils sont visibles sur le site. Dans ce cadre, des indications sur la disponibilité des produits vous sont fournies au moment de la passation de votre commande. Dans l'éventualité d'une indisponibilité de produit après passation de votre commande, votre commande sera automatiquement annulée et vous serez immédiatement remboursé si votre compte bancaire a été débité.",
  },
  { type: 'heading', text: 'ARTICLE 5 - LIVRAISON' },
  {
    type: 'paragraph',
    text: "Les produits sont automatiquement disponibles après paiement en ligne. En acceptant de payer un produit vous consentez être intéressé par l'achat du produit en l'état. Une fois le livre ouvert en ligne vous ne pouvez plus réclamer de remboursement. Vous pouvez annuler votre commande et demander le remboursement du produit si le livre n'a pas été ouvert par votre compte en ligne. Dans ce cas, RABIPEKNOVEL rembourse vos frais déboursés.",
  },
  { type: 'heading', text: 'ARTICLE 6 - PAIEMENT' },
  {
    type: 'paragraph',
    text: 'Pour tout paiement international, le débit de la carte ou de votre compte est effectué directement à la commande. Pour les paiements nationaux (Cameroun et sous-région Afrique centrale) le paiement peuvent se faire par mobile suivant les opérateurs affichés sur notre plateforme. Les virements sont aussi acceptés.',
  },
  { type: 'heading', text: 'ARTICLE 7 - SECURISATION' },
  {
    type: 'paragraph',
    text: "Notre site fait l'objet d'un système de sécurisation. Nous avons adopté la norme de sécurité standard de cryptage PCI DSS, mais nous avons aussi renforcé l'ensemble des procédés de brouillage et de cryptage pour protéger le plus efficacement possible toutes les données sensibles liées aux moyens de paiement.",
  },
  { type: 'heading', text: 'ARTICLE 8 - CONFORMITÉ DES PRODUITS' },
  {
    type: 'paragraph',
    text: "Nous nous engageons à vous rembourser -ou à vous échanger- les produits non disponibles, ou apparemment défectueux, abîmés ou endommagés. Dans ce cas, nous vous remercions de bien vouloir en faire état de manière détaillée par écrit et de nous renvoyer le ou les produits. RABIPEKNOVEL procédera, à votre choix, à l'échange ou au remboursement du ou des produits. La demande doit être effectuée dans les cinq jours ouvrés suivant l'achat. Toute réclamation formulée hors de ce délai ne pourra être acceptée. Les frais d'envoi vous seront remboursés sur la base du tarif facturé. En tout état de cause, vous bénéficiez des dispositions de la garantie légale notamment celles relatives à la garantie des vices cachés.",
  },
  { type: 'heading', text: 'ARTICLE 9 - REMBOURSEMENT' },
  {
    type: 'paragraph',
    text: "Les remboursements des produits dans les hypothèses visées aux articles 8 et 9 seront effectués dans un délai inférieur ou égal à 30 jours après la réception de la réclamation par nos soins. Le remboursement s'effectuera au choix de RABIPEKNOVEL par crédit sur votre compte bancaire ou par chèque bancaire adressé au nom du client ayant passé la commande et à l'adresse de facturation. Aucun envoi en contre-remboursement ne sera accepté, quel qu'en soit le motif.",
  },
  { type: 'heading', text: 'ARTICLE 10 - DROIT APPLICABLE - LITIGES' },
  {
    type: 'paragraph',
    text: 'Le présent contrat est soumis à la loi Camerounaise. La langue du présent contrat est la langue française. En cas de litige, les tribunaux camerounais seront seuls compétents.',
  },
  { type: 'heading', text: 'ARTICLE 11 - INFORMATIONS NOMINATIVES' },
  {
    type: 'paragraph',
    text: "Les informations et données vous concernant sont nécessaires à la gestion de votre commande et à nos relations commerciales. Elles peuvent être transmises aux sociétés qui contribuent à ces relations telles que celles chargées de l'exécution des services et commandes pour leur gestion, exécution, traitement et paiement. Ces informations et données sont également conservées à des fins de sécurité, afin de respecter les obligations légales et réglementaires et pour nous permettre d'améliorer et personnaliser les services que nous vous proposons ainsi que les informations que nous vous adressons. Conformément à la loi informatique et libertés du 6 janvier 1978, vous disposez d'un droit d'accès et de rectification aux données personnelles vous concernant. Il vous suffit de nous écrire en ligne ou par courrier, en nous indiquant vos noms, prénom, e-mail, adresse et si possible votre référence client.",
  },
];

export default function CgvScreen() {
  return <LegalPage title="Conditions générales de ventes" blocks={blocks} />;
}
