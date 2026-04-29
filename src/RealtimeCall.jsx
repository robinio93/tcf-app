import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import {
  IconArrowLeft, IconRefresh, IconChevronUp, IconChevronDown,
  IconPhone, IconCheck, IconAlert, IconLightbulb, IconTarget,
  IconBarChart, IconHourglass, IconSpeak, IconClock, IconWave,
  CategoryBadge,
} from "./components/Icons";

const USER_ACTIVITY = "A vous de parler";
const EXAMINER_ACTIVITY = "L'examinateur parle...";
const WAITING_ACTIVITY = "L'examinateur va vous accueillir...";

const TASK2_MAX_TIME = 210;    // 3 min 30 — interaction effective (la préparation 2 min est en amont)
const TASK2_MIN_TIME = 120;    // 2 min — minimum évaluable
const TASK2_WARN_TIME = 150;   // 2 min 30 — 1 min restante → orange
const TASK2_DANGER_TIME = 180; // 3 min — 30s restantes → rouge
const BASE_FOLLOWUP_RULES =
  "REGLES ABSOLUES DE L'EXAMINATEUR TCF — RESPECTE-LES SANS EXCEPTION : " +
  "1. RELANCES SYSTEMATIQUES : Apres CHAQUE reponse du candidat, pose une question de suivi directement liee a ce qu'il vient de dire. Ne laisse jamais une replique sans reactir ou sans poser une question complementaire. " +
  "2. REPONSES TROP COURTES : Si le candidat repond en une phrase ou de facon vague, relance IMMEDIATEMENT avec 'Et concernant...', 'Pourriez-vous preciser...', 'C'est-a-dire ?', 'Qu'est-ce que vous entendez par...', ou 'Pouvez-vous m'en dire plus sur ce point ?'. " +
  "3. COUVERTURE COMPLETE DU SCENARIO : Tu dois IMPERATIVEMENT aborder tous les aspects du scenario (prix, conditions, horaires, modalites, disponibilites, etc.) sur toute la duree de l'echange. Si le candidat n'a pas demande les tarifs, amene-le naturellement : 'Je peux aussi vous donner une idee des prix si vous voulez.' ou 'Vous voulez qu'on parle des conditions ?' " +
  "4. GESTION DE LA DUREE : Si l'echange dure moins de 3 minutes et que le candidat semble vouloir conclure, relance naturellement avec un detail supplementaire : 'Avant de terminer, je voulais aussi vous mentionner...', 'Au fait, j'oubliais de vous preciser...'. En revanche, si l'echange dure deja plus de 3 minutes et que le candidat dit au revoir ou souhaite partir, conclus poliment et naturellement selon ton role. Ne le retiens plus apres 3 minutes — c'est irrealiste. " +
  "5. DOSES PROGRESSIVES : Revele les informations progressivement, en petites quantites, pour obliger le candidat a poser plusieurs questions successives. Ne donne jamais tout d'un coup. " +
  "6. TON ET REGISTRE : Adapte ton registre au candidat (tutoiement si tutoiement, vouvoiement si vouvoiement). Reste dans ton role. Ne corrige jamais les fautes. Ne sors jamais du role. Reponds uniquement en francais naturel. " +
  "7. LONGUEUR DES REPONSES : 2 a 3 phrases maximum par tour. Laisse toujours de la place pour que le candidat reagisse ou pose une question.";

function buildOpening(roleDesc) {
  return (
    "Tu joues " +
    roleDesc +
    ". Ta toute premiere replique doit etre tres courte et adaptee a ton role : une salutation suivie d'une question ouverte adaptee au contexte. N'anticipe aucun sujet. Attends que le candidat expose sa situation et commence a poser ses questions. Reponds uniquement en francais naturel."
  );
}

function buildOpeningWithPhrases(roleDesc, phrases) {
  if (!Array.isArray(phrases) || phrases.length === 0) return buildOpening(roleDesc);
  const list = phrases.map((p) => `"${p}"`).join(", ");
  return (
    `Tu joues ${roleDesc}. ` +
    `REGLE STRICTE — PREMIERE PHRASE OBLIGATOIRE : Tu DOIS commencer la conversation par EXACTEMENT l'une de ces phrases, choisie au hasard parmi la liste suivante : ${list}. ` +
    `Tu n'as PAS le droit d'improviser, de reformuler ou de modifier cette premiere phrase. C'est l'introduction obligatoire qui pose le contexte. ` +
    `Apres cette premiere phrase, tu attends que le candidat parle et expose sa demande. ` +
    `Tu ne poses JAMAIS de question sur l'organisation personnelle du candidat. ` +
    `Tu joues uniquement le role defini dans le scenario. Reponds uniquement en francais naturel.`
  );
}

// Converts a Supabase scenario_references row to the shape the UI expects.
function adaptScenario(row) {
  const roleMatch = row.role_examinateur.match(
    /[Ll]['']examinateur(?:\s+joue\s+)([\s\S]+?)\.?\s*$/
  );
  const roleDesc = roleMatch ? roleMatch[1].trim() : row.role_examinateur;

  const pointsCles = Array.isArray(row.points_cles_attendus)
    ? `Points importants que le candidat devrait aborder : ${row.points_cles_attendus.join(", ")}. `
    : "";

  return {
    id: row.id,
    badge: `${row.emoji_categorie} ${row.categorie}`,
    title: row.titre,
    summary: row.consigne,
    examinerRole: row.role_examinateur,
    candidateGoal: Array.isArray(row.points_a_penser)
      ? row.points_a_penser.join(". ") + "."
      : row.consigne,
    prompts: Array.isArray(row.points_a_penser) ? row.points_a_penser : [],
    openingInstruction: buildOpeningWithPhrases(roleDesc, row.phrases_accueil_examinateur),
    followupInstruction:
      `Tu joues ${roleDesc}. Scenario : ${row.consigne} ` +
      pointsCles +
      BASE_FOLLOWUP_RULES,
    _raw: row,
  };
}

// Placeholder shown while scenarios load from Supabase
const LOADING_SCENARIO = {
  id: "loading",
  badge: "⏳ Chargement",
  title: "Chargement des scénarios...",
  summary: "Connexion à la base de données en cours.",
  examinerRole: "",
  candidateGoal: "",
  prompts: [],
  openingInstruction: "",
  followupInstruction: "",
  _raw: null,
};

