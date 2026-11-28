/* Qualities — content & demo data.
   Everything here is SAMPLE data for the pitch demo. Replace via the admin panel / Supabase. */
window.Q = window.Q || {};

Q.TODAY = new Date('2026-11-25T10:00:00+02:00'); // demo "today" so the journey looks alive

Q.OMAR = [
  { k: 'O', ar: 'التفاؤل', en: 'Optimism', c: '#F39A1E',
    dAr: 'أن ترى الخير القادم وتعمل له، حتى في الأيام الصعبة.', dEn: 'Seeing the good ahead and working toward it, even on hard days.' },
  { k: 'M', ar: 'التدبّر والعبادة', en: 'Mindfulness', c: '#1E6B3C',
    dAr: 'أن تعيش لحظتك مع الله: صلاة بحضور، وتفكّر في خلقه.', dEn: 'Living the moment with Allah: present prayer and reflection on His creation.' },
  { k: 'A', ar: 'الإيثار', en: 'Altruism', c: '#2B7BB9',
    dAr: 'أن تقدّم غيرك على نفسك، فتسعد حين تُسعِده.', dEn: 'Putting others first, and finding joy in their joy.' },
  { k: 'R', ar: 'العرفان والتقدير', en: 'Recognition', c: '#8A4FBF',
    dAr: 'أن تلاحظ النِّعم وتشكر أصحاب الفضل عليك.', dEn: 'Noticing blessings and thanking those who did you good.' },
  { k: 'FLOW', ar: 'الشغف', en: 'Flow', c: '#D2453B',
    dAr: 'أن تنغمس في عمل تحبه حتى تنسى الوقت.', dEn: 'Being so absorbed in work you love that you lose track of time.' }
];

Q.VIRTUES = [
  { id: 'ihsan', ar: 'الإحسان', people: 'المحسنون', en: 'Excellence (Ihsan)', ayah: '2:195',
    lugha: 'الإتقان وفعلُ ما هو حسن.', istilah: 'أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك؛ ويشمل الإحسان إلى الخلق بالقول والعمل.' },
  { id: 'taqwa', ar: 'التقوى', people: 'المتقون', en: 'God-consciousness', ayah: '3:76',
    lugha: 'الوقاية والحذر.', istilah: 'أن تجعل بينك وبين ما يُغضب الله وقاية، بفعل أمره واجتناب نهيه.' },
  { id: 'qist', ar: 'القسط', people: 'المقسطون', en: 'Justice', ayah: '60:8',
    lugha: 'العدل.', istilah: 'أن تعطي كل ذي حق حقه، مع القريب والبعيد.' },
  { id: 'tawba', ar: 'التوبة', people: 'التوّابون', en: 'Repentance', ayah: '2:222',
    lugha: 'الرجوع.', istilah: 'الرجوع إلى الله بعد الخطأ، بندم وعزم على التغيير.' },
  { id: 'tawakkul', ar: 'التوكّل', people: 'المتوكّلون', en: 'Trust in Allah', ayah: '3:159',
    lugha: 'الاعتماد وتفويض الأمر.', istilah: 'أن تأخذ بالأسباب كاملة، ثم تعتمد بقلبك على الله.' },
  { id: 'sabr', ar: 'الصبر', people: 'الصابرون', en: 'Patience', ayah: '3:146',
    lugha: 'الحبس والمنع.', istilah: 'حبس النفس على الطاعة، وعن المعصية، وعلى أقدار الله.' },
  { id: 'tahara', ar: 'الطهارة', people: 'المتطهّرون', en: 'Purity', ayah: '9:108',
    lugha: 'النظافة والنزاهة.', istilah: 'طهارة الظاهر بالنظافة، وطهارة الباطن من الحقد والحسد.' }
];

