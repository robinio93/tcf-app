export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { conversation, durationSec } = req.body;

    if (!conversation?.trim()) {
      return res.status(400).json({ error: "conversation is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: buildPrompt(conversation, durationSec),
      }),
    });

    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || raw || "OpenAI request failed",
      });
    }

    if (!data) {
      return res.status(502).json({ error: "OpenAI returned an empty response" });
    }

    const rawText =
      data.output_text ||
      data.output?.map((item) => item.content?.map((c) => c.text || "").join("")).join("") ||
      "";

    const analysis = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}

function buildPrompt(conversation, durationSec) {
  const dureeStr = Number.isFinite(Number(durationSec))
    ? `${Math.max(1, Number(durationSec))} secondes`
    : "inconnue";

  return `Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat sur la TACHE 1 (entretien dirige, 2 minutes).

SPECIFICITES DE LA TACHE 1 :
- Le candidat repond a des questions personnelles simples posees par l'examinateur
- Il doit parler de lui de maniere naturelle : presentation, famille, travail, loisirs, projets
- Le niveau attendu est A2-B2 (pas besoin d'argumenter ou negocier)
- L'important : spontaneite, reponses completes et developpees, variete des sujets abordes

TRANSCRIPTION DU DIALOGUE :
${conversation}

DUREE REELLE DE L'ENTRETIEN : ${dureeStr}

Evalue UNIQUEMENT les repliques du CANDIDAT (lignes [CANDIDAT]). Les repliques [EXAMINATEUR] sont du contexte.

Evalue selon ces 5 criteres, chacun note de 0 a 4 :

1. REALISATION DE LA TACHE (0-4)
Le candidat a-t-il repondu aux questions avec des phrases COMPLETES et DEVELOPPEES (pas juste oui/non) ? A-t-il couvert plusieurs aspects de sa vie ?
- 0 = reponses d'un seul mot ou hors sujet, questions eludees
- 1 = reponses minimales, souvent un seul mot ou une formule telegraphique (A2-)
- 2 = reponses courtes mais completes, peu de details (A2/B1 faible)
- 3 = reponses developpees avec details sur plusieurs sujets (B1/B2)
- 4 = reponses riches, detaillees, naturelles, plusieurs sujets abordes (B2+/C1)
ATTENTION : Si la duree est inferieure a 90 secondes, ce critere est plafonne a 2/4.

2. LEXIQUE (0-4)
Variete et precision du vocabulaire pour parler de soi et de sa vie.
- 1 = vocabulaire tres limite, memes mots repetes (A2) : 'j'aime', 'c'est bien', 'je fais'
- 2 = vocabulaire suffisant pour parler de sa vie, quelques repetitions (B1)
- 3 = vocabulaire varie, peut nuancer et decrire avec precision (B2)
- 4 = vocabulaire riche, expressions variees, peu de repetitions (C1)

3. GRAMMAIRE (0-4)
Correction et variete des structures. En tache 1 on utilise beaucoup le present et le passe compose, c'est normal.
- 1 = erreurs frequentes dans les accords, conjugaisons, articles (A2)
- 2 = present et passe compose corrects, quelques erreurs dans les structures complexes (B1)
- 3 = bon controle general, structures variees (relatives, conditionnels), erreurs non systematiques (B2)
- 4 = excellent controle, variete syntaxique, rares erreurs (C1)

4. FLUIDITE ET PRONONCIATION (0-4)
Debit, pauses, intelligibilite, naturel de l'expression.
- 1 = hesitations tres longues, silences bloques, prononciation difficile a comprendre (A2)
- 2 = debit assez regulier malgre des pauses de recherche, globalement intelligible (B1)
- 3 = discours fluide, peu d'hesitations, prononciation claire (B2)
- 4 = naturel, debit spontane, quasi-natif (C1)

5. INTERACTION ET SPONTANEITE (0-4)
Capacite a REAGIR naturellement aux questions sans reciter un texte appris. Ecoute, rebonds, spontaneite.
- 0 = ne repond pas aux questions ou recite manifestement un texte prepare
- 1 = repond mais semble reciter, peu de spontaneite, reponses hors-contexte (A2)
- 2 = repond simplement, ecoute la question, quelques relances possibles (B1)
- 3 = repond naturellement, fait des liens entre les sujets abordes (B2)
- 4 = spontaneite totale, reactions naturelles, suit parfaitement l'echange (C1)
ATTENTION : Si le candidat donne des reponses en UN SEUL MOT repetees, ce critere est plafonne a 1/4.

BAREME TOTAL :
0-4 -> A1 | 5-7 -> A2 | 8-11 -> B1 | 12-15 -> B2 | 16-18 -> C1 | 19-20 -> C2

CORRESPONDANCE NCLC :
A1=NCLC 1-2 | A2=NCLC 3-4 | B1=NCLC 5-6 | B2=NCLC 7-8 | C1=NCLC 9-10 | C2=NCLC 11-12

EXEMPLES DE CALIBRATION :

Niveau A2 (5-7/20) :
- Reponses d'un mot ou telegraphiques : 'Oui', 'Trois enfants', 'Ingenieur'
- Aucun developpement apres la reponse initiale
- Vocabulaire tres basique : 'j'aime', 'c'est bien', 'je fais', 'il y a'
- Hesitations longues avant chaque reponse
- Pronoms sujets oublies, accords incorrects

Niveau B1 (8-11/20) :
- Reponses completes mais courtes : 'Je travaille dans un hopital comme infirmier depuis cinq ans.'
- Quelques details spontanes mais limites
- Connecteurs simples : et, mais, parce que, alors, donc
- Debit irregulier mais intelligible, hesitations moderees
- Conjugaisons correctes au present et passe compose

Niveau B2 (12-15/20) :
- Reponses developpees avec details : 'Je suis infirmier dans un service de cardiologie, ca fait sept ans. C'est un metier exigeant mais tres enrichissant.'
- Vocabulaire varie, nuances, adjectifs precisement choisis
- Structures variees : relatives ('le service dans lequel je travaille'), conditionnels
- Discours fluide, rares hesitations, natural
- Spontaneite dans les reactions aux questions

Niveau C1 (16-18/20) :
- Reponses riches, detaillees, structurees naturellement
- Vocabulaire precis et varie, expressions idiomatiques
- Tres naturel, comme une vraie conversation

IMPORTANT :
- Sois STRICT et REALISTE. Un candidat qui repond en phrases tres courtes ne peut pas avoir B2.
- NOTES DIFFERENCIEES OBLIGATOIRES : Tu DOIS avoir au moins 2 notes DIFFERENTES parmi les 5 criteres. Le score 2/4 partout est un signal que tu n'as pas assez analyse. Identifie le critere le PLUS FORT et le PLUS FAIBLE.
- Chaque justification DOIT citer un EXEMPLE CONCRET tire de la transcription. Exemples DIFFERENTS pour chaque critere.
- STYLE DU FEEDBACK : Tutoie le candidat (tu, ton, tes) dans tous les champs texte.
- CITATIONS OBLIGATOIRES dans points_ameliorer : cite les mots EXACTS entre guillemets, puis donne la version amelioree. Ex : Tu as dit 'j'aime le sport' -> dis plutot 'je pratique la natation trois fois par semaine depuis deux ans'.
- CONSEIL PRIORITAIRE ULTRA CONCRET : Pas de generalites. Donne des formules de remplacement specifiques. Ex : 'Au lieu de dire j'aime le cinema, developpe : je vais au cinema au moins deux fois par mois, j'aime particulierement les films historiques car...'
- VERSION AMELIOREE : prends une reponse reelle du candidat et montre comment la reformuler au niveau superieur.

REGLE ABSOLUE DE NOTATION :
- Tu DOIS avoir au moins 2 notes DIFFERENTES parmi les 5 criteres.
- Commence par identifier le critere le PLUS FAIBLE et le PLUS FORT. Note-les en premier.
- Distributions valides : 1-2-2-3-2, 2-1-3-2-3, 3-2-2-3-4
- Distributions INVALIDES : 2-2-2-2-2, 3-3-3-3-3

Reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "scores": {
    "realisation_tache": { "note": 0, "justification": "" },
    "lexique": { "note": 0, "justification": "" },
    "grammaire": { "note": 0, "justification": "" },
    "fluidite_prononciation": { "note": 0, "justification": "" },
    "interaction_spontaneite": { "note": 0, "justification": "" }
  },
  "total": 0,
  "niveau_cecrl": "",
  "niveau_nclc": "",
  "resume_niveau": "",
  "points_positifs": ["", "", ""],
  "points_ameliorer": ["", "", ""],
  "correction_simple": "",
  "version_amelioree": {
    "niveau_cible": "",
    "texte": ""
  },
  "phrases_utiles": ["", "", "", ""],
  "conseil_prioritaire": "",
  "objectif_prochain_essai": ""
}`.trim();
}
