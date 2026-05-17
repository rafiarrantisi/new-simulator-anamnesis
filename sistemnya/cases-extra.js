// ============================================================
// OphthaSim — Extra Cases (5–10) + Exam Findings for All Cases
// ============================================================

// ── 6 New Cases ───────────────────────────────────────────
CASES.push(
  {
    id: 'case-005',
    title: 'Acute Eye Pain with Halos',
    category: 'Acute Glaucoma',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '15–20 min',
    tags: ['glaucoma','emergency','IOP','halos','pain'],
    chiefComplaint: '"I have the worst headache and my eye is in agony. I can\'t see properly and there are rainbow rings around lights."',
    synopsis: 'An elderly woman with sudden severe eye pain, headache, halos around lights, nausea — classic acute angle closure glaucoma presentation.',
    learningGoals: ['Recognise acute angle closure glaucoma as an emergency','Identify classic triad: pain + halos + reduced vision','Understand risk factors: hyperopia, female sex, age, shallow AC'],
    patientProfile: { name: 'Dorothy L.', age: 67, gender: 'Female', occupation: 'Retired teacher' },
    patientTone: 'pain-affected',
    accentColor: '#8B5CF6',
    accentLight: '#EDE9FE',
    orbColor: '#8B5CF6',
    correctDiagnosis: 'Acute Angle Closure Glaucoma — Ophthalmic Emergency',
    keyDomains: ['laterality','onset','pain','visual_acuity','photophobia','headache','floaters','history','medication','systemic','diplopia','redness'],
    criticalDomains: ['pain','visual_acuity','headache','onset'],
    responses: {
      laterality:    { text: "The left eye is the one in agony, though my right feels a bit off too.", found: 'Left eye primary (bilateral awareness)', isRedFlag: false },
      onset:         { text: "Suddenly, about two hours ago. I was watching TV and it just hit me out of nowhere.", found: '🚨 Sudden onset — 2 hours ago', isRedFlag: true },
      duration:      { text: "Two hours of the worst pain of my life. I nearly called an ambulance.", found: 'Duration: 2 hours (acute, severe)', isRedFlag: false },
      pain:          { text: "Excruciating. A deep, throbbing pain in my eye that radiates up into my head. I've never felt anything like it.", found: '🚨 Severe deep orbital pain + headache', isRedFlag: true },
      redness:       { text: "Yes, my eye looks very red. The white part is red and the front looks cloudy or hazy.", found: 'Marked injection + corneal haziness (oedema)', isRedFlag: false },
      photophobia:   { text: "Yes — I can barely stand any light. It makes the pain worse.", found: 'Significant photophobia', isRedFlag: false },
      visual_acuity: { text: "I can barely see out of that eye — just blurry shapes. And there are rainbow halos around any light I look at.", found: '🚨 Severely reduced vision + rainbow halos — classic AACG', isRedFlag: true },
      floaters:      { text: "No floaters. The vision is just blurry and there are halos.", found: 'No floaters — halos only', isRedFlag: false },
      flashes:       { text: "No flashing lights. Just the halos around lights.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "No discharge from the eye.", found: 'No discharge', isRedFlag: false },
      trauma:        { text: "No injury. Nothing happened to it.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "No, I don't wear contact lenses. I wear reading glasses.", found: 'No contact lens use (hyperopic glasses user)', isRedFlag: false },
      history:       { text: "Nothing specific. I've always needed reading glasses — very long-sighted apparently.", found: '⚠️ Long-standing hyperopia — major AACG risk factor', isRedFlag: true },
      medication:    { text: "Blood pressure tablets and I recently started some tablets for a cold — antihistamines from the pharmacist.", found: '⚠️ Recent antihistamine use — can precipitate AACG', isRedFlag: true },
      headache:      { text: "Terrible headache — on the left side, very severe. I also feel nauseous and vomited once.", found: '🚨 Severe headache + nausea/vomiting — AACG triad complete', isRedFlag: true },
      diplopia:      { text: "No double vision, just extremely blurry.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "High blood pressure, well controlled. Nothing else significant.", found: 'Hypertension (controlled)', isRedFlag: false },
      surgical:      { text: "I had a hip replacement two years ago. No eye surgery ever.", found: 'No prior ocular surgery', isRedFlag: false },
      visual_field:  { text: "I can barely see anything out of that eye. The whole vision is bad, not just one area.", found: 'Diffusely reduced vision (not field defect)', isRedFlag: false },
      default:       { text: "I'm in agony. Please help — is this serious?", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-006',
    title: 'Sudden Painless Vision Loss',
    category: 'Retinal Vascular',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '15–20 min',
    tags: ['CRVO','vascular','vision-loss','diabetes','emergency'],
    chiefComplaint: '"I woke up this morning and my left eye vision was just gone. No pain at all."',
    synopsis: 'A diabetic hypertensive male with acute painless unilateral visual loss on waking — central retinal vein occlusion.',
    learningGoals: ['Recognise CRVO presentation','Identify vascular risk factors as key history','Understand acute painless vision loss differential'],
    patientProfile: { name: 'Victor O.', age: 61, gender: 'Male', occupation: 'Accountant' },
    patientTone: 'worried',
    accentColor: '#DC2626',
    accentLight: '#FEE2E2',
    orbColor: '#DC2626',
    correctDiagnosis: 'Central Retinal Vein Occlusion (CRVO)',
    keyDomains: ['laterality','onset','pain','visual_acuity','floaters','flashes','visual_field','history','systemic','medication','surgical','redness'],
    criticalDomains: ['pain','visual_acuity','onset','systemic'],
    responses: {
      laterality:    { text: "Left eye. The right eye is completely normal.", found: 'Left eye affected', isRedFlag: false },
      onset:         { text: "I woke up this morning and it was already like this. So it happened overnight while I was sleeping.", found: '🚨 Acute onset on waking — overnight occlusion', isRedFlag: true },
      duration:      { text: "Since I woke up about 4 hours ago. It hasn't changed at all.", found: 'Duration: 4 hours (stable, not improving)', isRedFlag: false },
      pain:          { text: "No pain whatsoever. That's what worries me — it just happened with no warning.", found: 'PAINLESS — white quiet eye (key feature)', isRedFlag: false },
      redness:       { text: "No, my eye doesn't look red. It looks normal from outside.", found: 'No redness — white quiet eye', isRedFlag: false },
      photophobia:   { text: "No, no light sensitivity.", found: 'No photophobia', isRedFlag: false },
      visual_acuity: { text: "I can barely see — just vague shapes and shadows. It's almost like I'm looking through a frosted glass.", found: '🚨 Severely reduced VA — count fingers or worse', isRedFlag: true },
      floaters:      { text: "Yes, I notice some dark spots in the vision but it's hard to tell from the overall blurriness.", found: 'Some floaters (haemorrhage-related)', isRedFlag: false },
      flashes:       { text: "No flashing lights.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "No discharge at all.", found: 'No discharge', isRedFlag: false },
      trauma:        { text: "No injury or trauma.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "I wear glasses for distance. No contacts.", found: 'Spectacle correction (distance)', isRedFlag: false },
      history:       { text: "No previous eye problems. First time this has ever happened.", found: 'First episode — no prior ocular history', isRedFlag: false },
      medication:    { text: "Metformin for diabetes, amlodipine for blood pressure, and a statin — rosuvastatin.", found: '⚠️ On DM + HTN + statin medications — high vascular risk profile', isRedFlag: true },
      headache:      { text: "No headache at all.", found: 'No headache', isRedFlag: false },
      diplopia:      { text: "No double vision.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "Type 2 diabetes for 8 years, poorly controlled recently — my last HbA1c was 9.2%. Also hypertension and high cholesterol.", found: '🚨 Poorly controlled T2DM (HbA1c 9.2%) + HTN + hyperlipidaemia — critical risk factors', isRedFlag: true },
      surgical:      { text: "No eye surgery ever. I had a cardiac stent put in 3 years ago.", found: '⚠️ Previous coronary stent — significant cardiovascular history', isRedFlag: true },
      visual_field:  { text: "The whole vision is bad — I can't make out anything clearly in that eye.", found: 'Diffuse visual loss (central + peripheral)', isRedFlag: false },
      default:       { text: "I'm very worried. My wife made me come straight here.", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-007',
    title: 'Itchy Watery Eyes — Both',
    category: 'Allergic Conjunctivitis',
    difficulty: 'Easy',
    difficultyLevel: 1,
    estimatedTime: '8–10 min',
    tags: ['allergy','conjunctivitis','seasonal','bilateral'],
    chiefComplaint: '"Both my eyes have been incredibly itchy and watery for about a week. It happens every year around this time."',
    synopsis: 'A young adult with bilateral seasonal itchy watery eyes — classic allergic conjunctivitis with a clear seasonal and atopic history.',
    learningGoals: ['Recognise allergic conjunctivitis pattern','Identify seasonal and atopic triggers','Differentiate from infective and dry eye causes'],
    patientProfile: { name: 'Aisha R.', age: 22, gender: 'Female', occupation: 'Pharmacy student' },
    patientTone: 'cooperative',
    accentColor: '#34D399',
    accentLight: '#D1FAE5',
    orbColor: '#34D399',
    correctDiagnosis: 'Seasonal Allergic Conjunctivitis',
    keyDomains: ['laterality','onset','pain','redness','discharge','photophobia','visual_acuity','history','medication','systemic','contact_lens','floaters'],
    criticalDomains: ['history','systemic','onset'],
    responses: {
      laterality:    { text: "Both eyes — equally bad in both.", found: 'Bilateral symmetric involvement', isRedFlag: false },
      onset:         { text: "About a week ago, right when the pollen season started. Same as every year.", found: 'Onset 1 week ago (seasonal pattern)', isRedFlag: false },
      duration:      { text: "A week now. It usually lasts 4–6 weeks until the season is over.", found: 'Duration: 1 week (seasonal), usually 4–6 weeks', isRedFlag: false },
      pain:          { text: "No pain, just incredibly itchy. Like I want to rub my eyes constantly — which I know I shouldn't.", found: 'Intense pruritus (NO pain) — hallmark of allergy', isRedFlag: false },
      redness:       { text: "Yes, both eyes look pink and irritated. Not dramatically red though.", found: 'Mild-moderate bilateral redness', isRedFlag: false },
      photophobia:   { text: "Not really sensitive to light. Just the itching and watering.", found: 'No significant photophobia', isRedFlag: false },
      visual_acuity: { text: "Vision is fine when my eyes aren't watering. No vision problems.", found: 'Normal VA (transiently blurred only from tearing)', isRedFlag: false },
      floaters:      { text: "No floaters.", found: 'No floaters', isRedFlag: false },
      flashes:       { text: "No flashing lights.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "Lots of watery discharge — clear, not sticky or yellow. Very watery.", found: 'Clear watery discharge (not mucopurulent) — allergic pattern', isRedFlag: false },
      trauma:        { text: "No injury.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "I wear daily disposable contacts but I've stopped during this episode because they're too uncomfortable.", found: 'CL intolerance during episode (common in allergic CJ)', isRedFlag: false },
      history:       { text: "I get this every spring and autumn. I've had hay fever since I was a teenager.", found: 'Recurrent seasonal pattern + known hay fever — strong allergic history', isRedFlag: false },
      medication:    { text: "I use loratadine tablets when it gets bad. Sometimes some OTC antihistamine eye drops.", found: 'Self-medicating with systemic + topical antihistamines', isRedFlag: false },
      headache:      { text: "I get headaches from the congestion but not from the eye itself.", found: 'Headache from nasal congestion (not ocular)', isRedFlag: false },
      diplopia:      { text: "No double vision.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "I have asthma and eczema as well as the hay fever. All atopic conditions.", found: 'Atopic triad: asthma + eczema + allergic rhinitis', isRedFlag: false },
      surgical:      { text: "No eye surgery.", found: 'No prior ocular surgery', isRedFlag: false },
      visual_field:  { text: "My peripheral vision is fine.", found: 'No visual field complaint', isRedFlag: false },
      default:       { text: "I'm pretty sure it's allergy — I just need to confirm and get something that works better.", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-008',
    title: 'Severe Eye Pain + White Spot',
    category: 'Corneal Ulcer',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '12–15 min',
    tags: ['keratitis','corneal-ulcer','contact-lens','emergency'],
    chiefComplaint: '"My eye is extremely painful and I can see a white spot on my eye when I look in the mirror."',
    synopsis: 'A contact lens wearer with severe eye pain, photophobia, and a visible white corneal infiltrate — bacterial keratitis requiring urgent treatment.',
    learningGoals: ['Recognise bacterial keratitis presentation','Understand contact lens as major risk factor','Know when corneal ulcer requires urgent ophthalmology referral'],
    patientProfile: { name: 'Leon H.', age: 28, gender: 'Male', occupation: 'Software developer' },
    patientTone: 'pain-affected',
    accentColor: '#F59E0B',
    accentLight: '#FEF3C7',
    orbColor: '#F59E0B',
    correctDiagnosis: 'Bacterial Keratitis (Corneal Ulcer) — Urgent Referral',
    keyDomains: ['laterality','onset','pain','photophobia','redness','visual_acuity','discharge','contact_lens','history','trauma','medication','systemic'],
    criticalDomains: ['contact_lens','pain','photophobia','visual_acuity'],
    responses: {
      laterality:    { text: "Right eye. Only the right one — the left is completely fine.", found: 'Right eye only', isRedFlag: false },
      onset:         { text: "Started yesterday evening, got dramatically worse overnight. This morning I could barely open it.", found: '⚠️ Rapid progression overnight', isRedFlag: true },
      duration:      { text: "About 18 hours, getting rapidly worse.", found: 'Duration: 18h (rapid progression)', isRedFlag: false },
      pain:          { text: "The worst eye pain I've ever had. It's like a hot needle in my eye. I can't open it in any light.", found: '🚨 Severe eye pain — foreign body/needle sensation', isRedFlag: true },
      redness:       { text: "Bright red around the coloured part. I also noticed a whitish spot on the coloured part of my eye this morning.", found: '🚨 Ciliary injection + visible white corneal infiltrate', isRedFlag: true },
      photophobia:   { text: "Extreme — I can't tolerate any light at all. I came here wearing sunglasses.", found: '🚨 Severe photophobia (with sunglasses)', isRedFlag: true },
      visual_acuity: { text: "Very blurry in that eye. Significantly worse than normal.", found: '⚠️ Reduced VA in affected eye', isRedFlag: true },
      floaters:      { text: "No floaters.", found: 'No floaters', isRedFlag: false },
      flashes:       { text: "No flashing lights.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "Some discharge — yellowish and sticky. There was crust when I woke up.", found: 'Mucopurulent discharge (bacterial pattern)', isRedFlag: false },
      trauma:        { text: "No injury. I just noticed something was very wrong when I woke up.", found: 'No trauma history', isRedFlag: false },
      contact_lens:  { text: "Yes, I wear monthly extended-wear contacts. I admit I sometimes sleep in them and don't always clean them properly.", found: '🚨 Monthly EW contact lenses + poor compliance — highest risk factor for bacterial keratitis', isRedFlag: true },
      history:       { text: "I had a minor eye infection about a year ago — red eye with discharge — treated with drops. Nothing like this.", found: 'Previous mild conjunctivitis (treated)', isRedFlag: false },
      medication:    { text: "Nothing currently. I had some old chloramphenicol drops from last time but I've been using them — they don't seem to be helping.", found: '⚠️ Self-medicating with old antibiotic drops (inappropriate)', isRedFlag: true },
      headache:      { text: "Mild headache from the pain and light sensitivity.", found: 'Secondary headache (from pain/photophobia)', isRedFlag: false },
      diplopia:      { text: "No double vision.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "Otherwise healthy. No medical conditions.", found: 'No relevant systemic disease', isRedFlag: false },
      surgical:      { text: "No eye surgery.", found: 'No prior ocular surgery', isRedFlag: false },
      visual_field:  { text: "I can't really tell — the pain and blurring make it hard to assess.", found: 'Unable to assess VF (pain/blur)', isRedFlag: false },
      default:       { text: "It's really serious right? The white spot scared me.", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-009',
    title: 'Vision Loss + Pain on Eye Movement',
    category: 'Optic Neuritis',
    difficulty: 'Hard',
    difficultyLevel: 3,
    estimatedTime: '18–22 min',
    tags: ['optic-neuritis','demyelination','MS','vision-loss','young'],
    chiefComplaint: '"My right eye vision went blurry over a few days and it hurts when I move my eye."',
    synopsis: 'A young woman with subacute unilateral visual loss, pain on eye movement, and reduced colour vision — optic neuritis with possible demyelinating aetiology.',
    learningGoals: ['Recognise optic neuritis presentation','Identify pain on eye movement as key diagnostic clue','Understand association with multiple sclerosis'],
    patientProfile: { name: 'Priya S.', age: 27, gender: 'Female', occupation: 'Junior doctor' },
    patientTone: 'worried',
    accentColor: '#38BDF8',
    accentLight: '#E0F2FE',
    orbColor: '#38BDF8',
    correctDiagnosis: 'Optic Neuritis — Demyelinating Disease Workup Required',
    keyDomains: ['laterality','onset','pain','visual_acuity','visual_field','redness','photophobia','history','systemic','medication','floaters','diplopia'],
    criticalDomains: ['pain','visual_acuity','onset','systemic'],
    responses: {
      laterality:    { text: "Right eye. The left eye is completely normal.", found: 'Right eye affected (unilateral)', isRedFlag: false },
      onset:         { text: "Gradually over about 3–4 days. It wasn't sudden — it got progressively worse each day.", found: 'Subacute onset over 3–4 days (demyelinating pattern)', isRedFlag: false },
      duration:      { text: "About 4 days now. It seems to have plateaued but hasn't improved.", found: 'Duration: 4 days (not improving)', isRedFlag: false },
      pain:          { text: "Yes — but interestingly, it only hurts when I move my eye. It's a dull aching behind the eye with movement. Not when it's still.", found: '🚨 Pain on eye movement (retrobulbar) — KEY optic neuritis sign', isRedFlag: true },
      redness:       { text: "No, my eye doesn't look red at all.", found: 'No redness — white quiet eye', isRedFlag: false },
      photophobia:   { text: "I haven't noticed particular light sensitivity. Colours do seem washed out in that eye though.", found: '⚠️ Reduced colour saturation (dyschromatopsia) — optic nerve sign', isRedFlag: true },
      visual_acuity: { text: "Significantly blurred in the right eye. It was fine and then just got progressively dimmer and blurry over days.", found: '⚠️ Progressive subacute VA loss — optic nerve pathology', isRedFlag: true },
      floaters:      { text: "No floaters.", found: 'No floaters', isRedFlag: false },
      flashes:       { text: "No flashing lights.", found: 'No flashes', isRedFlag: false },
      discharge:     { text: "No discharge.", found: 'No discharge', isRedFlag: false },
      trauma:        { text: "No trauma.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "I wear glasses. No contacts.", found: 'No contact lens use', isRedFlag: false },
      history:       { text: "About 6 months ago I had an episode of tingling and numbness in my left arm that lasted 2 weeks. My GP said to monitor it. And I had one episode of double vision that resolved on its own last year.", found: '🚨 Previous neurological episodes — demyelinating disease (possible MS)', isRedFlag: true },
      medication:    { text: "Nothing regular. I took some ibuprofen for the eye pain but it didn't help much.", found: 'NSAIDs unhelpful (consistent with optic neuritis)', isRedFlag: false },
      headache:      { text: "Mild headache sometimes, mostly associated with the eye pain.", found: 'Mild associated headache', isRedFlag: false },
      diplopia:      { text: "I had an episode of double vision about a year ago that resolved. Nothing now.", found: '⚠️ Previous diplopia episode — possible prior demyelinating event', isRedFlag: true },
      systemic:      { text: "Generally healthy. No known medical conditions. Though I've wondered about the arm tingling episode — I googled it but I'm trying not to self-diagnose.", found: '⚠️ Unexplained neurological symptoms — MS red flag', isRedFlag: true },
      surgical:      { text: "No surgery ever.", found: 'No prior surgery', isRedFlag: false },
      visual_field:  { text: "I can't see as clearly — it feels like there's a dim area in the centre of my vision in that eye.", found: '⚠️ Central scotoma (reduced central vision) — optic nerve pattern', isRedFlag: true },
      default:       { text: "I've been worried about this. I tried not to look it up but I have a feeling it might be something serious.", found: null, isRedFlag: false }
    }
  },
  {
    id: 'case-010',
    title: 'Blurry Vision + Routine Diabetic Review',
    category: 'Diabetic Eye Disease',
    difficulty: 'Medium',
    difficultyLevel: 2,
    estimatedTime: '12–18 min',
    tags: ['diabetic-retinopathy','diabetes','blur','chronic'],
    chiefComplaint: '"My vision has been getting gradually blurrier over the past few months. I\'m a diabetic and worried it\'s my eyes."',
    synopsis: 'A long-standing type 2 diabetic with gradual bilateral visual decline — systematic history reveals poor glycaemic control and hypertension, suggesting diabetic retinopathy.',
    learningGoals: ['Systematic diabetic eye history','Identify risk factors for diabetic retinopathy progression','Understand relationship between glycaemic control and ocular complications'],
    patientProfile: { name: 'Bernard K.', age: 56, gender: 'Male', occupation: 'Bus driver' },
    patientTone: 'tired',
    accentColor: '#F59E0B',
    accentLight: '#FEF3C7',
    orbColor: '#F59E0B',
    correctDiagnosis: 'Diabetic Maculopathy / Non-Proliferative Diabetic Retinopathy',
    keyDomains: ['laterality','onset','visual_acuity','floaters','pain','redness','history','systemic','medication','surgical','visual_field','diplopia'],
    criticalDomains: ['systemic','visual_acuity','history'],
    responses: {
      laterality:    { text: "Both eyes, but the right is worse. It's like everything is slightly out of focus.", found: 'Bilateral (R > L)', isRedFlag: false },
      onset:         { text: "Gradual — over the past 4–6 months. It's been so slow I almost didn't notice at first.", found: 'Gradual onset over 4–6 months (chronic)', isRedFlag: false },
      duration:      { text: "About 6 months now. Getting slowly worse.", found: 'Duration: 6 months (progressive)', isRedFlag: false },
      pain:          { text: "No pain whatsoever. Just the blurry vision.", found: 'No pain — painless bilateral blur', isRedFlag: false },
      redness:       { text: "No, my eyes don't look red.", found: 'No redness', isRedFlag: false },
      photophobia:   { text: "Not really sensitive to light.", found: 'No photophobia', isRedFlag: false },
      visual_acuity: { text: "Getting progressively worse. I'm struggling to read and I've had to lower the brightness on my phone. Reading at work has become difficult.", found: '⚠️ Progressive bilateral VA loss — affecting daily life', isRedFlag: true },
      floaters:      { text: "Some dark spots occasionally. I mentioned it to my GP but they said it could be normal.", found: '⚠️ Occasional floaters — could represent haemorrhage', isRedFlag: true },
      flashes:       { text: "Occasionally. Not often.", found: 'Occasional flashes (DR-related vitreous traction?)', isRedFlag: false },
      discharge:     { text: "No discharge.", found: 'No discharge', isRedFlag: false },
      trauma:        { text: "No injury.", found: 'No trauma', isRedFlag: false },
      contact_lens:  { text: "No contacts. Just glasses.", found: 'Spectacle correction', isRedFlag: false },
      history:       { text: "I have type 2 diabetes for 14 years. I've been told before that my eyes need monitoring but I admit I haven't been for my diabetic eye check in about 3 years.", found: '🚨 T2DM 14 years + missed diabetic eye screenings for 3 years', isRedFlag: true },
      medication:    { text: "Insulin twice a day, metformin, lisinopril, atorvastatin. My HbA1c was 10.8% at my last check — not great. I've been under a lot of stress.", found: '🚨 HbA1c 10.8% — very poor control — major DR risk factor', isRedFlag: true },
      headache:      { text: "Occasionally, usually from the visual strain.", found: 'Occasional headache from visual strain', isRedFlag: false },
      diplopia:      { text: "No double vision.", found: 'No diplopia', isRedFlag: false },
      systemic:      { text: "Diabetes, high blood pressure, high cholesterol. And I'm quite overweight — my BMI is about 34.", found: '⚠️ Multiple vascular risk factors (DM + HTN + dyslipidaemia + obesity)', isRedFlag: true },
      surgical:      { text: "No eye surgery. I had a knee replacement 2 years ago.", found: 'No prior ocular surgery', isRedFlag: false },
      visual_field:  { text: "I haven't noticed missing areas — just general blur everywhere.", found: 'Diffuse blur (no specific field defect noted)', isRedFlag: false },
      default:       { text: "I know it's probably my diabetes. I just keep putting it off coming here.", found: null, isRedFlag: false }
    }
  }
);

// ============================================================
// EXAM FINDINGS — All 10 cases
// ============================================================
var EXAM_FINDINGS = {
  'case-001': {
    fundoscopyType: 'normal',
    visualAcuity: { OD: '6/6', OS: '6/9 (clears with blinking)' },
    anteriorSegment: {
      lids: 'Right: mild lid oedema',
      conjunctiva: 'Right: diffuse conjunctival injection + copious mucopurulent discharge',
      cornea: 'Right: mild superficial punctate keratopathy (SPK). No infiltrate.',
      anteriorChamber: 'Right: deep and quiet. No cells or flare.',
      iris: 'Normal in both eyes',
      lens: 'Clear bilaterally',
      pupil: 'Equal, round, reactive bilaterally'
    },
    IOP: { OD: '14 mmHg', OS: '13 mmHg' },
    specialTests: ['Corneal scrape: indicated if no improvement or CL-related', 'Staining: Rose Bengal may show conjunctival staining'],
    diagnosis_options: ['Bacterial Conjunctivitis', 'Viral Conjunctivitis', 'Allergic Conjunctivitis', 'Contact Lens Keratitis'],
    correct_diagnosis_index: 0
  },
  'case-002': {
    fundoscopyType: 'retinal-detachment',
    visualAcuity: { OD: '6/6', OS: 'CF (counting fingers at 1m)' },
    anteriorSegment: {
      lids: 'Normal bilaterally',
      conjunctiva: 'White and quiet bilaterally',
      cornea: 'Clear bilaterally',
      anteriorChamber: 'Deep and quiet bilaterally',
      iris: 'Normal pattern bilaterally',
      lens: 'Nuclear sclerosis grade 1 bilaterally (age-related)',
      pupil: 'Right: RAPD positive in left eye (afferent defect)'
    },
    IOP: { OD: '14 mmHg', OS: '8 mmHg (lower IOP can indicate RD)' },
    specialTests: ['Dilated fundoscopy: ESSENTIAL — shows inferotemporal bullous RD with visible break', 'Scleral indentation if available'],
    diagnosis_options: ['Retinal Detachment', 'Vitreous Haemorrhage', 'Posterior Vitreous Detachment', 'Macular Degeneration'],
    correct_diagnosis_index: 0
  },
  'case-003': {
    fundoscopyType: 'uveitis',
    visualAcuity: { OD: '6/6', OS: '6/18' },
    anteriorSegment: {
      lids: 'Normal bilaterally',
      conjunctiva: 'Left: perilimbal (ciliary) injection',
      cornea: 'Left: fine keratic precipitates (KPs) on inferior endothelium — "mutton-fat" KPs absent',
      anteriorChamber: 'Left: cells 2+, flare 1+. Right: clear.',
      iris: 'Left: posterior synechiae — irregular pupil shape',
      lens: 'Left: early posterior subcapsular cataract (steroid/inflammation related)',
      pupil: 'Left: irregular, sluggish. Right: normal.'
    },
    IOP: { OD: '14 mmHg', OS: '10 mmHg (low — due to ciliary body inflammation)' },
    specialTests: ['HLA-B27 typing: strongly recommended given history', 'Sacroiliac joint X-ray if AS not previously confirmed'],
    diagnosis_options: ['Anterior Uveitis (HLA-B27 associated)', 'Acute Angle Closure Glaucoma', 'Keratitis', 'Scleritis'],
    correct_diagnosis_index: 0
  },
  'case-004': {
    fundoscopyType: 'normal',
    visualAcuity: { OD: '6/7.5 (fluctuating)', OS: '6/9 (fluctuating)' },
    anteriorSegment: {
      lids: 'Mild meibomian gland dysfunction (MGD) — lid margin irregular',
      conjunctiva: 'Bilateral mild injection. Mild conjunctival laxity.',
      cornea: 'Bilateral SPK — inferior 1/3. Rose Bengal staining positive.',
      anteriorChamber: 'Deep and quiet bilaterally',
      iris: 'Normal',
      lens: 'Clear',
      pupil: 'Normal bilaterally'
    },
    IOP: { OD: '13 mmHg', OS: '12 mmHg' },
    specialTests: ['TBUT (tear break-up time): 4 seconds (normal >10s)', "Schirmer's test: 7mm at 5 min (borderline)"],
    diagnosis_options: ['Dry Eye Syndrome', 'Allergic Conjunctivitis', 'Blepharitis', 'Conjunctivochalasis'],
    correct_diagnosis_index: 0
  },
  'case-005': {
    fundoscopyType: 'glaucoma',
    visualAcuity: { OD: '6/6', OS: 'LP (light perception only)' },
    anteriorSegment: {
      lids: 'Normal',
      conjunctiva: 'Left: severe ciliary injection',
      cornea: 'Left: oedematous — microcystic epithelial oedema. Hazy, reduced clarity.',
      anteriorChamber: 'Left: very shallow (Van Herick grade 1). Right: deep.',
      iris: 'Left: mid-dilated, oval, FIXED pupil — non-reactive',
      lens: 'Not clearly visible left due to corneal haze',
      pupil: 'Left: mid-dilated (5mm), oval, non-reactive. Right: normal reactive.'
    },
    IOP: { OD: '18 mmHg', OS: '62 mmHg 🚨 EMERGENCY' },
    specialTests: ['Gonioscopy: closed angle (360°) in left eye when cornea clears', 'Ultrasound biomicroscopy if cornea too hazy'],
    diagnosis_options: ['Acute Angle Closure Glaucoma', 'Acute Anterior Uveitis', 'Corneal Ulcer', 'Migraine with Visual Aura'],
    correct_diagnosis_index: 0
  },
  'case-006': {
    fundoscopyType: 'crvo',
    visualAcuity: { OD: '6/6', OS: '6/120' },
    anteriorSegment: {
      lids: 'Normal',
      conjunctiva: 'White and quiet bilaterally',
      cornea: 'Clear bilaterally',
      anteriorChamber: 'Deep and quiet',
      iris: 'Normal bilaterally',
      lens: 'Nuclear sclerosis grade 2 (bilateral, age-related)',
      pupil: 'Right: RAPD in left eye'
    },
    IOP: { OD: '15 mmHg', OS: '14 mmHg' },
    specialTests: ['FFA (fluorescein angiography): will confirm CRVO, show ischaemia extent', 'OCT macula: macular oedema assessment'],
    diagnosis_options: ['Central Retinal Vein Occlusion (CRVO)', 'Central Retinal Artery Occlusion (CRAO)', 'Vitreous Haemorrhage', 'Ischaemic Optic Neuropathy'],
    correct_diagnosis_index: 0
  },
  'case-007': {
    fundoscopyType: 'normal',
    visualAcuity: { OD: '6/6', OS: '6/6' },
    anteriorSegment: {
      lids: 'Upper tarsal papillae (bilateral) — moderate',
      conjunctiva: 'Bilateral diffuse injection + papillary reaction on tarsal conjunctiva',
      cornea: 'Clear bilaterally. No infiltrate or staining.',
      anteriorChamber: 'Deep and quiet',
      iris: 'Normal',
      lens: 'Clear',
      pupil: 'Normal bilaterally'
    },
    IOP: { OD: '13 mmHg', OS: '13 mmHg' },
    specialTests: ['Skin prick testing / RAST: for specific allergen identification', 'No corneal involvement — antibiotic drops not indicated'],
    diagnosis_options: ['Seasonal Allergic Conjunctivitis', 'Viral Conjunctivitis', 'Bacterial Conjunctivitis', 'Dry Eye Syndrome'],
    correct_diagnosis_index: 0
  },
  'case-008': {
    fundoscopyType: 'normal',
    visualAcuity: { OD: 'CF 1m (affected)', OS: '6/6' },
    anteriorSegment: {
      lids: 'Right: moderate lid oedema and blepharospasm',
      conjunctiva: 'Right: severe ciliary injection + chemosis',
      cornea: 'Right: 4×3mm dense white infiltrate central with overlying epithelial defect. Mucopurulent exudate. Hypopyon 1mm.',
      anteriorChamber: 'Right: hypopyon 1mm (sterile pus — immune response)',
      iris: 'Limited view due to hypopyon',
      lens: 'Limited view',
      pupil: 'Right: limited view. Left: normal.'
    },
    IOP: { OD: 'Not measured (pain)', OS: '14 mmHg' },
    specialTests: ['Corneal scrape: URGENT — for culture and sensitivity', 'Contact lens case swab: essential for culture'],
    diagnosis_options: ['Bacterial Keratitis (Corneal Ulcer)', 'Acanthamoeba Keratitis', 'Viral Keratitis (HSV)', 'Fungal Keratitis'],
    correct_diagnosis_index: 0
  },
  'case-009': {
    fundoscopyType: 'optic-neuritis',
    visualAcuity: { OD: '6/6', OS: '6/60' },
    anteriorSegment: {
      lids: 'Normal',
      conjunctiva: 'White and quiet',
      cornea: 'Clear',
      anteriorChamber: 'Deep and quiet',
      iris: 'Normal',
      lens: 'Clear',
      pupil: 'Right: RAPD positive (swinging torch test positive) — afferent defect'
    },
    IOP: { OD: '14 mmHg', OS: '13 mmHg' },
    specialTests: ['Colour vision (Ishihara): OD 12/12, OS 2/12 — severely impaired', 'Contrast sensitivity: reduced right eye', 'MRI brain/orbits with contrast: ESSENTIAL'],
    diagnosis_options: ['Optic Neuritis (Demyelinating)', 'Ischaemic Optic Neuropathy', 'Compressive Optic Neuropathy', 'Leber\'s Hereditary Optic Neuropathy'],
    correct_diagnosis_index: 0
  },
  'case-010': {
    fundoscopyType: 'diabetic',
    visualAcuity: { OD: '6/18', OS: '6/12' },
    anteriorSegment: {
      lids: 'Normal',
      conjunctiva: 'White and quiet',
      cornea: 'Clear',
      anteriorChamber: 'Deep and quiet',
      iris: 'Normal — no rubeosis',
      lens: 'Bilateral nuclear sclerosis grade 2',
      pupil: 'Normal bilaterally'
    },
    IOP: { OD: '18 mmHg', OS: '17 mmHg' },
    specialTests: ['OCT macula: bilateral macular oedema (more right)', 'FFA: microaneurysms, dot/blot haemorrhages, areas of capillary non-perfusion'],
    diagnosis_options: ['Diabetic Maculopathy / NPDR', 'Age-Related Macular Degeneration', 'Hypertensive Retinopathy', 'Branch Retinal Vein Occlusion'],
    correct_diagnosis_index: 0
  }
};

// ============================================================
// CUSTOM CASES (from localStorage)
// ============================================================
(function loadCustomCases() {
  try {
    var saved = localStorage.getItem('ophtha_custom_cases');
    if (saved) {
      var customs = JSON.parse(saved);
      customs.forEach(function(c) {
        if (!CASES.find(function(x) { return x.id === c.id; })) {
          CASES.push(c);
        }
      });
    }
  } catch(e) {}
})();

function saveCustomCase(caseData) {
  try {
    var saved = localStorage.getItem('ophtha_custom_cases');
    var customs = saved ? JSON.parse(saved) : [];
    var existing = customs.findIndex(function(c) { return c.id === caseData.id; });
    if (existing >= 0) customs[existing] = caseData;
    else customs.push(caseData);
    localStorage.setItem('ophtha_custom_cases', JSON.stringify(customs));
    if (!CASES.find(function(c) { return c.id === caseData.id; })) CASES.push(caseData);
  } catch(e) {}
}

function deleteCustomCase(id) {
  try {
    var saved = localStorage.getItem('ophtha_custom_cases');
    if (!saved) return;
    var customs = JSON.parse(saved).filter(function(c) { return c.id !== id; });
    localStorage.setItem('ophtha_custom_cases', JSON.stringify(customs));
    var idx = CASES.findIndex(function(c) { return c.id === id; });
    if (idx >= 0) CASES.splice(idx, 1);
  } catch(e) {}
}