Q.TEAMS = [
  { id: 'experts', ar: 'خبراء الإحسان', en: 'Ihsan Experts', color: '#2B7BB9', icon: 'search',
    focusAr: 'البحث والتعمّق', focusEn: 'Research & depth',
    missionAr: 'نبحث في الصفة بعمق: في القرآن والسنة والحياة، ونقدّم بحثًا موثّقًا.',
    missionEn: 'We study the virtue deeply — in Quran, Sunnah and life — and deliver a documented research paper.' },
  { id: 'ambassadors', ar: 'سفراء الإحسان', en: 'Ihsan Ambassadors', color: '#F39A1E', icon: 'megaphone',
    focusAr: 'التسويق والتأثير', focusEn: 'Marketing & influence',
    missionAr: 'ننقل الصفة إلى الناس بمنتج تسويقي مؤثّر، ونقيس أثره باستبيان.',
    missionEn: 'We carry the virtue to people through a marketing product, and measure its impact with a survey.' },
  { id: 'action', ar: 'إحسان الإحسان', en: 'Ihsan in Action', color: '#1E6B3C', icon: 'sprout',
    focusAr: 'المبادرة وحل المشكلات', focusEn: 'Initiative & problem solving',
    missionAr: 'نحوّل الصفة إلى مبادرة تحل مشكلة حقيقية في مجتمعنا، ونقيس أثرها.',
    missionEn: 'We turn the virtue into an initiative that solves a real problem in our community, and measure its impact.' }
];

