import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xlhdakujfjmsmyvdrcdc.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sujets = [
  {
    numero: 1,
    sujet: "Pensez-vous que les jeunes devraient travailler à temps partiel pendant leurs études ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Éducation",
    emoji_categorie: "🎓",
    arguments_pour: [
      "Acquérir une première expérience professionnelle avant la fin des études",
      "Apprendre la responsabilité et la gestion du temps",
      "Développer des compétences sociales (communication, travail en équipe)",
      "Renforcer la confiance en soi",
      "Gagner de l'autonomie financière"
    ],
    arguments_contre: [
      "Risque de fatigue et de baisse de motivation scolaire",
      "Difficile de concilier travail et révisions en période d'examens",
      "Tous les jeunes n'ont pas les mêmes capacités d'adaptation",
      "Risque d'échec scolaire si le travail prend trop de place"
    ],
    erreurs_typiques_b1: [
      "Donne une opinion sans la justifier",
      "Un seul argument développé, les autres juste cités",
      "Pas de nuance — soit tout positif soit tout négatif",
      "Pas de conclusion claire",
      "Connecteurs basiques uniquement (et, mais, parce que)",
      "Pas d'exemple concret"
    ],
    difference_b1_b2: "B1 : 'C'est bien de travailler car on gagne de l'expérience.' B2 : 'Travailler pendant ses études permet d'acquérir une expérience professionnelle précieuse dans un marché du travail de plus en plus compétitif. Cependant, il est essentiel de bien choisir son emploi pour éviter que cela nuise aux études.'",
    monologue_a2: "Euh... je pense que oui, les jeunes peuvent travailler pendant les études. C'est bien parce qu'on gagne de l'argent. Et euh... on apprend des choses. Mais c'est difficile aussi. Il faut bien organiser. Voilà, c'est mon opinion.",
    monologue_b1: "À mon avis, je pense que les jeunes devraient travailler pendant leurs études, mais pas trop. D'abord, c'est utile parce qu'on acquiert de l'expérience professionnelle. Par exemple, si on travaille dans un magasin, on apprend à communiquer avec les clients. Ensuite, on apprend aussi à gérer son temps et à être responsable. Mais il faut faire attention parce que si on travaille trop, ça peut nuire aux études. Il faut donc trouver un bon équilibre. En conclusion, je pense que travailler un peu pendant les études, c'est une bonne chose si c'est bien organisé.",
    monologue_b2: "À mon avis, il est tout à fait bénéfique pour les jeunes de travailler pendant leurs études, à condition que cela soit bien encadré et équilibré. Je vais développer ma réponse en trois points. D'abord, travailler pendant ses études permet d'acquérir une première expérience professionnelle qui sera précieuse sur le marché du travail. Au Canada, le marché de l'emploi est de plus en plus compétitif, et même une expérience modeste peut faire toute la différence sur un CV. Ensuite, cela développe des compétences essentielles comme la gestion du temps et le sens des responsabilités. Cependant, il faut reconnaître que ce n'est pas toujours facile. Il est donc essentiel de bien choisir son emploi et de ne pas dépasser ses limites. En conclusion, je crois que travailler pendant ses études est une excellente préparation à la vie adulte, à condition que cela soit bien encadré.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "À mon avis, il est bénéfique de...",
      "Je vais développer ma réponse en trois points.",
      "Cela permet d'acquérir...",
      "Il faut reconnaître que...",
      "À condition que cela soit bien encadré."
    ],
    connecteurs_utiles: [
      "D'abord / Ensuite / Par ailleurs / Cependant / En conclusion",
      "À mon avis / Personnellement / Je crois que",
      "Il faut reconnaître que / Certes / Néanmoins",
      "Par exemple / C'est le cas de / Comme l'illustre"
    ]
  },
  {
    numero: 2,
    sujet: "Pensez-vous que l'activité physique régulière est essentielle pour rester en bonne santé ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Santé & Bien-être",
    emoji_categorie: "🏃",
    arguments_pour: [
      "Prévenir de nombreuses maladies (cardiovasculaires, diabète, obésité)",
      "Améliorer la santé mentale (réduction du stress, anxiété, dépression)",
      "Augmenter le niveau d'énergie et améliorer le sommeil",
      "Renforcer la confiance en soi",
      "Pas besoin d'une salle de sport — gestes simples suffisent"
    ],
    arguments_contre: [
      "Manque de temps avec les horaires chargés",
      "Certaines personnes n'aiment pas le sport",
      "Coût des abonnements sportifs parfois élevé",
      "Difficile en hiver avec les conditions climatiques"
    ],
    erreurs_typiques_b1: [
      "Dit juste 'c'est bon pour la santé' sans développer",
      "Pas d'exemple concret personnel",
      "Oublie la nuance — ne reconnaît pas que c'est pas toujours facile",
      "Pas de conclusion claire",
      "Ne mentionne pas le lien santé mentale / bien-être"
    ],
    difference_b1_b2: "B1 : 'Le sport c'est important pour la santé et pour être en forme.' B2 : 'Au-delà des bénéfices physiques évidents, l'activité physique joue un rôle crucial sur la santé mentale. Elle permet de libérer des endorphines qui réduisent le stress et l'anxiété, ce qui est particulièrement important dans nos modes de vie de plus en plus sédentaires.'",
    monologue_a2: "Euh... oui je pense que le sport c'est important. C'est bon pour la santé. Moi je fais du sport parfois. Euh... c'est bien pour le corps. Et aussi pour être heureux. Voilà c'est mon opinion.",
    monologue_b1: "À mon avis, avoir une activité physique régulière c'est très important dans la vie quotidienne. D'abord, c'est bon pour la santé parce que ça permet de prévenir des maladies comme le diabète ou les problèmes cardiaques. Ensuite, le sport aide aussi à réduire le stress. Quand on fait du sport, on se sent mieux dans sa tête. Par exemple, moi quand je marche pendant 30 minutes, je me sens plus détendu. Cependant, je comprends que certaines personnes n'ont pas le temps. Mais je pense qu'on peut faire des petites choses simples. En conclusion, je pense que l'activité physique c'est essentiel pour rester en bonne santé.",
    monologue_b2: "À mon avis, intégrer une activité physique régulière dans sa vie quotidienne est absolument indispensable, et cela pour plusieurs raisons. Tout d'abord, sur le plan physique, le sport permet de prévenir de nombreuses maladies chroniques comme les problèmes cardiovasculaires et le diabète. Ensuite, au-delà des bénéfices physiques, l'activité physique joue un rôle crucial sur la santé mentale. Elle permet de libérer des endorphines qui réduisent naturellement le stress et l'anxiété. Cependant, je comprends que certaines personnes manquent de temps. Dans ce cas, il n'est pas nécessaire de s'inscrire dans une salle de sport. Il suffit d'intégrer des gestes simples dans sa routine : marcher au lieu de prendre la voiture, prendre les escaliers. En conclusion, je pense que les employeurs et les écoles devraient davantage encourager ces habitudes saines.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Intégrer une activité physique régulière est indispensable.",
      "Sur le plan physique... / Sur le plan mental...",
      "Cela permet de prévenir de nombreuses maladies.",
      "Au-delà des bénéfices physiques...",
      "Il suffit d'intégrer des gestes simples dans sa routine."
    ],
    connecteurs_utiles: [
      "Tout d'abord / Ensuite / Par ailleurs / Cependant / En conclusion",
      "Au-delà de / D'autant plus que / Dans ce cas",
      "Personnellement / À mon avis / Je pense que",
      "Il suffit de / Il est d'autant plus important de"
    ]
  },
  {
    numero: 3,
    sujet: "Pensez-vous que les achats en ligne vont remplacer les magasins traditionnels ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Consommation",
    emoji_categorie: "🛒",
    arguments_pour: [
      "Praticité — commander à toute heure sans se déplacer",
      "Variété de choix et comparaison des prix en quelques clics",
      "Livraison à domicile en quelques jours",
      "Accès à des produits spécialisés ou venant de l'étranger",
      "Gain de temps pour les personnes avec un emploi du temps chargé"
    ],
    arguments_contre: [
      "Voir, toucher et essayer le produit avant d'acheter",
      "Contact humain et conseils personnalisés du vendeur",
      "Repartir avec son achat immédiatement",
      "Expérience sociale et sensorielle du shopping",
      "Soutenir les commerces locaux"
    ],
    erreurs_typiques_b1: [
      "Choisit un camp sans reconnaître les avantages de l'autre",
      "Arguments trop vagues : 'c'est pratique' sans expliquer pourquoi",
      "Pas d'exemple concret",
      "Conclusion absente ou trop courte",
      "Ne mentionne pas l'impact sur les commerces locaux"
    ],
    difference_b1_b2: "B1 : 'Les achats en ligne c'est pratique parce qu'on peut commander depuis chez soi.' B2 : 'Si les achats en ligne offrent une praticité indéniable, notamment pour les personnes avec un emploi du temps chargé, ils ne peuvent pas totalement remplacer l'expérience sensorielle et humaine du magasin physique, surtout pour des articles comme les vêtements ou les meubles.'",
    monologue_a2: "Euh... moi je pense que les deux c'est bien. Les achats en ligne c'est pratique. On commande et on reçoit chez soi. Mais les magasins c'est bien aussi parce qu'on peut voir les choses. Euh... voilà c'est mon avis.",
    monologue_b1: "À mon avis, les achats en ligne et les magasins physiques ont chacun leurs avantages. D'abord, faire ses achats en ligne c'est très pratique parce qu'on peut commander n'importe quand et recevoir le colis à domicile. Ensuite, on peut comparer les prix facilement. Cependant, les magasins physiques ont aussi des avantages. Par exemple, pour acheter des vêtements, c'est mieux d'essayer avant d'acheter. En conclusion, je pense que les deux sont complémentaires et je les utilise selon la situation.",
    monologue_b2: "C'est une question très intéressante qui touche à nos habitudes de consommation modernes. Personnellement, je pense que les achats en ligne et les magasins physiques sont complémentaires plutôt que concurrents. D'un côté, le commerce en ligne présente des avantages indéniables. Il permet de gagner un temps précieux en commandant depuis chez soi et de comparer les prix en quelques clics. Cependant, le magasin physique garde des atouts que l'internet ne peut pas reproduire. Voir, toucher et essayer un produit avant de l'acheter est essentiel pour certains articles. De plus, le contact humain avec un vendeur compétent apporte une valeur ajoutée réelle. En conclusion, je ne pense pas que les achats en ligne vont remplacer totalement les magasins physiques. L'avenir est dans une complémentarité intelligente entre les deux formats.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Les deux sont complémentaires plutôt que concurrents.",
      "D'un côté... / De l'autre côté...",
      "Des avantages indéniables.",
      "Cela permet de gagner un temps précieux.",
      "L'avenir est dans une complémentarité intelligente."
    ],
    connecteurs_utiles: [
      "D'un côté / De l'autre côté / En revanche",
      "Indéniablement / Cependant / Néanmoins",
      "De plus / Par ailleurs / Notamment",
      "En conclusion / Pour résumer / Au final"
    ]
  },
  {
    numero: 4,
    sujet: "Pensez-vous que voyager à l'étranger est une expérience enrichissante pour tout le monde ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Culture",
    emoji_categorie: "🌍",
    arguments_pour: [
      "Découvrir de nouvelles cultures et sortir de sa zone de confort",
      "Développer des compétences personnelles (adaptation, autonomie, confiance en soi)",
      "Atout professionnel — les entreprises valorisent l'expérience internationale",
      "Apprendre à communiquer dans d'autres langues",
      "Enrichissement personnel et ouverture d'esprit"
    ],
    arguments_contre: [
      "Coût élevé — tout le monde n'a pas les moyens",
      "Impact environnemental (pollution des avions, tourisme de masse)",
      "Certaines personnes préfèrent découvrir leur propre pays",
      "Peut être stressant pour les personnes peu à l'aise avec l'inconnu"
    ],
    erreurs_typiques_b1: [
      "Dit juste 'c'est bien de voyager' sans développer pourquoi",
      "Oublie l'impact environnemental",
      "Pas d'exemple personnel concret",
      "Ne mentionne pas les bénéfices professionnels",
      "Conclusion trop courte ou absente"
    ],
    difference_b1_b2: "B1 : 'Voyager c'est bien parce qu'on découvre d'autres cultures et on apprend des choses.' B2 : 'Au-delà de l'enrichissement culturel, voyager à l'étranger développe des compétences professionnelles très valorisées aujourd'hui. Cependant, il faut aussi reconnaître l'impact environnemental du tourisme de masse et privilégier un voyage responsable.'",
    monologue_a2: "Euh... je pense que voyager c'est bien. On découvre des nouvelles choses. Des nouvelles cultures. Euh... moi j'aime voyager. C'est enrichissant. Mais c'est cher aussi. Voilà c'est mon avis.",
    monologue_b1: "À mon avis, voyager à l'étranger c'est très important et très enrichissant. D'abord, quand on voyage, on découvre de nouvelles cultures et de nouveaux modes de vie. Ça nous ouvre l'esprit. Par exemple, moi quand j'ai voyagé dans un autre pays, j'ai appris beaucoup de choses sur les autres et sur moi-même. Ensuite, voyager aide aussi à développer la confiance en soi. Cependant, je comprends que tout le monde n'a pas les moyens de voyager loin. En conclusion, je pense que voyager est une très bonne expérience si on en a la possibilité.",
    monologue_b2: "Voyager à l'étranger est selon moi l'une des expériences les plus formatrices qu'on puisse vivre. D'abord, le voyage nous confronte à des cultures et des modes de vie radicalement différents des nôtres. Cette confrontation développe une véritable ouverture d'esprit. Ensuite, au-delà de l'enrichissement personnel, voyager représente aujourd'hui un véritable atout professionnel. Dans un monde globalisé, les entreprises recherchent des collaborateurs capables de travailler dans des environnements multiculturels. Cependant, il faut aussi reconnaître que voyager a un coût environnemental. L'avion pollue, et le tourisme de masse peut détruire des écosystèmes fragiles. C'est pourquoi il est important de voyager de façon responsable. En conclusion, voyager est une source inestimable de richesse personnelle et professionnelle, à condition de le faire avec conscience.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "L'une des expériences les plus formatrices.",
      "Sortir de sa zone de confort.",
      "Développer une véritable ouverture d'esprit.",
      "Un atout professionnel indéniable.",
      "Voyager de façon responsable.",
      "Une source inestimable de richesse."
    ],
    connecteurs_utiles: [
      "D'abord / Ensuite / Au-delà de / Cependant / En conclusion",
      "Tant... que... / À condition de / C'est pourquoi",
      "Personnellement / Selon moi / À mon avis",
      "Radicalement / Véritablement / Inestimable"
    ]
  },
  {
    numero: 5,
    sujet: "Pensez-vous que les réseaux sociaux ont plus d'effets négatifs que positifs sur notre société ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Technologie",
    emoji_categorie: "📱",
    arguments_pour: [
      "Maintenir le contact avec proches à l'étranger",
      "S'informer rapidement et découvrir des opinions diverses",
      "Donner une voix à des personnes exclues des médias traditionnels",
      "Outil de communication puissant pour les entreprises et associations",
      "Partager des moments de vie et créer des communautés"
    ],
    arguments_contre: [
      "Perte de temps considérable",
      "Impact sur l'estime de soi (comparaison constante avec les autres)",
      "Désinformation et fausses nouvelles",
      "Harcèlement en ligne et addiction numérique",
      "Dégradation de la qualité des relations humaines réelles"
    ],
    erreurs_typiques_b1: [
      "Choisit un camp sans nuancer",
      "Pas d'exemple concret d'impact négatif ou positif",
      "Oublie la désinformation et le harcèlement en ligne",
      "Ne propose pas de solution (usage responsable)",
      "Conclusion trop vague"
    ],
    difference_b1_b2: "B1 : 'Les réseaux sociaux c'est bien pour parler avec les amis mais ça peut être mauvais pour la santé.' B2 : 'Si les réseaux sociaux constituent un outil de communication puissant, leur usage excessif peut nuire à la santé mentale, notamment chez les jeunes qui se comparent constamment aux autres et développent parfois une véritable addiction numérique.'",
    monologue_a2: "Euh... les réseaux sociaux... je pense que c'est bien et c'est pas bien. C'est bien parce qu'on peut parler avec des amis. Euh... mais c'est mauvais aussi parce qu'on passe trop de temps. Moi je suis beaucoup sur mon téléphone. C'est pas bon. Voilà.",
    monologue_b1: "À mon avis, les réseaux sociaux ont des effets positifs et négatifs sur la société. D'un côté, ils permettent de rester en contact avec des amis ou de la famille qui vivent loin. De plus, on peut s'informer rapidement sur l'actualité. Mais d'un autre côté, les réseaux sociaux peuvent aussi être négatifs. Beaucoup de gens passent trop de temps à faire défiler leur téléphone. Il y a aussi des problèmes de harcèlement en ligne. Je pense qu'il faut utiliser les réseaux sociaux de manière responsable. En conclusion, les réseaux sociaux ne sont ni bons ni mauvais — tout dépend de comment on les utilise.",
    monologue_b2: "La question de l'impact des réseaux sociaux sur notre société est particulièrement pertinente aujourd'hui. Personnellement, je pense que ces plateformes sont des outils puissants dont l'impact dépend entièrement de la manière dont on les utilise. D'un côté, les réseaux sociaux présentent des avantages indéniables. Ils permettent de maintenir des liens avec des proches qui vivent à l'étranger, ce qui est particulièrement précieux pour les personnes immigrées. En revanche, leur usage excessif comporte de réels dangers. Beaucoup de jeunes passent plusieurs heures par jour à faire défiler leur fil d'actualité, ce qui peut nuire à leur santé mentale. La comparaison constante avec les autres affecte l'estime de soi, et les problèmes de désinformation sont de plus en plus préoccupants. En conclusion, il faut apprendre à utiliser les réseaux sociaux de manière consciente et responsable.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Des outils puissants dont l'impact dépend de leur utilisation.",
      "D'un côté... / En revanche...",
      "Maintenir des liens avec des proches à l'étranger.",
      "Nuire à la santé mentale.",
      "Une véritable addiction numérique.",
      "Utiliser de manière consciente et responsable."
    ],
    connecteurs_utiles: [
      "D'un côté / En revanche / De plus / Notamment",
      "Indéniablement / Particulièrement / Entièrement",
      "Ce qui génère / Ce qui enrichit / Afin que",
      "En conclusion / Pour résumer / Personnellement"
    ]
  },
  {
    numero: 6,
    sujet: "Pensez-vous qu'il est encore possible de préserver les traditions culturelles dans un monde de plus en plus globalisé ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Culture",
    emoji_categorie: "🌍",
    arguments_pour: [
      "Représentent l'identité d'un peuple, son histoire et ses valeurs",
      "Créent un lien entre les générations et transmettent des savoirs anciens",
      "Renforcent la cohésion sociale et le sentiment d'appartenance",
      "Enrichissent la diversité culturelle mondiale",
      "Peuvent s'adapter et évoluer sans disparaître"
    ],
    arguments_contre: [
      "Mondialisation et homogénéisation des cultures",
      "Les jeunes générations se désintéressent parfois des traditions",
      "Certaines traditions peuvent être incompatibles avec les valeurs modernes",
      "Risque de folklorisation — les traditions deviennent un spectacle touristique"
    ],
    erreurs_typiques_b1: [
      "Dit juste 'les traditions c'est important' sans expliquer pourquoi",
      "Oublie de mentionner la mondialisation comme menace",
      "Pas d'exemple concret de tradition menacée ou préservée",
      "Ne fait pas la distinction entre préserver et figer",
      "Conclusion trop vague"
    ],
    difference_b1_b2: "B1 : 'Les traditions culturelles c'est important parce que c'est notre identité et notre histoire.' B2 : 'Préserver les traditions culturelles ne signifie pas les figer dans le passé, mais les faire vivre et les adapter au monde contemporain. Une culture vivante est une culture qui évolue avec son temps tout en gardant ses valeurs fondamentales.'",
    monologue_a2: "Euh... je pense que les traditions c'est important. C'est notre culture. Notre identité. Euh... moi j'aime les traditions de mon pays. Mais avec la modernité c'est difficile. Les jeunes oublient parfois. Voilà c'est mon opinion.",
    monologue_b1: "À mon avis, il est très important de préserver les traditions culturelles même dans le monde moderne. D'abord, les traditions représentent l'identité d'un peuple et son histoire. Elles créent un lien entre les générations. Par exemple, dans ma culture, on célèbre des fêtes traditionnelles qui rassemblent toute la famille. Ensuite, les traditions renforcent aussi la cohésion sociale. Cependant, je pense qu'il ne faut pas rejeter la modernité non plus. Les traditions peuvent évoluer et s'adapter. En conclusion, je crois qu'il est possible et important de préserver les traditions culturelles tout en les adaptant au monde actuel.",
    monologue_b2: "La question de la préservation des traditions culturelles dans un monde globalisé est particulièrement pertinente, surtout dans un pays multiculturel comme le Canada. À mon avis, il est non seulement possible mais essentiel de préserver les traditions culturelles. Ces traditions représentent bien plus que de simples coutumes — elles incarnent l'identité d'un peuple et transmettent des savoirs anciens. De plus, les traditions culturelles renforcent la cohésion sociale en créant un sentiment d'appartenance à une communauté. Au Canada, la richesse culturelle vient précisément de cette diversité de traditions que les immigrants apportent avec eux. Cependant, préserver ne signifie pas figer. Une culture vivante est une culture qui s'adapte avec son temps tout en préservant ses valeurs fondamentales. En conclusion, il faut faire vivre les traditions plutôt que de les muséifier.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Préserver ne signifie pas figer.",
      "Incarner l'identité d'un peuple.",
      "Créer un sentiment d'appartenance.",
      "Une culture vivante est une culture qui évolue.",
      "Faire vivre les traditions plutôt que de les muséifier."
    ],
    connecteurs_utiles: [
      "Non seulement... mais aussi / De plus / Cependant",
      "Précisément / Particulièrement / Bien plus que",
      "À mon avis / Surtout / En conclusion",
      "Tout en / Plutôt que / Afin de"
    ]
  },
  {
    numero: 7,
    sujet: "Pensez-vous que les devoirs à la maison sont bénéfiques pour la réussite scolaire des élèves ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Éducation",
    emoji_categorie: "🎓",
    arguments_pour: [
      "Renforcer les connaissances vues en classe",
      "Développer l'autonomie et la responsabilisation",
      "Favoriser l'autodiscipline — compétence précieuse dans la vie adulte",
      "Permettre à l'élève de progresser à son rythme",
      "Repérer ses difficultés et les travailler"
    ],
    arguments_contre: [
      "Risque de surcharge et de fatigue",
      "Peut creuser les inégalités (pas les mêmes conditions à la maison)",
      "Certains élèves n'ont pas d'endroit calme ni d'aide parentale",
      "L'apprentissage ne doit pas se faire uniquement dans la contrainte",
      "Les élèves ont besoin de temps libre pour se détendre"
    ],
    erreurs_typiques_b1: [
      "Dit juste 'les devoirs c'est utile pour apprendre' sans nuancer",
      "Oublie la question des inégalités sociales",
      "Pas d'exemple concret d'élève ou de matière",
      "Ne mentionne pas le bien-être de l'élève",
      "Conclusion trop vague"
    ],
    difference_b1_b2: "B1 : 'Les devoirs c'est bien parce qu'on peut réviser ce qu'on a appris en classe.' B2 : 'Si les devoirs permettent de renforcer les connaissances et de développer l'autodiscipline, ils risquent aussi de creuser les inégalités entre les élèves qui ont un environnement favorable à la maison et ceux qui n'ont ni endroit calme ni aide parentale.'",
    monologue_a2: "Euh... les devoirs... je pense que c'est utile. On révise ce qu'on a appris. Euh... mais c'est beaucoup parfois. Les enfants sont fatigués. Moi quand j'étais petit j'avais beaucoup de devoirs. C'était difficile. Voilà c'est mon avis.",
    monologue_b1: "À mon avis, les devoirs à la maison peuvent être utiles mais il faut faire attention à ne pas en donner trop. D'abord, les devoirs permettent aux élèves de revoir ce qu'ils ont appris en classe. Par exemple, un exercice de maths à la maison aide à bien assimiler une formule. Ensuite, les devoirs développent aussi l'autonomie et la responsabilité. Cependant, si les devoirs sont trop nombreux, ça peut créer du stress. Les enfants ont besoin de temps libre pour jouer. De plus, tous les enfants n'ont pas les mêmes conditions à la maison. En conclusion, je pense que les devoirs sont utiles s'ils sont raisonnables et bien adaptés à l'âge des élèves.",
    monologue_b2: "La question des devoirs à la maison fait débat dans de nombreux pays, et je pense qu'il n'existe pas de réponse simple. D'un côté, les devoirs présentent des avantages réels. Ils permettent aux élèves de consolider les notions vues en classe et de développer une autodiscipline précieuse. Cependant, il faut reconnaître que les devoirs peuvent aussi avoir des effets négatifs. Un emploi du temps trop chargé peut engendrer de la fatigue et du découragement. De plus, les devoirs risquent de creuser les inégalités sociales : tous les élèves n'ont pas les mêmes conditions à la maison. Certains n'ont ni endroit calme pour travailler, ni parents disponibles pour les aider. En conclusion, les devoirs doivent être un outil au service de l'apprentissage, et non une source de stress ou d'inégalité.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Consolider les notions vues en classe.",
      "Développer une autodiscipline précieuse.",
      "Engendrer de la fatigue et du découragement.",
      "Creuser les inégalités sociales.",
      "Un outil au service de l'apprentissage.",
      "Sans nuire à son bien-être."
    ],
    connecteurs_utiles: [
      "D'un côté / Cependant / De plus / En conclusion",
      "Bien au-delà de / Précisément / Notamment",
      "S'ils sont / À condition que / Non pas... mais",
      "Engendrer / Consolider / Creuser / Nuire à"
    ]
  },
  {
    numero: 8,
    sujet: "Pensez-vous que l'utilisation des animaux à des fins scientifiques est acceptable ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Éthique",
    emoji_categorie: "⚖️",
    arguments_pour: [
      "Nombreuses avancées médicales grâce à l'expérimentation animale",
      "Vaccins et traitements contre des maladies graves développés grâce aux tests",
      "Objectif de sauver des vies humaines",
      "Cadre réglementé qui limite les abus"
    ],
    arguments_contre: [
      "Souffrance animale injustifiable",
      "Existence de méthodes alternatives (simulations informatiques, cultures cellulaires)",
      "Tests cosmétiques sur animaux totalement inacceptables",
      "Les animaux sont des êtres vivants qui méritent respect et protection"
    ],
    erreurs_typiques_b1: [
      "Position trop tranchée sans nuance",
      "Ne mentionne pas les alternatives existantes",
      "Oublie la distinction entre tests médicaux et tests cosmétiques",
      "Pas d'exemple concret de médicament développé grâce aux animaux",
      "Conclusion trop vague"
    ],
    difference_b1_b2: "B1 : 'Je pense que c'est pas bien de faire souffrir les animaux pour la science.' B2 : 'Si certaines expérimentations animales ont permis des avancées médicales majeures, il est essentiel de distinguer ces cas de ceux qui n'ont aucune justification médicale, comme les tests cosmétiques qui font souffrir des êtres vivants pour des raisons purement esthétiques.'",
    monologue_a2: "Euh... je pense que c'est pas bien d'utiliser les animaux pour la science. Les animaux ils souffrent. C'est pas juste. Euh... mais parfois c'est nécessaire peut-être pour les médicaments. Je sais pas. C'est difficile. Voilà c'est mon avis.",
    monologue_b1: "À mon avis, l'utilisation des animaux pour la science c'est un sujet très difficile. D'un côté, je comprends que certaines expériences sur les animaux ont permis de développer des médicaments importants. Beaucoup de vaccins ont été testés sur des animaux avant d'être utilisés sur les humains. Mais d'un autre côté, les animaux souffrent et c'est pas acceptable. Il existe maintenant des méthodes alternatives. Et surtout, utiliser des animaux pour tester des produits cosmétiques c'est vraiment inacceptable. En conclusion, je pense que l'expérimentation animale devrait être limitée aux cas vraiment nécessaires.",
    monologue_b2: "L'utilisation des animaux à des fins scientifiques soulève un débat éthique fondamental qui oppose le progrès médical au respect du bien-être animal. C'est un sujet sur lequel j'ai une position nuancée. D'un côté, il est indéniable que l'expérimentation animale a permis des avancées médicales considérables. De nombreux vaccins ont pu être développés grâce à des tests préalables sur des animaux. Cependant, je pense qu'il faut absolument distinguer ces cas de ceux qui n'ont aucune justification médicale. Utiliser des animaux pour tester des produits cosmétiques me paraît totalement inacceptable. De plus, il existe aujourd'hui des méthodes alternatives qui permettent souvent d'obtenir les mêmes résultats sans recourir aux animaux. En conclusion, l'expérimentation animale ne devrait être autorisée que dans un cadre très réglementé, avec un objectif médical clair et en l'absence totale d'alternative.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Soulève un débat éthique fondamental.",
      "J'ai une position nuancée sur ce sujet.",
      "Des avancées médicales considérables.",
      "Me paraît totalement inacceptable.",
      "Dans un cadre très réglementé."
    ],
    connecteurs_utiles: [
      "D'un côté / Cependant / De plus / En conclusion",
      "Indéniablement / Totalement / Strictement",
      "À condition que / En l'absence de",
      "Soulever / Distinguer / Privilégier / Encadrer"
    ]
  },
  {
    numero: 9,
    sujet: "Selon vous, quels sont les avantages et les inconvénients de vivre seul par rapport à la vie en colocation ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Vie quotidienne",
    emoji_categorie: "🏠",
    arguments_pour: [
      "Grande liberté — organiser sa vie comme on veut",
      "Calme et concentration pour les études ou le travail",
      "Aide à se connaître soi-même et gagner en autonomie",
      "Pas de conflits liés aux habitudes différentes"
    ],
    arguments_contre: [
      "Partager les frais — souvent nécessaire pour les étudiants et nouveaux arrivants",
      "Soutien moral et compagnie au quotidien",
      "Apprendre à vivre avec les autres, faire des compromis",
      "Moments de convivialité et d'entraide",
      "Moins de risque d'isolement"
    ],
    erreurs_typiques_b1: [
      "Choisit un camp sans reconnaître les avantages de l'autre",
      "Oublie l'aspect financier — argument clé pour les immigrants",
      "Pas d'exemple concret de situation du quotidien",
      "Ne mentionne pas le risque d'isolement quand on vit seul",
      "Conclusion trop vague"
    ],
    difference_b1_b2: "B1 : 'Vivre seul c'est bien parce qu'on est libre et on fait ce qu'on veut.' B2 : 'Si vivre seul offre une liberté indéniable et favorise l'autonomie personnelle, la colocation présente des avantages non négligeables, notamment sur le plan financier et social, ce qui en fait souvent le choix privilégié des étudiants et des nouveaux arrivants.'",
    monologue_a2: "Euh... moi je pense que vivre seul c'est bien. On est libre. On fait ce qu'on veut. Pas de problèmes avec les autres. Mais euh... c'est cher. Et parfois on se sent seul. La colocation c'est moins cher. Voilà c'est mon avis.",
    monologue_b1: "À mon avis, vivre seul et vivre en colocation ont chacun leurs avantages. D'un côté, vivre seul c'est très bien parce qu'on a une grande liberté. On organise sa vie comme on veut. Mais d'un autre côté, vivre seul c'est souvent plus cher. Et parfois la solitude peut peser. La colocation permet de partager les frais et d'avoir de la compagnie au quotidien. On apprend aussi à faire des compromis. En conclusion, je pense que le choix dépend de la personnalité de chacun et de sa situation financière.",
    monologue_b2: "La question de vivre seul ou en colocation est particulièrement pertinente pour les personnes qui s'installent dans un nouveau pays. Vivre seul présente des avantages indéniables. On bénéficie d'une liberté totale — on organise son emploi du temps comme on veut et on peut se concentrer pleinement sur ses projets professionnels. Cependant, la solitude peut parfois peser lourd, surtout lorsqu'on est loin de sa famille. Il peut être difficile de faire face seul à certaines situations du quotidien. C'est là que la colocation prend tout son sens — elle apporte du soutien moral, de la compagnie, et permet de partager les frais, ce qui est souvent indispensable pour les nouveaux arrivants. En conclusion, il n'existe pas de réponse universelle. Le choix dépend de la personnalité de chacun et de ce qu'il recherche à un moment donné de sa vie.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "Chacun a ses avantages et ses inconvénients.",
      "Bénéficier d'une liberté totale.",
      "La solitude peut parfois peser lourd.",
      "C'est là que la colocation prend tout son sens.",
      "Il n'existe pas de réponse universelle."
    ],
    connecteurs_utiles: [
      "D'un côté / Cependant / C'est là que / En conclusion",
      "Indéniablement / Pleinement / Souvent / Parfois",
      "Qu'il s'agisse de / Ce qui est / Lorsqu'on est",
      "Se sentir bien / Faire des compromis"
    ]
  },
  {
    numero: 10,
    sujet: "Pensez-vous que s'intégrer dans un nouveau pays nécessite d'abandonner sa culture d'origine ?",
    consigne: "Donnez votre opinion et justifiez votre réponse avec des arguments et des exemples concrets.",
    categorie: "Société & Immigration",
    emoji_categorie: "🌍",
    arguments_pour: [
      "Apprendre la langue du pays d'accueil est indispensable",
      "Respecter les lois et les valeurs de la société d'accueil",
      "S'adapter facilite l'insertion professionnelle et sociale",
      "Permet de créer des liens avec la population locale"
    ],
    arguments_contre: [
      "La diversité culturelle enrichit la société d'accueil",
      "On peut s'intégrer sans renier ses racines",
      "La culture d'origine fait partie de l'identité",
      "Le Canada valorise officiellement le multiculturalisme"
    ],
    erreurs_typiques_b1: [
      "Confond intégration et assimilation",
      "Ne mentionne pas le multiculturalisme canadien",
      "Pas d'exemple personnel ou concret",
      "Ne nuance pas entre adaptation nécessaire et abandon total",
      "Conclusion trop vague"
    ],
    difference_b1_b2: "B1 : 'Je pense qu'on peut garder sa culture et s'intégrer en même temps.' B2 : 'S'intégrer ne signifie pas s'assimiler. On peut parfaitement adopter les codes et les valeurs de la société d'accueil tout en préservant sa langue maternelle et son identité culturelle. C'est d'ailleurs le modèle que prône officiellement le Canada avec sa politique de multiculturalisme.'",
    monologue_a2: "Euh... je pense que non. On peut garder sa culture. Moi je suis immigrant et je garde mes traditions. Mais il faut apprendre le français. C'est important. Euh... les deux c'est possible. Voilà c'est mon avis.",
    monologue_b1: "À mon avis, s'intégrer dans un nouveau pays ne veut pas dire abandonner sa culture. On peut faire les deux en même temps. D'abord, il est vrai qu'il faut s'adapter au pays d'accueil. Par exemple, apprendre la langue c'est essentiel pour trouver un emploi. Il faut aussi respecter les lois et les valeurs du pays. Mais ça ne veut pas dire qu'on doit oublier ses traditions. Au contraire, la diversité culturelle enrichit la société. Au Canada par exemple, il y a des gens de partout dans le monde et c'est une richesse. En conclusion, je pense qu'on peut très bien s'intégrer tout en gardant son identité culturelle.",
    monologue_b2: "La question de l'intégration culturelle est au cœur du débat sur l'immigration, et c'est un sujet qui me touche personnellement. À mon avis, s'intégrer ne signifie pas s'assimiler ni renier ses racines. Il existe une différence fondamentale entre les deux. S'intégrer, c'est adopter les codes sociaux, respecter les lois et les valeurs de la société d'accueil, et maîtriser la langue — en l'occurrence le français au Québec, ce qui est absolument indispensable pour s'insérer professionnellement. Mais cela ne nécessite pas d'abandonner sa culture d'origine. Au contraire, je pense que la diversité culturelle est une richesse pour la société d'accueil. Le Canada l'a d'ailleurs reconnu officiellement avec sa politique de multiculturalisme. En conclusion, une intégration réussie repose sur un équilibre : adopter ce qui est nécessaire pour vivre dans le nouveau pays, tout en préservant ce qui constitue notre identité profonde.",
    note_cible_a2: { realisation_tache: 1, lexique: 1, grammaire: 1, fluidite_prononciation: 1, interaction_coherence: 1, total: 5 },
    note_cible_b1: { realisation_tache: 2, lexique: 2, grammaire: 2, fluidite_prononciation: 2, interaction_coherence: 2, total: 10 },
    note_cible_b2: { realisation_tache: 3, lexique: 3, grammaire: 3, fluidite_prononciation: 3, interaction_coherence: 3, total: 15 },
    expressions_cles: [
      "S'intégrer ne signifie pas s'assimiler.",
      "Il existe une différence fondamentale entre les deux.",
      "Maîtriser la langue est absolument indispensable.",
      "La diversité culturelle est une richesse.",
      "La politique de multiculturalisme canadienne.",
      "Une intégration réussie repose sur un équilibre."
    ],
    connecteurs_utiles: [
      "Au contraire / D'ailleurs / En l'occurrence / En conclusion",
      "Fondamentalement / Officiellement / Absolument",
      "Tout en / Ce qui / En tant que / Reposer sur",
      "Reconnaître / Préserver / Encourager / Constituer"
    ]
  },
  {
    numero: 11,
    sujet: "Dans le monde actuel, les médias peuvent manipuler volontairement notre opinion. Qu'en pensez-vous ?",
    consigne: "Donnez votre opinion personnelle sur ce sujet et justifiez-la avec au moins 2 arguments. Illustrez vos idées avec des exemples concrets.",
    categorie: "Société & Médias",
    emoji_categorie: "📰",
    arguments_pour: [
      "Concentration des médias entre les mains de quelques milliardaires (cas en France)",
      "Algorithmes des réseaux sociaux qui filtrent l'information",
      "Sélection éditoriale partisane (ligne politique des journaux)",
      "Sensationnalisme pour faire de l'audience",
      "Désinformation et fake news"
    ],
    arguments_contre: [
      "Pluralité des sources accessibles via Internet",
      "Esprit critique des lecteurs/spectateurs aujourd'hui",
      "Médias indépendants, journalisme d'investigation",
      "Régulation et déontologie journalistique"
    ],
    erreurs_typiques_b1: [
      "Confusion 'média' / 'moyen' (faux ami)",
      "'manipuler' mal conjugué",
      "Pas d'utilisation du subjonctif après 'il faut que'",
      "Vocabulaire trop simple ('c'est mauvais', 'c'est bien')",
      "Argumentation linéaire sans nuance",
      "Pas de connecteurs logiques variés"
    ],
    difference_b1_b2: "B1 : 'Je pense que les médias mentent. C'est mauvais pour les gens.' (position binaire, lexique simple) B2 : 'Je pense que les médias peuvent manipuler l'opinion, mais la vraie question est de savoir s'ils le font systématiquement. Avec Internet, le contrôle est moins fort qu'avant.' (nuance, lexique précis, structure argumentée)",
    monologue_a2: "",
    monologue_b1: "",
    monologue_b2: "",
    note_cible_a2: {},
    note_cible_b1: {},
    note_cible_b2: {},
    expressions_cles: [
      "manipuler l'opinion publique",
      "se rendre compte que",
      "racheter un journal / un média",
      "contrôler l'information",
      "avoir un monopole sur"
    ],
    connecteurs_utiles: [
      "Cause : 'à cause de cela', 'puisque', 'étant donné que'",
      "Opposition : 'mais', 'cependant', 'en revanche'",
      "Concession : 'bien sûr', 'il est vrai que'",
      "Conclusion : 'finalement', 'en somme', 'pour conclure'"
    ]
  }
];

async function seed() {
  console.log("Deleting existing task3_references rows...");
  await supabase.from("task3_references").delete().gte("numero", 1);

  console.log(`Inserting ${sujets.length} task 3 subjects...`);
  const { data, error } = await supabase
    .from("task3_references")
    .insert(sujets)
    .select("numero, sujet");

  if (error) {
    console.error("Insert error:", error.message);
    process.exit(1);
  }

  data.forEach((row) => console.log(`  ${row.numero}. ${row.sujet.substring(0, 60)}...`));
  console.log("Done!");
}

seed();