// Kept only as emergency fallback if Supabase is unreachable
const FALLBACK_SCENARIOS = [
  {
    id: "car-rental",
    category: "🚗 Transport",
    badge: "🚗 Transport",
    title: "Louer une voiture pour le week-end",
    summary:
      "Vous contactez une agence pour louer une voiture pour le week-end et trouver une formule adaptee a votre budget.",
    examinerRole: "L'examinateur joue l'employe(e) de l'agence de location.",
    candidateGoal:
      "Expliquez votre besoin, demandez les prix, les conditions et cherchez une solution qui vous convient.",
    prompts: [
      "preciser les dates et le type de voiture souhaite",
      "demander le prix, l'assurance et les conditions de location",
      "negocier ou demander une alternative si l'offre ne convient pas",
    ],
    openingInstruction: buildOpening(
      "un(e) employe(e) d'une agence de location de voitures"
    ),
    followupInstruction:
      "Tu joues l'employe(e) d'une agence de location de voitures. Le candidat veut louer une voiture pour le week-end. Tarifs indicatifs : economique 45-65 CAD/jour, intermediaire 65-85 CAD/jour, SUV 90-120 CAD/jour. Assurance de base incluse ; tous risques en option a 15-25 CAD/jour supplementaires. Carte de credit et permis valide requis. Si le vehicule souhaite n'est pas disponible, propose une alternative proche. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "hotel-bedbugs",
    category: "🏨 Hebergement",
    badge: "🏨 Hébergement",
    title: "Se plaindre a la reception d'un hotel",
    summary:
      "Vous arrivez dans votre chambre d'hotel, vous trouvez des punaises de lit dans le lit et vous allez a la reception demander une solution immediate.",
    examinerRole: "L'examinateur joue le/la receptionniste de l'hotel.",
    candidateGoal:
      "Expliquez clairement le probleme, demandez une solution malgre les difficultes annoncees par l'hotel, puis cherchez une prise en charge correcte.",
    prompts: [
      "decrire clairement le probleme dans la chambre",
      "demander une solution immediate meme si l'hotel dit qu'il n'a pas de chambre libre",
      "si necessaire, insister sur un dedommagement, un relogement ou une prise en charge",
    ],
    openingInstruction:
      "Tu es receptionniste dans un hotel. Le client arrive a la reception pour un probleme. Ta toute premiere replique doit etre tres courte : une salutation polie suivie d'une question ouverte, par exemple 'Bonsoir, que puis-je faire pour vous ?'. N'evoque aucun probleme ni contrainte. Attends que le client expose sa situation. Reponds uniquement en francais naturel.",
    followupInstruction:
      "Tu joues un(e) receptionniste d'hotel. Le client signale avoir trouve des punaises de lit. CONTEXTE : les punaises sont une catastrophe pour un hotel (sante, reputation, legal) — un receptionniste serieux le sait. PROGRESSION — Phase 1 (decouverte) : surprise sincere et empathie, pose uniquement le numero de chambre. Phase 2 (premiere demande) : annonce que l'hotel est complet ce soir, gene et desole, ne propose rien d'autre. Phase 3 (pression) : ajoute que le responsable n'est pas disponible, tu es seul(e) de nuit. Phase 4 (negociation) : laisse le client proposer des solutions. REGLE DU BON SENS : accepte sans resistance les demandes raisonnables — remboursement complet de la nuit = oui ; hotel voisin pris en charge = oui ; taxi = oui. Reste ferme uniquement sur les demandes abusives (remboursement de sejours anterieurs, etc.). Reponds en 1 a 3 phrases. Utilise des tournures naturelles : 'Ecoutez...', 'Vous avez tout a fait raison...', 'On va arranger ca.'. Reponds uniquement en francais. Ne sors jamais du role.",
  },
  {
    id: "agent-immobilier",
    category: "🏠 Logement",
    badge: "🏠 Logement",
    title: "Chercher un logement avec un agent immobilier",
    summary:
      "Vous contactez une agence immobiliere pour trouver un appartement a louer correspondant a vos criteres et a votre budget.",
    examinerRole: "L'examinateur joue l'agent immobilier.",
    candidateGoal:
      "Expliquez vos criteres (type, surface, quartier, budget) et posez des questions sur les biens disponibles et les conditions de location.",
    prompts: [
      "preciser le type de logement, la surface souhaitee et le budget mensuel",
      "demander les quartiers disponibles, les charges et le depot de garantie",
      "s'informer sur les conditions du bail, les animaux et les visites possibles",
    ],
    openingInstruction: buildOpening("un(e) agent immobilier en agence"),
    followupInstruction:
      "Tu joues un(e) agent immobilier a Montreal. Le candidat cherche un appartement a louer. Loyers indicatifs : studio 900-1 100 CAD/mois, 1.5 1 100-1 400, 2.5 1 300-1 700, 3.5 1 500-2 200. Quartiers : Plateau-Mont-Royal, Mile-End, Rosemont, Verdun, Hochelaga, NDG, Outremont. Depot de garantie : generalement 1 mois. Bail standard : 12 mois, reconductible. Chauffage inclus ou non selon l'annonce. Animaux : depends du proprietaire. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "aide-domicile",
    category: "🏠 Logement",
    badge: "🏠 Logement",
    title: "Prendre des renseignements aupres d'une aide a domicile",
    summary:
      "Un(e) voisin(e) vous propose ses services pour le menage, le jardinage ou de petits travaux. Vous voulez en savoir plus avant d'accepter.",
    examinerRole: "L'examinateur joue le/la voisin(e) qui propose ses services.",
    candidateGoal:
      "Demandez les taches proposees, les tarifs, les horaires disponibles et la frequence de passage souhaitable.",
    prompts: [
      "demander quelles taches il/elle peut faire et dans quelles conditions",
      "s'informer sur les tarifs horaires et les modalites de paiement",
      "discuter des horaires, de la frequence et des disponibilites",
    ],
    openingInstruction: buildOpening(
      "un(e) voisin(e) sympa qui propose des services a domicile (menage, jardinage, petits travaux) et attend une reponse"
    ),
    followupInstruction:
      "Tu joues un(e) voisin(e) qui propose ses services a domicile. Prestations : menage (20-28 CAD/h), jardinage (25-35 CAD/h), petits travaux (30-40 CAD/h). Tu travailles pour plusieurs familles du quartier, disponible en semaine et certains samedis. Tu peux t'adapter aux besoins specifiques. Paiement en liquide ou virement. Ton naturel et detendu — c'est un(e) voisin(e), pas une entreprise. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "garde-enfant",
    category: "🏠 Logement",
    badge: "🏠 Logement",
    title: "Garder l'enfant d'un(e) voisin(e)",
    summary:
      "Un(e) voisin(e) vous demande de garder son enfant un soir. Avant d'accepter, vous posez des questions pour bien comprendre la situation.",
    examinerRole: "L'examinateur joue le/la parent voisin(e).",
    candidateGoal:
      "Demandez l'age de l'enfant, les horaires, les repas, les allergies eventuelles et les activites prevues pour la soiree.",
    prompts: [
      "demander l'age de l'enfant, ses habitudes et ses eventuelles allergies",
      "s'informer sur les horaires et l'heure de retour prevue",
      "demander si des repas sont prevus et quelles activites proposer a l'enfant",
    ],
    openingInstruction: buildOpening(
      "un(e) parent voisin(e) qui cherche quelqu'un pour garder son enfant et est soulag(e) de pouvoir compter sur toi"
    ),
    followupInstruction:
      "Tu joues un(e) parent voisin(e) qui cherche a faire garder son enfant. L'enfant s'appelle Theo, 6 ans, calme et facile. Il mange des pates ou du riz, boit du lait. Pas d'allergies connues. Tu prevois rentrer vers 22h30. Il a ses jouets et peut regarder un dessin anime. Tu laisses une liste de numeros d'urgence. Tarif habituellement 15-18 CAD/h. Ton chaleureux et familier — c'est un(e) voisin(e). " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "retour-canada",
    category: "✈️ Voyage",
    badge: "✈️ Voyage",
    title: "Parler du retour de voyage d'un(e) collegue",
    summary:
      "Un(e) collegue vient de rentrer d'un sejour de deux semaines au Canada. Vous lui posez des questions sur son voyage.",
    examinerRole: "L'examinateur joue le/la collegue qui revient de voyage.",
    candidateGoal:
      "Posez des questions sur les activites, les transports, les loisirs, les couts et demandez des conseils pour un futur voyage.",
    prompts: [
      "demander ou il/elle est alle(e) et pendant combien de temps",
      "s'informer sur les activites, les transports et les couts du sejour",
      "demander des conseils pratiques pour un voyage similaire",
    ],
    openingInstruction: buildOpening(
      "un(e) collegue qui revient d'un sejour de 2 semaines au Canada et est enthousiaste a l'idee d'en parler"
    ),
    followupInstruction:
      "Tu joues un(e) collegue qui revient d'un sejour de 2 semaines au Quebec (Montreal + Quebec City). Activites : Vieux-Montreal, Mont-Royal, plaines d'Abraham, randonnees, musees, festivals. Transport : vol Paris-Montreal ~7h, 600-900 CAD aller-simple ; VIA Rail Montreal-Quebec 50-80 CAD. Budget moyen 150-200 CAD/jour tout compris. Saison ideale : ete juin-aout, ou hiver pour la neige et le Carnaval. Conseils : reserver Airbnb a l'avance, louer une voiture si possible. Ton enthousiaste et familier. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "sejour-ville",
    category: "✈️ Voyage",
    badge: "✈️ Voyage",
    title: "Organiser un sejour en ville francophone avec un professeur",
    summary:
      "Un professeur vous aide a organiser un voyage en famille dans une ville francophone (Quebec, Bruxelles ou Dakar). Vous posez vos questions.",
    examinerRole: "L'examinateur joue le professeur ou le conseiller voyage.",
    candidateGoal:
      "Demandez les activites adaptees a une famille, le budget necessaire, les preparatifs et les conseils pratiques.",
    prompts: [
      "choisir la destination et demander les activites adaptees a une famille",
      "s'informer sur le budget total, les hebergements et les transports sur place",
      "demander la meilleure periode, les documents necessaires et les precautions",
    ],
    openingInstruction: buildOpening(
      "un professeur ou conseiller voyage qui aide a planifier un sejour en famille dans une ville francophone"
    ),
    followupInstruction:
      "Tu joues un professeur ou conseiller voyage. Destinations possibles : Quebec City (3h de Montreal, patrimoine UNESCO, Carnaval en fevrier, activites hivernales et estivales, budget 150-180 CAD/j/pers) ; Bruxelles (vol ~8h, 700-1 100 CAD, musees, chocolat, BD, Atomium, tres familiale) ; Dakar (vol ~8h, 800-1 400 CAD, plages, marches, ile de Goree, culture riche). Budget famille de 4 personnes pour 10 jours : 4 000-6 000 CAD selon destination. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "vacances-mer",
    category: "✈️ Voyage",
    badge: "✈️ Voyage",
    title: "Demander des conseils pour des vacances a la mer",
    summary:
      "Un(e) ami(e) a passe de belles vacances au bord de la mer et vous conseille pour organiser votre propre sejour balneaire.",
    examinerRole: "L'examinateur joue l'ami(e) qui conseille.",
    candidateGoal:
      "Demandez des conseils sur la destination, l'hebergement, la periode ideale, les activites et le budget.",
    prompts: [
      "demander ou il/elle est alle(e) et pourquoi cette destination",
      "s'informer sur l'hebergement, les activites et le budget quotidien",
      "demander la meilleure periode et des conseils pratiques",
    ],
    openingInstruction: buildOpening(
      "un(e) ami(e) qui revient de super vacances a la mer et est ravi(e) d'en parler"
    ),
    followupInstruction:
      "Tu joues un(e) ami(e) qui revient de vacances a la mer. Destination au choix selon le candidat : Cote d'Azur (Nice, Antibes), Bretagne, Gaspesie au Quebec, ou Caraïbes. Hebergement en location ~80-150 CAD ou EUR/nuit selon destination. Activites : plage, snorkeling, velo cotier, marche, restaurants poissons/fruits de mer. Meilleure periode : juillet-aout pour soleil, juin/septembre moins cher. Conseils : reserver 2-3 mois a l'avance en haute saison. Ton chaleureux et enthousiaste. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "vacances-montagne",
    category: "✈️ Voyage",
    badge: "✈️ Voyage",
    title: "Parler des vacances a la montagne avec un(e) ami(e) canadien(ne)",
    summary:
      "Un(e) ami(e) canadien(ne) rentre de vacances a la montagne. Vous lui posez des questions sur son sejour.",
    examinerRole:
      "L'examinateur joue l'ami(e) canadien(ne) qui revient de montagne.",
    candidateGoal:
      "Demandez le lieu, l'hebergement, les activites pratiquees, l'equipement necessaire et le budget du sejour.",
    prompts: [
      "demander ou il/elle est alle(e) et comment etait le sejour",
      "s'informer sur les activites pratiquees et l'equipement necessaire",
      "demander le budget total et si il/elle recommande cette destination",
    ],
    openingInstruction: buildOpening(
      "un(e) ami(e) canadien(ne) qui revient de vacances a la montagne, encore sous le charme"
    ),
    followupInstruction:
      "Tu joues un(e) ami(e) canadien(ne) qui revient de vacances dans les Laurentides ou les Rocheuses (Banff, Whistler). Activites ete : randonnee, kayak, vtt, lac. Hiver : ski, raquettes, spa chalet. Hebergement : chalet loue 180-350 CAD/nuit ou hotel montagne 150-280 CAD/nuit. Forfait ski : 80-120 CAD/jour, location equipement 40-60 CAD. Conseils : pneus hiver obligatoires, reserver les chalets longtemps a l'avance. Periode ski : decembre-mars. Ton enthousiaste et familier. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "office-tourisme",
    category: "✈️ Voyage",
    badge: "✈️ Voyage",
    title: "S'informer a l'office de tourisme d'une ville",
    summary:
      "Vous venez d'arriver dans une ville francophone et vous allez a l'office de tourisme pour decouvrir les activites et visites possibles.",
    examinerRole:
      "L'examinateur joue l'employe(e) de l'office de tourisme.",
    candidateGoal:
      "Demandez les activites disponibles, les tarifs, les horaires et les visites guidees possibles.",
    prompts: [
      "demander les principales attractions et activites de la ville",
      "s'informer sur les tarifs, les horaires et les passes touristiques",
      "demander s'il existe des visites guidees et comment y acceder",
    ],
    openingInstruction: buildOpening(
      "un(e) employe(e) accueillant(e) de l'office de tourisme de Montreal (ou d'une autre ville si le candidat le mentionne)"
    ),
    followupInstruction:
      "Tu joues un(e) employe(e) de l'office de tourisme de Montreal. Attractions : Vieux-Montreal, Mont-Royal, marche Jean-Talon, biodome (~22 CAD), musee des Beaux-Arts (~20 CAD), marche Bonsecours. Visites guidees : a pied ou en bus, 25-45 CAD. Montreal Pass 3 jours ~70 CAD. Metro + bus : carnet 10 titres ~30 CAD. Gratuit : parc du Mont-Royal, Vieux-Port, piste cyclable. Ton professionnel et accueillant. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "premier-jour",
    category: "💼 Travail",
    badge: "💼 Travail",
    title: "Parler du premier jour de travail d'un(e) ami(e)",
    summary:
      "Un(e) ami(e) vient de vivre son premier jour dans un nouveau travail. Vous lui posez des questions sur son experience.",
    examinerRole:
      "L'examinateur joue l'ami(e) qui raconte son premier jour.",
    candidateGoal:
      "Demandez des informations sur l'ambiance, les taches confiees, les collegues, les horaires et la formation prevue.",
    prompts: [
      "demander comment s'est passe l'accueil et quelle est l'ambiance",
      "s'informer sur les taches confiees et les responsabilites du poste",
      "demander les horaires, la periode d'essai et les perspectives",
    ],
    openingInstruction: buildOpening(
      "un(e) ami(e) qui vient de vivre son premier jour dans un nouveau poste et a envie d'en parler"
    ),
    followupInstruction:
      "Tu joues un(e) ami(e) qui vient de vivre son premier jour dans un nouveau poste (secteur tertiaire, bureaux). Ambiance : collegues sympas, open-space, manager accessible et direct. Taches : prise en main des outils, reunions d'introduction, lecture documentation interne. Horaires : 8h30-17h30, teletravail 2 jours/semaine possible apres la periode d'essai. Periode d'essai : 3 mois. Formation : e-learning la premiere semaine, puis mentoring avec un collegue. Ton enthousiaste mais un peu stresse, familier. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "livraison-meuble",
    category: "💼 Travail",
    badge: "💼 Travail",
    title: "Organiser la livraison d'un meuble",
    summary:
      "Vous contactez une entreprise de livraison pour vous renseigner sur les tarifs, les delais et les conditions pour livrer un meuble.",
    examinerRole:
      "L'examinateur joue l'employe(e) du service client de l'entreprise.",
    candidateGoal:
      "Demandez les tarifs selon le type de meuble, les delais de livraison, si le montage est inclus et les conditions d'annulation.",
    prompts: [
      "demander les tarifs de livraison selon le type et la taille du meuble",
      "s'informer sur les delais et les creneaux de livraison disponibles",
      "demander si le montage est inclus et quelles sont les conditions d'annulation",
    ],
    openingInstruction: buildOpening(
      "un(e) employe(e) du service client d'une entreprise de livraison de meubles, professionnel(le) et disponible"
    ),
    followupInstruction:
      "Tu joues un(e) employe(e) du service client d'une entreprise de livraison de meubles. Tarifs : petit meuble 25-45 CAD, meuble moyen 55-80 CAD, grand meuble ou electromenager 90-150 CAD. Montage en option : 30-60 CAD selon complexite. Delais : 3-7 jours ouvrables standard, livraison express 24-48h avec supplement. Zones : Grand Montreal et couronne, 40 km autour. Creneaux : matin (8h-12h) ou apres-midi (13h-17h). Annulation gratuite jusqu'a 48h avant. Ton professionnel et courtois. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "yoga-entreprise",
    category: "🏋️ Sport",
    badge: "🏋️ Sport",
    title: "S'informer sur des seances de yoga au bureau",
    summary:
      "Un(e) collegue organise des seances de yoga au bureau. Vous lui posez des questions pour savoir si vous pouvez participer.",
    examinerRole:
      "L'examinateur joue le/la collegue organisateur(trice).",
    candidateGoal:
      "Demandez des informations sur le lieu, les horaires, la duree, les niveaux requis et l'equipement necessaire.",
    prompts: [
      "demander ou se deroulent les seances et a quelle frequence",
      "s'informer sur le niveau requis et si les debutants sont les bienvenus",
      "demander si un equipement special est necessaire et s'il y a des frais",
    ],
    openingInstruction: buildOpening(
      "un(e) collegue enthousiaste qui organise des seances de yoga au bureau et cherche a convaincre d'autres personnes de participer"
    ),
    followupInstruction:
      "Tu joues un(e) collegue qui organise des seances de yoga en entreprise. Seances dans la salle de reunion du 3e etage, mardis et jeudis de 12h15 a 13h (pause dejeuner). Instructrice certifiee externe. Tous niveaux acceptes, debutants bienvenus. Materiel : tapis fournis, vetements confortables suffisent. Gratuit pour les employes (comite d'entreprise). 8 personnes max par seance, 5 inscrits pour l'instant. Ton enthousiaste et familier. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "club-sport",
    category: "🏋️ Sport",
    badge: "🏋️ Sport",
    title: "S'inscrire dans un club de sport de quartier",
    summary:
      "Vous allez a la reception d'un club de sport de quartier pour vous renseigner sur les activites, les tarifs et les horaires d'inscription.",
    examinerRole:
      "L'examinateur joue le/la receptionniste du club de sport.",
    candidateGoal:
      "Demandez les sports disponibles, les tarifs d'abonnement, les horaires des cours et les conditions d'inscription.",
    prompts: [
      "demander quels sports et activites sont proposes par le club",
      "s'informer sur les tarifs (mensuel, annuel, seance d'essai) et ce qui est inclus",
      "demander les horaires, les conditions d'essai et les formalites pour s'inscrire",
    ],
    openingInstruction: buildOpening(
      "un(e) receptionniste professionnel(le) d'un club de sport de quartier"
    ),
    followupInstruction:
      "Tu joues le/la receptionniste d'un club de sport de quartier. Sports : musculation, cardio, piscine, cours collectifs (zumba, pilates, spinning, boxe, yoga). Tarifs : seance a l'essai 15 CAD, mensuel 45-65 CAD, annuel 400-550 CAD. Cours collectifs inclus dans l'abonnement sauf cours premium. Horaires : lun-ven 6h-22h, week-end 8h-18h. Inscription : piece d'identite et carte bancaire. Premier mois sans engagement possible. Ton professionnel et accueillant. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "passion-montagne",
    category: "🏋️ Sport",
    badge: "🏋️ Sport",
    title: "Parler de la passion de la montagne avec une rencontre en gare",
    summary:
      "Vous rencontrez quelqu'un dans une gare qui est passionne(e) de montagne. Vous lui posez des questions sur cette activite.",
    examinerRole:
      "L'examinateur joue le/la passionne(e) de montagne rencontre(e) en gare.",
    candidateGoal:
      "Demandez le type d'activite pratiquee, la frequence, l'equipement, les refuges et les conseils pour un debutant.",
    prompts: [
      "demander quel type d'activite il/elle pratique et depuis combien de temps",
      "s'informer sur l'equipement necessaire et les precautions a prendre",
      "demander des conseils pour debuter et des itineraires accessibles",
    ],
    openingInstruction: buildOpening(
      "une personne passionnee de montagne rencontree par hasard dans une gare, sac de rando sur le dos, de retour d'une sortie"
    ),
    followupInstruction:
      "Tu joues quelqu'un de passionne de montagne (randonnee et alpinisme leger) depuis 8 ans, surtout Alpes, Pyrenees ou Rocheuses. Activites : randonnee journee, bivouac, raquettes en hiver. Equipement indispensable : chaussures de rando, veste impermeable, batons, carte ou GPS, trousse de secours. Refuges de montagne : 40-60 EUR/nuit en Europe, reservation conseillée ete. Pour debutants : commencer par des balades balisees niveau vert, puis bleu. Tu parles avec passion. Registre semi-familier selon ce que fait le candidat. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "centre-langue",
    category: "🎓 Formation",
    badge: "🎓 Formation",
    title: "S'inscrire dans un centre de langue pour apprendre le francais",
    summary:
      "Vous appelez ou visitez un centre de langue francaise pour vous renseigner sur les cours disponibles et les modalites d'inscription.",
    examinerRole:
      "L'examinateur joue le/la conseiller(e) pedagogique du centre.",
    candidateGoal:
      "Demandez les niveaux de cours, les horaires, les tarifs, les methodes et les certifications preparees.",
    prompts: [
      "demander les niveaux proposes et comment evaluer son propre niveau",
      "s'informer sur les horaires, la duree des cours et les tarifs",
      "demander quelles certifications sont preparees et quelles methodes sont utilisees",
    ],
    openingInstruction: buildOpening(
      "un(e) conseiller(e) pedagogique d'un centre de langue francaise, professionnel(le) et bienveillant(e)"
    ),
    followupInstruction:
      "Tu joues un(e) conseiller pedagogique d'un centre de langue. Niveaux : A1 a C1, avec test de positionnement gratuit. Formats : intensif 20h/semaine (9h-13h), semi-intensif 10h/semaine (matin ou soir), cours du soir 2 soirees/semaine. Tarifs : semi-intensif 4 semaines ~450 CAD, intensif 4 semaines ~800 CAD. Certifications preparees : TCF, TEF, DELF, DALF. Methode communicative, classes de 8-12 personnes max. Ton professionnel et bienveillant. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "cours-particuliers",
    category: "🎓 Formation",
    badge: "🎓 Formation",
    title: "Prendre des cours particuliers de francais",
    summary:
      "Vous contactez un(e) professeur de francais independant(e) pour vous renseigner sur ses cours, ses methodes et ses tarifs.",
    examinerRole:
      "L'examinateur joue le/la professeur de francais independant(e).",
    candidateGoal:
      "Demandez si les cours sont en ligne ou en presentiel, les tarifs, les forfaits disponibles, les devoirs et le niveau requis.",
    prompts: [
      "demander si les cours sont en ligne ou en presentiel et la duree des seances",
      "s'informer sur les tarifs a la seance et les eventuels forfaits",
      "demander comment se deroulent les cours et si des devoirs sont donnes entre les seances",
    ],
    openingInstruction: buildOpening(
      "un(e) professeur de francais independant(e) qui propose des cours particuliers"
    ),
    followupInstruction:
      "Tu joues un(e) professeur de francais independant(e). Cours en presentiel a domicile ou en ligne (Zoom ou Teams). Seances de 1h ou 1h30. Tarifs : 45-60 CAD/h selon le niveau (FLE debutant moins cher, preparation TCF/DALF plus cher). Forfaits : 10 seances avec 10% de remise. Exercices donnes entre les seances (20-30 min). Aucun niveau requis, adaptation totale. Preparation aux certifications : TCF, TEF, DELF, DALF. Ton accessible et professionnel, semi-formel. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "fete-quebec",
    category: "🎉 Vie sociale",
    badge: "🎉 Vie sociale",
    title: "Preparer une fete avec un(e) ami(e) quebecois(e)",
    summary:
      "Un(e) ami(e) quebecois(e) organise une fete chez lui/elle et vous invite. Vous posez des questions pour savoir comment vous preparer.",
    examinerRole:
      "L'examinateur joue l'ami(e) quebecois(e) qui organise la fete.",
    candidateGoal:
      "Demandez l'heure, l'adresse, le dress code, les autres invites, la nourriture prevue et les eventuelles traditions locales.",
    prompts: [
      "demander l'heure, l'adresse et s'il faut apporter quelque chose",
      "s'informer sur le style de la fete, les invites et le dress code",
      "demander s'il y a des traditions ou coutumes quebecoises a connaitre",
    ],
    openingInstruction: buildOpening(
      "un(e) ami(e) quebecois(e) qui organise une fete et est content(e) de t'inviter"
    ),
    followupInstruction:
      "Tu joues un(e) ami(e) quebecois(e) qui organise une fete. Ca commence a 18h30. Apporter une bouteille de vin ou une biere quebecoise (Boreal, IPA locale) est bienvenu mais pas obligatoire. Dress code : decontracte, pas de costume. Invites : une quinzaine d'amis et collegues. Bouffe : BBQ en ete (burgers, saucisses), ou buffet hivernal (tourtiere, cretons, tarte au sucre — style cabane a sucre). Fin prevue vers minuit ou 1h. Musique quebecoise possible. Ton tres familier et enjoue. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "vente-demenagement",
    category: "🛒 Achats",
    badge: "🛒 Achats",
    title: "Acheter des objets chez un(e) ami(e) qui demenage",
    summary:
      "Un(e) ami(e) demenage et vend ses affaires avant de partir. Vous lui posez des questions sur ce qui est disponible et a quels prix.",
    examinerRole:
      "L'examinateur joue l'ami(e) qui vend ses affaires.",
    candidateGoal:
      "Demandez quels objets sont disponibles, leur etat, les prix et si une negociation est possible.",
    prompts: [
      "demander quels meubles et objets sont a vendre",
      "s'informer sur l'etat des articles et les prix demandes",
      "negocier un prix ou demander une remise si vous en achetez plusieurs",
    ],
    openingInstruction: buildOpening(
      "un(e) ami(e) decontracte(e) qui vend ses affaires avant de demenager et est contente de te voir intéresse(e)"
    ),
    followupInstruction:
      "Tu joues un(e) ami(e) qui vend ses affaires avant un demenagement. Articles disponibles : canape 3 places bon etat (200 CAD), table basse quelques rayures (40 CAD), lampe de salon neuve (35 CAD), velo de ville 2 ans bien entretenu (150 CAD), livres et vinyls (10 CAD le lot), petite etagere Ikea (15 CAD). Tu peux negocier si le candidat en prend plusieurs. Tout doit partir avant samedi. Ton tres detendu et familier. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "achat-voiture",
    category: "🛒 Achats",
    badge: "🛒 Achats",
    title: "Acheter une voiture d'occasion a un particulier",
    summary:
      "Un particulier vend sa voiture d'occasion. Vous le contactez pour en savoir plus et evaluer si c'est une bonne affaire.",
    examinerRole: "L'examinateur joue le vendeur particulier.",
    candidateGoal:
      "Demandez le prix, le kilometrage, l'annee, l'etat general, l'historique d'entretien et si une negociation est possible.",
    prompts: [
      "demander l'annee du vehicule, le kilometrage et la raison de la vente",
      "s'informer sur l'etat general, les reparations recentes et l'historique",
      "discuter du prix, des documents disponibles et d'une eventuelle visite ou essai",
    ],
    openingInstruction: buildOpening(
      "un particulier qui vend sa voiture de bonne foi et repond aux questions de facon transparente"
    ),
    followupInstruction:
      "Tu joues un particulier qui vend sa voiture. Modele : Honda Civic 2019, 78 000 km, automatique, climatisee, Bluetooth, pneus hiver inclus. Prix demande : 14 500 CAD (negoce jusqu'a 13 800). Raison : achat d'un pick-up plus grand. Entretien : vidanges regulieres, revisee il y a 6 mois. Carrosserie : petite egratignure arriere, sinon bon etat. 2 proprietaires avant toi. Pret a faire essayer et a fournir le CARFAX. Ton naturel et honnete, semi-formel. " +
      BASE_FOLLOWUP_RULES,
  },
  {
    id: "cinema-canada",
    category: "🎬 Culture",
    badge: "🎬 Culture",
    title: "S'informer sur les films dans une salle de cinema canadienne",
    summary:
      "Vous allez a la caisse d'un cinema pour vous renseigner sur les films a l'affiche, les horaires et les tarifs.",
    examinerRole:
      "L'examinateur joue l'employe(e) de la salle de cinema.",
    candidateGoal:
      "Demandez les films a l'affiche, les horaires, les tarifs et s'il existe une salle IMAX ou des abonnements avantageux.",
    prompts: [
      "demander quels films sont a l'affiche et dans quels genres",
      "s'informer sur les horaires des seances et les tarifs (adulte, etudiant, IMAX)",
      "demander comment reserver et s'il existe des formules ou abonnements",
    ],
    openingInstruction: buildOpening(
      "un(e) employe(e) souriant(e) d'un cinema Cineplex (grande chaine canadienne)"
    ),
    followupInstruction:
      "Tu joues un(e) employe(e) d'un cinema Cineplex. Films a l'affiche : varies (action, comedie, animation, thriller — adapte selon ce que demande le candidat). Tarifs : adulte 13-16 CAD, etudiant/senior 10-12 CAD, enfant 8-10 CAD, IMAX 18-22 CAD. Horaires : seances a 14h, 17h, 19h30 et 21h45 selon les films. Reservation en ligne ou en caisse. Programme Scene+ (fidelite) et membership mensuel ~20 CAD pour films illimites. Ton professionnel et souriant. " +
      BASE_FOLLOWUP_RULES,
  },
];