/* ---------- Stations (from the project document) ---------- */
const S = (o) => o;
Q.STATIONS = [
  S({ id: 's1', track: 'shared', n: 1, ar: 'لماذا هذا المشروع؟', en: 'Why this project?', due: '2026-11-29', opens: '2026-11-22', icon: 'compass',
    goalsAr: ['تعرف لماذا نقوم بهذا المشروع وكيف يرتبط بسعادتك', 'تفرّق بين المتعة والسعادة', 'تكتب أول مسودّة لرسالتك في الحياة'],
    goalsEn: ['Know why we do this project and how it links to your happiness', 'Tell pleasure from happiness', 'Write the first draft of your life mission'],
    steps: [
      { t: 'video', ar: 'شاهد فيديو المحطة', en: 'Watch the station video', min: 6 },
      { t: 'quiz', ar: 'متى يكون الناس سعداء حقًّا؟', en: 'When are people truly happy?',
        opts: [['حين يحصلون على ما يريدون فورًا', 'When they get what they want instantly'], ['حين يعيشون لهدف أكبر منهم', 'When they live for a purpose bigger than themselves'], ['حين يرتاحون من كل عمل', 'When they rest from all work'], ['حين يمدحهم الآخرون', 'When others praise them']], ok: 1,
        whyAr: 'المتعة تنتهي بانتهاء الشيء، أما السعادة فتأتي من معنى وهدف تعيش له.', whyEn: 'Pleasure ends when the thing ends; happiness comes from meaning and purpose.' },
      { t: 'quiz', ar: 'أيّ مثال يصف «السعادة» لا «المتعة»؟', en: 'Which example describes happiness, not pleasure?',
        opts: [['أكل الحلوى المفضّلة', 'Eating your favourite sweet'], ['ساعة ألعاب إلكترونية', 'An hour of video games'], ['مساعدة صديق حتى نجح', 'Helping a friend until they succeeded'], ['شراء هاتف جديد', 'Buying a new phone']], ok: 2,
        whyAr: 'أثر مساعدة الصديق يبقى في داخلك طويلًا — هذه سعادة.', whyEn: 'The feeling of helping a friend stays with you — that is happiness.' },
      { t: 'quiz', ar: 'حرف A في OMAR FLOW يعني…', en: 'The A in OMAR FLOW stands for…',
        opts: [['التفاؤل', 'Optimism'], ['الإيثار', 'Altruism'], ['الشغف', 'Flow'], ['التقدير', 'Recognition']], ok: 1,
        whyAr: 'A = Altruism = الإيثار: أن تقدّم غيرك على نفسك.', whyEn: 'A = Altruism: putting others before yourself.' },
      { t: 'scale', ar: 'ما مدى سعادتك الآن من ١ إلى ١٠؟', en: 'How happy are you right now, 1 to 10?', why: true, key: 'happy_before' },
      { t: 'pillars', ar: 'اختر أركان السعادة الموجودة في حياتك الآن', en: 'Pick the happiness pillars you already have' },
      { t: 'text', ar: 'ما الشيء الذي تفعله فتنسى معه الوقت؟', en: 'What do you do that makes you lose track of time?' },
      { t: 'text', ar: 'ما أكثر جملة لمستك في الفيديو؟ ولماذا؟', en: 'Which sentence in the video touched you most? Why?' },
      { t: 'mission', ar: 'اكتب رسالتك في الحياة بكلماتك', en: 'Write your life mission in your own words',
        draftAr: 'أن أساهم بوقتي وعلمي في جعل من حولي أسعد، من خلال الإحسان في أقوالي وأفعالي.',
        draftEn: 'To use my time and knowledge to make the people around me happier, through excellence in my words and actions.' }
    ] }),
  S({ id: 's2', track: 'shared', n: 2, ar: 'محطة السعادة', en: 'The Happiness Station', due: '2026-12-06', opens: '2026-11-29', icon: 'sun',
    goalsAr: ['تفهم أركان السعادة الخمسة OMAR FLOW', 'تربط كل ركن بموقف من حياتك'], goalsEn: ['Understand the five OMAR FLOW pillars', 'Link each pillar to a moment in your life'],
    steps: [
      { t: 'cards', ar: 'اقلب بطاقات أركان السعادة', en: 'Flip the happiness pillar cards' },
      { t: 'quiz', ar: 'صديقك انغمس في الرسم ثلاث ساعات دون أن يشعر. أي ركن هذا؟', en: 'Your friend drew for 3 hours without noticing. Which pillar?',
        opts: [['FLOW الشغف', 'FLOW'], ['R التقدير', 'R'], ['O التفاؤل', 'O'], ['M التدبّر', 'M']], ok: 0, whyAr: 'الانغماس حتى نسيان الوقت هو الـ FLOW.', whyEn: 'Total absorption is Flow.' },
      { t: 'text', ar: 'اكتب موقفًا عشت فيه ركن «العرفان والتقدير»', en: 'Describe a moment you lived “Recognition”' },
      { t: 'upload', ar: 'صوّر «جدار الامتنان» الذي صنعته (٣ أشياء تشكر الله عليها)', en: 'Photograph your gratitude wall (3 things you thank Allah for)' }
    ] }),
  S({ id: 's3', track: 'shared', n: 3, ar: 'صفات من يحبهم الله + مقدمة المشروع', en: 'Those Allah loves + project introduction', due: '2026-12-13', opens: '2026-12-06', icon: 'heart',
    steps: [{ t: 'cards-virtues', ar: 'تعرّف على صفات من يحبهم الله', en: 'Meet the qualities of those Allah loves' }, { t: 'recite', ar: 'استمع وردّد: ﴿إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ﴾', en: 'Listen & repeat the verse', ayah: '2:195' }, { t: 'text', ar: 'اكتب مقدمة مشروعك (٥–٨ أسطر)', en: 'Write your project introduction (5–8 lines)' }] }),
  S({ id: 's4', track: 'shared', n: 4, ar: 'اختيار فريق العمل', en: 'Choose your team', due: '2026-12-20', opens: '2026-12-13', icon: 'users',
    steps: [{ t: 'choose-team', ar: 'أيّ فريق يناسبك؟', en: 'Which team fits you?' }, { t: 'text', ar: 'لماذا اخترت هذا الفريق؟', en: 'Why did you choose this team?' }, { t: 'upload', ar: 'ارفع ورقة العمل الخاصة بفريقك', en: 'Upload your team worksheet' }] }),
  S({ id: 's5', track: 'shared', n: 5, ar: 'محطة التقوى', en: 'The Taqwa Station', due: '2027-01-10', opens: '2026-12-20', icon: 'shield',
    steps: [{ t: 'recite', ar: 'استمع وتدبّر: ﴿فَإِنَّ اللَّهَ يُحِبُّ الْمُتَّقِينَ﴾', en: 'Listen and reflect', ayah: '3:76' }, { t: 'text', ar: 'التقوى تجمع كل الصفات. اذكر ٣ أعمال للمتقين وجدتها في الآيات', en: 'Taqwa gathers all virtues. List 3 deeds of the God-conscious from the verses' }] }),
  S({ id: 's6', track: 'shared', n: 6, ar: 'محطة الإحسان: معاني الإحسان الخمس', en: 'Ihsan: its five meanings', due: '2027-01-17', opens: '2027-01-10', icon: 'star',
    steps: [{ t: 'text', ar: 'اكتب معاني الإحسان الخمس بأسلوبك', en: 'Write the five meanings of Ihsan in your own words' }, { t: 'text', ar: 'كيف «تُحسن» صفتك؟ مثال من يومك', en: 'How do you do your virtue with excellence? An example from your day' }] }),
  S({ id: 's7', track: 'shared', n: 7, ar: 'اختيار الصفة + التقييم الذاتي', en: 'Choose your virtue + self-assessment', due: '2027-01-24', opens: '2027-01-17', icon: 'target',
    steps: [{ t: 'choose-virtue', ar: 'اختر صفتك', en: 'Choose your virtue' }, { t: 'self', ar: 'قيّم نفسك في صفتك الآن', en: 'Rate yourself in your virtue now', key: 'self_before' }] }),
  S({ id: 's8', track: 'shared', n: 8, ar: 'التحديات الشهرية', en: 'Monthly challenges', due: '2027-02-28', opens: '2027-01-24', icon: 'flame',
    steps: [{ t: 'challenge', ar: 'تحدّي ٣٠ يومًا لصفتك', en: '30-day challenge for your virtue' }] }),
  S({ id: 's9', track: 'shared', n: 9, ar: 'خطة لعمل مجتمعي يضم الفرق الثلاثة', en: 'Joint community action plan', due: '2027-03-14', opens: '2027-02-28', icon: 'globe',
    steps: [{ t: 'text', ar: 'ما دور فريقك في العمل المجتمعي المشترك؟', en: "What is your team's role in the joint community action?" }, { t: 'upload', ar: 'ارفع خطة العمل', en: 'Upload the action plan' }] }),
  S({ id: 's10', track: 'shared', n: 10, ar: 'أوراق عمل المشروع', en: 'Project worksheets', due: '2027-03-28', opens: '2027-03-14', icon: 'file',
    steps: [{ t: 'upload', ar: 'ارفع أوراق العمل المكتملة', en: 'Upload completed worksheets' }] }),

  // ---- Team tracks
  ...[['experts', [
      ['مقدمة الصفات والسعادة', 'Introduction: virtues & happiness'], ['مقدمة عن الصفة المختارة', 'Introduction to your virtue'],
      ['أعمال الصفة: نفع للنفس ونفع للغير', 'Deeds of the virtue: for self & others'], ['الصفة في القرآن والأحاديث', 'The virtue in Quran & Hadith'],
      ['آيات الحب للصفة + تفسيرها + التسميع', 'Love verses: meaning & recitation'], ['البحث في المحور المختار', 'Research on your chosen axis']]],
    ['ambassadors', [
      ['مقدمة الصفات والسعادة', 'Introduction: virtues & happiness'], ['مقدمة عن الصفة المختارة', 'Introduction to your virtue'],
      ['أعمال الصفة: نفع للنفس ونفع للغير', 'Deeds of the virtue: for self & others'], ['آيات الحب للصفة + تفسيرها + التسميع', 'Love verses: meaning & recitation'],
      ['اختيار المنتج التسويقي', 'Choose the marketing product'], ['خطة التسويق: المنتج – الرسالة – الفئة المستهدفة', 'Marketing plan: product, message, audience'],
      ['تصميم الاستبيان وتنفيذه وتحليله', 'Design, run & analyse a survey'], ['تنفيذ المنتج', 'Produce the product']]],
    ['action', [
      ['مقدمة الصفات والسعادة', 'Introduction: virtues & happiness'], ['مقدمة عن الصفة المختارة', 'Introduction to your virtue'],
      ['أعمال الصفة: نفع للنفس ونفع للغير', 'Deeds of the virtue: for self & others'], ['آيات الحب للصفة + تفسيرها + التسميع', 'Love verses: meaning & recitation'],
      ['أهم المشكلات من غياب الصفة', 'Key problems caused by the missing virtue'], ['خطة المبادرة لحل المشكلة', 'Initiative plan'],
      ['تنفيذ الخطة', 'Run the plan'], ['استبيان بعد التنفيذ', 'Post-initiative survey'], ['التوصيات', 'Recommendations']]]
  ].flatMap(([team, list]) => list.map(([ar, en], i) => {
    const isRecite = /التسميع/.test(ar), isSurvey = /استبيان/.test(ar);
    return { id: `${team}-${i + 1}`, track: team, n: i + 1, ar, en, icon: isRecite ? 'book' : isSurvey ? 'chart' : 'pen',
      due: null, opens: '2027-03-28',
      steps: isRecite
        ? [{ t: 'recite', ar: 'استمع للآيات وردّدها ثم سمّعها', en: 'Listen, repeat, then recite', ayah: 'virtue' }, { t: 'text', ar: 'اشرح الآية بأسلوبك', en: 'Explain the verse in your own words' }]
        : [{ t: 'text', ar: ar + ': اكتب عملك هنا', en: en + ': write your work here' }, { t: 'upload', ar: 'ارفع الدليل (صور، ملف، فيديو)', en: 'Upload evidence (photos, file, video)' }] };
  }))
];

