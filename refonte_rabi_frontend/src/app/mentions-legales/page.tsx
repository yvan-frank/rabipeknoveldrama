import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  openGraph: { type: 'website', url: 'https://rabipeknovel.com/mentions-legales', images: [{ url: 'https://rabipeknovel.com/images/rabipek-about-hero.png', width: 1200, height: 984, alt: 'RabipekNovel' }] },
  alternates: { canonical: '/mentions-legales' },
  title: 'Mentions légales | Rabipek',
  description: "La modification interviendra dans des délais raisonnables à compter de la réception de la demande de l'utilisateur.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions légales de RabipekNovel">
      <p>
        En vertu de l&apos;article 6 de la loi <strong>n° 2004-575 du 21 juin 2004</strong> pour la confiance dans
        l&apos;économie numérique, il est précisé aux utilisateurs du site www.rabipeknovel.com l&apos;identité des
        différents intervenants dans le cadre de sa réalisation et de son suivi :
      </p>

      <h2>Propriétaire et/ou éditeur</h2>
      <p>
        Propriétaire et/ou éditeur du site : RabipekNovel SARL. Capital Social : neuf cent cinquante mille francs
        (950 000) FCFA. RCCM : CM-DLA-03-2024-B12-00323. Durée : 99 ans. Nom de l&apos;actionnaire majoritaire
        (Gérante) : PEKA RABIATOU. Code de l&apos;activité : G470206.
      </p>
      <p>
        <strong>Adresse éditeur</strong> : Logpom, derrière station Neptune.
      </p>
      <p>
        <strong>Présidente Fondatrice</strong> : PEKA RABIATOU
      </p>

      <h2>Informations personnelles</h2>
      <p>
        Conformément à la règlementation en vigueur en la matière, RabipekNovel a effectué auprès de la juridiction
        camerounaise une déclaration du site internet www.rabipeknovel.com. Cette déclaration a été enregistrée sous
        le numéro de récépissé : CM-DLA-03-2024-B12-00323.
      </p>

      <h3>Rectification des informations nominatives collectées</h3>
      <p>Au Cameroun, les données personnelles sont notamment protégées par la loi n°. Ci-après :</p>
      <ul>
        <li>L&apos;utilisateur désigne « l&apos;internaute se connectant, utilisant le site www.rabipeknovel.com ».</li>
        <li>
          Les informations personnelles désignent « les informations qui permettent, sous quelque forme que ce
          soit, directement ou non, l&apos;identification des personnes physiques auxquelles elles s&apos;appliquent ».
        </li>
      </ul>
      <p>Les informations personnelles de l&apos;utilisateur du site www.rabipeknovel.com :</p>
      <ul>
        <li>ne sont ni collectées ni publiées à l&apos;insu de l&apos;utilisateur ;</li>
        <li>
          ne sont pas échangées, transférées, cédées ou vendues sur un support quelconque à des tiers. Seule
          l&apos;hypothèse du rachat de RabipekNovel et de ses droits permettrait la transmission desdites
          informations à l&apos;éventuel acquéreur, qui serait à son tour tenu de la même obligation de conservation
          et de modification des données vis-à-vis de l&apos;utilisateur du site.
        </li>
      </ul>
      <p>
        Au demeurant, RabipekNovel est autorisé à effectuer des études et analyses statistiques sur
        l&apos;utilisation et la typologie des utilisateurs du site www.rabipeknovel.com, sous réserve de confirmer
        l&apos;anonymat de ces derniers.
      </p>
      <p>À l&apos;occasion de l&apos;utilisation du site www.rabipeknovel.com, sont notamment recueillies les données suivantes :</p>
      <ul>
        <li>l&apos;adresse Internet URL des liens par l&apos;intermédiaire desquels l&apos;utilisateur a accédé au site ;</li>
        <li>le fournisseur d&apos;accès de l&apos;utilisateur ;</li>
        <li>la configuration technique du navigateur.</li>
      </ul>
      <p>
        En tout état de cause, RabipekNovel ne collecte des informations personnelles relatives à l&apos;utilisateur
        (nom, adresse électronique, coordonnées téléphoniques) que pour le besoin des services proposés par le site
        www.rabipeknovel.com. L&apos;utilisateur fournit ces informations en toute connaissance de cause, notamment
        lorsqu&apos;il procède par lui-même à leur saisie. Il est alors précisé à l&apos;utilisateur le caractère
        obligatoire ou non des informations qu&apos;il serait amené à fournir.
      </p>

      <h3>Rectification des informations nominatives collectées</h3>
      <p>
        Conformément à la loi dite « Informatique et Libertés » (art. 34 de la loi n° 48-87 du 6 janvier 1978),
        l&apos;utilisateur dispose d&apos;un droit de modification des données nominatives collectées le concernant.
        Pour ce faire, l&apos;utilisateur envoie à RabipekNovel un courrier électronique à l&apos;adresse{' '}
        <a href="mailto:rabipek@yahoo.fr">rabipek@yahoo.fr</a> ou{' '}
        <a href="mailto:rabipeknovel@gmail.com">rabipeknovel@gmail.com</a>. La modification interviendra dans des
        délais raisonnables à compter de la réception de la demande de l&apos;utilisateur.
      </p>

      <h3>Utilisation de l&apos;adresse électronique</h3>
      <p>
        Si vous souhaitez utiliser le courrier électronique mis à votre disposition sur ce site, vous êtes informés
        que le secret des correspondances transmises sur le réseau Internet n&apos;est pas garanti.
      </p>
    </LegalPageLayout>
  );
}