function getActivityColors(label) {
  if (label === USER_ACTIVITY) {
    return {
      border: "rgba(34, 197, 94, 0.45)",
      background: "rgba(34, 197, 94, 0.16)",
      text: "#dcfce7",
      glow: "0 18px 40px rgba(34, 197, 94, 0.18)",
    };
  }

  return {
    border: "rgba(59, 130, 246, 0.45)",
    background: "rgba(59, 130, 246, 0.16)",
    text: "#dbeafe",
    glow: "0 18px 40px rgba(59, 130, 246, 0.18)",
  };
}

function extractClientSecret(payload) {
  if (!payload || typeof payload !== "object") return "";

  if (typeof payload.value === "string") return payload.value;
  if (typeof payload.client_secret === "string") return payload.client_secret;
  if (typeof payload.client_secret?.value === "string") {
    return payload.client_secret.value;
  }

  return "";
}

async function createRealtimeSession(silenceDuration = 1200) {
  let response;

  try {
    response = await fetch("/api/realtime-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ silenceDuration }),
    });
  } catch {
    throw new Error(
      "Impossible de joindre /api/realtime-session. En local, redemarrez le serveur npm run dev apres la mise a jour de vite.config.js."
    );
  }

  const raw = await response.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "La route /api/realtime-session est introuvable. En local, redemarrez npm run dev pour recharger vite.config.js."
      );
    }

    throw new Error(
      data?.message ||
        data?.details?.error?.message ||
        data?.error ||
        `Echec de /api/realtime-session (HTTP ${response.status}).`
    );
  }

  const clientSecret = extractClientSecret(data);

  if (!clientSecret) {
    throw new Error(
      "La reponse de /api/realtime-session ne contient pas de client secret exploitable."
    );
  }

  return clientSecret;
}