Q.RUBRIC = [
  { id: 'honesty', ar: 'الصدق والعمق', en: 'Honesty & depth' },
  { id: 'understanding', ar: 'الفهم', en: 'Understanding' },
  { id: 'life', ar: 'الربط بالحياة', en: 'Link to life' },
  { id: 'craft', ar: 'الإتقان', en: 'Craft' }
];

/* ---------- People (SAMPLE) ---------- */
Q.SUPERVISORS = [
  { id: 'sup1', name: 'أ/ منى سامي', email: 'mona@school.example', pass: 'Mona#2026' },
  { id: 'sup2', name: 'أ/ أحمد فؤاد', email: 'ahmed@school.example', pass: 'Ahmed#2026' },
  { id: 'sup3', name: 'أ/ هبة كمال', email: 'heba@school.example', pass: 'Heba#2026' },
  { id: 'sup4', name: 'أ/ ياسر نبيل', email: 'yasser@school.example', pass: 'Yasser#2026' },
  { id: 'sup5', name: 'أ/ نهى عادل', email: 'noha@school.example', pass: 'Noha#2026' }
];

const names = ['مريم أحمد', 'عمر خالد', 'ليلى حسن', 'يوسف طارق', 'سلمى إبراهيم', 'آدم محمود', 'نور الدين علي', 'فرح مصطفى', 'زياد عمرو', 'جنى وليد',
  'مالك شريف', 'حبيبة سامح', 'كريم هشام', 'رقيّة أيمن', 'تميم ماجد', 'ملك رامي', 'سليم وائل', 'هنا عصام', 'علي ياسين', 'سارة نادر'];
