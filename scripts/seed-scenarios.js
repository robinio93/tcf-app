import { createClient } from "@supabase/supabase-js";

// Uses the service role key to bypass RLS for seeding.
// Add SUPABASE_SERVICE_KEY=<your-service-role-key> to your .env
// (found in Supabase dashboard → Settings → API → service_role secret)
const supabaseUrl = "https://xlhdakujfjmsmyvdrcdc.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const scenarios = [
  {
    numero: 1,
    titre: "S'inscrire à un centre de langue française à Montréal",
    consigne: "Vous appelez un centre de formation francophone pour vous renseigner sur leurs cours de français avant de vous inscrire.",
    role_examinateur: "L'examinateur joue le/la conseiller(ère) pédagogique du centre.",
    points_a_penser: [
      "demander les niveaux proposés et le format des cours (présentiel/ligne)",
      "s'informer sur les tarifs, les horaires et la durée des sessions",
      "demander si une attestation officielle est délivrée à la fin"
    ],
    categorie: "Formation",
    emoji_categorie: "🎓",
    points_cles_attendus: [
      "format présentiel ou en ligne",
      "tarifs et forfaits disponibles",
      "horaires et durée des cours",
      "niveau requis pour s'inscrire",
      "attestation ou certification délivrée",
      "réductions pour nouveaux arrivants"
    ],
    erreurs_typiques_b1: [
      "demande juste le prix sans demander ce qui est inclus",
      "oublie de demander l'attestation officielle",
      "ne demande pas s'il y a des réductions pour nouveaux arrivants",
      "questions trop vagues : 'C'est combien ?' au lieu de 'Pourriez-vous me détailler les différentes formules ?'"
    ],
    difference_b1_b2_mauvais: "C'est combien par mois ?",
    difference_b1_b2_bon: "Pourriez-vous me préciser ce qui est inclus dans le tarif mensuel, notamment les supports pédagogiques et l'accès aux ressources en ligne ?",
    dialogue_a2: `Examinateur : Bonjour, Centre Francophonie Montréal, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... cours français. Vous avez ?\nExaminateur : Oui bien sûr, nous proposons plusieurs niveaux. Quel est votre niveau actuel ?\nCandidat : Je sais pas. Débutant peut-être.\nExaminateur : D'accord, et vous préférez des cours en présentiel ou en ligne ?\nCandidat : Euh... présentiel. C'est combien ?\nExaminateur : Nos cours débutent à 200 dollars canadiens par mois.\nCandidat : OK. Merci.`,
    dialogue_b1: `Examinateur : Bonjour, Centre Francophonie Montréal, que puis-je faire pour vous ?\nCandidat : Bonjour Madame. Je voudrais des informations sur vos cours de français s'il vous plaît.\nExaminateur : Bien sûr, nous avons plusieurs formules. Quel est votre niveau actuel ?\nCandidat : Euh, je pense que je suis niveau B1. Et vous proposez quoi comme cours ?\nExaminateur : Nous avons des cours intensifs et des cours du soir. Vous préférez quel format ?\nCandidat : Les cours du soir c'est mieux pour moi. C'est combien par mois ?\nExaminateur : C'est 250 dollars canadiens par mois, matériel inclus.\nCandidat : D'accord. Et euh... est-ce qu'il y a un certificat à la fin ?\nExaminateur : Oui, vous recevez une attestation de niveau à la fin de la formation.\nCandidat : C'est bien. Merci beaucoup madame. Je vais réfléchir.`,
    dialogue_b2: `Examinateur : Bonjour, Centre Francophonie Montréal, que puis-je faire pour vous ?\nCandidat : Bonjour. Je viens d'arriver au Canada et je cherche une formation sérieuse en français pour améliorer mon niveau rapidement. Pourriez-vous me présenter vos différentes formules ?\nExaminateur : Bien sûr. Nous proposons des cours intensifs en présentiel et des cours flexibles en ligne.\nCandidat : À quelle fréquence ont lieu les cours intensifs et combien d'heures par semaine sont prévues ?\nExaminateur : Les cours intensifs se déroulent 5 jours par semaine, avec 3 heures de cours par jour.\nCandidat : Est-ce qu'il est possible de combiner présentiel et en ligne selon mes disponibilités ?\nExaminateur : Oui tout à fait, nous proposons une formule hybride très appréciée des nouveaux arrivants.\nCandidat : Parfait. Et concernant les tarifs, est-ce qu'il y a des réductions prévues pour les nouveaux immigrants ?\nExaminateur : Oui, nous offrons une réduction de 15% sur le premier mois pour les nouveaux arrivants.\nCandidat : Très bien. Une dernière question : est-ce qu'une attestation officielle reconnue par les employeurs québécois est délivrée à la fin de la formation ?\nExaminateur : Absolument, notre attestation est conforme au cadre européen commun de référence et reconnue par la plupart des employeurs.\nCandidat : Parfait, merci beaucoup. Je vais opter pour la formule hybride. Comment puis-je procéder pour m'inscrire ?`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Pourriez-vous me présenter vos différentes formules ?",
      "Est-ce possible de combiner présentiel et en ligne ?",
      "Y a-t-il des réductions pour les nouveaux arrivants ?",
      "Une attestation officielle est-elle délivrée à la fin ?",
      "Comment puis-je procéder pour m'inscrire ?"
    ]
  },
  {
    numero: 2,
    titre: "Réserver une chambre dans un hôtel à Québec",
    consigne: "Vous appelez un hôtel pour réserver une chambre et obtenir des informations sur les services proposés.",
    role_examinateur: "L'examinateur joue le/la réceptionniste de l'hôtel.",
    points_a_penser: [
      "préciser le type de chambre, les dates et la durée du séjour",
      "s'informer sur les services inclus (petit-déjeuner, parking, équipements)",
      "demander les conditions de modification ou d'annulation et finaliser la réservation"
    ],
    categorie: "Voyage & Tourisme",
    emoji_categorie: "🏨",
    points_cles_attendus: [
      "type de chambre et dates",
      "prix et ce qui est inclus",
      "horaires d'arrivée et départ",
      "services disponibles (parking, spa, gym)",
      "conditions de modification/annulation",
      "comment finaliser la réservation"
    ],
    erreurs_typiques_b1: [
      "demande juste le prix sans demander ce qui est inclus",
      "oublie de demander les conditions d'annulation",
      "ne demande pas le parking ni les équipements",
      "ne confirme pas comment finaliser la réservation"
    ],
    difference_b1_b2_mauvais: "Le petit-déjeuner c'est inclus ?",
    difference_b1_b2_bon: "Est-ce que le petit-déjeuner buffet est compris dans le tarif de la chambre ?",
    dialogue_a2: `Examinateur : Bonjour, Hôtel Château Frontenac, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... chambre. Week-end prochain.\nExaminateur : Bien sûr, pour combien de personnes ?\nCandidat : Deux personnes.\nExaminateur : Vous préférez une chambre standard ou supérieure ?\nCandidat : Euh... pas trop chère. C'est combien ?\nExaminateur : La chambre standard est à 150 dollars canadiens par nuit.\nCandidat : OK. Le repas c'est inclus ?\nExaminateur : Le petit-déjeuner est inclus oui.\nCandidat : D'accord. Merci.`,
    dialogue_b1: `Examinateur : Bonjour, Hôtel Château Frontenac, que puis-je faire pour vous ?\nCandidat : Bonjour Madame. Je voudrais réserver une chambre pour deux personnes pour le week-end prochain, du vendredi au dimanche.\nExaminateur : Très bien. Vous préférez une chambre standard ou une chambre avec vue ?\nCandidat : Une chambre avec vue s'il vous plaît. Est-ce que le petit-déjeuner est inclus ?\nExaminateur : Oui, le petit-déjeuner buffet est inclus dans le tarif.\nCandidat : Bien. Et c'est à quelle heure l'arrivée ?\nExaminateur : L'arrivée se fait à partir de 14h et le départ avant 11h.\nCandidat : OK. Est-ce qu'il y a un parking ?\nExaminateur : Oui, nous avons un parking privé gratuit pour les clients.\nCandidat : Très bien. Merci beaucoup madame.`,
    dialogue_b2: `Examinateur : Bonjour, Hôtel Château Frontenac, que puis-je faire pour vous ?\nCandidat : Bonjour. Je souhaiterais réserver une chambre double pour deux personnes pour le week-end prochain, du vendredi soir au dimanche matin. Auriez-vous des disponibilités ?\nExaminateur : Oui tout à fait, nous avons encore quelques chambres disponibles.\nCandidat : Parfait. Est-ce que vous proposez des chambres avec vue sur le Saint-Laurent et quel serait le tarif pour ces deux nuits ?\nExaminateur : Oui, nos chambres avec vue sont à 180 dollars canadiens par nuit, petit-déjeuner buffet inclus.\nCandidat : Le petit-déjeuner est donc compris dans ce tarif. Et concernant le parking, est-il disponible et gratuit pour les clients ?\nExaminateur : Oui, nous disposons d'un parking privé entièrement gratuit pour nos clients.\nCandidat : Très bien. Si un imprévu survient, est-il possible de modifier ou d'annuler la réservation sans frais ?\nExaminateur : Oui, vous pouvez modifier votre réservation jusqu'à 24 heures avant l'arrivée sans frais.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Auriez-vous des disponibilités pour ces dates ?",
      "Le petit-déjeuner est-il compris dans le tarif ?",
      "Est-ce que le parking est gratuit pour les clients ?",
      "Est-il possible de modifier la réservation en cas d'imprévu ?",
      "Pour finaliser, puis-je effectuer la réservation en ligne ?"
    ]
  },
  {
    numero: 3,
    titre: "S'inscrire comme bénévole dans une organisation communautaire",
    consigne: "Vous appelez une organisation communautaire francophone de votre quartier pour vous renseigner sur les activités bénévoles disponibles et vous inscrire.",
    role_examinateur: "L'examinateur joue le/la coordinateur(trice) bénévole de l'organisation.",
    points_a_penser: [
      "demander quelles missions bénévoles sont disponibles et si on peut choisir selon ses compétences",
      "s'informer sur les horaires, la formation requise et les conditions de participation",
      "demander si une attestation est délivrée et comment s'inscrire"
    ],
    categorie: "Communauté",
    emoji_categorie: "🤝",
    points_cles_attendus: [
      "types de missions disponibles",
      "possibilité de choisir selon ses compétences",
      "horaires et fréquence des missions",
      "formation obligatoire ou non",
      "attestation ou reconnaissance délivrée",
      "modalités d'inscription"
    ],
    erreurs_typiques_b1: [
      "demande juste 'qu'est-ce que vous faites ?' sans préciser ses intérêts",
      "oublie de demander la formation obligatoire",
      "ne demande pas l'attestation",
      "ne demande pas comment s'inscrire concrètement"
    ],
    difference_b1_b2_mauvais: "Vous avez quoi comme activités ?",
    difference_b1_b2_bon: "Quelles sont les missions bénévoles disponibles et est-il possible de choisir en fonction de mes compétences et de mes disponibilités ?",
    dialogue_a2: `Examinateur : Bonjour, Organisation Entraide Québec, je vous écoute.\nCandidat : Bonjour. Euh... bénévole. Je veux aider.\nExaminateur : Très bien, nous avons plusieurs missions disponibles. Vous avez des préférences ?\nCandidat : Euh... avec les enfants peut-être.\nExaminateur : D'accord, nous avons de l'accompagnement scolaire le samedi.\nCandidat : C'est le matin ?\nExaminateur : Oui, de 9h à 12h.\nCandidat : OK. Comment je fais pour m'inscrire ?\nExaminateur : Vous pouvez venir à notre bureau ou vous inscrire en ligne.\nCandidat : D'accord merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Organisation Entraide Québec, je vous écoute.\nCandidat : Bonjour. Je voudrais me renseigner sur les activités bénévoles que vous proposez s'il vous plaît.\nExaminateur : Bien sûr, nous avons plusieurs missions : distribution alimentaire et accompagnement scolaire notamment.\nCandidat : Est-ce qu'on peut choisir l'activité selon nos préférences ?\nExaminateur : Oui, vous pouvez indiquer vos préférences lors de l'inscription.\nCandidat : Bien. Et c'est quels jours les missions ?\nExaminateur : La majorité des missions ont lieu le samedi matin de 9h à 12h.\nCandidat : D'accord. Est-ce qu'il faut une formation avant de commencer ?\nExaminateur : Oui, mais elle est courte et gratuite.\nCandidat : Et est-ce qu'on reçoit un certificat après ?\nExaminateur : Oui, une attestation est remise après 20 heures de bénévolat.`,
    dialogue_b2: `Examinateur : Bonjour, Organisation Entraide Québec, je vous écoute.\nCandidat : Bonjour. Je suis nouveau au Québec et je souhaiterais m'impliquer comme bénévole dans votre organisation. Pourriez-vous me présenter les missions actuellement disponibles ?\nExaminateur : Bien sûr, nous avons principalement deux types de missions : la distribution alimentaire et l'accompagnement scolaire pour les enfants.\nCandidat : Est-il possible de choisir une mission en fonction de mes compétences et de mes disponibilités ?\nExaminateur : Vous pouvez tout à fait indiquer vos préférences lors de l'inscription, nous en tenons compte.\nCandidat : Quels sont les jours et les horaires habituellement proposés pour ces missions ?\nExaminateur : La majorité des missions se déroulent le samedi matin, de 9h à 12h.\nCandidat : Est-ce qu'une formation est obligatoire avant de commencer, et si oui, combien de temps dure-t-elle ?\nExaminateur : Oui, une formation est requise, mais elle est courte — environ deux heures — et totalement gratuite.\nCandidat : Et après un certain nombre d'heures de bénévolat, est-ce qu'une attestation officielle est délivrée ?\nExaminateur : Absolument, une attestation vous est remise après 20 heures de bénévolat, et elle est reconnue officiellement.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Quelles sont les missions bénévoles disponibles ?",
      "Est-il possible de choisir selon mes compétences ?",
      "Quels sont les jours et horaires habituellement proposés ?",
      "La formation est-elle obligatoire avant de commencer ?",
      "Une attestation officielle est-elle délivrée après un certain nombre d'heures ?"
    ]
  },
  {
    numero: 4,
    titre: "Prendre rendez-vous dans un cabinet dentaire à Montréal",
    consigne: "Vous avez des douleurs aux dents et vous appelez un cabinet dentaire pour prendre rendez-vous rapidement et poser quelques questions.",
    role_examinateur: "L'examinateur joue le/la secrétaire du cabinet dentaire.",
    points_a_penser: [
      "expliquer votre problème et demander un rendez-vous urgent",
      "s'informer sur ce qu'il faut apporter et ce qui est inclus dans la consultation",
      "demander le tarif, la durée et les modalités de remboursement"
    ],
    categorie: "Santé",
    emoji_categorie: "🏥",
    points_cles_attendus: [
      "expliquer le problème de santé clairement",
      "demander les créneaux disponibles et choisir",
      "demander si la carte d'assurance maladie est nécessaire",
      "s'informer sur ce qui est inclus dans la consultation",
      "demander le tarif et la durée",
      "demander un reçu pour remboursement"
    ],
    erreurs_typiques_b1: [
      "dit juste 'j'ai mal aux dents' sans préciser depuis combien de temps",
      "oublie de demander ce qu'il faut apporter",
      "ne demande pas si les examens supplémentaires sont inclus",
      "oublie de demander le reçu pour remboursement"
    ],
    difference_b1_b2_mauvais: "C'est combien ?",
    difference_b1_b2_bon: "Combien coûte la première consultation et est-ce que vous délivrez un reçu pour que je puisse me faire rembourser par mon assurance ?",
    dialogue_a2: `Examinateur : Bonjour, Cabinet Dentaire Sourire, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... j'ai mal aux dents. Rendez-vous possible ?\nExaminateur : Oui bien sûr. Vous avez une disponibilité jeudi ou vendredi ?\nCandidat : Jeudi c'est bien.\nExaminateur : Jeudi à 14h ça vous convient ?\nCandidat : Oui. C'est combien ?\nExaminateur : La consultation est à 80 dollars canadiens.\nCandidat : D'accord. Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Cabinet Dentaire Sourire, que puis-je faire pour vous ?\nCandidat : Bonjour. J'ai une douleur aux dents depuis quelques jours et j'aimerais prendre rendez-vous assez vite s'il vous plaît.\nExaminateur : Bien sûr. Nous avons jeudi à 14h ou vendredi à 9h. Vous préférez ?\nCandidat : Je vais prendre jeudi à 14h. Est-ce que je dois apporter ma carte d'assurance maladie ?\nExaminateur : Oui, si vous en avez une, apportez-la.\nCandidat : D'accord. Et c'est combien la consultation ?\nExaminateur : C'est 80 dollars canadiens sans assurance.\nCandidat : Est-ce que vous donnez un reçu après ?\nExaminateur : Oui, un reçu vous sera remis après la consultation.\nCandidat : Parfait. Merci beaucoup. À jeudi.`,
    dialogue_b2: `Examinateur : Bonjour, Cabinet Dentaire Sourire, que puis-je faire pour vous ?\nCandidat : Bonjour. J'ai une douleur dentaire assez intense depuis plusieurs jours et j'aimerais obtenir un rendez-vous rapidement si possible. Quels créneaux avez-vous de disponibles cette semaine ?\nExaminateur : Nous avons une disponibilité jeudi à 14h ou vendredi à 9h.\nCandidat : Je vais prendre jeudi à 14h. Est-ce que je dois impérativement apporter ma carte d'assurance maladie pour la consultation ?\nExaminateur : Oui, si vous en avez une, c'est préférable de l'apporter.\nCandidat : Très bien. Est-ce que la première consultation inclut une radiographie ou des examens supplémentaires, ou sont-ils facturés séparément ?\nExaminateur : La radio est facturée séparément si elle est nécessaire.\nCandidat : Et concernant le remboursement, est-ce que vous délivrez un reçu détaillé que je pourrai soumettre à mon assurance ?\nExaminateur : Oui, un reçu vous sera remis à la fin de la consultation.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "J'ai une douleur dentaire depuis plusieurs jours, j'aurais besoin d'un rendez-vous urgent.",
      "Quels créneaux avez-vous de disponibles cette semaine ?",
      "Est-ce que la radiographie est incluse ou facturée séparément ?",
      "Délivrez-vous un reçu pour remboursement par l'assurance ?",
      "Quel est le tarif de la consultation et combien de temps dure-t-elle ?"
    ]
  },
  {
    numero: 5,
    titre: "Ouvrir un compte bancaire professionnel au Canada",
    consigne: "Vous venez de créer votre entreprise au Canada et vous appelez votre banque pour vous renseigner sur l'ouverture d'un compte professionnel.",
    role_examinateur: "L'examinateur joue le/la conseiller(ère) bancaire.",
    points_a_penser: [
      "expliquer votre situation et demander les démarches pour ouvrir un compte professionnel",
      "s'informer sur les documents nécessaires et si le processus peut se faire en ligne",
      "demander les frais mensuels, ce qui est inclus dans le forfait et comment finaliser"
    ],
    categorie: "Banque & Administratif",
    emoji_categorie: "🏦",
    points_cles_attendus: [
      "expliquer qu'on est entrepreneur",
      "demander si avoir un compte personnel simplifie la procédure",
      "demander les documents nécessaires",
      "s'informer sur la possibilité de faire ça en ligne",
      "demander les frais mensuels",
      "demander ce qui est inclus dans le forfait",
      "demander s'il existe des offres pour nouveaux entrepreneurs"
    ],
    erreurs_typiques_b1: [
      "ne précise pas qu'il est entrepreneur",
      "oublie de demander les documents nécessaires",
      "ne demande pas si ça peut se faire en ligne",
      "ne demande pas ce qui est inclus dans le forfait"
    ],
    difference_b1_b2_mauvais: "Il faut quoi comme documents ?",
    difference_b1_b2_bon: "Quels documents exactement dois-je fournir pour constituer mon dossier d'ouverture de compte ?",
    dialogue_a2: `Examinateur : Bonjour, Banque Nationale du Canada, en quoi puis-je vous aider ?\nCandidat : Bonjour. Euh... compte professionnel. Je veux ouvrir.\nExaminateur : Bien sûr. Vous avez déjà un compte chez nous ?\nCandidat : Oui j'ai un compte normal.\nExaminateur : D'accord, ça simplifie les choses.\nCandidat : C'est combien par mois ?\nExaminateur : Le forfait de base est à 25 dollars canadiens par mois.\nCandidat : OK. Quels documents ?\nExaminateur : Votre numéro d'entreprise, une pièce d'identité et une preuve d'activité.\nCandidat : D'accord merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Banque Nationale du Canada, en quoi puis-je vous aider ?\nCandidat : Bonjour. Je suis entrepreneur et je voudrais ouvrir un compte professionnel. Comment ça se passe ?\nExaminateur : Bien sûr. Vous avez déjà un compte personnel chez nous ?\nCandidat : Oui depuis deux ans. Est-ce que ça simplifie la procédure ?\nExaminateur : Oui, les démarches sont un peu plus simples dans ce cas.\nCandidat : Bien. Quels documents je dois fournir ?\nExaminateur : Votre numéro d'entreprise, une pièce d'identité et une preuve d'activité professionnelle.\nCandidat : Est-ce que je peux faire ça en ligne ou il faut venir en agence ?\nExaminateur : Vous pouvez commencer en ligne mais la finalisation se fait en agence.`,
    dialogue_b2: `Examinateur : Bonjour, Banque Nationale du Canada, en quoi puis-je vous aider ?\nCandidat : Bonjour. Je viens de créer mon entreprise au Canada et je souhaiterais ouvrir un compte professionnel. Pourriez-vous m'expliquer les démarches à suivre ?\nExaminateur : Bien sûr. Avez-vous déjà un compte personnel chez nous ?\nCandidat : Oui, j'en ai un depuis trois ans. Est-ce que cela simplifie la procédure d'ouverture du compte professionnel ?\nExaminateur : Oui, cela facilite les démarches, il nous faudra simplement quelques documents supplémentaires.\nCandidat : Quels documents exactement dois-je fournir pour constituer mon dossier ?\nExaminateur : Votre numéro d'entreprise, une pièce d'identité valide et une preuve de votre activité professionnelle.\nCandidat : Est-il possible d'initier la procédure entièrement en ligne ou est-ce qu'une visite en agence est obligatoire ?\nExaminateur : Vous pouvez commencer en ligne, mais la finalisation doit se faire en agence avec un conseiller.\nCandidat : Est-ce qu'il existe des forfaits plus adaptés aux petites entreprises qui démarrent, avec des frais réduits ?\nExaminateur : Oui, nous avons un forfait spécial nouveaux entrepreneurs à 15 dollars par mois pendant les six premiers mois.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Je viens de créer mon entreprise et je souhaiterais ouvrir un compte professionnel.",
      "Le fait d'avoir un compte personnel simplifie-t-il la procédure ?",
      "Quels documents exactement dois-je fournir ?",
      "Est-il possible d'initier la procédure en ligne ?",
      "Quels sont les frais mensuels et qu'est-ce qui est inclus dans le forfait ?",
      "Existe-t-il des offres spéciales pour les nouveaux entrepreneurs ?"
    ]
  },
  {
    numero: 6,
    titre: "Inscrire son enfant à un camp d'été au Québec",
    consigne: "Vous appelez un centre de loisirs pour inscrire votre enfant à un camp d'été et obtenir des informations sur le programme et les conditions.",
    role_examinateur: "L'examinateur joue le/la responsable des inscriptions du centre de loisirs.",
    points_a_penser: [
      "préciser l'âge de l'enfant et la période souhaitée, demander le programme proposé",
      "s'informer sur les repas, l'encadrement et les activités incluses",
      "demander le tarif, comment s'inscrire et les modalités pratiques"
    ],
    categorie: "Famille",
    emoji_categorie: "👨‍👩‍👧",
    points_cles_attendus: [
      "préciser l'âge de l'enfant et la période",
      "demander quelles activités sont proposées",
      "s'informer sur les repas inclus",
      "demander si l'encadrement est professionnel",
      "demander le tarif total",
      "demander comment procéder pour l'inscription et les documents nécessaires"
    ],
    erreurs_typiques_b1: [
      "ne précise pas l'âge de l'enfant ni la période",
      "oublie de demander si les repas sont inclus",
      "ne demande pas les qualifications des animateurs",
      "ne demande pas les documents nécessaires pour l'inscription"
    ],
    difference_b1_b2_mauvais: "L'encadrement c'est des professionnels ?",
    difference_b1_b2_bon: "Est-ce que l'encadrement est assuré par des professionnels diplômés et expérimentés dans l'animation jeunesse ?",
    dialogue_a2: `Examinateur : Bonjour, Centre de Loisirs Laurentides, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... camp d'été. Mon fils.\nExaminateur : Bien sûr, quel âge a votre fils ?\nCandidat : Dix ans.\nExaminateur : Nous avons un programme pour les 8-12 ans. C'est pour quelle période ?\nCandidat : Juillet.\nExaminateur : D'accord, nous avons des places disponibles en juillet.\nCandidat : C'est combien ?\nExaminateur : C'est 300 dollars canadiens pour deux semaines.\nCandidat : Le repas c'est inclus ?\nExaminateur : Oui, le déjeuner est fourni.\nCandidat : OK merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Centre de Loisirs Laurentides, que puis-je faire pour vous ?\nCandidat : Bonjour. Je voudrais inscrire mon fils à un camp d'été. Il a dix ans. Vous avez un programme pour son âge ?\nExaminateur : Oui, nous avons un programme pour les 8-12 ans avec des activités sportives et artistiques.\nCandidat : C'est bien. Je pensais au mois de juillet, les deux premières semaines. Est-ce qu'il y a des places ?\nExaminateur : Oui, il reste encore des places pour cette période.\nCandidat : Est-ce que le déjeuner est inclus ?\nExaminateur : Oui, les repas de midi sont fournis. Il faut juste prévoir une collation pour la matinée.\nCandidat : D'accord. Et c'est combien pour deux semaines ?\nExaminateur : C'est 300 dollars canadiens, tout compris.`,
    dialogue_b2: `Examinateur : Bonjour, Centre de Loisirs Laurentides, que puis-je faire pour vous ?\nCandidat : Bonjour. Je souhaiterais inscrire mon fils à un camp d'été et j'aurais quelques questions avant de prendre ma décision. Il a dix ans — est-ce que vous proposez un programme adapté à sa tranche d'âge ?\nExaminateur : Absolument, nous avons un programme spécialement conçu pour les 8-12 ans, avec des activités sportives, artistiques et des sorties nature.\nCandidat : Je pensais à la période de juillet, pendant les deux premières semaines. Est-ce qu'il reste encore des disponibilités ?\nExaminateur : Oui, nous avons encore quelques places disponibles pour ces deux semaines.\nCandidat : Concernant les repas, est-ce que le déjeuner et le goûter sont inclus dans le programme ?\nExaminateur : Les repas de midi sont entièrement fournis. Il faudra juste prévoir une collation pour la matinée.\nCandidat : Est-ce que l'encadrement est assuré par des professionnels diplômés et expérimentés dans l'animation jeunesse ?\nExaminateur : Bien sûr, tous nos animateurs sont diplômés et ont une solide expérience avec les enfants.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Je souhaiterais inscrire mon enfant — est-ce que vous avez un programme pour les 8-12 ans ?",
      "Est-ce qu'il reste des disponibilités pour la période de juillet ?",
      "Les repas sont-ils inclus dans le tarif ?",
      "L'encadrement est-il assuré par des professionnels diplômés ?",
      "Quel est le tarif total et qu'est-ce qui est inclus exactement ?",
      "Comment dois-je procéder pour finaliser l'inscription ?"
    ]
  },
  {
    numero: 7,
    titre: "Louer une voiture pour le week-end",
    consigne: "Vous contactez une agence de location pour réserver un véhicule pour le week-end et vous renseigner sur les conditions de location.",
    role_examinateur: "L'examinateur joue l'employé(e) de l'agence de location.",
    points_a_penser: [
      "préciser les dates, le type de véhicule souhaité et vérifier les disponibilités",
      "s'informer sur les restrictions d'âge, le kilométrage et le carburant",
      "demander les documents nécessaires, le tarif avec assurance et finaliser"
    ],
    categorie: "Transport",
    emoji_categorie: "🚗",
    points_cles_attendus: [
      "préciser les dates et le type de véhicule",
      "demander les disponibilités",
      "s'informer sur les restrictions d'âge",
      "demander si le kilométrage est illimité",
      "demander si le carburant est inclus",
      "demander les documents nécessaires",
      "demander le tarif avec assurance de base"
    ],
    erreurs_typiques_b1: [
      "ne précise pas le type de véhicule souhaité",
      "oublie de demander les restrictions d'âge",
      "ne demande pas si le kilométrage est illimité",
      "ne demande pas si le carburant est inclus",
      "oublie de demander les documents nécessaires"
    ],
    difference_b1_b2_mauvais: "Y a un kilométrage limité ?",
    difference_b1_b2_bon: "Est-ce que le kilométrage est illimité pour les locations de week-end ou y a-t-il un plafond à ne pas dépasser ?",
    dialogue_a2: `Examinateur : Bonjour, AutoLocation Montréal, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... voiture. Week-end prochain.\nExaminateur : Bien sûr, du vendredi au dimanche ?\nCandidat : Oui. Petite voiture.\nExaminateur : Nous avons une Toyota Yaris disponible.\nCandidat : C'est combien ?\nExaminateur : C'est 120 dollars canadiens pour le week-end.\nCandidat : L'assurance c'est inclus ?\nExaminateur : L'assurance de base est incluse, oui.\nCandidat : OK. Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, AutoLocation Montréal, que puis-je faire pour vous ?\nCandidat : Bonjour. Je voudrais louer une voiture pour le week-end prochain, du vendredi soir au lundi matin. Vous avez des disponibilités ?\nExaminateur : Oui, c'est tout à fait possible.\nCandidat : Je cherche une petite voiture compacte. Vous avez quoi comme modèle ?\nExaminateur : Nous avons une Toyota Yaris ou une Honda Civic disponibles.\nCandidat : La Yaris c'est bien. Est-ce qu'il y a un âge minimum pour louer ?\nExaminateur : Oui, il faut avoir au moins 25 ans.\nCandidat : D'accord. Et le kilométrage c'est illimité ?\nExaminateur : Oui, pour les locations de plus de deux jours le kilométrage est illimité.`,
    dialogue_b2: `Examinateur : Bonjour, AutoLocation Montréal, que puis-je faire pour vous ?\nCandidat : Bonjour. Je souhaiterais louer un véhicule compact pour le week-end prochain, du vendredi soir au lundi matin. Est-ce que vous avez des disponibilités pour ces dates ?\nExaminateur : Oui, c'est tout à fait possible.\nCandidat : Est-ce que vous proposez des voitures compactes avec climatisation ? J'ai besoin d'un véhicule confortable pour un long trajet.\nExaminateur : Oui, nous avons une Toyota Yaris qui correspond exactement à votre demande.\nCandidat : Est-ce qu'il y a des restrictions d'âge pour louer un véhicule chez vous ?\nExaminateur : Oui, il faut avoir au moins 25 ans.\nCandidat : Est-ce que le kilométrage est illimité pour les locations de week-end ou y a-t-il un plafond ?\nExaminateur : Pour les locations de plus de deux jours, le kilométrage est illimité.\nCandidat : Et concernant le carburant, est-il inclus dans le prix de la location ?\nExaminateur : Le carburant reste à votre charge, vous devrez rendre le véhicule avec le même niveau qu'au départ.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Est-ce que vous avez des disponibilités du vendredi soir au lundi matin ?",
      "Y a-t-il des restrictions d'âge pour louer un véhicule ?",
      "Le kilométrage est-il illimité pour les locations de week-end ?",
      "Le carburant est-il inclus dans le prix ?",
      "Quels documents dois-je présenter pour finaliser la réservation ?",
      "Quel est le tarif avec l'assurance de base incluse ?"
    ]
  },
  {
    numero: 8,
    titre: "Ouvrir un contrat d'électricité dans son nouveau logement",
    consigne: "Vous venez d'emménager dans un nouvel appartement au Québec et vous appelez Hydro-Québec pour ouvrir un contrat d'électricité et poser des questions sur les démarches.",
    role_examinateur: "L'examinateur joue le/la conseiller(ère) du service client d'Hydro-Québec.",
    points_a_penser: [
      "expliquer votre situation et demander les premières étapes pour ouvrir un contrat",
      "s'informer sur les types de contrats disponibles et leurs différences",
      "demander les documents nécessaires, le délai d'activation et si les démarches peuvent se faire en ligne"
    ],
    categorie: "Logement & Services",
    emoji_categorie: "🏠",
    points_cles_attendus: [
      "expliquer qu'on vient d'emménager",
      "donner l'adresse du logement",
      "demander les types de contrats disponibles",
      "comprendre la différence entre les options",
      "demander les documents nécessaires",
      "demander le délai d'activation",
      "demander si les démarches peuvent se faire en ligne"
    ],
    erreurs_typiques_b1: [
      "ne donne pas l'adresse spontanément",
      "ne demande pas les différents types de contrats",
      "oublie de demander les documents nécessaires",
      "ne demande pas le délai d'activation"
    ],
    difference_b1_b2_mauvais: "C'est quoi la différence entre les deux contrats ?",
    difference_b1_b2_bon: "Quelle est la différence concrète entre le contrat standard et le contrat avec heures creuses, et lequel serait le plus avantageux pour quelqu'un qui est souvent absent la journée ?",
    dialogue_a2: `Examinateur : Bonjour, Hydro-Québec, comment puis-je vous aider ?\nCandidat : Bonjour. Euh... électricité. Nouvel appartement.\nExaminateur : Vous souhaitez ouvrir un contrat ?\nCandidat : Oui. Comment je fais ?\nExaminateur : Il nous faut votre adresse complète.\nCandidat : C'est le 45 rue Saint-Denis à Montréal.\nExaminateur : Très bien. Vous préférez un contrat standard ou avec heures creuses ?\nCandidat : Euh... standard c'est quoi ?\nExaminateur : C'est le tarif normal, le même prix à toute heure.\nCandidat : OK standard alors. Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Hydro-Québec, comment puis-je vous aider ?\nCandidat : Bonjour. Je viens d'emménager dans un nouvel appartement et je voudrais ouvrir un contrat d'électricité. Quelles sont les premières étapes ?\nExaminateur : Il nous faut votre adresse complète et votre nom.\nCandidat : Bien sûr. C'est le 45 rue Saint-Denis, appartement 3, à Montréal.\nExaminateur : Merci. Vous souhaitez un contrat standard ou avec heures creuses ?\nCandidat : Quelle est la différence entre les deux ?\nExaminateur : Avec les heures creuses, vous payez moins cher la nuit, mais le tarif de base est un peu plus élevé.\nCandidat : Je vais prendre le contrat standard alors. Quels documents je dois fournir ?\nExaminateur : Une pièce d'identité et un relevé de compteur.\nCandidat : Et combien de temps pour que le service soit activé ?\nExaminateur : Généralement 48 heures.`,
    dialogue_b2: `Examinateur : Bonjour, Hydro-Québec, comment puis-je vous aider ?\nCandidat : Bonjour. Je viens d'emménager dans un nouvel appartement à Montréal et je souhaiterais ouvrir un contrat d'électricité. Pourriez-vous m'expliquer les premières étapes à suivre ?\nExaminateur : Bien sûr. Il nous faut l'adresse complète de votre logement ainsi que votre nom complet.\nCandidat : Tout à fait. C'est le 45 rue Saint-Denis, appartement 3, à Montréal. Est-ce que je dois choisir un type de contrat spécifique ?\nExaminateur : Oui, vous pouvez opter pour un contrat standard ou un contrat avec heures creuses.\nCandidat : Quelle est la différence concrète entre ces deux options, et lequel serait le plus avantageux pour quelqu'un qui travaille de nuit ?\nExaminateur : Avec les heures creuses, vous payez moins cher la nuit, mais le tarif de base est légèrement plus élevé. Pour quelqu'un qui consomme surtout la nuit, c'est souvent plus économique.\nCandidat : Dans ce cas le contrat avec heures creuses semble plus adapté. Quels documents dois-je fournir pour l'ouverture du contrat ?\nExaminateur : Une pièce d'identité valide, un relevé de compteur, et un RIB si vous souhaitez un prélèvement automatique.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Je viens d'emménager et je souhaiterais ouvrir un contrat d'électricité.",
      "Quelle est la différence entre le contrat standard et le contrat avec heures creuses ?",
      "Quels documents dois-je fournir pour l'ouverture du contrat ?",
      "Quel est le délai d'activation du service ?",
      "Est-ce que les démarches peuvent se faire entièrement en ligne ?",
      "Est-ce qu'un prélèvement automatique est possible ?"
    ]
  },
  {
    numero: 9,
    titre: "Renouveler un document officiel auprès d'un service administratif",
    consigne: "Vous appelez un bureau de Services Canada pour vous renseigner sur le renouvellement de votre carte de résidence permanente et les démarches à suivre.",
    role_examinateur: "L'examinateur joue le/la agent(e) de Services Canada.",
    points_a_penser: [
      "expliquer votre situation (carte expirée) et demander les démarches",
      "s'informer sur les documents nécessaires et si la demande peut se faire en ligne",
      "demander le délai de traitement, le coût et comment suivre sa demande"
    ],
    categorie: "Banque & Administratif",
    emoji_categorie: "🏦",
    points_cles_attendus: [
      "expliquer que le document est expiré",
      "demander les démarches à suivre",
      "demander les documents nécessaires",
      "s'informer sur la possibilité de faire la demande en ligne",
      "demander le délai de traitement",
      "demander s'il existe une procédure accélérée",
      "demander le coût et les moyens de paiement",
      "demander comment suivre sa demande"
    ],
    erreurs_typiques_b1: [
      "ne précise pas si le document est expiré depuis longtemps",
      "oublie de demander les documents nécessaires",
      "ne demande pas s'il existe une procédure accélérée",
      "ne demande pas comment suivre sa demande après soumission"
    ],
    difference_b1_b2_mauvais: "Combien de temps ça prend ?",
    difference_b1_b2_bon: "Quel est le délai habituel de traitement et est-ce qu'il existe une procédure accélérée si j'en ai besoin rapidement pour voyager ?",
    dialogue_a2: `Examinateur : Bonjour, Services Canada, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... carte résidence. Expirée.\nExaminateur : Vous souhaitez la renouveler ?\nCandidat : Oui. Comment je fais ?\nExaminateur : Il faut faire une demande en ligne ou en personne.\nCandidat : Quels documents ?\nExaminateur : Votre ancienne carte, deux photos et une pièce d'identité.\nCandidat : C'est combien ?\nExaminateur : Les frais sont de 50 dollars canadiens.\nCandidat : Combien de temps ?\nExaminateur : Environ six semaines.\nCandidat : D'accord merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Services Canada, que puis-je faire pour vous ?\nCandidat : Bonjour. Ma carte de résidence permanente a expiré il y a deux semaines. Je voudrais savoir comment la renouveler.\nExaminateur : Bien sûr. Vous pouvez faire la demande en ligne ou en personne.\nCandidat : Quels documents je dois fournir ?\nExaminateur : Votre ancienne carte, deux photos d'identité récentes et une pièce d'identité valide.\nCandidat : Est-ce que je peux prendre rendez-vous en ligne ?\nExaminateur : Oui, sur notre site internet.\nCandidat : Et combien de temps ça prend pour recevoir la nouvelle carte ?\nExaminateur : Environ six semaines.\nCandidat : Comment je peux suivre ma demande après ?\nExaminateur : Vous recevrez un numéro de suivi par courriel.`,
    dialogue_b2: `Examinateur : Bonjour, Services Canada, que puis-je faire pour vous ?\nCandidat : Bonjour. Ma carte de résidence permanente a expiré il y a deux semaines et j'aurais besoin de la renouveler rapidement. Pourriez-vous m'expliquer les démarches à suivre ?\nExaminateur : Bien sûr. Votre carte est-elle encore valide ou complètement expirée ?\nCandidat : Elle est complètement expirée depuis deux semaines. Est-ce que cela complique les démarches ?\nExaminateur : La procédure reste la même, mais je vous conseille de faire la demande le plus tôt possible.\nCandidat : Quels documents dois-je fournir pour constituer mon dossier de renouvellement ?\nExaminateur : Il vous faudra votre ancienne carte, deux photos d'identité récentes conformes aux normes canadiennes, et une pièce d'identité valide.\nCandidat : Est-ce que l'ensemble de la demande peut se faire en ligne ?\nExaminateur : Vous pouvez initier la demande en ligne sur notre site, à la rubrique renouvellement de carte.\nCandidat : Quel est le délai habituel de traitement et existe-t-il une procédure accélérée si j'en ai besoin rapidement pour voyager ?\nExaminateur : Le délai standard est d'environ six semaines. Il existe une procédure urgente mais elle est soumise à des critères spécifiques.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Ma carte de résidence permanente a expiré, je souhaiterais la renouveler.",
      "Est-ce que cela complique les démarches ?",
      "Quels documents dois-je fournir pour constituer mon dossier ?",
      "La demande peut-elle se faire entièrement en ligne ?",
      "Quel est le délai de traitement et existe-t-il une procédure accélérée ?",
      "Comment puis-je suivre l'avancement de mon dossier ?"
    ]
  },
  {
    numero: 10,
    titre: "Signaler un bagage perdu à une compagnie de transport",
    consigne: "Vous avez oublié votre valise dans un train et vous appelez le service des objets trouvés de Via Rail Canada pour la signaler et savoir comment la récupérer.",
    role_examinateur: "L'examinateur joue le/la agent(e) du service des objets trouvés de Via Rail.",
    points_a_penser: [
      "expliquer la situation précisément (trajet, numéro de train, heure de départ)",
      "décrire le bagage en détail pour faciliter la recherche",
      "demander les options de récupération et si une confirmation sera envoyée"
    ],
    categorie: "Transport",
    emoji_categorie: "🚗",
    points_cles_attendus: [
      "expliquer clairement le trajet et donner le numéro du train ou l'horaire",
      "décrire précisément le bagage",
      "demander si une vérification peut être faite immédiatement",
      "demander les options de récupération",
      "demander s'il y a des frais pour la livraison",
      "demander une confirmation écrite du signalement"
    ],
    erreurs_typiques_b1: [
      "ne donne pas le numéro du train ni l'horaire précis",
      "description du bagage trop vague",
      "ne demande pas les options de récupération",
      "oublie de demander une confirmation écrite"
    ],
    difference_b1_b2_mauvais: "C'est une valise noire.",
    difference_b1_b2_bon: "C'est une valise noire à roulettes de taille moyenne, avec une étiquette à mon nom attachée à la poignée.",
    dialogue_a2: `Examinateur : Bonjour, Via Rail, service des objets trouvés, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... valise oubliée. Train hier.\nExaminateur : Quel trajet et à quelle heure ?\nCandidat : Montréal-Toronto. Le matin.\nExaminateur : Vous avez le numéro du train ?\nCandidat : Non je sais pas.\nExaminateur : D'accord. Pouvez-vous décrire votre valise ?\nCandidat : Noire. Moyenne.\nExaminateur : Nous allons vérifier. Vous avez un numéro de téléphone ?\nCandidat : Oui, c'est le 514-555-0123.\nCandidat : Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Via Rail, service des objets trouvés, que puis-je faire pour vous ?\nCandidat : Bonjour. J'ai pris le train hier entre Montréal et Toronto et j'ai oublié ma valise à bord. Que dois-je faire pour la retrouver ?\nExaminateur : Avez-vous le numéro du train ou l'horaire approximatif ?\nCandidat : C'était le train de 9h15 de Montréal. Je crois que c'était le train 60.\nExaminateur : Très bien. Pouvez-vous décrire votre valise ?\nCandidat : C'est une valise noire à roulettes, taille moyenne. Elle a mon nom sur une étiquette.\nCandidat : Est-ce que je dois venir en personne pour la récupérer ?\nExaminateur : Pas nécessairement, vous pouvez choisir un point de retrait ou une livraison.\nCandidat : Je préfère la livraison à domicile. Est-ce que je vais recevoir une confirmation ?\nExaminateur : Oui, vous recevrez un courriel avec un numéro de dossier.`,
    dialogue_b2: `Examinateur : Bonjour, Via Rail, service des objets trouvés, que puis-je faire pour vous ?\nCandidat : Bonjour. J'ai effectué hier le trajet Montréal-Toronto et j'ai malheureusement oublié ma valise à bord du train. Je souhaiterais signaler la perte et savoir comment procéder pour la récupérer.\nExaminateur : Avez-vous le numéro du train ou l'horaire approximatif de votre départ ?\nCandidat : Oui, c'était le train numéro 60, départ à 9h15 de la gare centrale de Montréal. Est-ce que vous pouvez vérifier immédiatement si elle a été retrouvée à bord ?\nExaminateur : Bien sûr, pouvez-vous me décrire votre valise en détail ?\nCandidat : C'est une valise noire à roulettes de taille moyenne, avec une étiquette à mon nom attachée à la poignée. Y a-t-il des frais pour la livraison à domicile ?\nExaminateur : Des frais de livraison peuvent s'appliquer selon votre adresse.\nCandidat : Est-ce que je vais recevoir une confirmation écrite de mon signalement avec un numéro de dossier ?\nExaminateur : Oui, vous recevrez un courriel avec votre numéro de dossier une fois la déclaration enregistrée.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "J'ai oublié ma valise à bord du train numéro X, départ à Xh de [ville].",
      "Pouvez-vous vérifier immédiatement si elle a été retrouvée ?",
      "C'est une valise noire à roulettes avec une étiquette à mon nom.",
      "Est-ce que je dois me déplacer en personne ou existe-t-il d'autres options ?",
      "Y a-t-il des frais pour la livraison à domicile ?",
      "Vais-je recevoir une confirmation écrite avec un numéro de dossier ?"
    ]
  },
  {
    numero: 11,
    titre: "S'informer sur les films à l'affiche dans un cinéma",
    consigne: "Vous appelez un cinéma francophone de Montréal pour vous renseigner sur les films à l'affiche, les horaires et les tarifs avant de réserver.",
    role_examinateur: "L'examinateur joue l'employé(e) de la billetterie du cinéma.",
    points_a_penser: [
      "demander quels films sont à l'affiche et dans quels genres",
      "s'informer sur les horaires des séances et les tarifs",
      "demander s'il existe une salle IMAX ou des formules d'abonnement et comment réserver"
    ],
    categorie: "Loisirs",
    emoji_categorie: "🎭",
    points_cles_attendus: [
      "demander les films à l'affiche et les genres disponibles",
      "s'informer sur les horaires des séances",
      "demander les tarifs adulte, étudiant, famille",
      "demander s'il y a une salle IMAX",
      "demander s'il existe un abonnement ou carte de fidélité",
      "demander comment réserver"
    ],
    erreurs_typiques_b1: [
      "demande juste 'c'est quoi les films ?' sans préciser ses préférences",
      "oublie de demander les horaires précis",
      "ne demande pas les tarifs étudiants ou famille",
      "ne demande pas s'il y a un abonnement avantageux",
      "ne demande pas comment réserver"
    ],
    difference_b1_b2_mauvais: "C'est combien une place ?",
    difference_b1_b2_bon: "Quels sont vos tarifs pour une séance en soirée, et est-ce qu'il existe un tarif réduit pour les étudiants ou une formule famille ?",
    dialogue_a2: `Examinateur : Bonjour, Cinéma Quartier Latin, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... films. Ce soir.\nExaminateur : Nous avons plusieurs films à l'affiche. Vous préférez quel genre ?\nCandidat : Action.\nExaminateur : Nous avons un film d'action à 19h et 21h.\nCandidat : C'est combien ?\nExaminateur : C'est 14 dollars canadiens par personne.\nCandidat : Étudiant c'est moins cher ?\nExaminateur : Oui, 10 dollars avec une carte étudiante.\nCandidat : OK. Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Cinéma Quartier Latin, que puis-je faire pour vous ?\nCandidat : Bonjour. Je voudrais savoir quels films sont à l'affiche ce soir s'il vous plaît.\nExaminateur : Nous avons un film d'action, une comédie et un thriller. Vous préférez quel genre ?\nCandidat : Plutôt le thriller. C'est à quelle heure ?\nExaminateur : Il y a des séances à 18h30 et 20h45.\nCandidat : Je vais prendre celle de 20h45. C'est combien le billet ?\nExaminateur : C'est 14 dollars canadiens pour un adulte.\nCandidat : Est-ce qu'il y a un tarif étudiant ?\nExaminateur : Oui, 10 dollars avec une carte étudiante valide.`,
    dialogue_b2: `Examinateur : Bonjour, Cinéma Quartier Latin, que puis-je faire pour vous ?\nCandidat : Bonjour. Je souhaiterais avoir des informations sur vos films à l'affiche ce soir avant de décider si je viens. Pourriez-vous me présenter ce que vous proposez ?\nExaminateur : Bien sûr, nous avons un film d'action, une comédie familiale et un thriller psychologique ce soir.\nCandidat : Le thriller m'intéresse. À quelles heures sont prévues les séances et quelle est la durée approximative du film ?\nExaminateur : Les séances sont à 18h30 et 20h45, pour une durée d'environ 1h55.\nCandidat : Quels sont vos tarifs pour une séance en soirée et est-ce qu'il existe un tarif réduit pour les étudiants ?\nExaminateur : Le tarif adulte est de 14 dollars canadiens et le tarif étudiant est de 10 dollars avec une carte valide.\nCandidat : Est-ce que ce film est disponible en salle IMAX et si oui, quel est le supplément tarifaire ?\nExaminateur : Non, ce film n'est pas en IMAX. Seul le film d'action est disponible dans cette salle, à 21 dollars.\nCandidat : Est-ce que votre cinéma propose des formules d'abonnement ou une carte de fidélité ?\nExaminateur : Oui, nous avons une carte mensuelle à 20 dollars pour des films illimités, très appréciée des habitués.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Quels films sont à l'affiche ce soir et dans quels genres ?",
      "À quelles heures sont les séances et quelle est la durée du film ?",
      "Y a-t-il un tarif réduit pour les étudiants ou une formule famille ?",
      "Ce film est-il disponible en salle IMAX ?",
      "Proposez-vous une carte d'abonnement mensuel ?",
      "Comment puis-je réserver ma place à l'avance ?"
    ]
  },
  {
    numero: 12,
    titre: "S'inscrire dans un club de sport de quartier",
    consigne: "Vous appelez un centre sportif francophone de votre quartier pour vous renseigner sur les activités proposées, les tarifs et les conditions d'inscription.",
    role_examinateur: "L'examinateur joue le/la réceptionniste du centre sportif.",
    points_a_penser: [
      "demander quels sports et activités sont proposés et à quels niveaux",
      "s'informer sur les tarifs d'abonnement et ce qui est inclus",
      "demander les horaires des cours, les conditions d'essai et comment s'inscrire"
    ],
    categorie: "Loisirs",
    emoji_categorie: "🎭",
    points_cles_attendus: [
      "demander quelles activités et sports sont disponibles",
      "s'informer sur les niveaux requis",
      "demander les tarifs mensuel et annuel",
      "demander ce qui est inclus dans l'abonnement",
      "demander s'il y a une séance d'essai gratuite",
      "demander les horaires des cours",
      "demander comment s'inscrire et quels documents fournir"
    ],
    erreurs_typiques_b1: [
      "demande juste 'vous avez quoi comme sport ?' sans préciser ses intérêts",
      "oublie de demander les tarifs annuels vs mensuels",
      "ne demande pas ce qui est inclus dans l'abonnement",
      "oublie de demander s'il y a une séance d'essai",
      "ne demande pas les documents nécessaires pour l'inscription"
    ],
    difference_b1_b2_mauvais: "C'est combien par mois ?",
    difference_b1_b2_bon: "Pourriez-vous me comparer les formules mensuelle et annuelle et me préciser ce qui est inclus dans chaque abonnement ?",
    dialogue_a2: `Examinateur : Bonjour, Centre Sportif Laurier, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... sport. Je veux m'inscrire.\nExaminateur : Bien sûr, vous avez une activité en tête ?\nCandidat : Natation peut-être.\nExaminateur : Nous avons des cours de natation pour tous niveaux.\nCandidat : C'est combien ?\nExaminateur : L'abonnement mensuel est à 45 dollars canadiens.\nCandidat : C'est quand les cours ?\nExaminateur : Il y a des cours le matin et le soir en semaine.\nCandidat : OK. Je peux essayer d'abord ?\nExaminateur : Oui, nous offrons une séance d'essai gratuite.\nCandidat : Bien. Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Centre Sportif Laurier, que puis-je faire pour vous ?\nCandidat : Bonjour. Je voudrais me renseigner sur les activités que vous proposez et les conditions d'inscription s'il vous plaît.\nExaminateur : Bien sûr. Nous avons de la natation, du yoga, de la musculation et des cours collectifs de fitness.\nCandidat : Je suis intéressé par la natation et le yoga. Est-ce que ces activités sont accessibles aux débutants ?\nExaminateur : Oui, nous avons des cours pour tous les niveaux.\nCandidat : Bien. Quels sont vos tarifs d'abonnement ?\nExaminateur : L'abonnement mensuel est à 45 dollars et l'annuel à 400 dollars.\nCandidat : Qu'est-ce qui est inclus dans l'abonnement ?\nExaminateur : L'accès à toutes les activités, la piscine et la salle de musculation.`,
    dialogue_b2: `Examinateur : Bonjour, Centre Sportif Laurier, que puis-je faire pour vous ?\nCandidat : Bonjour. Je viens d'emménager dans le quartier et je cherche un club de sport pour pratiquer régulièrement. Pourriez-vous me présenter les activités que vous proposez ?\nExaminateur : Bien sûr, nous avons de la natation, du yoga, de la musculation, du badminton et des cours collectifs de fitness.\nCandidat : Je suis particulièrement intéressé par la natation et le yoga. Est-ce que ces activités sont accessibles aux débutants ?\nExaminateur : Les deux sont accessibles à tous les niveaux, nous avons des groupes débutants et avancés.\nCandidat : Pourriez-vous me comparer vos formules d'abonnement mensuelle et annuelle et me préciser ce qui est inclus dans chaque option ?\nExaminateur : L'abonnement mensuel est à 45 dollars sans engagement, et l'annuel à 400 dollars avec un accès illimité à toutes les activités.\nCandidat : Avant de m'engager, est-il possible de faire une séance d'essai pour voir si les cours correspondent à mes attentes ?\nExaminateur : Absolument, nous offrons une séance d'essai gratuite sur présentation d'une pièce d'identité.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Quelles activités proposez-vous et sont-elles accessibles aux débutants ?",
      "Pourriez-vous comparer les formules mensuelle et annuelle ?",
      "Qu'est-ce qui est inclus dans l'abonnement ?",
      "Est-il possible de faire une séance d'essai avant de s'engager ?",
      "Quels sont les créneaux disponibles en soirée ?",
      "Quels documents dois-je fournir pour l'inscription ?"
    ]
  },
  {
    numero: 13,
    titre: "S'informer à l'office de tourisme de Québec",
    consigne: "Vous venez d'arriver à Québec et vous vous rendez à l'office de tourisme pour découvrir les activités, visites et attractions de la ville.",
    role_examinateur: "L'examinateur joue l'employé(e) de l'office de tourisme de Québec.",
    points_a_penser: [
      "demander les principales attractions et activités incontournables de la ville",
      "s'informer sur les tarifs, les horaires et les passes touristiques disponibles",
      "demander s'il existe des visites guidées et comment les réserver"
    ],
    categorie: "Voyage & Tourisme",
    emoji_categorie: "🏨",
    points_cles_attendus: [
      "demander les attractions incontournables",
      "s'informer sur les activités adaptées à ses intérêts",
      "demander les tarifs et horaires",
      "s'informer sur l'existence d'un pass touristique",
      "demander s'il y a des visites guidées disponibles",
      "demander s'il y a des événements culturels cette semaine",
      "demander comment réserver"
    ],
    erreurs_typiques_b1: [
      "demande juste 'qu'est-ce qu'il y a à voir ?' sans préciser ses intérêts",
      "oublie de demander les tarifs et horaires",
      "ne demande pas s'il existe un pass touristique",
      "ne demande pas les visites guidées",
      "ne demande pas les événements culturels de la semaine"
    ],
    difference_b1_b2_mauvais: "Il y a des visites guidées ?",
    difference_b1_b2_bon: "Est-ce qu'il existe des visites guidées disponibles en français et comment puis-je les réserver à l'avance pour éviter d'attendre sur place ?",
    dialogue_a2: `Examinateur : Bonjour, Office de Tourisme de Québec, que puis-je faire pour vous ?\nCandidat : Bonjour. Euh... je suis nouveau. Qu'est-ce qu'il y a à voir ?\nExaminateur : Il y a le Vieux-Québec, la Citadelle et les Plaines d'Abraham.\nCandidat : C'est loin du centre ?\nExaminateur : Non, tout est accessible à pied depuis le centre-ville.\nCandidat : C'est combien pour la Citadelle ?\nExaminateur : C'est 18 dollars canadiens pour un adulte.\nCandidat : Y a des visites guidées ?\nExaminateur : Oui, plusieurs fois par jour.\nCandidat : Merci. Au revoir.`,
    dialogue_b1: `Examinateur : Bonjour, Office de Tourisme de Québec, que puis-je faire pour vous ?\nCandidat : Bonjour. Je viens d'arriver à Québec pour quelques jours et je voudrais connaître les principales attractions à ne pas manquer.\nExaminateur : Je vous recommande le Vieux-Québec, la Citadelle, les Plaines d'Abraham et le Musée de la Civilisation.\nCandidat : J'aime beaucoup l'histoire. Lequel vous recommandez en priorité ?\nExaminateur : La Citadelle est incontournable pour l'histoire, avec la relève de la garde en été.\nCandidat : Quels sont les horaires et les tarifs ?\nExaminateur : La Citadelle est ouverte de 9h à 17h, à 18 dollars pour un adulte.\nCandidat : Est-ce qu'il existe un pass touristique pour visiter plusieurs sites ?\nExaminateur : Oui, le Québec City Pass couvre plusieurs attractions pour 50 dollars par jour.`,
    dialogue_b2: `Examinateur : Bonjour, Office de Tourisme de Québec, que puis-je faire pour vous ?\nCandidat : Bonjour. Je viens d'arriver à Québec pour un séjour de trois jours et j'aimerais optimiser mon temps pour découvrir ce que la ville a de plus remarquable. Pourriez-vous me conseiller sur les incontournables ?\nExaminateur : Bien sûr. Je vous recommande le Vieux-Québec classé au patrimoine mondial de l'UNESCO, la Citadelle, les Plaines d'Abraham et le Musée de la Civilisation.\nCandidat : Je suis particulièrement passionné par l'histoire. Lequel de ces sites offre la meilleure expérience pour quelqu'un qui s'intéresse à l'histoire du Canada francophone ?\nExaminateur : Dans ce cas, la Citadelle et le Musée de la Civilisation sont absolument incontournables pour vous.\nCandidat : Quels sont leurs horaires d'ouverture et leurs tarifs respectifs, et est-ce qu'il existe un pass touristique qui permettrait de visiter plusieurs sites à tarif réduit ?\nExaminateur : La Citadelle est ouverte de 9h à 17h à 18 dollars, et le musée de 10h à 17h à 20 dollars. Le Québec City Pass couvre ces deux sites pour 50 dollars par jour.\nCandidat : Est-ce qu'il existe des visites guidées disponibles en français et comment puis-je les réserver à l'avance ?\nExaminateur : Oui, des visites guidées en français sont proposées plusieurs fois par jour. Vous pouvez réserver en ligne sur notre site.\nCandidat : Y a-t-il des événements culturels particuliers à ne pas manquer cette semaine ?\nExaminateur : Oui, il y a justement un festival de musique folklorique ce week-end dans le Vieux-Québec, c'est gratuit.`,
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Quelles sont les attractions incontournables à ne pas manquer ?",
      "Lequel recommandez-vous pour quelqu'un qui s'intéresse à l'histoire ?",
      "Existe-t-il un pass touristique couvrant plusieurs sites ?",
      "Y a-t-il des visites guidées disponibles en français ?",
      "Comment puis-je réserver à l'avance ?",
      "Y a-t-il des événements culturels particuliers cette semaine ?"
    ]
  }
];

async function seed() {
  console.log(`Inserting ${scenarios.length} scenarios...`);

  // Delete existing rows to avoid duplicates on re-run
  const { error: deleteError } = await supabase
    .from("scenario_references")
    .delete()
    .gte("numero", 1);

  if (deleteError) {
    console.warn("Warning during delete:", deleteError.message);
  }

  const { data, error } = await supabase
    .from("scenario_references")
    .insert(scenarios)
    .select("numero, titre");

  if (error) {
    console.error("Insert error:", error.message);
    process.exit(1);
  }

  console.log("Inserted successfully:");
  data.forEach((row) => console.log(`  ${row.numero}. ${row.titre}`));
}

seed();
