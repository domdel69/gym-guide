/* Séances. Une station = 1 exercice, ou 2 exercices enchaînés (superset).
   rest = repos en secondes après chaque série. side = répétitions « par côté ». */
const I=(ex,sets,reps,rest,o={})=>Object.assign({ex,sets,reps,rest},o);
/* Échauffement : 4 stations marquées warm:true, placées au début des séances A, B et C. */
const WU=()=>[
  [I('elliptical',1,'4 min',0,{warm:true})],
  [I('bandpull',1,'15',0,{warm:true})],
  [I('bander',1,'12 par côté',0,{warm:true})],
  [I('ankle',1,'10 par sens',0,{warm:true})]];
/* Variantes : alt = autres exercices possibles pour la même station (choisis dans l’app selon ce qui est libre).
   Chaque entrée peut remplacer sets, reps, rest ou note ; sinon elle reprend ceux de l’exercice prévu. */
const ALT_REAR=[{ex:'bandfacepull'},{ex:'facepull'}];
const ALT_CORE=[{ex:'bandpallof',reps:'10 par côté'},{ex:'birddog',reps:'8 par côté'},{ex:'pallof',reps:'10 par côté'}];
window.SESSIONS=[
{id:'a',tab:'Séance A',title:'Séance A',sub:'Pectoraux et bas du corps, environ 60 min',dur:'≈ 60 min',focus:'Pectoraux, bas du corps',
 intro:'Les exercices sur machine se font en séries successives. Seules les stations à deux exercices s’enchaînent : une machine ou une poulie avec un exercice à l’élastique, au tapis ou aux haltères. Une série du premier, repos, une série du second, et ainsi de suite. Si une machine est prise, change l’ordre des exercices.',
 stations:[
  ...WU(),
  [I('legpress',3,'10',90)],
  [I('chestpress',4,'8–10',90)],
  [I('row',4,'10–12',75)],
  [I('pulldown',3,'8–12',60),I('latraise',3,'12–15',75)],
  [I('legcurl',3,'10–12',60)],
  [I('crunch',3,'12–15',45),I('deadbug',3,'8 par côté',60)],
  [I('bike',1,'5 min',0,{note:'Finisseur, allure facile. Vélo ou rameur. Optionnel : saute-le si la séance dépasse 60 min.'})]]},
{id:'b',tab:'Séance B',title:'Séance B',sub:'Dos et définition des pectoraux, environ 60 min',dur:'≈ 60 min',focus:'Dos, pectoraux',
 intro:'Toutes les séries se font à la suite, sans superset. Si une machine est prise, change l’ordre des exercices. Les bras sont en option, après la séance. Les exercices marqués ⇄ ont des variantes : choisis selon ce qui est libre.',
 stations:[
  ...WU(),
  [I('pullup',4,'5–8',90)],
  [I('incline',4,'8–12',90)],
  [I('revpecdeck',4,'12–15',60,{alt:ALT_REAR})],
  [I('pecfly',3,'12–15',60)],
  [I('dbrdl',3,'10–12',75)],
  [I('sideplanktime',3,'45 s/côté',45,{alt:ALT_CORE})],
  [I('shoulderpress',3,'8–10',90)],
  [I('curl',2,'12',60,{note:'Optionnel : après les 60 min, seulement s’il reste du temps.'})],
  [I('triext',2,'12',60,{note:'Optionnel : après les 60 min, seulement s’il reste du temps.'})],
  [I('bike',1,'5 min',0,{note:'Finisseur, allure facile. Vélo ou rameur. Optionnel : saute-le si la séance dépasse 60 min.'})]]},
{id:'c',tab:'Séance C',title:'Séance C : rattrapage',sub:'Environ 64 min',dur:'≈ 64 min',focus:'Rattrapage',
 intro:'À utiliser quand une seule séance rentre dans la semaine, et pendant la semaine de Noël. Elle remplace une séance manquée, elle ne s’ajoute jamais. Les exercices marqués ⇄ ont des variantes : choisis selon ce qui est libre.',
 stations:[
  ...WU(),
  [I('legpress',3,'10',90,{note:'Même charge qu’en séance A.'})],
  [I('chestpress',4,'8–10',90)],
  [I('row',3,'10–12',75)],
  [I('pullup',3,'6–8',90,{note:'Si tu ne connais pas encore ton assistance, fais 3×8–12 au tirage vertical.'})],
  [I('pecfly',2,'12–15',60)],
  [I('dbrdl',2,'12',75)],
  [I('revpecdeck',2,'15',60,{alt:ALT_REAR})],
  [I('crunch',2,'12–15',45),I('deadbug',2,'8 par côté',60)],
  [I('bike',1,'5 min',0,{note:'Finisseur, allure facile. Vélo ou rameur.'})]]},
{id:'home',tab:'Maison',title:'Routine maison H',sub:'15 min, 2 à 3 fois par semaine',dur:'15 min',focus:'2 à 3 fois par semaine',
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

/* Étirements de fin de séance (5 au maximum par séance). Illustrations : pictogrammes SVG ; la zone orange = muscle étiré, la flèche = mouvement.
   t = durée de maintien en secondes ; side = « / côté » ou « / jambe » quand il faut refaire de l’autre côté. Pas d’étirement des mollets. */
(()=>{
const P=(pts,w=9,c='var(--fig)')=>`<polyline points="${pts.map(q=>q.join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const HD=(x,y)=>`<circle cx="${x}" cy="${y}" r="8.5" fill="var(--skin)"/>`;
const GL=(x,y,r=15)=>`<circle class="glow" cx="${x}" cy="${y}" r="${r}"/>`;
const AR=(x1,y1,x2,y2)=>{const a=Math.atan2(y2-y1,x2-x1),h=8,l=[x2-h*Math.cos(a-.5),y2-h*Math.sin(a-.5)],r=[x2-h*Math.cos(a+.5),y2-h*Math.sin(a+.5)];
  return `<g class="arr"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><polyline points="${l.map(n=>n.toFixed(1))} ${x2},${y2} ${r.map(n=>n.toFixed(1))}"/></g>`};
const FL=y=>`<line class="floor" x1="12" y1="${y}" x2="148" y2="${y}"/>`;
const L='var(--leg)',F2='var(--fig2)';
const svg=b=>`<svg viewBox="0 0 160 120" role="img" aria-hidden="true">${b}</svg>`;
const legs=(x=80,y=76)=>P([[x,y],[x-9,108]],9,L)+P([[x,y],[x+9,108]],9,L);
window.STRETCH={
 chest:{fr:'Pectoraux au cadre de porte',en:'Doorway chest stretch',zone:'Pectoraux',c:'#f97316',t:30,side:'',cue:'Avant-bras sur le cadre, avance le buste.',
  svg:svg(FL(113)+'<rect class="prop" x="44" y="6" width="8" height="107" rx="3"/><rect class="prop" x="108" y="6" width="8" height="107" rx="3"/>'+GL(80,54,17)+legs()+P([[80,44],[80,78]],13)+P([[72,47],[58,47],[57,24]],8)+P([[88,47],[102,47],[103,24]],8)+HD(80,31))},
 shoulder:{fr:'Épaule bras croisé',en:'Cross-body shoulder stretch',zone:'Arrière d’épaule',c:'#a855f7',t:20,side:' / côté',cue:'Bras tendu devant la poitrine, tire doucement.',
  svg:svg(FL(113)+GL(86,49,14)+legs()+P([[80,44],[80,78]],13)+P([[89,48],[52,53]],8)+HD(80,31)+P([[72,47],[69,68],[60,56]],8,F2)+AR(40,66,52,60))},
 child:{fr:'Posture de l’enfant',en:'Child’s pose',zone:'Dos, grand dorsal',c:'#3b82f6',t:30,side:'',cue:'Assieds-toi sur les talons, bras loin devant.',
  svg:svg(FL(110)+GL(84,84,17)+P([[38,104],[92,104]],9,L)+P([[58,88],[92,104]],10,L)+P([[104,94],[148,105]],8,F2)+P([[58,88],[104,91]],13)+HD(116,96)+AR(66,66,46,74))},
 side:{fr:'Étirement latéral du dos',en:'Overhead side reach',zone:'Dorsal, flancs',c:'#0ea5e9',t:20,side:' / côté',cue:'Un bras au-dessus de la tête, penche-toi.',
  svg:svg(FL(113)+GL(84,62,15)+P([[82,78],[70,108]],9,L)+P([[82,78],[94,108]],9,L)+P([[82,78],[74,46]],13)+P([[69,50],[63,72]],8,F2)+HD(67,34)+P([[80,48],[82,19],[52,14]],8)+AR(108,46,94,46))},
 sphinx:{fr:'Le sphinx',en:'Sphinx stretch',zone:'Abdominaux',c:'#ec4899',t:20,side:'',cue:'Sur les avant-bras, pousse le buste, bassin au sol.',
  svg:svg(FL(110)+GL(84,88,14)+P([[22,104],[64,100]],9,L)+P([[64,98],[102,76]],13)+P([[102,80],[102,103],[132,104]],8,F2)+HD(112,62)+AR(136,92,136,70))},
 hams:{fr:'Arrière de cuisse couché',en:'Lying hamstring stretch',zone:'Ischio-jambiers',c:'#16a34a',t:30,side:' / jambe',cue:'Mains derrière la cuisse, pied détendu.',
  svg:svg(FL(107)+GL(73,76,14)+P([[74,98],[126,99]],9,L)+P([[32,98],[74,98]],12)+HD(18,96)+P([[74,96],[70,66],[62,32]],9,L)+P([[34,96],[50,72],[70,70]],8,F2)+AR(86,44,74,34))},
 kneechest:{fr:'Genou à la poitrine',en:'Knee to chest',zone:'Fessiers, bas du dos',c:'#e11d48',t:20,side:' / côté',cue:'Ramène un genou vers toi, l’autre jambe allongée.',
  svg:svg(FL(107)+GL(78,90,14)+P([[74,98],[126,99]],9,L)+P([[32,98],[74,98]],12)+HD(18,96)+P([[74,95],[56,68],[80,80]],9,L)+P([[34,96],[46,76],[64,74]],8,F2)+AR(66,58,50,60))}
};
const STR={a:['chest','hams','kneechest','child','sphinx'],b:['chest','side','shoulder','hams','child'],c:['chest','child','hams','kneechest','sphinx'],home:['chest','shoulder','child']};
window.SESSIONS.forEach(x=>{x.stretch=STR[x.id]||[]});
})();

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