function EncartTcfT2() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ border: "1px solid rgba(245,158,11,0.28)", background: "rgba(245,158,11,0.08)", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
      <button type="button" onClick={() => setIsOpen(v => !v)} aria-expanded={isOpen}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
        <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.4 }}>📖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#fbbf24", marginBottom: "4px" }}>Comment se déroule la Tâche 2 du TCF Canada</div>
          <div style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.55 }}>5 minutes 30 — c'est toi qui mènes la conversation pour obtenir des informations.</div>
        </div>
        <span style={{ color: "#fbbf24", fontSize: "16px", flexShrink: 0, marginTop: "2px", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} aria-hidden="true">▾</span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(245,158,11,0.2)" }}>
          <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.65 }}>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>📌 Le format réel de l'examen</div>
              <p style={{ margin: 0 }}>La Tâche 2 dure exactement <strong>5 minutes 30</strong>, dont <strong>2 minutes de préparation</strong> et 3 minutes 30 d'interaction. Tu reçois un scénario où on te dit qui est ton interlocuteur, qui tu es, et sur quel sujet tu dois obtenir des informations.</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>🎯 Ta stratégie gagnante</div>
              <p style={{ margin: 0 }}>Pendant les 2 minutes de préparation, tu lis le sujet et tu notes <strong>8 à 12 questions à poser</strong>. Pendant les 3 min 30 d'interaction, tu poses tes questions et tu réagis aux réponses pour montrer que tu comprends. Plus tu poses de questions variées, mieux tu démontres ton niveau.</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>💡 Comment l'interaction se passe</div>
              <p style={{ margin: 0 }}>L'examinateur joue le rôle indiqué dans le scénario (agent immobilier, ami, professeur…). Il répond sincèrement à tes questions avec des détails. Tu peux rebondir sur ses réponses pour demander des précisions.</p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fde68a", marginBottom: "4px" }}>⚠️ Le piège classique</div>
              <p style={{ margin: 0 }}>Beaucoup de candidats préparent 5-6 questions et s'arrêtent. Pour viser un bon score, prépare 8-12 questions différentes et n'hésite pas à demander des clarifications ("Et quels sont les tarifs exactement ?", "Comment ça marche concrètement ?").</p>
            </div>
            <div style={{ paddingTop: "8px", borderTop: "1px solid rgba(245,158,11,0.2)", fontSize: "12px", color: "rgba(253,230,138,0.6)", fontStyle: "italic" }}>
              Source : France Éducation International, méthodologie TCF Canada officielle.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RealtimeCall({ onBack = null }) {
  const [callState, setCallState] = useState("idle");
  const [activity, setActivity] = useState(WAITING_ACTIVITY);
  const [errorMessage, setErrorMessage] = useState("");
  const [scenarios, setScenarios] = useState([]);
  const [scenariosLoaded, setScenariosLoaded] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [speechRate, setSpeechRate] = useState(""); // "" = non choisi | "slow" = 1800ms | "fast" = 1000ms
  const [showScenario, setShowScenario] = useState(
    () => typeof window !== "undefined" ? window.innerWidth >= 640 : true
  );
  const [statusNote, setStatusNote] = useState(
    "Appuyez sur Appeler pour lancer la simulation de la tache 2."
  );

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const connectAttemptRef = useRef(0);
  const dataChannelReadyRef = useRef(false);
  const sessionReadyRef = useRef(false);
  const greetingSentRef = useRef(false);
  const activeResponseRef = useRef(false);
  const pendingExaminerTurnRef = useRef(false);
  const examinerAudioLockUntilRef = useRef(0);
  const returnToUserTimerRef = useRef(null);
  const conversationLogRef = useRef([]);
  const currentExaminerTranscriptRef = useRef("");
  const scenarioAtCallRef = useRef(null);
  const speechRecorderRef = useRef(null);
  const currentSpeechChunksRef = useRef([]);
  const speechBlobsRef = useRef([]);
  const callTimerRef = useRef(null);
  const callTimeAtHangUpRef = useRef(0);

  const [callTime, setCallTime] = useState(0);
  const [debriefState, setDebriefState] = useState("idle");
  const [debrief, setDebrief] = useState(null);
  const [conversationTranscript, setConversationTranscript] = useState([]);
  const debriefSectionRef = useRef(null);
  const processingSectionRef = useRef(null);
  const [expandedScore, setExpandedScore] = useState(null);
  // null | "transcribing" | "analyzing"
  const [processingStep, setProcessingStep] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [uiPhase, setUiPhase] = useState("intro"); // "intro" | "preparation" | "interaction"
  const [notesPreparation, setNotesPreparation] = useState("");
  const [preparationTimerSec, setPreparationTimerSec] = useState(120);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const selectedScenario = scenarios[scenarioIndex] ?? LOADING_SCENARIO;
  const isConnecting = callState === "connecting";
  const isConnected = callState === "connected";

  function getNextScenarioIndex(currentIndex, list) {
    if (list.length <= 1) return 0;
    return (currentIndex + 1) % list.length;
  }

  function handleStartInteraction() {
    setUiPhase("interaction");
    startCall();
  }

  useEffect(() => {
    if (uiPhase !== "preparation") return;
    if (preparationTimerSec <= 0) {
      handleStartInteraction();
      return;
    }
    const id = setTimeout(() => setPreparationTimerSec(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [uiPhase, preparationTimerSec]);

  function formatCallTime(seconds) {
    const safe = Math.max(0, Number(seconds) || 0);
    const min = Math.floor(safe / 60);
    const sec = safe % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  function getCallTimerColor() {
    if (callTime >= TASK2_DANGER_TIME) return "#fb7185";
    if (callTime >= TASK2_WARN_TIME) return "#f59e0b";
    if (callTime >= TASK2_MIN_TIME) return "#22c55e";
    return "#7dd3fc";
  }

  function getCallTimerLabel() {
    if (callTime >= TASK2_MAX_TIME) return "Temps écoulé";
    const remaining = TASK2_MAX_TIME - callTime;
    if (callTime >= TASK2_DANGER_TIME) return `⚠️ ${remaining}s restantes`;
    if (callTime >= TASK2_WARN_TIME) return "⚠️ 1 minute restante";
    if (callTime >= TASK2_MIN_TIME) return "Minimum conseillé atteint ✓";
    return "Minimum conseillé non atteint (3 min)";
  }

  function getCallTimerProgress() {
    return Math.min((callTime / TASK2_MAX_TIME) * 100, 100);
  }

  function stopCallTimer() {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }

  function clearReturnToUserTimer() {
    if (returnToUserTimerRef.current) {
      clearTimeout(returnToUserTimerRef.current);
      returnToUserTimerRef.current = null;
    }
  }

  function setUserTurn(note) {
    setActivity(USER_ACTIVITY);
    if (note) {
      setStatusNote(note);
    }
  }

  function setExaminerTurn(note) {
    setActivity(EXAMINER_ACTIVITY);
    if (note) {
      setStatusNote(note);
    }
  }

  function lockExaminerTurn(ms = 1600) {
    examinerAudioLockUntilRef.current = Math.max(
      examinerAudioLockUntilRef.current,
      Date.now() + ms
    );
  }

  function markExaminerPending(note, lockMs = 1400) {
    clearReturnToUserTimer();
    pendingExaminerTurnRef.current = true;
    lockExaminerTurn(lockMs);
    setExaminerTurn(note);
  }

  function scheduleUserTurn(note) {
    clearReturnToUserTimer();

    const retry = () => {
      const remainingLock = examinerAudioLockUntilRef.current - Date.now();

      if (pendingExaminerTurnRef.current || remainingLock > 0) {
        returnToUserTimerRef.current = setTimeout(
          retry,
          Math.max(200, remainingLock)
        );
        return;
      }

      setUserTurn(note);
    };

    returnToUserTimerRef.current = setTimeout(retry, 1200);
  }

  function resetRealtimeFlags() {
    clearReturnToUserTimer();
    dataChannelReadyRef.current = false;
    sessionReadyRef.current = false;
    greetingSentRef.current = false;
    activeResponseRef.current = false;
    pendingExaminerTurnRef.current = false;
    examinerAudioLockUntilRef.current = 0;
    currentExaminerTranscriptRef.current = "";
    stopCallTimer();
    if (speechRecorderRef.current && speechRecorderRef.current.state !== "inactive") {
      try { speechRecorderRef.current.stop(); } catch { /* no-op */ }
    }
    speechRecorderRef.current = null;
    currentSpeechChunksRef.current = [];
  }

  function closeRealtimeResources() {
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch {
        // no-op
      }
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;

      try {
        peerConnectionRef.current.close();
      } catch {
        // no-op
      }

      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    resetRealtimeFlags();
  }

  function sendClientEvent(event) {
    const channel = dataChannelRef.current;

    if (!channel || channel.readyState !== "open") return;
    channel.send(JSON.stringify(event));
  }

  function setMicrophoneEnabled(enabled) {
    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  function changeScenario() {
    if (isConnecting || isConnected || scenarios.length === 0) return;

    const nextIndex = getNextScenarioIndex(scenarioIndex, scenarios);

    // Reshuffle when wrapping around to the start
    if (nextIndex === 0 && scenarios.length > 1) {
      setScenarios((prev) => [...prev].sort(() => Math.random() - 0.5));
    }

    const nextScenario = scenarios[nextIndex] ?? LOADING_SCENARIO;

    setScenarioIndex(nextIndex);
    setErrorMessage("");
    setActivity(USER_ACTIVITY);
    setDebrief(null);
    setDebriefState("idle");
    setProcessingStep(null);
    setConversationTranscript([]);
    setShowTranscript(false);
    setCallTime(0);
    stopCallTimer();
    conversationLogRef.current = [];
    speechBlobsRef.current = [];
    currentSpeechChunksRef.current = [];
    setStatusNote(
      `Nouveau sujet charge : ${nextScenario.title}. Appuyez sur Appeler pour demarrer.`
    );
  }

  function maybeStartAssistantGreeting() {
    if (
      greetingSentRef.current ||
      activeResponseRef.current ||
      !dataChannelReadyRef.current ||
      !sessionReadyRef.current
    ) {
      return;
    }

    greetingSentRef.current = true;
    markExaminerPending(
      `Connexion etablie. L'examinateur ouvre brievement l'echange, puis ce sera a vous.`
    );

    sendClientEvent({
      type: "response.create",
      response: {
        output_modalities: ["audio"],
        instructions: selectedScenario.openingInstruction,
      },
    });
  }

  function handleServerEvent(event) {
    if (!event || typeof event.type !== "string") return;

    if (event.type === "session.created") {
      sessionReadyRef.current = true;
      maybeStartAssistantGreeting();
      return;
    }

    if (event.type === "input_audio_buffer.speech_started") {
      if (!localStreamRef.current?.getAudioTracks()?.some((track) => track.enabled)) {
        return;
      }

      if (
        pendingExaminerTurnRef.current ||
        Date.now() < examinerAudioLockUntilRef.current
      ) {
        return;
      }

      // Démarrer l'enregistrement local de ce tour candidat
      try {
        if (localStreamRef.current && !speechRecorderRef.current) {
          currentSpeechChunksRef.current = [];
          const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
          const rec = mimeType
            ? new MediaRecorder(localStreamRef.current, { mimeType })
            : new MediaRecorder(localStreamRef.current);
          rec.ondataavailable = (e) => {
            if (e.data.size > 0) currentSpeechChunksRef.current.push(e.data);
          };
          rec.start();
          speechRecorderRef.current = rec;
        }
      } catch {
        // enregistrement local non disponible, on continue sans
      }

      clearReturnToUserTimer();
      setUserTurn("Le micro est ouvert. Parlez naturellement.");
      return;
    }

    if (event.type === "input_audio_buffer.speech_stopped") {
      // Arrêter l'enregistrement local et réserver un slot dans le log
      const rec = speechRecorderRef.current;
      if (rec && rec.state !== "inactive") {
        const slot = speechBlobsRef.current.length;
        speechBlobsRef.current.push(null); // réserver le slot
        conversationLogRef.current.push({ role: "candidate", text: "__pending__", _slot: slot });
        rec.onstop = () => {
          const mime = rec.mimeType || "audio/webm";
          const blob = new Blob(currentSpeechChunksRef.current, { type: mime });
          // Garde même les blobs courts — Whisper peut transcrire une phrase de 1 mot
          if (blob.size > 0) speechBlobsRef.current[slot] = blob;
        };
        rec.stop();
        speechRecorderRef.current = null;
      } else {
        // Recorder bloqué (micro verrouillé au moment de speech_started) :
        // on garde trace de l'intervention pour ne pas fausser le scoring silencieusement
        conversationLogRef.current.push({
          role: "candidate",
          text: "[intervention non capturée — micro bloqué]",
          _capture_failed: true,
        });
      }

      setMicrophoneEnabled(false);
      markExaminerPending(
        "Vous avez termine. L'examinateur enchaine avec sa reponse."
      );
      sendClientEvent({
        type: "response.create",
        response: {
          output_modalities: ["audio"],
          instructions: selectedScenario.followupInstruction,
        },
      });
      return;
    }

    if (event.type === "response.created") {
      activeResponseRef.current = true;
      markExaminerPending("L'examinateur prend la parole.");
      return;
    }

    if (event.type === "output_audio_buffer.started") {
      activeResponseRef.current = true;
      pendingExaminerTurnRef.current = false;
      clearReturnToUserTimer();
      setMicrophoneEnabled(false);
      lockExaminerTurn(2200);
      setExaminerTurn(
        "L'examinateur parle. Attendez qu'il ait fini avant de repondre."
      );
      return;
    }

    if (event.type === "response.output_audio_transcript.delta") {
      currentExaminerTranscriptRef.current += event.delta || "";
      pendingExaminerTurnRef.current = false;
      clearReturnToUserTimer();
      setMicrophoneEnabled(false);
      lockExaminerTurn(1800);
      setExaminerTurn(
        "Ecoutez la reponse, puis reprenez la parole quand il a termine."
      );
      return;
    }

    if (event.type === "response.output_audio.delta") {
      pendingExaminerTurnRef.current = false;
      clearReturnToUserTimer();
      setMicrophoneEnabled(false);
      lockExaminerTurn(1800);
      setExaminerTurn(
        "Ecoutez la reponse, puis reprenez la parole quand il a termine."
      );
      return;
    }

    if (event.type === "output_audio_buffer.stopped") {
      activeResponseRef.current = false;
      pendingExaminerTurnRef.current = false;
      setMicrophoneEnabled(true);
      scheduleUserTurn("Votre tour. Parlez directement dans le micro.");
      return;
    }

    if (event.type === "output_audio_buffer.cleared") {
      activeResponseRef.current = false;
      pendingExaminerTurnRef.current = false;
      setMicrophoneEnabled(true);
      scheduleUserTurn("Votre tour. Parlez directement dans le micro.");
      return;
    }

    if (event.type === "response.done") {
      activeResponseRef.current = false;
      const examinerText = currentExaminerTranscriptRef.current.trim();
      if (examinerText) {
        conversationLogRef.current.push({ role: "examiner", text: examinerText });
        currentExaminerTranscriptRef.current = "";
      }
      if (event.response?.status === "incomplete") {
        const reason = event.response?.status_details?.reason;

        if (reason === "max_output_tokens") {
          setStatusNote(
            "La reponse a ete tronquee par la limite de sortie du modele."
          );
        }
      }
      return;
    }

    if (event.type === "error") {
      const message =
        event.error?.message || "Erreur inconnue recue depuis le canal Realtime.";

      if (message.includes("active response in progress")) {
        return;
      }

      setErrorMessage(message);
      setStatusNote("La session a renvoye une erreur.");
    }
  }

  async function startCall() {
    if (isConnecting || isConnected) return;

    const attemptId = connectAttemptRef.current + 1;
    connectAttemptRef.current = attemptId;

    stopCallTimer();
    setCallTime(0);
    setProcessingStep(null);
    closeRealtimeResources();
    conversationLogRef.current = [];
    currentExaminerTranscriptRef.current = "";
    speechBlobsRef.current = [];
    currentSpeechChunksRef.current = [];
    scenarioAtCallRef.current = selectedScenario;
    setDebrief(null);
    setDebriefState("idle");
    setConversationTranscript([]);
    setShowTranscript(false);
    setErrorMessage("");
    setCallState("connecting");
    setActivity(WAITING_ACTIVITY);
    setStatusNote("Activation du micro et connexion WebRTC en cours...");

    try {
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        throw new Error("Ce navigateur ne prend pas en charge l'acces micro.");
      }

      const silenceDuration = speechRate === "fast" ? 1200 : 1800;
      const clientSecret = await createRealtimeSession(silenceDuration);

      if (connectAttemptRef.current !== attemptId) {
        return;
      }

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (connectAttemptRef.current !== attemptId) {
        localStream.getTracks().forEach((track) => track.stop());
        return;
      }

      localStreamRef.current = localStream;
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      peerConnection.ontrack = (event) => {
        if (!remoteAudioRef.current) return;
        remoteAudioRef.current.srcObject = event.streams[0];
        void remoteAudioRef.current.play().catch(() => {});
      };

      peerConnection.onconnectionstatechange = () => {
        const nextState = peerConnection.connectionState;

        if (nextState === "connected") {
          setCallState("connected");
          setStatusNote("Connexion active. La conversation vocale est en cours.");

          // Démarrer le timer TCF tâche 2
          stopCallTimer();
          setCallTime(0);
          let elapsed = 0;
          callTimerRef.current = setInterval(() => {
            elapsed += 1;
            setCallTime(elapsed);
            if (elapsed >= TASK2_MAX_TIME) {
              stopCallTimer();
              hangUp();
            }
          }, 1000);
          return;
        }

        if (nextState === "failed") {
          setErrorMessage("La connexion WebRTC a echoue.");
          setCallState("error");
          setStatusNote("La connexion a echoue. Vous pouvez relancer un appel.");
          stopCallTimer();
          closeRealtimeResources();
          return;
        }

        if (nextState === "disconnected" || nextState === "closed") {
          setCallState("idle");
          setUserTurn("Appel termine.");
          setStatusNote("Appel termine.");
          stopCallTimer();
          closeRealtimeResources();
        }
      };

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener("open", () => {
        dataChannelReadyRef.current = true;
        maybeStartAssistantGreeting();
      });

      dataChannel.addEventListener("close", () => {
        dataChannelReadyRef.current = false;
      });

      dataChannel.addEventListener("message", (messageEvent) => {
        try {
          const evt = JSON.parse(messageEvent.data);
          handleServerEvent(evt);
        } catch {
          // ignore malformed events
        }
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: peerConnection.localDescription?.sdp || offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });

      const answerSdp = await sdpResponse.text();

      if (!sdpResponse.ok) {
        throw new Error(
          answerSdp || "OpenAI a refuse la negociation SDP pour la session Realtime."
        );
      }

      if (connectAttemptRef.current !== attemptId) {
        return;
      }

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });
    } catch (error) {
      closeRealtimeResources();
      setCallState("error");
      setUserTurn("Le prototype n'a pas pu demarrer.");
      setStatusNote("Le prototype n'a pas pu demarrer.");
      setErrorMessage(
        error instanceof Error ? error.message : "Erreur inconnue pendant l'appel."
      );
    }
  }

  async function hangUp() {
    connectAttemptRef.current += 1;
    const hangUpAttemptId = connectAttemptRef.current;
    const scenario = scenarioAtCallRef.current;

    // Afficher l'écran de traitement immédiatement, avant toute autre opération
    setProcessingStep("transcribing");
    setCallState("idle");
    setErrorMessage("");

    // Arrêter un enregistrement en cours si le candidat parlait encore
    if (speechRecorderRef.current && speechRecorderRef.current.state !== "inactive") {
      const rec = speechRecorderRef.current;
      const slot = speechBlobsRef.current.length;
      speechBlobsRef.current.push(null);
      conversationLogRef.current.push({ role: "candidate", text: "__pending__", _slot: slot });
      rec.onstop = () => {
        const mime = rec.mimeType || "audio/webm";
        const blob = new Blob(currentSpeechChunksRef.current, { type: mime });
        if (blob.size > 200) speechBlobsRef.current[slot] = blob;
      };
      rec.stop();
      speechRecorderRef.current = null;
    }

    setMicrophoneEnabled(false);

    // Attendre que les onstop des MediaRecorder finalisent leurs blobs
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (connectAttemptRef.current !== hangUpAttemptId) return;

    const rawLog = [...conversationLogRef.current];
    const blobs = [...speechBlobsRef.current];
    closeRealtimeResources();

    // Transcrire les tours candidat via /api/transcribe
    const pendingSlots = rawLog.filter((e) => e._slot !== undefined);
    if (pendingSlots.length > 0) {
      for (const entry of pendingSlots) {
        const blob = blobs[entry._slot];
        if (!blob) continue;
        try {
          const ext = blob.type.includes("ogg") ? "ogg" : "webm";
          const file = new File([blob], `tour_${entry._slot}.${ext}`, { type: blob.type });
          const formData = new FormData();
          formData.append("file", file);
          formData.append("model", "gpt-4o-mini-transcribe");
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            const transcribed = (data.text || "").trim();
            if (transcribed) {
              entry.text = transcribed;
            } else {
              entry.text = "[intervention non transcrite]";
              entry._whisper_failed = true;
            }
          }
        } catch {
          entry.text = "[intervention non transcrite]";
          entry._whisper_failed = true;
        }
      }
    }

    if (connectAttemptRef.current !== hangUpAttemptId) return;

    // Nettoyer les métadonnées — conserver les placeholders, éliminer uniquement les vrais "__pending__"
    const cleanLog = rawLog
      .map(({ _slot, ...rest }) => rest)
      .filter((e) => e.text && e.text !== "__pending__");

    // Avertissement si beaucoup d'interventions candidat n'ont pas été transcrites
    const candidateTurns = cleanLog.filter(t => t.role === "candidate");
    const failedTurns = candidateTurns.filter(t => t._capture_failed || t._whisper_failed);
    if (candidateTurns.length > 0 && failedTurns.length / candidateTurns.length >= 0.3) {
      console.warn(`[T2] ${failedTurns.length}/${candidateTurns.length} interventions candidat non transcrites — scoring basé sur un log partiel`);
    }

    if (cleanLog.length > 0) {
      setConversationTranscript(cleanLog);
      setShowTranscript(false);
    }

    if (cleanLog.length >= 2) {
      setProcessingStep("analyzing");
      analyzeInteraction(cleanLog, scenario, callTimeAtHangUpRef.current);
    } else {
      setProcessingStep(null);
    }
  }

  async function analyzeInteraction(log, scenario, durationSec) {
    setDebriefState("analyzing");
    setDebrief(null);

    const conversationText = log
      .map((turn) =>
        `[${turn.role === "examiner" ? "EXAMINATEUR" : "CANDIDAT"}] ${turn.text}`
      )
      .join("\n");

    try {
      const raw_row = scenario?._raw;
      const scenarioData = raw_row ? {
        points_cles_attendus: raw_row.points_cles_attendus,
        erreurs_typiques_b1: raw_row.erreurs_typiques_b1,
        difference_b1_b2_bon: raw_row.difference_b1_b2_bon,
        expressions_cles: raw_row.expressions_cles,
        titre: raw_row.titre,
        dialogue_a2: raw_row.dialogue_a2,
        dialogue_b1: raw_row.dialogue_b1,
        dialogue_b2: raw_row.dialogue_b2,
      } : null;

      const response = await fetch("/api/analyze-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: conversationText,
          scenario: scenario?.title || selectedScenario?.title,
          scenarioData,
          durationSec: durationSec > 0 ? durationSec : null,
        }),
      });

      const raw = await response.text();
      if (!raw) throw new Error("Reponse vide.");
      const data = JSON.parse(raw);

      if (!response.ok) throw new Error(data?.error || "Erreur API");

      const analysisRaw = data.analysis || "";

      const analysisText = analysisRaw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();

      let parsed = null;
      try {
        parsed = JSON.parse(analysisText);
      } catch {
        const match = analysisText.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
        }
      }

      if (!parsed) throw new Error("JSON inexploitable.");

      if (!parsed.scores || typeof parsed.total !== "number") {
        throw new Error("Structure inattendue. Clés reçues : " + Object.keys(parsed).join(", "));
      }

      setDebrief(parsed);
      setDebriefState("done");
      setProcessingStep(null);

      // Sauvegarde session Supabase (anonyme, best-effort)
      supabase.from("sessions").insert([{
        tache: 2,
        sujet: scenario?.title || selectedScenario.title,
        transcription: conversationText,
        scores: parsed.scores,
        total: parsed.total,
        niveau_cecrl: parsed.niveau_cecrl,
        niveau_nclc: parsed.niveau_nclc,
        feedback_complet: parsed,
        duree_secondes: callTime > 0 ? callTime : null,
      }]).then(({ error }) => {
        if (error) console.error("Supabase sessions insert error:", error);
      });
    } catch (e) {
      console.error("Debrief error:", e);
      setDebriefState("idle");
      setProcessingStep(null);
    }
  }

  // Load scenarios from Supabase on mount, shuffle them, fallback to hardcoded list
  useEffect(() => {
    async function loadScenarios() {
      try {
        const { data, error } = await supabase
          .from("scenario_references")
          .select("*")
          .order("numero");

        if (!error && data && data.length > 0) {
          const adapted = data.map(adaptScenario);
          const shuffled = [...adapted].sort(() => Math.random() - 0.5);
          setScenarios(shuffled);
        } else {
          setScenarios([...FALLBACK_SCENARIOS].sort(() => Math.random() - 0.5));
        }
      } catch {
        setScenarios([...FALLBACK_SCENARIOS].sort(() => Math.random() - 0.5));
      } finally {
        setScenariosLoaded(true);
      }
    }
    loadScenarios();
  }, []);

  useEffect(() => {
    if (processingStep === "transcribing" && processingSectionRef.current) {
      processingSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [processingStep]);

  useEffect(() => {
    if (debriefState === "done" && debriefSectionRef.current) {
      setTimeout(() => {
        debriefSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [debriefState]);

  useEffect(() => {
    return () => {
      connectAttemptRef.current += 1;
      stopCallTimer();
      closeRealtimeResources();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 18px 48px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            borderRadius: "20px",
            border: processingStep !== null
              ? "1px solid rgba(59, 130, 246, 0.45)"
              : "1px solid rgba(148, 163, 184, 0.12)",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: processingStep !== null
              ? "0 0 0 3px rgba(59,130,246,0.12), 0 8px 32px rgba(0,0,0,0.24)"
              : "0 8px 32px rgba(0, 0, 0, 0.24)",
            padding: "clamp(20px, 4vw, 32px)",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          {/* ══════════════════════════════════════════
              VUE TRAITEMENT POST-APPEL
          ══════════════════════════════════════════ */}
          {!isConnecting && !isConnected && processingStep !== null && (
            <div ref={processingSectionRef} style={{ textAlign: "center", padding: "36px 16px" }}>
              <div style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 800, marginBottom: "6px", color: "#f1f5f9" }}>
                ⏳ Traitement de votre session...
              </div>
              <div style={{ fontSize: "14px", color: "#475569", marginBottom: "36px" }}>
                Cela prend généralement 5 à 10 secondes
              </div>

              <div style={{ maxWidth: "300px", marginInline: "auto", textAlign: "left" }}>
                {[
                  {
                    label: "Transcription du dialogue",
                    done: processingStep === "analyzing",
                    active: processingStep === "transcribing",
                  },
                  {
                    label: "Évaluation de votre performance",
                    done: false,
                    active: processingStep === "analyzing",
                  },
                  {
                    label: "Génération du feedback personnalisé",
                    done: false,
                    active: processingStep === "analyzing",
                  },
                ].map(({ label, done, active }, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "11px 0",
                      borderBottom: i < 2 ? "1px solid rgba(148,163,184,0.08)" : "none",
                      opacity: active || done ? 1 : 0.28,
                      transition: "opacity 0.4s ease",
                    }}
                  >
                    <span style={{ width: "24px", flexShrink: 0, display: "inline-flex", justifyContent: "center", color: done ? "#4ade80" : active ? "#93c5fd" : "#334155" }}>
                      {done ? <IconCheck size={18} /> : active ? <IconHourglass size={18} /> : <span style={{ opacity: 0.3 }}>○</span>}
                    </span>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: active ? 700 : 400,
                      color: done ? "#4ade80" : active ? "#f1f5f9" : "#64748b",
                      transition: "color 0.3s ease",
                    }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              VUE PRÉPARATION (2 minutes)
          ══════════════════════════════════════════ */}
          {!isConnecting && !isConnected && processingStep === null && uiPhase === "preparation" && (
            <div>
              {/* Header : titre + timer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7dd3fc", marginBottom: "4px" }}>Tâche 2 — Préparation</div>
                  <div style={{ fontSize: "15px", color: "#94a3b8" }}>Prends le temps de lire et de noter tes questions</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 800, color: preparationTimerSec <= 10 ? "#fb7185" : preparationTimerSec <= 30 ? "#f59e0b" : "#7dd3fc", letterSpacing: "-0.03em", lineHeight: 1 }}>
                    ⏱ {Math.floor(preparationTimerSec / 60)}:{String(preparationTimerSec % 60).padStart(2, "0")}
                  </div>
                  {preparationTimerSec <= 10 && (
                    <div style={{ fontSize: "12px", color: "#fb7185", fontWeight: 600, marginTop: "4px" }}>L'interaction démarre dans {preparationTimerSec}s</div>
                  )}
                  {preparationTimerSec > 10 && preparationTimerSec <= 30 && (
                    <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600, marginTop: "4px" }}>Finis tes notes bientôt</div>
                  )}
                </div>
              </div>

              {/* Scénario */}
              <div style={{ background: "rgba(125,211,252,0.06)", border: "1px solid rgba(125,211,252,0.18)", borderRadius: "14px", padding: "16px 18px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7dd3fc", marginBottom: "8px" }}>📋 Ton scénario</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9", marginBottom: "8px" }}>{selectedScenario.title}</div>
                <div style={{ fontSize: "14px", color: "#e2e8f0", lineHeight: 1.7, marginBottom: "12px" }}>{selectedScenario.summary}</div>
                <div style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: "#7dd3fc" }}>Rôle de l'examinateur : </span>{selectedScenario.examinerRole}
                </div>
                {selectedScenario.prompts?.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#fcd34d", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pistes à explorer</div>
                    <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.8 }}>
                      {selectedScenario.prompts.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Textarea notes */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "8px" }}>
                  📝 Prends des notes <span style={{ fontWeight: 400, color: "#64748b" }}>(optionnel)</span>
                </div>
                <textarea
                  value={notesPreparation}
                  onChange={e => setNotesPreparation(e.target.value)}
                  placeholder={"Note ici les questions que tu veux poser :\n1. Quels sont les tarifs ?\n2. Comment ça fonctionne ?\n3. Quelles sont les conditions ?\n..."}
                  style={{
                    width: "100%", minHeight: "160px", padding: "14px", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: "12px", color: "#e2e8f0", fontSize: "14px",
                    fontFamily: "ui-monospace, monospace", lineHeight: 1.7, resize: "vertical",
                    outline: "none",
                  }}
                />
                <div style={{ fontSize: "12px", color: "#475569", marginTop: "6px" }}>Conseil : note 8 à 12 questions variées pour maximiser ton score</div>
              </div>

              {/* CTA */}
              <button
                onClick={handleStartInteraction}
                style={{
                  display: "block", width: "100%", padding: "16px 24px",
                  fontSize: "16px", fontWeight: 700, cursor: "pointer",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "white", border: "none", borderRadius: "16px",
                  touchAction: "manipulation",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <IconSpeak size={18} /> Je suis prêt, commencer l'interaction
                </span>
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════
              VUE PRÉ-APPEL (idle / error)
          ══════════════════════════════════════════ */}
          {!isConnecting && !isConnected && processingStep === null && uiPhase !== "preparation" && (
            <div className="t2-precall">
              {/* Top bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
                {typeof onBack === "function" ? (
                  <button className="btn-ghost" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><IconArrowLeft size={14} /> Retour</span>
                  </button>
                ) : <div />}
                <button className="btn-ghost" onClick={changeScenario} disabled={!scenariosLoaded || scenarios.length === 0}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {!scenariosLoaded ? <IconHourglass size={14} /> : <IconRefresh size={14} />}
                    {!scenariosLoaded ? "Chargement..." : "Changer de scénario"}
                  </span>
                </button>
              </div>

              {/* Spinner pendant le chargement initial */}
              {!scenariosLoaded && (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "#64748b", fontSize: "15px" }}>
                  ⏳ Chargement des scénarios...
                </div>
              )}

              {/* Scenario : badge + title + summary */}
              <div style={{ marginBottom: "20px", textAlign: "center" }}>
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: "14px",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#7dd3fc",
                    background: "rgba(125,211,252,0.1)",
                    border: "1px solid rgba(125,211,252,0.22)",
                    borderRadius: "999px",
                    padding: "4px 12px",
                  }}
                >
                  <CategoryBadge emoji={selectedScenario._raw?.emoji_categorie} label={selectedScenario._raw?.categorie || selectedScenario.badge} size={11} />
                </span>

                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "clamp(22px, 4vw, 32px)",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    color: "#f1f5f9",
                  }}
                >
                  {selectedScenario.title}
                </h2>

                <p style={{ margin: 0, fontSize: "15px", color: "#94a3b8", lineHeight: 1.65 }}>
                  {selectedScenario.summary}
                </p>
              </div>

              {/* Objectif — toujours visible */}
              <div
                style={{
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.18)",
                  borderRadius: "14px",
                  padding: "16px 18px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#86efac", marginBottom: "6px" }}>
                  Votre objectif
                </div>
                <div style={{ fontSize: "15px", color: "#e2e8f0", lineHeight: 1.65 }}>
                  {selectedScenario.candidateGoal}
                </div>
              </div>

              {/* Encart pédagogique T2 */}
              <EncartTcfT2 />

              {/* Toggle détails */}
              <button
                className="btn-ghost"
                onClick={() => setShowScenario((v) => !v)}
                style={{ marginBottom: "16px", fontSize: "13px" }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>{showScenario ? <><IconChevronUp size={13} /> Masquer les détails</> : <><IconChevronDown size={13} /> Voir les détails du sujet</>}</span>
              </button>

              {/* Détails dépliables : rôle + prompts */}
              {showScenario && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "14px", padding: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7dd3fc", marginBottom: "8px" }}>
                      Rôle de l'examinateur
                    </div>
                    <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.65 }}>
                      {selectedScenario.examinerRole}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(148,163,184,0.1)", borderRadius: "14px", padding: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fcd34d", marginBottom: "8px" }}>
                      À penser pendant l'échange
                    </div>
                    <div style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                      {selectedScenario.prompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}
                    </div>
                  </div>
                </div>
              )}

              {/* Timer + statut post-appel */}
              {callTime > 0 && (
                <div
                  style={{
                    borderRadius: "14px",
                    padding: "16px 18px",
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${callTime >= TASK2_DANGER_TIME ? "rgba(248,113,113,0.22)" : callTime >= TASK2_WARN_TIME ? "rgba(245,158,11,0.22)" : "rgba(148,163,184,0.1)"}`,
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: getCallTimerColor() }}>
                      ⏱ {formatCallTime(callTime)} / {formatCallTime(TASK2_MAX_TIME)}
                    </span>
                    <span style={{ fontSize: "12px", color: getCallTimerColor(), fontWeight: 600 }}>
                      {getCallTimerLabel()}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: `${getCallTimerProgress()}%`, height: "100%", background: callTime >= TASK2_DANGER_TIME ? "linear-gradient(90deg, #fb7185, #ef4444)" : callTime >= TASK2_WARN_TIME ? "linear-gradient(90deg, #f59e0b, #d97706)" : callTime >= TASK2_MIN_TIME ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, #60a5fa, #3b82f6)", borderRadius: "999px" }} />
                  </div>
                  {statusNote && debriefState !== "idle" && (
                    <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                      {debriefState === "analyzing" && <span>⏳</span>}
                      {statusNote}
                    </div>
                  )}
                </div>
              )}

              {/* Erreur */}
              {errorMessage && (
                <div style={{ borderRadius: "14px", padding: "14px 18px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(127,29,29,0.22)", color: "#fecaca", fontSize: "14px", marginBottom: "16px" }}>
                  <strong style={{ display: "block", marginBottom: "4px" }}>Erreur</strong>
                  {errorMessage}
                </div>
              )}

              {/* Indicateur débrief disponible */}
              {debriefState === "done" && debrief && (
                <button
                  onClick={() => debriefSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px",
                    marginBottom: "12px",
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.35)",
                    borderRadius: "14px",
                    color: "#93c5fd",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><IconBarChart size={15} /> Débrief disponible — voir les résultats ↓</span>
                </button>
              )}

              {/* Question rythme — obligatoire avant de démarrer */}
              <div
                className={`pace-selector${!speechRate ? " pace-selector--needs-attention" : ""}`}
                style={{
                  marginTop: "20px",
                  padding: "18px",
                  borderRadius: "16px",
                  border: speechRate ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(255,255,255,0.03)",
                  transition: "border-color 0.3s ease",
                }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", marginBottom: "6px" }}>
                  Avant de commencer
                </div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", marginBottom: "14px", lineHeight: 1.3 }}>
                  Comment parlez-vous le français ?
                </div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                  {[
                    { key: "slow", icon: <IconClock size={22} />, label: "Lentement" },
                    { key: "fast", icon: <IconWave size={22} />, label: "Normalement" },
                  ].map(({ key, icon, label }) => (
                    <button
                      key={key}
                      onClick={() => setSpeechRate(key)}
                      style={{
                        flex: 1,
                        padding: "14px 12px",
                        borderRadius: "12px",
                        border: speechRate === key
                          ? "1px solid rgba(59,130,246,0.6)"
                          : "1px solid rgba(148,163,184,0.2)",
                        background: speechRate === key
                          ? "rgba(59,130,246,0.15)"
                          : "rgba(255,255,255,0.04)",
                        color: speechRate === key ? "#93c5fd" : "#94a3b8",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s ease",
                        boxShadow: speechRate === key ? "0 0 0 1px rgba(59,130,246,0.2)" : "none",
                      }}
                    >
                      <div style={{ marginBottom: "6px", display: "flex", justifyContent: "center" }}>{icon}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700 }}>{label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: "12px", color: "#475569", textAlign: "center" }}>
                  Cela aide l'IA à respecter votre rythme
                </div>
              </div>

              {/* CTA principal — bloqué tant qu'aucun rythme choisi */}
              <div className="t2-precall-cta">
                <button
                  className="btn-start-call"
                  onClick={() => speechRate && setUiPhase("preparation")}
                  disabled={!speechRate}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "18px 24px",
                    fontSize: "17px",
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    cursor: speechRate ? "pointer" : "not-allowed",
                    background: speechRate
                      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                      : "rgba(59,130,246,0.15)",
                    color: speechRate ? "white" : "rgba(255,255,255,0.3)",
                    border: "none",
                    borderRadius: "16px",
                    transition: "all 0.3s ease",
                    touchAction: "manipulation",
                  }}
                >
                  {speechRate ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>📋 Commencer la préparation</span>
                  ) : (
                    <span>Choisissez votre rythme ↑</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              VUE EN-APPEL (connecting / connected)
          ══════════════════════════════════════════ */}
          {(isConnecting || isConnected) && (
            <>
              {/* Header compact : badge + titre */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7dd3fc", background: "rgba(125,211,252,0.1)", border: "1px solid rgba(125,211,252,0.22)", borderRadius: "999px", padding: "3px 10px" }}>
                  <CategoryBadge emoji={selectedScenario._raw?.emoji_categorie} label={selectedScenario._raw?.categorie || selectedScenario.badge} size={11} />
                </span>
                <span style={{ fontSize: "15px", fontWeight: 600, color: "#94a3b8", flex: 1, lineHeight: 1.4 }}>
                  {selectedScenario.title}
                </span>
                {notesPreparation && (
                  <button
                    onClick={() => setShowNotesModal(true)}
                    style={{ fontSize: "12px", fontWeight: 600, color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "999px", padding: "3px 10px", flexShrink: 0, cursor: "pointer" }}
                  >📝 Mes notes</button>
                )}
                {isConnected && (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "999px", padding: "3px 10px", flexShrink: 0 }}>
                    ● EN DIRECT
                  </span>
                )}
              </div>

              {/* Indicateur qui parle */}
              <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "14px", padding: "16px 28px", borderRadius: "999px", transition: "all 0.3s ease",
                  border: activity === USER_ACTIVITY ? "1px solid rgba(34,197,94,0.55)" : activity === WAITING_ACTIVITY ? "1px solid rgba(245,158,11,0.55)" : "1px solid rgba(59,130,246,0.55)",
                  background: activity === USER_ACTIVITY ? "rgba(34,197,94,0.18)" : activity === WAITING_ACTIVITY ? "rgba(245,158,11,0.14)" : "rgba(59,130,246,0.18)",
                }}>
                  <span className={`speaker-dot speaker-dot--${activity === USER_ACTIVITY ? "candidate" : "examiner"}`} />
                  <span style={{ fontSize: "18px", fontWeight: 700, color: activity === USER_ACTIVITY ? "#4ade80" : activity === WAITING_ACTIVITY ? "#fbbf24" : "#60a5fa" }}>
                    {activity === WAITING_ACTIVITY && <span style={{ marginRight: "6px", display: "inline-flex", opacity: 0.8 }}><IconHourglass size={16} /></span>}{activity}
                  </span>
                </div>
              </div>

              {/* Timer */}
              <div
                style={{
                  borderRadius: "16px",
                  padding: "18px 20px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${callTime >= TASK2_DANGER_TIME ? "rgba(248,113,113,0.3)" : callTime >= TASK2_WARN_TIME ? "rgba(245,158,11,0.3)" : "rgba(148,163,184,0.1)"}`,
                  marginBottom: "20px",
                  textAlign: "center",
                  transition: "border-color 0.5s ease",
                }}
              >
                <div style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: getCallTimerColor(), marginBottom: "8px", transition: "color 0.5s ease" }}>
                  {formatCallTime(callTime)} / {formatCallTime(TASK2_MAX_TIME)}
                </div>
                <div style={{ color: getCallTimerColor(), fontWeight: 600, fontSize: "14px", marginBottom: "12px", transition: "color 0.5s ease" }}>
                  {getCallTimerLabel()}
                </div>
                <div style={{ width: "100%", maxWidth: "480px", height: "6px", margin: "0 auto", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: `${getCallTimerProgress()}%`, height: "100%", background: callTime >= TASK2_DANGER_TIME ? "linear-gradient(90deg, #fb7185, #ef4444)" : callTime >= TASK2_WARN_TIME ? "linear-gradient(90deg, #f59e0b, #d97706)" : callTime >= TASK2_MIN_TIME ? "linear-gradient(90deg, #4ade80, #22c55e)" : "linear-gradient(90deg, #60a5fa, #3b82f6)", borderRadius: "999px", transition: "width 0.5s ease, background 0.5s ease" }} />
                </div>
              </div>

              {/* Status note */}
              {statusNote && (
                <div style={{ fontSize: "14px", color: "#64748b", textAlign: "center", marginBottom: "20px", lineHeight: 1.5 }}>
                  {statusNote}
                </div>
              )}

              {/* Erreur */}
              {errorMessage && (
                <div style={{ borderRadius: "14px", padding: "14px 18px", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(127,29,29,0.22)", color: "#fecaca", fontSize: "14px", marginBottom: "20px" }}>
                  {errorMessage}
                </div>
              )}

              {/* Bouton Raccrocher */}
              <button
                onClick={hangUp}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "18px 24px",
                  fontSize: "17px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
                  minHeight: "56px",
                  touchAction: "manipulation",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><IconPhone size={18} /> Raccrocher</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: "960px", margin: "0 auto" }}>
      {conversationTranscript.length > 0 && (
        <div style={{ marginTop: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "#7dd3fc",
                fontWeight: 700,
              }}
            >
              Transcription — Tâche 2
            </div>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              style={{
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: "999px",
                padding: "8px 16px",
                background: "rgba(255,255,255,0.05)",
                color: "#94a3b8",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showTranscript ? "Masquer transcription" : "Voir transcription"}
            </button>
          </div>

          {showTranscript && (
            <div
              style={{
                borderRadius: "24px",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                background: "rgba(15, 23, 42, 0.72)",
                backdropFilter: "blur(12px)",
                padding: "28px",
              }}
            >
              {conversationTranscript.map((turn, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom:
                      index < conversationTranscript.length - 1 ? "18px" : 0,
                    lineHeight: 1.7,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "14px",
                      color:
                        turn.role === "candidate" ? "#86efac" : "#7dd3fc",
                    }}
                  >
                    {turn.role === "candidate"
                      ? "🎓 Candidat"
                      : "🎙️ Examinateur"}{" "}
                    :
                  </span>
                  <span
                    style={{
                      color: turn._capture_failed || turn._whisper_failed ? "#fca5a5" : "#e2e8f0",
                      fontStyle: turn._capture_failed || turn._whisper_failed ? "italic" : "normal",
                      marginLeft: "8px",
                    }}
                  >
                    {turn.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {debriefState === "analyzing" && (
        <div
          style={{
            marginTop: "16px",
            borderRadius: "20px",
            border: "1px solid rgba(148, 163, 184, 0.12)",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "28px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            ⏳ Génération du débrief...
          </div>
          <div style={{ color: "#94a3b8", fontSize: "15px" }}>
            Analyse de votre interaction en cours.
          </div>
        </div>
      )}

      {debriefState === "done" && debrief && (
        <div ref={debriefSectionRef} style={{ marginTop: "20px" }}>

        {(() => {
          const lc = debrief.niveau_cecrl === "C1" || debrief.niveau_cecrl === "C2" ? "#60a5fa" : debrief.niveau_cecrl === "B2" ? "#4ade80" : debrief.niveau_cecrl === "B1" ? "#f59e0b" : "#fb7185";
          const total = debrief.total ?? 0;
          const sc = total >= 12 ? "#4ade80" : total >= 8 ? "#f59e0b" : "#fb7185";
          const sl = total >= 16 ? "Niveau C1 — excellent" : total >= 12 ? "Niveau B2 atteint" : total >= 8 ? "Niveau B1 — bon socle" : total >= 5 ? "Niveau A2 — à renforcer" : "Niveau A1 — travail ciblé nécessaire";
          const bc = (n) => n >= 4 ? "#3b82f6" : n >= 3 ? "#22c55e" : n >= 2 ? "#f59e0b" : "#ef4444";
          const card = { borderRadius: "20px", border: "1px solid rgba(148,163,184,0.12)", background: "rgba(15,23,42,0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.24)" };
          const criteria = [
            ["Réalisation de la tâche", "realisation_tache"],
            ["Lexique", "lexique"],
            ["Grammaire", "grammaire"],
            ["Fluidité & Prononciation", "fluidite_prononciation"],
            ["Interaction & Cohérence", "interaction_coherence"],
          ];
          return (
            <>
              {/* 1. En-tête niveau */}
              <div style={{ ...card, textAlign: "center", padding: "32px 24px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "12px" }}>
                  Niveau estimé — Tâche 2
                </div>
                <div className="level-pop" style={{ fontSize: "clamp(64px, 12vw, 96px)", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: lc, marginBottom: "6px" }}>
                  {debrief.niveau_cecrl || "—"}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#a5b4fc", marginBottom: "4px" }}>
                  NCLC {debrief.niveau_nclc || "—"}
                </div>
                <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, marginBottom: "16px" }}>
                  {sl} — {total}/20
                </div>
                {debrief.resume_niveau && (
                  <div style={{ fontSize: "15px", color: "#94a3b8", lineHeight: 1.7, maxWidth: "560px", marginInline: "auto" }}>
                    {debrief.resume_niveau}
                  </div>
                )}
              </div>

              {/* 2. Barres de score */}
              <div style={{ ...card, padding: "24px", marginBottom: "14px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: "8px" }}>
                  Scores — 5 critères
                </div>
                {criteria.map(([label, key]) => {
                  const score = debrief.scores?.[key];
                  const note = typeof score?.note === "number" ? score.note : 0;
                  const color = bc(note);
                  const isOpen = expandedScore === key;
                  return (
                    <div key={key}>
                      <button className="score-bar-row" onClick={() => setExpandedScore(isOpen ? null : key)}>
                        <span className="score-bar-label">{label}</span>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: `${(note / 4) * 100}%`, background: color }} />
                        </div>
                        <span className="score-bar-note" style={{ color }}>{note}/4</span>
                        <span className="score-bar-chevron" style={{ display: "inline-flex" }}>{isOpen ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}</span>
                      </button>
                      {isOpen && score?.justification && (
                        <div className="score-justif" style={{ padding: "4px 10px 12px 167px", fontSize: "13px", color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic" }}>
                          {score.justification}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(148,163,184,0.1)", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ fontSize: "clamp(20px, 4vw, 26px)", fontWeight: 900, color: sc }}>Total : {total}/20</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#64748b" }}>{sl}</div>
                </div>
              </div>

              {/* 3. Points */}
              {(Array.isArray(debrief.points_positifs) && debrief.points_positifs.length > 0) || (Array.isArray(debrief.points_ameliorer) && debrief.points_ameliorer.length > 0) ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                  {Array.isArray(debrief.points_positifs) && debrief.points_positifs.length > 0 && (
                    <div style={{ ...card, padding: "20px", borderColor: "rgba(34,197,94,0.2)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#22c55e", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><IconCheck size={13} /> Points positifs</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 1.9, color: "#e2e8f0", fontSize: "14px" }}>
                        {debrief.points_positifs.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(debrief.points_ameliorer) && debrief.points_ameliorer.length > 0 && (
                    <div style={{ ...card, padding: "20px", borderColor: "rgba(245,158,11,0.2)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><IconAlert size={13} /> Points à améliorer</div>
                      <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 1.9, color: "#e2e8f0", fontSize: "14px" }}>
                        {debrief.points_ameliorer.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {/* 4. Correction + Version côte à côte */}
              {(debrief.correction_simple || debrief.version_amelioree?.texte) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px", marginBottom: "14px" }}>
                  {debrief.correction_simple && (
                    <div style={{ ...card, padding: "20px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#93c5fd", marginBottom: "12px" }}>Votre réponse corrigée</div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#e2e8f0", fontSize: "14px" }}>{debrief.correction_simple}</div>
                    </div>
                  )}
                  {debrief.version_amelioree?.texte && (
                    <div style={{ ...card, padding: "20px", border: "1px solid rgba(139,92,246,0.28)", background: "rgba(76,29,149,0.12)" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#c4b5fd", marginBottom: "12px" }}>
                        Modèle {debrief.version_amelioree.niveau_cible || "niveau supérieur"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75, color: "#ddd6fe", fontSize: "14px" }}>{debrief.version_amelioree.texte}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Conseil prioritaire */}
              {debrief.conseil_prioritaire && (
                <div style={{ ...card, padding: "20px", marginBottom: "14px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.28)" }}>
                  <div style={{ display: "flex", gap: "14px" }}>
                    <span style={{ flexShrink: 0, marginTop: "2px", display: "inline-flex", color: "#60a5fa" }}><IconLightbulb size={20} /></span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#60a5fa", marginBottom: "8px" }}>Conseil prioritaire</div>
                      <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "15px" }}>{debrief.conseil_prioritaire}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Phrases utiles */}
              {Array.isArray(debrief.phrases_utiles) && debrief.phrases_utiles.length > 0 && (
                <div style={{ ...card, padding: "20px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f9a8d4", marginBottom: "12px" }}>Phrases utiles à retenir</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: 2, color: "#e2e8f0", fontSize: "14px" }}>
                    {debrief.phrases_utiles.map((p, i) => <li key={i} style={{ fontStyle: "italic" }}>{p}</li>)}
                  </ul>
                </div>
              )}

              {/* 7. Objectif prochain essai */}
              {debrief.objectif_prochain_essai && (
                <div style={{ ...card, padding: "20px", marginBottom: "20px", background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, display: "inline-flex", color: "#2dd4bf" }}><IconTarget size={18} /></span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#2dd4bf", marginBottom: "6px" }}>Objectif prochain essai</div>
                      <div style={{ color: "#e2e8f0", lineHeight: 1.7, fontSize: "15px" }}>{debrief.objectif_prochain_essai}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Bouton Nouvel essai */}
              <button
                className="btn-ghost"
                onClick={() => { setDebrief(null); setDebriefState("idle"); setConversationTranscript([]); setShowTranscript(false); setExpandedScore(null); }}
                style={{ display: "block", width: "100%", padding: "14px", textAlign: "center", fontSize: "15px" }}
              >
                Nouvel essai
              </button>
            </>
          );
        })()}
        </div>
      )}

      </div>

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      {/* ══ MODALE MES NOTES ══ */}
      {showNotesModal && (
        <div
          onClick={() => setShowNotesModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "rgba(15,23,42,0.97)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: "20px", padding: "28px", maxWidth: "560px", width: "100%", maxHeight: "80vh", overflowY: "auto", backdropFilter: "blur(16px)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#fbbf24" }}>📝 Mes notes de préparation</div>
              <button onClick={() => setShowNotesModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            {notesPreparation ? (
              <pre style={{ margin: 0, fontFamily: "ui-monospace, monospace", fontSize: "14px", color: "#e2e8f0", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {notesPreparation}
              </pre>
            ) : (
              <div style={{ fontSize: "14px", color: "#64748b", fontStyle: "italic" }}>Tu n'as pas pris de notes pendant la préparation.</div>
            )}
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#475569", textAlign: "center" }}>Lecture seule — tu ne peux pas modifier tes notes pendant l'interaction</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealtimeCall;
