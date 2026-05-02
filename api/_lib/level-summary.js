/**
 * Génère un résumé textuel cohérent du niveau atteint, basé sur les notes calculées.
 * Post-corrige les champs textuels du JSON Claude qui peuvent mentionner des niveaux
 * incohérents avec les vraies notes (bug de contamination par sur-mention "B2/NCLC 7").
 *
 * @param {string} cecrl - Niveau CECRL ("A1", "A2", "B1", "B2", "C1", "C2")
 * @param {number} nclc - Niveau NCLC (1 à 10)
 * @param {number} total - Total /20
 * @returns {{ resume_niveau: string, niveau_label: string, seuil_atteint: boolean }}
 */
export function generateLevelSummary(cecrl, nclc, total) {
  const validCecrl = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(cecrl) ? cecrl : 'B1';
  const validNclc = (Number.isInteger(nclc) && nclc >= 1 && nclc <= 10) ? nclc : 5;
  const validTotal = (Number.isInteger(total) && total >= 0 && total <= 20) ? total : 10;

  const seuilAtteint = validNclc >= 7;
  const niveauLabel = `${validCecrl} — NCLC ${validNclc}`;

  let resumeBase;

  if (validCecrl === 'A1' || validCecrl === 'A2') {
    resumeBase = `Tu es actuellement au niveau ${validCecrl} (NCLC ${validNclc}). C'est un niveau débutant qui ne permet pas encore d'atteindre le seuil Entrée Express (NCLC 7 minimum). Tu dois consolider les bases en grammaire, lexique et fluidité avant de viser un niveau intermédiaire.`;
  } else if (validCecrl === 'B1') {
    if (validNclc <= 5) {
      resumeBase = `Tu es au niveau ${niveauLabel} (B1 bas). Tu communiques sur des sujets familiers mais ton vocabulaire et ta structure restent limités. Pour atteindre le seuil Entrée Express (NCLC 7), tu dois enrichir significativement ton lexique, varier tes structures grammaticales et améliorer la cohérence de ton discours.`;
    } else {
      resumeBase = `Tu es au niveau ${niveauLabel} (B1 solide). Tu te débrouilles correctement à l'oral, mais il te manque encore quelques marges de progression pour atteindre le seuil Entrée Express (NCLC 7). Concentre-toi sur l'enrichissement lexical, la diversité des connecteurs logiques et la structuration de tes arguments.`;
    }
  } else if (validCecrl === 'B2') {
    if (validNclc === 7) {
      resumeBase = `Tu atteins le niveau ${niveauLabel}, ce qui correspond au seuil minimum requis pour Entrée Express. Ton discours est compréhensible et structuré, mais tu es à la limite basse du B2. Pour consolider ce niveau et viser un NCLC 8, tu dois développer davantage tes arguments, diversifier ton vocabulaire et construire des conclusions explicites.`;
    } else {
      resumeBase = `Tu atteins le niveau ${niveauLabel} (B2 confortable). Tu dépasses le seuil minimum d'Entrée Express. Tu peux maintenant viser un score plus élevé (NCLC 9-10) en travaillant la précision lexicale, la spontanéité et la richesse argumentative.`;
    }
  } else if (validCecrl === 'C1') {
    resumeBase = `Tu atteins le niveau ${niveauLabel} (C1). Tu maîtrises la langue avec aisance et nuance. Ton score est largement au-dessus du seuil Entrée Express. Continue de raffiner ton expression pour un score TCF maximal.`;
  } else if (validCecrl === 'C2') {
    resumeBase = `Tu atteins le niveau ${niveauLabel} (C2 — niveau quasi natif). Tu maîtrises la langue à un niveau très élevé. Aucune marge significative de progression à viser pour le TCF.`;
  } else {
    resumeBase = `Tu es au niveau ${niveauLabel} avec un total de ${validTotal}/20. ${seuilAtteint ? 'Tu as atteint le seuil Entrée Express (NCLC 7).' : "Tu n'as pas encore atteint le seuil Entrée Express (NCLC 7)."}`;
  }

  return {
    resume_niveau: resumeBase,
    niveau_label: niveauLabel,
    seuil_atteint: seuilAtteint,
  };
}
