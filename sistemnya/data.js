// ============================================================
// OphthaSim — Mock Data, Scenario Engine, Badges, XP System
// ============================================================

var CASES = [
  {
    id: 'case-001',
    title: 'Red Eye with Discharge',
    category: 'Red Eye',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '10–15 min',
    tags: ['conjunctivitis','discharge','contact-lens'],
    chiefComplaint: '"My eye has been red and sticky since yesterday morning."',
    synopsis: 'A young adult with acute unilateral red eye, mucopurulent discharge, and a history of overnight contact lens wear.',
    learningGoals: ['Differentiate bacterial vs viral conjunctivitis','Identify contact lens risk factors for keratitis','Recognise when urgent referral is needed'],
    patientProfile: { name: 'Sarah K.', age: 25, gender: 'Female', occupation: 'University student' },
    patientTone: 'anxious',
    accentColor: '#EF4444',
    accentLight: '#FEE2E2',
    orbColor: '#EF4444',
    correctDiagnosis: 'Bacterial Conjunctivitis (contact-lens keratitis risk)',
    keyDomains: ['laterality','onset','duration','discharge','contact_lens','pain','visual_acuity','redness','history','medication'],
    criticalDomains: ['contact_lens','visual_acuity','laterality'],
    responses: {
      laterality:    { text: "It's my right eye. The left one feels completely fine.", found: 'Right eye affected', isRedFlag: false },
      onset:         { text: "It started yesterday morning — I woke up and my eyelid was almost glued shut.", found: 'Acute onset — 1 day ago', isRedFlag: false },
      duration:      { text: "About 24 hours now and it's not getting any better.", found: 'Duration: ~24 hours', isRedFlag: false },
      pain:          { text: "It's scratchy, like there's something in my eye — but not really painful.", found: 'Mild scratchy discomfort', isRedFlag: false },
      redness:       { text: "Very red, yes. My flatmate said it looked awful this morning.", found: 'Marked conjunctival injection', isRedFlag: false },
      photophobia:   { text: "Not particularly. Bright light doesn't bother me much.", found: 'No significant photophobia', isRedFlag: false },
      visual_acuity: { text: "Slightly blurry but it clears when I blink. Not dramatically worse.", found: 'Mildly blurry — clears on blinking', isRedFlag: false },
      floaters:      { text: "No spots or floaters, no.", found: 'No floaters', isRedFlag: false },
      flashes:       { text: "No flashing lights at all.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "Yes — yellowish sticky discharge. In the morning there was a lot; it was sealing my eye shut.", found: 'Mucopurulent discharge (copious, AM worse)', isRedFlag: false },
      trauma:        { text: "No injury or anything like that.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "Yes, I wear daily contacts. I fell asleep with them in two nights ago… I know I shouldn't have.", found: '⚠️ Contact lens — overnight wear (keratitis risk)', isRedFlag: true },
      history:       { text: "I had something similar about a year ago, went away on its own — no contacts then.", found: 'Previous episode ~1yr ago (resolved spontaneously)', isRedFlag: false },
      medication:    { text: "Nothing for my eye. Just contact lens solution.", found: 'No current ophthalmic medications', isRedFlag: false },
      headache:      { text: "No headache — I feel fine otherwise.", found: 'No headache', isRedFlag: false },
      diplopia:      { text: "No double vision, just the one blurry image.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "Healthy otherwise. No major conditions.", found: 'No relevant systemic disease', isRedFlag: false },
      surgical:      { text: "Never had any eye surgery.", found: 'No prior ocular surgery', isRedFlag: false },
      visual_field:  { text: "No, my peripheral vision seems fine.", found: 'No visual field complaint', isRedFlag: false },
      default:       { text: "Hmm, I'm not quite sure what you mean. Could you ask me something more specific about my eye?", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-002',
    title: 'Sudden Flashes & Floaters',
    category: 'Retinal Emergency',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '15–20 min',
    tags: ['retinal-detachment','emergency','floaters','flashes'],
    chiefComplaint: '"I\'m suddenly seeing black spots and flashing lights in one eye."',
    synopsis: 'A middle-aged highly myopic patient with acute-onset photopsia and a shower of new floaters — high suspicion for retinal tear or detachment.',
    learningGoals: ['Recognise retinal detachment red flags','Understand significance of new-onset floaters + flashes','Identify high-risk features: myopia, age, previous retinal pathology'],
    patientProfile: { name: 'Robert M.', age: 54, gender: 'Male', occupation: 'Architect' },
    patientTone: 'worried',
    accentColor: '#5865F2',
    accentLight: '#EEF0FE',
    orbColor: '#5865F2',
    correctDiagnosis: 'Suspected Retinal Detachment — Ophthalmic Emergency',
    keyDomains: ['laterality','onset','floaters','flashes','visual_acuity','visual_field','contact_lens','history','systemic','pain','redness'],
    criticalDomains: ['floaters','flashes','visual_acuity','visual_field','onset'],
    responses: {
      laterality:    { text: "The left eye. It started in my left eye this morning.", found: 'Left eye affected', isRedFlag: false },
      onset:         { text: "Suddenly, this morning. I was just at my desk and it started out of nowhere.", found: '🚨 Acute onset — this morning', isRedFlag: true },
      duration:      { text: "It's been about 6 hours and it's not going away at all.", found: 'Duration: ~6 hours (not resolving)', isRedFlag: false },
      pain:          { text: "No pain at all. That's what worries me — it doesn't hurt but something is clearly wrong.", found: 'PAINLESS — quiet white eye (important)', isRedFlag: false },
      redness:       { text: "My eye doesn't look red at all. I checked in the mirror.", found: 'No redness — white quiet eye', isRedFlag: false },
      photophobia:   { text: "Not really sensitive to light, no.", found: 'No photophobia', isRedFlag: false },
      visual_acuity: { text: "My central vision seems okay but… something feels different. Hard to explain.", found: '⚠️ Subjective visual disturbance — possible field defect', isRedFlag: true },
      floaters:      { text: "Yes! Lots of them — a sudden shower of black dots and a big cobweb-like shape. I've never had this before. It happened all at once.", found: '🚨 New-onset shower of floaters — EMERGENCY sign', isRedFlag: true },
      flashes:       { text: "Yes — flashing lights at the edge of my vision, like lightning at the side. It's intermittent.", found: '🚨 Peripheral photopsia (flashes) — EMERGENCY sign', isRedFlag: true },
      discharge:     { text: "No discharge. My eye looks perfectly normal from the outside.", found: 'No discharge', isRedFlag: false },
      trauma:        { text: "Nothing — no injury. I was just sitting at my desk when it started.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "I wear glasses, not contacts. I'm very short-sighted — about minus 7 in both eyes.", found: '⚠️ High myopia (−7D) — major risk factor', isRedFlag: true },
      history:       { text: "Yes — I had a small retinal tear in my right eye 3 years ago. They treated it with laser.", found: '⚠️ Previous retinal tear + laser treatment — significant risk', isRedFlag: true },
      medication:    { text: "Just amlodipine for blood pressure.", found: 'On antihypertensive (Amlodipine)', isRedFlag: false },
      headache:      { text: "No headache.", found: 'No headache', isRedFlag: false },
      diplopia:      { text: "No double vision — just the floaters and flashes.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "I have hypertension, well controlled. And early type 2 diabetes — diet-controlled so far.", found: 'Hypertension + early T2DM (retinal risk)', isRedFlag: false },
      surgical:      { text: "Only the retinal laser treatment on my right eye three years ago.", found: 'Previous retinal laser (OD) — 3 years ago', isRedFlag: false },
      visual_field:  { text: "Actually… now that you ask, there's a shadow or curtain at the bottom of my vision. I didn't mention it but it's there.", found: '🚨 CURTAIN/SHADOW in visual field — RETINAL DETACHMENT', isRedFlag: true },
      default:       { text: "I'm not sure. I'm quite scared honestly. Is this something serious?", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-003',
    title: 'Painful Eye + Photophobia',
    category: 'Anterior Uveitis',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '12–18 min',
    tags: ['uveitis','photophobia','pain','systemic','HLA-B27'],
    chiefComplaint: '"My eye has been painful, red, and very sensitive to light for 3 days."',
    synopsis: 'A young man with recurrent unilateral painful red eye and severe photophobia — suspected anterior uveitis with a systemic HLA-B27 association.',
    learningGoals: ['Recognise anterior uveitis presentation','Link ocular symptoms to systemic disease','Understand HLA-B27 associated conditions'],
    patientProfile: { name: 'James T.', age: 32, gender: 'Male', occupation: 'Physiotherapist' },
    patientTone: 'pain-affected',
    accentColor: '#F59E0B',
    accentLight: '#FEF3C7',
    orbColor: '#F59E0B',
    correctDiagnosis: 'Anterior Uveitis — HLA-B27 associated (Ankylosing Spondylitis)',
    keyDomains: ['laterality','onset','duration','pain','photophobia','redness','visual_acuity','floaters','history','medication','systemic','surgical'],
    criticalDomains: ['photophobia','pain','systemic','history'],
    responses: {
      laterality:    { text: "Left eye. It's always the left one when this happens.", found: 'Left eye affected', isRedFlag: false },
      onset:         { text: "Gradually — it came on over a day and has been getting progressively worse for 3 days now.", found: 'Gradual onset, progressive over 3 days', isRedFlag: false },
      duration:      { text: "Three days. I was hoping it would sort itself out but it's getting worse.", found: 'Duration: 3 days (worsening)', isRedFlag: false },
      pain:          { text: "Yes, quite painful — a deep aching pain. It gets worse when I look at anything bright.", found: '⚠️ Deep aching pain worsened by light', isRedFlag: true },
      redness:       { text: "Very red. The redness is mostly around the coloured part of the eye, not the outer white area.", found: 'Ciliary/perilimbal injection — significant pattern', isRedFlag: false },
      photophobia:   { text: "Terrible. I can barely open my eyes outdoors or in a bright room. It's one of the worst symptoms.", found: '🚨 Severe photophobia — key red flag for uveitis', isRedFlag: true },
      visual_acuity: { text: "A little blurry in that eye. Not as sharp as normal.", found: 'Mild visual blur (affected eye)', isRedFlag: false },
      floaters:      { text: "Now that you mention it, a few floaters — but less than last time.", found: 'Some floaters (anterior chamber activity possible)', isRedFlag: false },
      flashes:       { text: "No flashing lights. Just the pain and light sensitivity.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "No discharge. Maybe a little watery from the pain.", found: 'No discharge (reflex lacrimation only)', isRedFlag: false },
      trauma:        { text: "No injury. Nothing happened to it.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "I don't wear contact lenses.", found: 'No contact lens use', isRedFlag: false },
      history:       { text: "Yes — I've had this before. About 4 times in the last 3 years. Always the same kind of thing.", found: '⚠️ Recurrent episodes — 4× in 3 years', isRedFlag: true },
      medication:    { text: "Nothing for my eye right now. I take naproxen sometimes for my back pain.", found: 'On NSAIDs for back pain — highly relevant', isRedFlag: false },
      headache:      { text: "A mild headache, mostly from the light sensitivity I think.", found: 'Mild headache (photophobia-related)', isRedFlag: false },
      diplopia:      { text: "No double vision.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "I have ankylosing spondylitis — diagnosed about 4 years ago. My rheumatologist actually told me to watch for eye problems.", found: '🚨 Ankylosing Spondylitis — HLA-B27 — critical systemic link', isRedFlag: true },
      surgical:      { text: "No surgery. Last time they treated it with steroid drops and it cleared up.", found: 'Previously treated with topical steroids — prior uveitis confirmed', isRedFlag: false },
      visual_field:  { text: "My peripheral vision seems okay.", found: 'No visual field complaint', isRedFlag: false },
      default:       { text: "I'm really struggling with the light. Could you be more specific? The pain is making it hard to concentrate.", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-004',
    title: 'Watery & Gritty Eyes',
    category: 'Dry Eye Syndrome',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '8–12 min',
    tags: ['dry-eye','watering','computer','occupational'],
    chiefComplaint: '"My eyes have been watery, gritty, and uncomfortable for about 2 months."',
    synopsis: 'An office worker with bilateral chronic gritty watery eyes worsening at day\'s end — classic dry eye syndrome with paradoxical tearing.',
    learningGoals: ['Recognise paradoxical tearing in dry eye','Identify environmental and occupational risk factors','Understand chronic vs acute ocular presentation'],
    patientProfile: { name: 'Michelle P.', age: 38, gender: 'Female', occupation: 'Data analyst' },
    patientTone: 'tired',
    accentColor: '#14B8A6',
    accentLight: '#CCFBF1',
    orbColor: '#14B8A6',
    correctDiagnosis: 'Dry Eye Syndrome (Evaporative)',
    keyDomains: ['laterality','onset','duration','discharge','pain','redness','visual_acuity','contact_lens','history','medication','systemic'],
    criticalDomains: ['onset','duration','systemic'],
    responses: {
      laterality:    { text: "Both eyes — but my right one is usually a bit worse.", found: 'Bilateral (R > L)', isRedFlag: false },
      onset:         { text: "Gradual onset over about 2 months. I noticed it when I started a high-screen project at work.", found: 'Gradual onset, 2 months (screen use related)', isRedFlag: false },
      duration:      { text: "Two months now. It's slowly getting worse, especially by the end of the work day.", found: 'Duration: 2 months (progressive, worse EOD)', isRedFlag: false },
      pain:          { text: "Gritty — like fine sand in my eyes. Not really painful, just uncomfortable and annoying.", found: 'Foreign body sensation / grittiness', isRedFlag: false },
      redness:       { text: "Mildly red, yes. Nothing dramatic — they just look tired and irritated.", found: 'Mild conjunctival redness', isRedFlag: false },
      photophobia:   { text: "A little sensitive to bright screens. Not severe.", found: 'Mild screen sensitivity', isRedFlag: false },
      visual_acuity: { text: "It fluctuates — sometimes blurry, then it gets better after blinking. It's quite annoying.", found: 'Fluctuating vision — classic dry eye finding', isRedFlag: false },
      floaters:      { text: "No floaters.", found: 'No floaters', isRedFlag: false },
      flashes:       { text: "No flashes.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "Watery — lots of tearing, ironically. My eyes are very watery even though they feel dry. Is that strange?", found: 'Paradoxical tearing — reflex hypersecretion', isRedFlag: false },
      trauma:        { text: "No trauma.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "I used to wear daily soft contacts but stopped 2 months ago because they became too uncomfortable. Glasses now.", found: 'Contact lens intolerance — stopped 2 months ago (correlates with onset)', isRedFlag: false },
      history:       { text: "No major eye problems before. I had hay fever growing up.", found: 'Previous allergic history (hay fever)', isRedFlag: false },
      medication:    { text: "I take antihistamines seasonally for allergies. And I'm on the contraceptive pill.", found: 'Antihistamines + OCP — both can worsen dry eye', isRedFlag: false },
      headache:      { text: "End-of-day headaches sometimes — I think from squinting at screens.", found: 'EOD headaches (screen-related)', isRedFlag: false },
      diplopia:      { text: "No double vision.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "Recently checked for thyroid — borderline underactive, being monitored. Also slightly anaemic.", found: 'Borderline hypothyroidism + anaemia — associated with dry eye', isRedFlag: false },
      surgical:      { text: "No eye surgery.", found: 'No prior ocular surgery', isRedFlag: false },
      visual_field:  { text: "My side vision seems fine.", found: 'No visual field complaint', isRedFlag: false },
      default:       { text: "I'm not sure. Can you ask me something more specific? My eyes are just really bothering me at work.", found: null, isRedFlag: false }
    }
  }
];

// ============================================================
// BADGES
// ============================================================
var BADGES = [
  { id: 'first-case',    name: 'First Steps',           desc: 'Complete your first case',                    color: '#10B981', bg: '#D1FAE5', icon: '🏥', earned: false },
  { id: 'red-flag',      name: 'Red Flag Hunter',        desc: 'Detect 3+ red flags in one session',          color: '#EF4444', bg: '#FEE2E2', icon: '🚩', earned: false },
  { id: 'floaters',      name: 'Flashes & Floaters Pro', desc: 'Identify a retinal emergency pattern',        color: '#5865F2', bg: '#EEF0FE', icon: '✨', earned: false },
  { id: 'contact-lens',  name: 'Lens Safety Awareness',  desc: 'Identify contact lens risk in 2 cases',       color: '#14B8A6', bg: '#CCFBF1', icon: '💧', earned: false },
  { id: 'systemic-link', name: 'Systemic Connector',     desc: 'Link ocular symptoms to systemic disease',    color: '#F59E0B', bg: '#FEF3C7', icon: '🔗', earned: false },
  { id: 'precision',     name: 'Precision Clinician',    desc: 'Achieve 85%+ accuracy in a case',             color: '#8B5CF6', bg: '#EDE9FE', icon: '🎯', earned: false },
  { id: 'perfect',       name: 'Perfect Anamnesis',      desc: 'Cover all critical domains in one case',      color: '#F59E0B', bg: '#FEF9C3', icon: '⭐', earned: false },
  { id: 'streak-3',      name: 'On a Roll',              desc: 'Complete 3 cases in a row',                   color: '#EF4444', bg: '#FEE2E2', icon: '🔥', earned: false },
  { id: 'fast',          name: 'Quick Clinician',        desc: 'Complete a case in under 10 minutes',         color: '#34D399', bg: '#D1FAE5', icon: '⚡', earned: false },
  { id: 'ophtho-expert', name: 'Ophtha Expert',          desc: 'Complete all 4 cases with 70%+ score',        color: '#5865F2', bg: '#EEF0FE', icon: '👁️', earned: false }
];

// ============================================================
// XP LEVELS
// ============================================================
var XP_LEVELS = [
  { level: 1, name: 'Medical Clerk',      min: 0,    max: 100  },
  { level: 2, name: 'Clinical Student',   min: 100,  max: 300  },
  { level: 3, name: 'Clinical Detective', min: 300,  max: 600  },
  { level: 4, name: 'Ophtha Resident',    min: 600,  max: 1000 },
  { level: 5, name: 'Senior Clinician',   min: 1000, max: 1500 },
  { level: 6, name: 'Ophthalmologist',    min: 1500, max: 99999 }
];

// ============================================================
// QUESTION DOMAIN MAP
// ============================================================
var DOMAIN_QUESTIONS = {
  laterality:    { label: 'Laterality',       question: 'Which eye is affected?',                        group: 'Symptom' },
  onset:         { label: 'Onset',            question: 'When did your symptoms start?',                 group: 'Symptom' },
  duration:      { label: 'Duration',         question: 'How long have you had this?',                   group: 'Symptom' },
  pain:          { label: 'Pain',             question: 'Are you experiencing any eye pain?',            group: 'Symptom' },
  redness:       { label: 'Redness',          question: 'Is your eye red?',                              group: 'Symptom' },
  photophobia:   { label: 'Light sensitivity',question: 'Are you sensitive to light?',                   group: 'Red Flags' },
  visual_acuity: { label: 'Vision changes',   question: 'Have you noticed any changes in your vision?', group: 'Red Flags' },
  floaters:      { label: 'Floaters',         question: 'Are you seeing any floaters or spots?',         group: 'Red Flags' },
  flashes:       { label: 'Flashes',          question: 'Are you seeing any flashing lights?',           group: 'Red Flags' },
  visual_field:  { label: 'Visual field',     question: 'Are there any dark areas or shadows in your vision?', group: 'Red Flags' },
  discharge:     { label: 'Discharge',        question: 'Is there any discharge from your eye?',         group: 'Symptom' },
  trauma:        { label: 'Trauma',           question: 'Have you had any injury or trauma to your eye?',group: 'History' },
  contact_lens:  { label: 'Contact lenses',   question: 'Do you wear contact lenses?',                   group: 'History' },
  history:       { label: 'Eye history',      question: 'Have you had any previous eye problems?',       group: 'History' },
  medication:    { label: 'Medications',      question: 'Are you taking any medications or eye drops?',  group: 'History' },
  systemic:      { label: 'General health',   question: 'Do you have any other medical conditions?',     group: 'Systemic' },
  surgical:      { label: 'Surgery history',  question: 'Have you had any eye surgery before?',          group: 'History' },
  headache:      { label: 'Headache',         question: 'Do you have any headache?',                     group: 'Associated' },
  diplopia:      { label: 'Double vision',    question: 'Are you seeing double?',                        group: 'Associated' }
};

// ============================================================
// KEYWORD DETECTION ENGINE
// ============================================================
function detectCategory(text) {
  var lower = text.toLowerCase();
  var rules = [
    { cat: 'visual_field', kws: ['shadow','curtain','dark area','missing area','peripheral','side vision','field','blocked vision','veil'] },
    { cat: 'flashes',      kws: ['flash','flashing','lightning','sparks','streaks of light','photopsia','light in the corner'] },
    { cat: 'floaters',     kws: ['floater','floating','spot','cobweb','dots','moving','black spot','web','flies','cloud'] },
    { cat: 'contact_lens', kws: ['contact lens','contact lenses','contacts','lenses','lens','wear lenses','contacts in'] },
    { cat: 'diplopia',     kws: ['double vision','diplopia','seeing double','two image','two thing'] },
    { cat: 'photophobia',  kws: ['light sensitive','sensitive to light','photophobia','bright light','sunlight','glare','lamp hurts','light hurts','light bother'] },
    { cat: 'visual_acuity',kws: ['vision','visual acuity','blur','blurry','see clearly','sight','can you see','clarity','sharp','acuity','vision loss','visual loss'] },
    { cat: 'discharge',    kws: ['discharge','watery','tearing','mucus','pus','sticky','crusty','weeping','gooey','secretion','leak'] },
    { cat: 'trauma',       kws: ['trauma','injury','hit','accident','foreign body','chemical','splash','struck','hurt your eye','something in your eye','debris'] },
    { cat: 'laterality',   kws: ['which eye','left eye','right eye','both eyes','affected eye','which side','eye is','eyes are','unilateral','bilateral'] },
    { cat: 'pain',         kws: ['pain','hurt','ache','sore','painful','discomfort','stinging','burning','tender','throb','deep pain','aching'] },
    { cat: 'redness',      kws: ['red','redness','pink','bloodshot','injected','reddish'] },
    { cat: 'onset',        kws: ['when did','when start','when begin','when first','how long ago','since when','onset','started','begin','first notice'] },
    { cat: 'duration',     kws: ['how long','duration','days','weeks','hours','how many days','how many weeks','how many hours'] },
    { cat: 'headache',     kws: ['headache','head pain','migraine','head ache','head hurts'] },
    { cat: 'systemic',     kws: ['diabetes','hypertension','blood pressure','thyroid','autoimmune','arthritis','spondylitis','health condition','medical condition','systemic disease','general health','medical history','other condition'] },
    { cat: 'surgical',     kws: ['surgery','operation','operated','procedure','lasik','cataract','laser treatment','implant','previous surgery','eye surgery'] },
    { cat: 'medication',   kws: ['medication','medicine','drug','eye drop','taking any','prescription','tablet','pill','drops'] },
    { cat: 'history',      kws: ['history','previous','before','past','ever had','prior','episode','happened before','had this before','similar before','recur'] }
  ];
  for (var i = 0; i < rules.length; i++) {
    for (var j = 0; j < rules[i].kws.length; j++) {
      if (lower.indexOf(rules[i].kws[j]) !== -1) return rules[i].cat;
    }
  }
  return 'default';
}

// ============================================================
// SCORE COMPUTATION
// ============================================================
function computeScore(session, caseData) {
  var discovered = session.discoveredDomains;
  var total = caseData.keyDomains.length;
  var covered = caseData.keyDomains.filter(function(d) { return discovered.has(d); }).length;
  var criticalTotal = caseData.criticalDomains.length;
  var criticalCovered = caseData.criticalDomains.filter(function(d) { return discovered.has(d); }).length;
  var redFlagsFound = session.redFlagsFound.length;
  var totalRedFlags = Object.values(caseData.responses).filter(function(r) { return r.isRedFlag; }).length;

  var domainScore    = total > 0 ? (covered / total) * 55 : 0;
  var criticalScore  = criticalTotal > 0 ? (criticalCovered / criticalTotal) * 30 : 0;
  var redFlagScore   = totalRedFlags > 0 ? (redFlagsFound / totalRedFlags) * 15 : 0;

  var raw = domainScore + criticalScore + redFlagScore;
  var completeness = total > 0 ? Math.round((covered / total) * 100) : 0;
  var confidence   = Math.min(100, Math.round(raw * 0.9 + (session.questionCount > 5 ? 10 : session.questionCount * 2)));
  var score        = Math.min(100, Math.round(raw));

  return { score, completeness, confidence, criticalCovered, criticalTotal, redFlagsFound, totalRedFlags };
}

// ============================================================
// SUGGESTIONS ENGINE
// ============================================================
function getSuggestions(caseData, discoveredDomains) {
  var priority = ['laterality','onset','flashes','floaters','visual_field','visual_acuity','photophobia','pain','discharge','contact_lens','redness','history','systemic','medication','surgical','trauma','headache','diplopia','duration'];
  return priority
    .filter(function(d) { return caseData.keyDomains.indexOf(d) !== -1 && !discoveredDomains.has(d); })
    .slice(0, 6)
    .map(function(d) { return Object.assign({ id: d }, DOMAIN_QUESTIONS[d]); });
}

// ============================================================
// XP / LEVEL UTILITIES
// ============================================================
function getLevelInfo(xp) {
  var level = XP_LEVELS[0];
  for (var i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].min) { level = XP_LEVELS[i]; break; }
  }
  var progress = level.max < 99999 ? ((xp - level.min) / (level.max - level.min)) * 100 : 100;
  return { level: level.level, name: level.name, progress: Math.min(100, Math.round(progress)), currentXP: xp, nextXP: level.max, levelMin: level.min };
}

// ============================================================
// INITIAL USER PROFILE (localStorage-persisted)
// ============================================================
function loadProfile() {
  var defaults = {
    xp: 280, streak: 3, completedCaseIds: [], totalSessions: 0,
    name: 'Dokter Muda',
    school: '',
    year: '',
    avatarEmoji: '👤',
    avatarColor: '#5865F2',
    favoriteCaseIds: [],
    sessionDates: {},
    dailyCompleted: {},
  };
  try {
    var saved = localStorage.getItem('ophtha_profile');
    if (saved) return Object.assign({}, defaults, JSON.parse(saved));
  } catch(e) {}
  return defaults;
}

function saveProfile(profile) {
  try { localStorage.setItem('ophtha_profile', JSON.stringify(profile)); } catch(e) {}
}

// Date helper
function todayKey() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ============================================================
// RECENT SESSIONS (mock)
// ============================================================
var MOCK_RECENT = [
  { caseId: 'case-001', caseName: 'Red Eye with Discharge',   score: 87, date: '2 days ago',    domains: 8,  total: 10 },
  { caseId: 'case-003', caseName: 'Painful Eye + Photophobia', score: 72, date: '5 days ago',    domains: 7,  total: 12 },
  { caseId: 'case-004', caseName: 'Watery & Gritty Eyes',      score: 65, date: '1 week ago',    domains: 6,  total: 11 }
];
