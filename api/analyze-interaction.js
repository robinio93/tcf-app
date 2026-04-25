function extractJson(rawText) {
  if (!rawText) return "";
  let text = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try { JSON.parse(text); return text; } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { JSON.parse(match[0]); return match[0]; } catch { /* */ }
  }
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { conversation, scenario, scenarioData, durationSec } = req.body;

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
        max_output_tokens: 2000,
        input: buildPrompt(conversation, scenario, scenarioData, durationSec),
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

    const analysis = extractJson(rawText);

    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
}

function buildFewShotBlock(scenarioData) {
  if (!scenarioData?.dialogue_a2) return "";
  return `
═══════════════════════════════════════════════════════
EXEMPLES DE REFERENCE POUR CALIBRER TA NOTATION
═══════════════════════════════════════════════════════
Voici 3 dialogues de reference pour ce scenario "${scenarioData.titre || ""}". Compare la transcription du candidat a ces exemples pour positionner correctement ton scoring.

──────────────────────────────────────
EXEMPLE A2 (total cible : 5/20)
──────────────────────────────────────
${scenarioData.dialogue_a2}

Notes attendues : realisation=1, lexique=1, grammaire=1, fluidite=1, interaction=1 -> TOTAL = 5/20

──────────────────────────────────────
EXEMPLE B1 (total cible : 10/20)
──────────────────────────────────────
${scenarioData.dialogue_b1}

Notes attendues : realisation=2, lexique=2, grammaire=2, fluidite=2, interaction=2 -> TOTAL = 10/20

──────────────────────────────────────
EXEMPLE B2 (total cible : 15/20)
──────────────────────────────────────
${scenarioData.dialogue_b2}

Notes attendues : realisation=3, lexique=3, grammaire=3, fluidite=3, interaction=3 -> TOTAL = 15/20

INSTRUCTION DE CALIBRAGE :
- Si la transcription ressemble au A2 -> notes proches de 5/20
- Si elle ressemble au B1 -> notes proches de 10/20
- Si elle ressemble au B2 -> notes proches de 15/20
- Au-dela du B2, on peut monter jusqu'a 18-20/20 pour C1/C2
- En-dessous du A2, on descend a 0-3/20 pour A1
═══════════════════════════════════════════════════════
`;
}

function buildScenarioContext(scenario, scenarioData) {
  if (!scenarioData) return "";
  const pts = Array.isArray(scenarioData.points_cles_attendus)
    ? scenarioData.points_cles_attendus.map((p, i) => `${i + 1}. ${p}`).join("\n")
    : "";
  const errs = Array.isArray(scenarioData.erreurs_typiques_b1)
    ? scenarioData.erreurs_typiques_b1.map((e) => `- ${e}`).join("\n")
    : "";
  const exprs = Array.isArray(scenarioData.expressions_cles)
    ? scenarioData.expressions_cles.map((e) => `- "${e}"`).join("\n")
    : "";
  return `
CONTEXTE SPECIFIQUE DU SCENARIO "${scenario}" :

Points cles que le candidat devait absolument aborder :
${pts}

Erreurs typiques d'un candidat B1 sur ce scenario :
${errs}

Exemple de formulation B2 sur ce scenario :
"${scenarioData.difference_b1_b2_bon || ""}"

Expressions cles a maitriser pour ce scenario :
${exprs}

INSTRUCTION CRITIQUE : Dans tes points_ameliorer, cite explicitement les points cles que le candidat n'a PAS abordes. Exemple : "Tu n'as pas demande [point cle manquant]. Tu aurais pu dire : [expression cle adaptee du scenario]."
`;
}

function buildDurationRules(durationSec) {
  if (!durationSec || durationSec <= 0) return "";
  const d = Number(durationSec);
  if (d < 30) return "\nREGLES STRICTES DE NOTATION — DUREE TRES COURTE (moins de 30s de parole candidat) : realisation_tache = 0 ou 1 maximum. Total plafonne a 5/20. Niveau maximum : A1.\n";
  if (d < 60) return "\nREGLES STRICTES DE NOTATION — DUREE COURTE (moins de 60s de parole candidat) : Total plafonne a 7/20. Niveau maximum : A2.\n";
  if (d < 90) return "\nREGLES STRICTES DE NOTATION — DUREE INSUFFISANTE (moins de 90s de parole candidat) : Total plafonne a 9/20. Niveau maximum : A2+.\n";
  return "";
}