const teamsCycle = ['action', 'experts', 'ambassadors'];
Q.STUDENTS = names.map((name, i) => ({
  id: 'st' + (i + 1), name, grade: i < 10 ? 'G7-A' : 'G7-B', team: teamsCycle[i % 3], sup: 'sup' + ((i % 5) + 1),
  user: 'student' + (i + 1), pass: ['Sun', 'Moon', 'Star', 'Palm', 'Nile'][i % 5] + (2026 + i),
  virtue: Q.VIRTUES[i % 7].id, streak: [6, 3, 0, 9, 2, 4, 1, 12, 0, 5, 7, 2, 3, 0, 8, 1, 4, 6, 2, 3][i],
  happyBefore: [6, 7, 5, 8, 6, 7, 5, 6, 7, 4, 6, 8, 5, 7, 6, 7, 5, 6, 8, 6][i],
  happyNow: [7, 8, 6, 8, 7, 8, 6, 8, 7, 6, 7, 9, 6, 8, 7, 8, 6, 7, 8, 7][i],
  done: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1][i] ? ['s1'] : [],
  reciteMin: [42, 18, 5, 60, 22, 9, 31, 55, 0, 27, 36, 48, 12, 20, 3, 40, 26, 8, 33, 29][i]
}));
Q.PRINCIPAL = { name: 'السيدة مديرة المدرسة', user: 'principal', pass: 'Principal#2026' };
Q.LEAD = { name: 'أ/ رانيا حسين (مشرفة المشرفين)', user: 'lead', pass: 'Lead#2026' };
Q.OWNER = { name: 'مسؤول المشروع', user: 'admin', pass: 'Owner#2026' };
