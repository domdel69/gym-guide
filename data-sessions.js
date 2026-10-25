/* Séances. Une station = 1 exercice, ou 2 exercices enchaînés (superset).
   rest = repos en secondes après chaque série. side = répétitions « par côté ». */
const I=(ex,sets,reps,rest,o={})=>Object.assign({ex,sets,reps,rest},o);
window.SESSIONS=[
{id:'warmup',tab:'Échauffement',title:'Échauffement',sub:'6 min, toutes les séances',
 intro:'Vélo facile d’abord, puis le travail à l’élastique.',
 stations:[
  [I('bike',1,'4 min',0)],
  [I('bandpull',1,'15',0)],
  [I('bander',1,'12 par côté',0)],
  [I('ankle',1,'10 par sens',0)]]},
{id:'a',tab:'Séance A',title:'Séance A',sub:'Pectoraux et bas du corps, environ 60 min',
 intro:'Les exercices sur machine se font en séries successives. Seules les stations à deux exercices s’enchaînent : une machine ou une poulie avec un exercice à l’élastique, au tapis ou aux haltères. Une série du premier, repos, une série du second, et ainsi de suite. Si une machine est prise, change l’ordre des exercices.',
 stations:[
  [I('legpress',3,'10',90)],
  [I('chestpress',4,'8–10',90)],
  [I('row',4,'10–12',75)],
  [I('pulldown',3,'8–12',60),I('latraise',3,'12–15',75)],
  [I('legcurl',3,'10–12',60)],
  [I('crunch',3,'12–15',45),I('deadbug',3,'8 par côté',60)],
  [I('bike',1,'5 min',0,{note:'Finisseur, allure facile. Vélo ou rameur. Optionnel : saute-le si la séance dépasse 60 min.'})]]},
{id:'b',tab:'Séance B',title:'Séance B',sub:'Dos et définition des pectoraux, environ 59 min',
 intro:'Toutes les séries se font à la suite, sans superset. Si une machine est prise, change l’ordre des exercices. Les bras sont en option, après la séance.',
 stations:[
  [I('pullup',4,'5–8',90)],
  [I('incline',4,'8–12',90)],
  [I('facepull',4,'12–15',60)],
  [I('pecfly',3,'12–15',60)],
  [I('pullthrough',3,'10–12',75)],
  [I('pallof',3,'10 par côté',60)],
  [I('shoulderpress',3,'8–10',90)],
  [I('curl',2,'12',60,{note:'Optionnel : après les 60 min, seulement s’il reste du temps.'})],
  [I('triext',2,'12',60,{note:'Optionnel : après les 60 min, seulement s’il reste du temps.'})],
  [I('bike',1,'5 min',0,{note:'Finisseur, allure facile. Vélo ou rameur. Optionnel : saute-le si la séance dépasse 60 min.'})]]},
{id:'c',tab:'Séance C',title:'Séance C : rattrapage',sub:'Environ 64 min',
 intro:'À utiliser quand une seule séance rentre dans la semaine, et pendant la semaine de Noël. Elle remplace une séance manquée, elle ne s’ajoute jamais.',
 stations:[
  [I('legpress',3,'10',90,{note:'Même charge qu’en séance A.'})],
  [I('chestpress',4,'8–10',90)],
  [I('row',3,'10–12',75)],
  [I('pullup',3,'6–8',90,{note:'Si tu ne connais pas encore ton assistance, fais 3×8–12 au tirage vertical.'})],
  [I('pecfly',2,'12–15',60)],
  [I('pullthrough',2,'12',75)],
  [I('facepull',2,'15',60)],
  [I('crunch',2,'12–15',45),I('deadbug',2,'8 par côté',60)],
  [I('bike',1,'5 min',0,{note:'Finisseur, allure facile. Vélo ou rameur.'})]]},
{id:'home',tab:'Maison',title:'Routine maison H',sub:'15 min, 2 à 3 fois par semaine',
 intro:'Circuit en 2 tours, 30 s de repos. Les jours sans salle.',
 stations:[
  [I('ankle',2,'1 min',30,{note:'Mobilité de cheville, sans charge.'})],
  [I('bandpull',2,'15',30)],
  [I('bander',2,'12 par côté',30)],
  [I('scap',2,'8',30)],
  [I('negpull',2,'3',30)],
  [I('pushup',2,'12–15',30)],
  [I('deadbug',2,'8 par côté',30)],
  [I('chintuck',2,'1 min',30)]]}
];

/* Guides : un onglet par entrée. Pour en ajouter un, ajoute un objet ici. */
window.GUIDES=[
{id:'nutrition',tab:'Nutrition',title:'Nutrition',
 blocks:[
  {h:'Protéines',p:'Environ 1.6–2.0 g par kg de poids de corps et par jour.',
   ul:['Sans compter : une portion de protéines grande comme la paume à chacun de 3 à 4 repas.','Un shaker de protéines en poudre les jours d’entraînement, en complément.']},
  {h:'Tour de taille sans compter les calories',
   ul:['Pas de calories liquides.','Une seule portion de féculents au dîner, pas deux.','Arrête-toi à environ 80 % de satiété et mange lentement en semaine.','Vise un petit déficit, pas un régime.']},
  {h:'Alcool et sommeil',
   ul:['Alcool : reste bas.','Sommeil : passe de 6–7 h vers 7 h et plus, avec un coucher à ±1 h chaque jour.']},
  {h:'Compléments',p:'Pistes à valider avec ton médecin lors de la prise de sang, avant de commencer.',
   ul:['Vitamine D en hiver.','Créatine monohydrate, 3–5 g par jour.']}]},
{id:'recovery',tab:'Récupération',title:'Récupération et progression',
 blocks:[
  {h:'Charge et progression',
   ul:['Choisis une charge qui laisse 2 répétitions en réserve.','Toutes les séries au haut de la fourchette pendant 2 séances de suite : ajoute environ 2.5–5 %.','Semaine 1 : calibrage, 3–4 répétitions en réserve, note tes charges de départ.','Semaines 2–5 : 2 répétitions en réserve, dernière série jusqu’à 1.','Pas d’échec musculaire sur les machines proches des articulations.']},
  {h:'Semaine allégée (semaines 6 et 12)',
   ul:['Mêmes exercices, mêmes charges, 2 séries au lieu de 3–4.','Pas d’élévations latérales, pas de bras en option, pas de finisseur.']},
  {h:'Feu tricolore douleur (tendons et articulations)',
   ul:['Vert : douleur à 3/10 ou moins, calmée en 24 h, raideur du matin comme d’habitude. Continue.','Orange : 4–5/10, ou pire le lendemain matin. Saute flexion de jambes et vélo, garde le reste.','Rouge : douleur vive, boiterie, gonflement. Arrête le bas du corps et consulte vite.']},
  {h:'Cardio et activité',
   ul:['Vélo ou rameur seulement, en finisseur de 5 min.','Pas de course, de sauts, de pente raide ni de Parcours Vita tant que ton médecin n’a pas donné son accord.','Marche quotidienne : 7'+"'"+'000–8'+"'"+'000 pas.']},
  {h:'Épaule',
   ul:['Le signal, c’est la gêne du matin, pas la douleur pendant l’exercice.','Si elle dure plus de 48 h après une séance, remplace le développé au-dessus de la tête par un landmine ou un développé prise neutre.']}]}
];