function buildPrompt(conversation, scenario, scenarioData, durationSec) {
  const contextBlock = buildScenarioContext(scenario, scenarioData);
  const fewShotBlock = buildFewShotBlock(scenarioData);
  const durationBlock = buildDurationRules(durationSec);

  return `⚠️ INSTRUCTION PRIORITAIRE — LIS CECI EN PREMIER ⚠️

Tu as un BIAIS DE SURNOTATION SYSTEMATIQUE. Tu donnes toujours 3 a 5 points de trop.
AVANT de finaliser tes notes, SOUSTRAIS 1 point a chaque critere que tu as note 3/4 ou plus,
SAUF si le candidat remplit TOUTES ces conditions :
- Utilise le conditionnel ("j'aurais souhaite", "pourriez-vous")
- Utilise des connecteurs varies (cependant, par ailleurs, en revanche)
- Couvre au moins 5 points cles sur 6
- Fait des relances spontanees et reformule
- Utilise un vocabulaire precis et varie (pas de "c'est combien")

BAREME STRICT :
- 4/4 = INTERDIT sauf locuteur natif C2. Maximum 3/4 par critere pour un B2.
- 3/4 = reserve aux candidats qui utilisent conditionnel + connecteurs varies + vocabulaire precis
- 2/4 = candidat qui communique correctement avec des phrases simples
- 1/4 = phrases tres courtes, vocabulaire basique, peu d'interaction
- 0/4 = incomprehensible ou hors sujet

TOTAUX ATTENDUS (verifie TOUJOURS avant de repondre) :
- 5-7/20 = A2 | 8-11/20 = B1 | 12-15/20 = B2 | 16-18/20 = C1 (tres rare) | 19-20/20 = C2 (quasi impossible)

Si ton total depasse 15/20, RELIS la transcription et BAISSE tes notes. Un total > 15 ne devrait arriver que si le candidat est quasi-natif.

═══════════════════════════════════════════════════════

Tu es un examinateur certifie TCF Canada, forme par France Education International.
Tu evalues la production orale d'un candidat.

TACHE : 2 — Interaction orale
SUJET / CONSIGNE : ${scenario || "Interaction orale TCF Canada"}
${contextBlock}${fewShotBlock}
Evalue UNIQUEMENT les repliques du CANDIDAT (lignes [CANDIDAT]). Les repliques [EXAMINATEUR] sont du contexte.

TRANSCRIPTION DU DIALOGUE :
${conversation}

Evalue selon ces 5 criteres, chacun note de 0 a 4 :

1. REALISATION DE LA TACHE (0-4)
Le candidat a-t-il obtenu les informations recherchees ? A-t-il pose des questions pertinentes et variees ? A-t-il reagi et adapte ses questions aux reponses ?
- 0 = pas de reponse ou hors sujet
- 1 = tache a peine abordee, questions tres basiques (A1-A2)
- 2 = tache partiellement realisee, quelques questions pertinentes (B1 faible)
- 3 = tache bien realisee, questions variees et pertinentes (B1+/B2)
- 4 = tache pleinement accomplie, questions riches et reactives (B2+/C1)

2. LEXIQUE (0-4)
- 0 = vocabulaire insuffisant pour communiquer
- 1 = vocabulaire tres basique, repetitions constantes (A2)
- 2 = vocabulaire suffisant pour le quotidien, quelques periphrases (B1)
- 3 = vocabulaire varie, reformulations, peu de repetitions (B2)
- 4 = vocabulaire riche, precis, nuance, synonymes maitrises (C1)

3. GRAMMAIRE (0-4)
- 0 = aucun controle grammatical
- 1 = structures simples avec erreurs frequentes (A2)
- 2 = structures simples correctes, erreurs dans le complexe (B1)
- 3 = bon controle, structures variees, erreurs non systematiques (B2)
- 4 = excellent controle, variete syntaxique, rares erreurs ponctuelles (C1)

4. FLUIDITE & PRONONCIATION (0-4)
- 0 = incomprehensible
- 1 = hesitations longues et frequentes, prononciation souvent peu claire (A2)
- 2 = debit assez regulier malgre pauses de recherche, globalement intelligible (B1)
- 3 = discours fluide, peu d'hesitations, bonne prononciation et intonation (B2)
- 4 = discours naturel et spontane, intonation maitrisee, autocorrection efficace (C1)

5. INTERACTION & COHERENCE (0-4)
Reactivite aux reponses, relances, questions de suivi, adaptation au contexte, registre poli approprie
- 0 = aucune interaction, echanges totalement deconnectes
- 1 = reponses minimales, pas de relances, registre inadapte (A2)
- 2 = interaction basique, quelques relances simples, registre acceptable (B1)
- 3 = interaction fluide, relances variees, bonne adaptation aux reponses (B2)
- 4 = interaction naturelle et convaincante, registre parfaitement maitrise (C1)

BAREME NIVEAU :
0-4 : A1 | 5-7 : A2 | 8-11 : B1 | 12-15 : B2 | 16-18 : C1 | 19-20 : C2

CORRESPONDANCE NCLC :
A1=NCLC 1-2 | A2=NCLC 3-4 | B1=NCLC 5-6 | B2=NCLC 7-8 | C1=NCLC 9-10 | C2=NCLC 11-12

EXEMPLES DE CALIBRATION — utilise ces exemples comme reference pour tes notes :

Niveau A2 (5-7/20) :
- Phrases tres courtes, souvent un seul mot : 'Oui', 'Non', 'Je sais pas'
- Pas de questions posees par le candidat, ou questions tres basiques d'un mot
- Vocabulaire de base uniquement, repetitions constantes
- Beaucoup d'hesitations longues (3-5 secondes), silences bloques
- Aucun connecteur logique

Niveau B1 (8-11/20) :
- Phrases simples mais completes : 'Je voudrais louer une voiture'
- Questions basiques : 'C'est combien ?', 'C'est quand ?'
- Connecteurs simples : et, mais, parce que, alors
- Quelques hesitations normales, debit irregulier mais intelligible
- Peut exprimer un besoin mais sans precision ni nuance

Niveau B2 (12-15/20) :
- Phrases complexes avec subordonnees et conditions
- Reformulations : 'Ce que je veux dire, c'est que...'
- Questions precisees et variees : 'Pourriez-vous me detailler les differentes formules ?'
- Connecteurs varies : cependant, en revanche, par consequent, a condition que
- Discours fluide avec rares hesitations
- Capacite a negocier, argumenter, nuancer

Niveau C1 (16-18/20) :
- Discours spontane et naturel, sans hesitations notables
- Vocabulaire riche, precis, registre parfaitement adapte a la situation
- Humour, ironie, nuances culturelles maitrisees
- Structure argumentative sophistiquee, reformulations elegantes

IMPORTANT :
- Sois STRICT et REALISTE. Un candidat avec tres peu de repliques ou des repliques tres courtes ne peut pas avoir B2.
- NOTES DIFFERENCIEES OBLIGATOIRES : Ne mets PAS la meme note a tous les criteres. Chaque critere doit etre evalue INDEPENDAMMENT. Un candidat peut avoir 3/4 en fluidite mais 1/4 en lexique. Le score 2/4 sur tous les criteres est un signal que tu n'as pas assez analyse la transcription. Relis chaque critere separement.
- Chaque justification doit citer un EXEMPLE CONCRET et DIFFERENT tire de la transcription (pas le meme exemple pour plusieurs criteres).
- "correction_simple" = les tours du CANDIDAT reformules avec les erreurs de langue corrigees, en conservant exactement le meme niveau de complexite et le meme sens.
- "version_amelioree" = repliques modeles du candidat AU NIVEAU JUSTE AU-DESSUS du niveau estime (si B1 estime, donner un modele B2 ; si B2, donner C1).
- "conseil_prioritaire" = UN SEUL conseil, le plus impactant pour progresser, concret et actionnable, lie a un defaut reel observe dans la transcription.
- STYLE DU FEEDBACK : Tutoie le candidat (tu, ton, tes) dans tous les champs texte — resume_niveau, points_positifs, points_ameliorer, correction_simple, version_amelioree, conseil_prioritaire, objectif_prochain_essai.
- CITATIONS OBLIGATOIRES : Dans chaque point_ameliorer, cite les mots ou phrases EXACTES de la transcription entre guillemets, puis donne la version corrigee directement. Ex : Tu as dit 'je veux un voiture' -> dis plutot 'je voudrais une voiture'.
- CONSEIL PRIORITAIRE ULTRA CONCRET : Pas de generalites ('enrichir le vocabulaire'). Donne des formules de remplacement specifiques. Ex : 'Au lieu de repeter je voudrais, utilise : j aurais aime, je souhaiterais, serait-il possible de...'


REGLES STRICTES DE NOTATION SELON LA DUREE :
- Moins de 30 secondes de parole candidat → realisation_tache = 0 ou 1 maximum, total plafonne a 5/20
- Moins de 60 secondes de parole candidat → total plafonne a 7/20
- Moins de 90 secondes de parole candidat → total plafonne a 9/20
- Une seule phrase du candidat dans toute la transcription → niveau maximum A2, jamais B1
${durationBlock}
REGLES STRICTES DE CALIBRAGE — OBLIGATOIRES :
1. SEVERITE : Tu as tendance a surnoter de 3 a 5 points. Corrige ce biais en etant plus strict.
2. BAREME STRICT par critere :
   - 0/4 = absence totale ou incomprehensible
   - 1/4 = tres basique, phrases minimales, vocabulaire tres limite, beaucoup d'erreurs
   - 2/4 = correct mais simple, quelques erreurs, vocabulaire suffisant sans plus
   - 3/4 = bon niveau, phrases complexes, peu d'erreurs, vocabulaire varie
   - 4/4 = excellent, quasi-natif, aucune erreur significative
3. TOTAUX DE REFERENCE STRICTS : A1=0-4 | A2=5-7 | B1=8-11 | B2=12-15 | C1=16-18 | C2=19-20
4. Un candidat qui dit "C'est combien ?" au lieu de "Pourriez-vous me preciser le tarif ?" a un lexique a 1/4, pas 2/4.
5. Un candidat qui ne couvre que 2-3 points cles sur 6 a une realisation a 1/4, pas 2/4.
6. Phrases courtes sans connecteurs = grammaire 1/4, pas 2/4.
7. Compare TOUJOURS avec les exemples de reference A2/B1/B2 fournis avant de noter. Si le dialogue ressemble au A2 de reference, le total doit etre proche de 5/20.
8. Une note de 3/4 signifie EXCELLENT, pas juste "correct". Pour avoir 3/4 en lexique, le candidat doit utiliser un vocabulaire varie ET precis avec des formulations elaborees. "C'est combien de plus ?" = 2/4 maximum, jamais 3/4.
9. Une note de 4/4 est QUASI-IMPOSSIBLE. Elle est reservee aux locuteurs natifs ou C2. Ne donne JAMAIS 4/4 sauf si le candidat est indiscernable d'un francophone natif sur ce critere.
10. Pour avoir realisation 3/4, le candidat doit couvrir AU MOINS 5 points cles sur 6. S'il en couvre 4, c'est 2/4.
11. Pour avoir interaction 3/4, le candidat doit faire des relances spontanees, reformuler, resumer et conclure naturellement. Poser des questions de suivi simples = 2/4 maximum.
12. Le total ne doit JAMAIS depasser 15/20 sauf si le candidat utilise le subjonctif, le conditionnel passe, des expressions idiomatiques et un registre soutenu avec nuance.
13. VERIFICATION FINALE : ton total est-il coherent avec les exemples A2/B1/B2 fournis ? Si ton total depasse 15, relis et baisse.

REGLE ABSOLUE DE NOTATION :
- Tu DOIS avoir au moins 2 notes DIFFERENTES parmi les 5 criteres. Si tu mets la meme note partout, ton evaluation est REJETEE.
- Commence par identifier le critere le PLUS FAIBLE et le critere le PLUS FORT du candidat. Note-les en premier, puis note les 3 autres entre ces deux extremes.
- Exemples de distributions valides : 1-2-2-3-2, 2-1-3-2-3, 3-2-2-3-4
- Exemple de distributions INVALIDES : 2-2-2-2-2, 3-3-3-3-3

Reponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "scores": {
    "realisation_tache": { "note": 0, "justification": "" },
    "lexique": { "note": 0, "justification": "" },
    "grammaire": { "note": 0, "justification": "" },
    "fluidite_prononciation": { "note": 0, "justification": "" },
    "interaction_coherence": { "note": 0, "justification": "" }
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
