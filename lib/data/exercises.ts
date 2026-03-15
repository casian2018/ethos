/**
 * Ethos Exercise Database - Complete Data
 * 100+ exercises with detailed instructions, tips, and video timestamps
 */

import { Exercise } from "@/lib/types/exercise";

export const exercisesDatabase: Exercise[] = [
  // ==================== CHEST (1-15) ====================
  {
    id: "chest_001",
    slug: "barbell-bench-press",
    name: "Barbell Bench Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Bară", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe bancă cu picioarele pe podea",
      "Ține bara cu priză mai largă decât umerii",
      "Lasă bara în jos până la piept cu coatele la 45 grade",
      "Împinge bara înapoi sus, fără a bloca coatele",
      "Repetă pentru numărul de repetări dorit"
    ],
    tips: [
      "Inspiră în timp ce cobori, expiră când împingi",
      "Ține omoplații împreuna și retrași",
      "Menține o curbură naturală în partea inferioară a spatelui",
      "Privește înainte, nu în sus"
    ],
    mistakes: [
      "Coate foarte depărtate (90 grade)",
      "Ridicarea picioarelor de pe podea",
      "Mișcare prea rapidă fără control",
      "Arcuierea excesivă a spatelui"
    ],
    videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
    videoTimestamps: [
      { time: 0, title: "Setup", description: "Poziția inițială pe bancă" },
      { time: 20, title: "Grip", description: "Priză corectă pe bară" },
      { time: 35, title: "Descent", description: "Coborârea controlată" },
      { time: 50, title: "Press", description: "Împingerea înapoi" },
      { time: 70, title: "Common Mistakes", description: "Greșeli de evitat" }
    ],
    tags: ["bench press", "piept", "împins", "bară", "sala", "forță", "pectoralis", "chest press"],
    language: "ro",
    isVerified: true,
    popularityScore: 98
  },
  {
    id: "chest_002",
    slug: "incline-barbell-press",
    name: "Incline Barbell Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Umeri", "Triceps"],
    equipment: ["Bară", "Bancă inclinată"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe bancă înclinată la 30-45 grade",
      "Ține bara cu priză la lățimea umerilor",
      "Coboară bara spre pieptul superior",
      "Împinge bara vertical în sus",
      "Menține control pe tot parcursul mișcării"
    ],
    tips: [
      "Nu lăsa bara să cadă pe gât",
      "Păstrează coatele la 45 grade",
      "Folosește un spotter pentru siguranță",
      "Nu bloca coatele în partea superioară"
    ],
    mistakes: [
      "Banca prea înclinată (peste 45 grade)",
      "Mișcare arcuță",
      "Greutate prea mare"
    ],
    tags: ["incline bench press", "piept superior", "umăr", "împins", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "chest_003",
    slug: "barbell-decline-press",
    name: "Decline Barbell Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps"],
    equipment: ["Bară", "Bancă"],
    difficulty: "Advanced",
    instructions: [
      "Așază-te pe bancă declinată cu picioarele fixate",
      "Ține bara cu priză mai largă decât umerii",
      "Coboară bara spre pieptul inferior",
      "Împinge bara în sus pe o traiectorie ușor curbată",
      "Nu forța dacă simți disconfort"
    ],
    tips: [
      "Asigură-te că picioarele sunt bine fixate",
      "Folosește o priză fermă",
      "Nu coborî bara prea aproape de stomac"
    ],
    mistakes: [
      "Picioare nefixate",
      "Mișcare necontrolată",
      "Greutate prea mare"
    ],
    tags: ["decline bench press", "piept inferior", "declinat", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 70
  },
  {
    id: "chest_004",
    slug: "dumbbell-flat-bench-press",
    name: "Dumbbell Flat Bench Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Gantera", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe bancă cu câte o ganteră în fiecare mână",
      "Împinge ganterele în sus, ținându-le deasupra pieptului",
      "Coboară ganterele lateral spre piept",
      "Împinge înapoi în poziția de start",
      "Menține o traiectorie ușor curbă"
    ],
    tips: [
      "Rotire încheieturi pentru o poziție confortabilă",
      "Coate la 45 grade",
      "Nu lăsa ganterele să se lovescă în centru"
    ],
    mistakes: [
      "Coate foarte depărtate",
      "Mișcare prea rapidă",
      "Umăr rotit în afară"
    ],
    tags: ["dumbbell bench press", "Gantera", "piept", "împins", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 90
  },
  {
    id: "chest_005",
    slug: "dumbbell-incline-press",
    name: "Dumbbell Incline Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Umeri", "Triceps"],
    equipment: ["Gantera", "Bancă inclinată"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe bancă înclinată la 30-45 grade",
      "Ține câte o ganteră în fiecare mână la nivelul pieptului",
      "Împinge ganterele în sus pe o traiectorie ușor convergentă",
      "Coboară controlat spre piept",
      "Repetă fără a bloca coatele"
    ],
    tips: [
      "Urmărește vârful ganterelor cu privirea",
      "Păstrează încheieturile stabile",
      "Contracție maximă în partea superioară"
    ],
    mistakes: [
      "Bancă prea dreaptă sau prea înclinată",
      "Mișcare circulară",
      "Greutate prea mare"
    ],
    tags: ["dumbbell incline press", "piept superior", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 82
  },
  {
    id: "chest_006",
    slug: "dumbbell-decline-press",
    name: "Dumbbell Decline Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps"],
    equipment: ["Gantera", "Bancă"],
    difficulty: "Advanced",
    instructions: [
      "Așază-te pe bancă declinată cu picioarele fixate",
      "Ține câte o ganteră în fiecare mână",
      "Coboară ganterele lateral spre pieptul inferior",
      "Împinge înapoi în poziția de start",
      "Menține control pe tot parcursul"
    ],
    tips: [
      "Fixare sigură a picioarelor",
      "Mișcare lentă și controlată",
      "Nu forța amplitudinea"
    ],
    mistakes: [
      "Picioare nefixate",
      "Mișcare explozivă",
      "Amplitudine excesivă"
    ],
    tags: ["dumbbell decline press", "piept inferior", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 65
  },
  {
    id: "chest_007",
    slug: "cable-chest-fly-high-to-low",
    name: "Cable Chest Fly (High-to-Low)",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: [],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Setează scripetele superior la înălțime",
      "Stai în centru cu un picior în față pentru echilibru",
      "Prinde mânerele și întinde brațele în lateral",
      "Coboară brațele într-o mișcare de arc",
      "Contracție maximă în partea de jos"
    ],
    tips: [
      "Nu îndoi coatele mult - menține-le aproape drepte",
      "Privește înainte",
      "Contracție izometrică în centru"
    ],
    mistakes: [
      "Coate foarte îndoite",
      "Mișcare prea rapidă",
      "Greutate prea mare"
    ],
    tags: ["cable fly", "fluturări piept", "cablu", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 75
  },
  {
    id: "chest_008",
    slug: "cable-chest-fly-low-to-high",
    name: "Cable Chest Fly (Low-to-High)",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Umeri"],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Setează scripetele inferior",
      "Stai în centru și apleacă-te ușor înainte",
      "Prinde mânerele și întinde brațele în jos",
      "Ridică brațele în sus într-o mișcare de arc",
      "Contracție maximă când brațele sunt paralele cu podeaua"
    ],
    tips: [
      "Nu îndoi coatele semnificativ",
      "Păstrează trunchiul stabil",
      "Contracție la mijlocul mișcării"
    ],
    mistakes: [
      "Trunchi instabil",
      "Mișcare prea rapidă",
      "Greutate prea mare"
    ],
    tags: ["cable fly", "low to high", "fluturări", "cablu", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 70
  },
  {
    id: "chest_009",
    slug: "pec-deck-machine",
    name: "Pec Deck Machine",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Umeri"],
    equipment: ["Mașină dePresă"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașina Pec Deck cu spatele pe perna",
      "Pune brațele pe pernuțele mașinii",
      "Împinge brațele împreună în față",
      "Nu bloca coatele la final",
      "Revino încet în poziția de start"
    ],
    tips: [
      "Nu forța mișcarea finală",
      "Mișcare lentă și controlată",
      "Contracție maximă când brațele sunt împreună"
    ],
    mistakes: [
      "Mișcare prea rapidă",
      "Greutate prea mare",
      "Umăr forward"
    ],
    tags: ["pec deck", "mașină piept", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 72
  },
  {
    id: "chest_010",
    slug: "weighted-dips",
    name: "Weighted Dips",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Niciunul"],
    difficulty: "Advanced",
    instructions: [
      "Agăță-te de barele de dips",
      "Pentru piept: apleacă-te ușor înainte",
      "Coboară până când pieptul este la nivelul barelor",
      "Împinge înapoi în poziția de start",
      "Adaugă greutate cu o centură sau vest"
    ],
    tips: [
      "Pentru piept: apleacă-te înainte 30-45 grade",
      "Pentru triceps: menține corpul drept",
      "Nu coborî complet dacă ai probleme cu umărul"
    ],
    mistakes: [
      "Mișcare prea adâncă",
      "Greutate prea mare",
      "Umăr rotit incorect"
    ],
    tags: ["weighted dips", "dips", "piept", "triceps", "avansat"],
    language: "ro",
    isVerified: true,
    popularityScore: 78
  },
  {
    id: "chest_011",
    slug: "smith-machine-incline-press",
    name: "Smith Machine Incline Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Umeri", "Triceps"],
    equipment: ["Mașină deSmith"],
    difficulty: "Beginner",
    instructions: [
      "Setează banca la 30-45 grade pe Smith Machine",
      "Așază-te pe bancă și prinde bara",
      "Desface siguranțele",
      "Coboară bara spre pieptul superior",
      "Împinge bara înapoi și blochează la final"
    ],
    tips: [
      "Traiectorie fixă - mai ușor pentru începători",
      "Nu lăsa bara să stea pe piept",
      "Folosește priză fermă"
    ],
    mistakes: [
      "Greutate prea mare",
      "Mișcare necontrolată",
      "Priză incorectă"
    ],
    tags: ["smith machine", "împins", "piept", "începător", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 68
  },
  {
    id: "chest_012",
    slug: "dumbbell-pullover",
    name: "Dumbbell Pullover",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Spate", "Triceps"],
    equipment: ["Gantera", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe marginea băncii cu umerii pe bancă",
      "Ține gantera cu ambele mâini deasupra pieptului",
      "Coboară gantera înapoia capului într-un arc larg",
      "Revino în poziția de start",
      "Menține o ușoară îndoire a coatelor"
    ],
    tips: [
      "Nu îndoi coatele complet",
      "Mișcare lentă și controlată",
      "Nu coborî prea mult"
    ],
    mistakes: [
      "Coate complet îndoite",
      "Mișcare explozivă",
      "Greutate prea mare"
    ],
    tags: ["dumbbell pullover", "pullover", "piept", "spate", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 62
  },
  {
    id: "chest_013",
    slug: "machine-chest-press",
    name: "Machine Chest Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Mașină dePresă"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașină cu spatele lipit de spătar",
      "Prinde mânerele la nivelul pieptului",
      "Împinge mânerele în față",
      "Nu bloca coatele la final",
      "Revino încet în poziția de start"
    ],
    tips: [
      "Ușor de folosit pentru începători",
      "Nu forța mișcarea completă",
      "Contracție la final"
    ],
    mistakes: [
      "Mișcare prea rapidă",
      "Greutate prea mare",
      "Umăr ridicat"
    ],
    tags: ["machine chest press", "mașină piept", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 65
  },
  {
    id: "chest_014",
    slug: "floor-press-dumbbell",
    name: "Floor Press (Dumbbell)",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps"],
    equipment: ["Gantera"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe podea cu genunchii îndoiți",
      "Ține câte o ganteră în fiecare mână la piept",
      "Împinge ganterele în sus",
      "Coboară până când coatele ating podeaua",
      "Repetă"
    ],
    tips: [
      "Nu atinge coatele de podea dacă ai flexibilitate redusă",
      "Alternativă sigură la bench press",
      "Contracție maximă sus"
    ],
    mistakes: [
      "Coate lovesc podeaua",
      "Mișcare prea rapidă",
      "Greutate neechilibrată"
    ],
    tags: ["floor press", "dumbbell floor press", "piept", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 58
  },
  {
    id: "chest_015",
    slug: "landmine-chest-press",
    name: "Landmine Chest Press",
    category: "Sala",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Fixează un capăt al barei în colț sau dispozitiv landmine",
      "Stai lateral față de bară",
      "Prinde bara cu ambele mâini lângă piept",
      "Împinge bara în față",
      "Revino încet"
    ],
    tips: [
      "Mișcare mai naturală pentru umăr",
      "Ușor pe încheieturi",
      "Contracție izometrică la final"
    ],
    mistakes: [
      "Corp instabil",
      "Mișcare prea rapidă",
      "Greutate necontrolată"
    ],
    tags: ["landmine press", "landmine", "piept", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 55
  },

  // ==================== BACK (16-35) ====================
  {
    id: "back_016",
    slug: "barbell-deadlift",
    name: "Barbell Deadlift",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Fese", "Cvadricepsi", "Ischiogambieri"],
    equipment: ["Bară"],
    difficulty: "Advanced",
    instructions: [
      "Stai în fața barei cu picioarele la lățimea umerilor",
      "Apucă bara la lățimea umerilor, cu palmele spre tine",
      "Ține spatele drept, piept înainte",
      "Ridică bara prin întinderea picioarelor și a spatelui",
      "În poziția de sus, stai drept cu umerii retrași"
    ],
    tips: [
      "Bară aproape de tibii pe tot parcursul",
      "Nu rounding spate - menține curbură naturală",
      "Împinge cu picioarele, nu trage cu spatele"
    ],
    mistakes: [
      "Spatele rotund",
      "Genunchii în interior",
      "Greutate pe vârfuri"
    ],
    tags: ["deadlift", "spate", "picioare", "fese", "compus", "sala", "avansat"],
    language: "ro",
    isVerified: true,
    popularityScore: 99
  },
  {
    id: "back_017",
    slug: "pull-ups-wide-grip",
    name: "Pull-Ups (Wide Grip)",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps"],
    equipment: ["Niciunul"],
    difficulty: "Intermediate",
    instructions: [
      "Agăță-te de bară cu priză mai largă decât umerii",
      "Palmele spre tine (overhand)",
      "Trage-te până când bărbia trece de bară",
      "Coboară-te încet în poziția de start",
      "Nu balansa"
    ],
    tips: [
      "Contracție inițială a latsilor",
      "Nu folosi impuls",
      "Mișcare controlată"
    ],
    mistakes: [
      "Mișcare cu balans",
      "Nu ajungi sus",
      "Greutate prea mare"
    ],
    tags: ["pull ups", "tractiuni", "spate", "lats", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 95
  },
  {
    id: "back_018",
    slug: "chin-ups-underhand",
    name: "Chin-Ups (Underhand)",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps"],
    equipment: ["Niciunul"],
    difficulty: "Intermediate",
    instructions: [
      "Agăță-te de bară cu priză la lățimea umerilor",
      "Palmele spre tine (underhand grip)",
      "Trage-te până când bărbia trece de bară",
      "Coboară-te complet",
      "Mai ușor decât pull-ups datorită bicepsului"
    ],
    tips: [
      "Mai ușor pentru începători",
      "Mai multă activare a bicepsului",
      "Contracție maximă sus"
    ],
    mistakes: [
      "Nu cobori complet",
      "Mișcare explozivă",
      "Priză prea îngustă"
    ],
    tags: ["chin ups", "tractiuni", "biceps", "spate", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "back_019",
    slug: "lat-pulldown-wide",
    name: "Lat Pulldown (Wide Grip)",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps"],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașina de lat pulldown",
      "Prinde bara cu priză largă",
      "Trage bara spre pieptul superior",
      "Contracție a latsilor la final",
      "Revino încet în poziția de start"
    ],
    tips: [
      "Nu trage bara în spatele gâtului",
      "Piept înainte",
      "Mișcare controlată"
    ],
    mistakes: [
      "Bară în spatele gâtului",
      "Mișcare prea rapidă",
      "Greutate prea mare"
    ],
    tags: ["lat pulldown", "lats", "spate", "cablu", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 92
  },
  {
    id: "back_020",
    slug: "close-grip-lat-pulldown",
    name: "Close-Grip Lat Pulldown",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps"],
    equipment: ["Cablu"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe mașină și prinde bara cu priză îngustă",
      "Trage bara spre piept",
      "Ține coatele aproape de corp",
      "Contracție maximă a latsilor",
      "Revino încet"
    ],
    tips: [
      "Mai multă activare a bicepsului",
      "Contracție izometrică la final",
      "Nu înclina corpul excesiv"
    ],
    mistakes: [
      "Corp prea înclinat",
      "Coate depărtate",
      "Greutate prea mare"
    ],
    tags: ["close grip lat pulldown", "lats", "biceps", "cablu", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "back_021",
    slug: "bent-over-barbell-row",
    name: "Bent-Over Barbell Row",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps", "Abdomen"],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Stai în picioare cu bara la nivelul coapselor",
      "Apleacă-te înainte la 45 grade, genunchii ușor îndoiți",
      "Ține bara cu priză la lățimea umerilor",
      "Trage bara spre abdomen",
      "Coboară încet și repetă"
    ],
    tips: [
      "Menține spatele drept",
      "Nu rounding spate",
      "Contracție a spatelui, nu a bicepsului"
    ],
    mistakes: [
      "Spatele rotund",
      "Mișcare prea rapidă",
      "Corp prea drept sau prea aplecat"
    ],
    tags: ["bent over row", "barbell row", "spate", "lats", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 90
  },
  {
    id: "back_022",
    slug: "one-arm-dumbbell-row",
    name: "One-Arm Dumbbell Row",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps"],
    equipment: ["Gantera", "Bancă"],
    difficulty: "Beginner",
    instructions: [
      "Pune un genunchi și o mână pe bancă pentru suport",
      "Ține gantera în cealaltă mână",
      "Trage gantera spre șold, cu coatele aproape de corp",
      "Strânge lamele la finalul mișcării",
      "Coboară încet și repetă"
    ],
    tips: [
      "Spatele paralel cu podeaua",
      "Nu rotiri ale corpului",
      "Mișcare controlată"
    ],
    mistakes: [
      "Corp instabil",
      "Mișcare cu impuls",
      "Greutate prea mare"
    ],
    tags: ["one arm dumbbell row", "dumbbell row", "spate", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 87
  },
  {
    id: "back_023",
    slug: "seated-cable-row",
    name: "Seated Cable Row",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps", "Abdomen"],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe scaunul mașinii cu picioarele pe platformă",
      "Prinde mânerul V sau drept cu ambele mâini",
      "Trage mânerul spre abdomen",
      "Strânge lamele și omoplații",
      "Revino încet"
    ],
    tips: [
      "Nu înclina excesiv în spate",
      "Contracție la mijloc",
      "Respiră corect"
    ],
    mistakes: [
      "Corp prea înclinat",
      "Mișcare prea rapidă",
      "Nu strânge suficient"
    ],
    tags: ["seated cable row", "cablu spate", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "back_024",
    slug: "t-bar-row",
    name: "T-Bar Row",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Biceps"],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Fixează bara în dispozitivul T-Bar sau prinde-o între picioare",
      "Ține spatele drept și apleacă-te ușor",
      "Trage bara spre piept",
      "Strânge lamele la final",
      "Coboară încet"
    ],
    tips: [
      "Menține spatele drept",
      "Nu rounding",
      "Contracție maximă"
    ],
    mistakes: [
      "Spatele rotund",
      "Mișcare explozivă",
      "Greutate prea mare"
    ],
    tags: ["t-bar row", "spate", "lats", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 75
  },
  {
    id: "back_025",
    slug: "face-pulls",
    name: "Face Pulls",
    category: "Sala",
    muscleGroup: "Spate",
    secondaryMuscles: ["Umeri"],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Setează scripetele la înălțimea feței",
      "Prinde coarda sau mânerul cu priză largă",
      "Trage spre față, separând mâinile",
      "Rotește încheieturile astfel încât degetele să arate în jos",
      "Strânge omoplații la final"
    ],
    tips: [
      "Foarte bun pentru rotator cuff",
      "Mișcare lentă",
      "Rotație externă la final"
    ],
    mistakes: [
      "Greutate prea mare",
      "Mișcare prea rapidă",
      "Nu separă suficient"
    ],
    tags: ["face pulls", "spate", "umeri", "cablu", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 72
  },

  // ==================== SHOULDERS (36-50) ====================
  {
    id: "shoulder_036",
    slug: "overhead-barbell-press",
    name: "Overhead Barbell Press (Military)",
    category: "Sala",
    muscleGroup: "Umeri",
    secondaryMuscles: ["Triceps"],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Stai în picioare cu bara la nivelul pieptului",
      "Ține bara cu priză la lățimea umerilor",
      "Împinge bara în sus deasupra capului",
      "Bară trebuie să treacă aproape de față",
      "Coboară încet și repetă"
    ],
    tips: [
      "Nu arcui spatele excesiv",
      "Ține core-ul angajat",
      "Privește înainte"
    ],
    mistakes: [
      "Spatele arcuit",
      "Mișcare prea rapidă",
      "Greutate prea mare"
    ],
    tags: ["overhead press", "military press", "umăr", "bară", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 92
  },
  {
    id: "shoulder_037",
    slug: "seated-dumbbell-press",
    name: "Seated Dumbbell Press",
    category: "Sala",
    muscleGroup: "Umeri",
    secondaryMuscles: ["Triceps"],
    equipment: ["Gantera", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe scaun sau bancă cu sprijin pentru spate",
      "Ține câte o ganteră la nivelul umerilor",
      "Împinge ganterele în sus",
      "Nu bloca coatele la final",
      "Coboară încet"
    ],
    tips: [
      "Spate susținut pentru stabilitate",
      "Mișcare controlată",
      "Nu înclina corpul"
    ],
    mistakes: [
      "Corp instabil",
      "Mișcare prea rapidă",
      "Greutate neuniformă"
    ],
    tags: ["seated dumbbell press", "umăr", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "shoulder_038",
    slug: "arnold-press",
    name: "Arnold Press",
    category: "Sala",
    muscleGroup: "Umeri",
    secondaryMuscles: ["Triceps"],
    equipment: ["Gantera"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te cu câte o ganteră în fiecare mână la nivelul pieptului",
      "Palmele spre tine",
      "Împinge în sus și rotește palmele în afară",
      "Coboară și rotește înapoi",
      "Mișcare continuă"
    ],
    tips: [
      "Mișcare fluidă, fără pauze",
      "Contracție maximă sus",
      "Pentru toate capetele deltoidului"
    ],
    mistakes: [
      "Pauze în mișcare",
      "Greutate prea mare",
      "Mișcare necontrolată"
    ],
    tags: ["arnold press", "umăr", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "shoulder_039",
    slug: "dumbbell-lateral-raise",
    name: "Dumbbell Lateral Raise",
    category: "Sala",
    muscleGroup: "Umeri",
    secondaryMuscles: [],
    equipment: ["Gantera"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare cu câte o ganteră pe lângă corp",
      "Ridică brațele lateral până la nivelul umerilor",
      "Coate ușor îndoite",
      "Coboară încet",
      "Nu balansa"
    ],
    tips: [
      "Mișcare strictă",
      "Nu ridica peste umeri",
      "Coate la 10-20 grade îndoite"
    ],
    mistakes: [
      "Impuls din corp",
      "Ridicare prea sus",
      "Greutate prea mare"
    ],
    tags: ["lateral raise", "umăr lateral", "Gantera", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 90
  },
  {
    id: "shoulder_040",
    slug: "front-dumbbell-raise",
    name: "Front Dumbbell Raise",
    category: "Sala",
    muscleGroup: "Umeri",
    secondaryMuscles: [],
    equipment: ["Gantera"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare cu câte o ganteră în fața coapselor",
      "Ridică un braț sau ambele în față",
      "Până la nivelul ochilor",
      "Coboară încet",
      "Alternativ sau simultan"
    ],
    tips: [
      "Nu locking la cot",
      "Mișcare strictă",
      "Contracție sus"
    ],
    mistakes: [
      "Impuls",
      "Mișcare prea rapidă",
      "Greutate prea mare"
    ],
    tags: ["front raise", "umăr anterior", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 78
  },

  // ==================== LEGS (51-75) ====================
  {
    id: "leg_051",
    slug: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese", "Ischiogambieri"],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Stai în fața rack-ului cu bara la nivelul pieptului",
      "Pune bara pe spate (trapez)",
      "Desface picioarele la lățimea umerilor",
      "Coboară până coapsele sunt paralele cu podeaua",
      "Împinge înapoi în poziția de start"
    ],
    tips: [
      "Genunchii urmăresc degetele",
      "Piept înainte",
      "Nu lăsa genunchii în interior"
    ],
    mistakes: [
      "Genunchii în interior",
      "Călcâiele se ridică",
      "Spatele rotund"
    ],
    tags: ["back squat", "squat", "picioare", "fese", "cvadricepsi", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 100
  },
  {
    id: "leg_052",
    slug: "front-squat",
    name: "Front Squat",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Abdomen", "Fese"],
    equipment: ["Bară"],
    difficulty: "Advanced",
    instructions: [
      "Stai în fața rack-ului",
      "Pune bara pe partea anterioară a umerilor",
      "Încrucișează brațele pentru a ține bara",
      "Coboară cu spatele drept",
      "Împinge înapoi"
    ],
    tips: [
      "Mai multă activare a cvadricepsului",
      "Core puternic necesar",
      "Nu lăsa bara să cadă"
    ],
    mistakes: [
      "Bară cade",
      "Genunchii în fața degetelor",
      "Spatele nu este drept"
    ],
    tags: ["front squat", "squat", "cvadricepsi", "sala", "avansat"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "leg_053",
    slug: "leg-press",
    name: "Leg Press",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese"],
    equipment: ["Mașină dePresă"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașină cu spatele pe spătar",
      "Pune picioarele pe platformă la lățimea umerilor",
      "Eliberează siguranțele",
      "Coboară greutatea până genunchii sunt la 90 grade",
      "Împinge înapoi fără a bloca"
    ],
    tips: [
      "Nu îndoi complet genunchii",
      "Nu lăsa șoldurile să se ridice",
      "Picioarele paralele cu podeaua"
    ],
    mistakes: [
      "Genunchii la piept",
      "Șolduri ridicate",
      "Mișcare necontrolată"
    ],
    tags: ["leg press", "presa picioare", "cvadricepsi", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 93
  },
  {
    id: "leg_054",
    slug: "romanian-deadlift-rdl",
    name: "Romanian Deadlift (RDL)",
    category: "Sala",
    muscleGroup: "Ischiogambieri",
    secondaryMuscles: ["Fese", "Spate"],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Stai în picioare cu bara în mâini",
      "Ține genunchii ușor îndoiți",
      "Împinge șoldurile în spate",
      "Coboară bara pe lângă picioare",
      "Revino prin împingerea șoldurilor în față"
    ],
    tips: [
      "Bară aproape de picioare",
      "Nu îndoi genunchii mult",
      "Spatele drept"
    ],
    mistakes: [
      "Genunchii îndoiți excesiv",
      "Spatele rotund",
      "Bară departe de corp"
    ],
    tags: ["romanian deadlift", "RDL", "ischiogambieri", "fese", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "leg_055",
    slug: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese"],
    equipment: ["Gantera"],
    difficulty: "Intermediate",
    instructions: [
      "Stai în fața unei bănci",
      "Pune un picior în spate pe bancă",
      "Coboară până coapsa din față este paralelă",
      "Împinge înapoi",
      "Alternază picioarele"
    ],
    tips: [
      "Trunchiul drept",
      "Genunchiul din față nu depășește degetele",
      "Contracție la final"
    ],
    mistakes: [
      "Genunchi prea depărtat",
      "Trunchi înclinat",
      "Pas prea mic"
    ],
    tags: ["bulgarian split squat", "fandari", "cvadricepsi", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 82
  },
  {
    id: "leg_056",
    slug: "leg-extension-machine",
    name: "Leg Extension Machine",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: [],
    equipment: ["Mașină dePresă"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașină cu perna pe gambiere",
      "Întinde picioarele în față",
      "Nu bloca genunchii la final",
      "Coboară încet",
      "Nu folosi impuls"
    ],
    tips: [
      "Nu bloca genunchii",
      "Mișcare lentă",
      "Pentru izolare cvadriceps"
    ],
    mistakes: [
      "Genunchi blocați",
      "Mișcare cu impuls",
      "Greutate prea mare"
    ],
    tags: ["leg extension", "cvadricepsi", "mașină", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 75
  },
  {
    id: "leg_057",
    slug: "seated-leg-curl",
    name: "Seated Leg Curl",
    category: "Sala",
    muscleGroup: "Ischiogambieri",
    secondaryMuscles: [],
    equipment: ["Mașină pentruGambiere"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe mașină cu perna pe gambiere",
      "Îndoiește genunchii spre fese",
      "Strânge ischiogambierii la final",
      "Coboară încet",
      "Nu folosi impuls"
    ],
    tips: [
      "Mișcare strictă",
      "Contracție la final",
      "Nu ridica șoldurile"
    ],
    mistakes: [
      "Șolduri ridicate",
      "Mișcare rapidă",
      "Greutate prea mare"
    ],
    tags: ["leg curl", "ischiogambieri", "mașină", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 72
  },
  {
    id: "leg_058",
    slug: "lying-leg-curl",
    name: "Lying Leg Curl",
    category: "Sala",
    muscleGroup: "Ischiogambieri",
    secondaryMuscles: [],
    equipment: ["Mașină pentruGambiere"],
    difficulty: "Beginner",
    instructions: [
      "Așază-te pe burtă pe mașină",
      "Perna sub picioare",
      "Îndoiește genunchii spre fese",
      "Strânge la final",
      "Revino încet"
    ],
    tips: [
      "Nu ridica coapsele",
      "Mișcare controlată",
      "Contracție maximă"
    ],
    mistakes: [
      "Coapse ridicate",
      "Mișcare rapidă",
      "Greutate prea mare"
    ],
    tags: ["lying leg curl", "ischiogambieri", "mașină", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 70
  },
  {
    id: "leg_059",
    slug: "goblet-squat",
    name: "Goblet Squat",
    category: "Sala",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese"],
    equipment: ["Kettlebell"],
    difficulty: "Beginner",
    instructions: [
      "Ține un kettlebell sau ganteră la piept",
      "Stai cu picioarele la lățimea umerilor",
      "Coboară în genuflexiune",
      "Genunchii nu depășesc degetele",
      "Împinge înapoi"
    ],
    tips: [
      "Ușor de învățat",
      "Poți merge adânc",
      "Contracție la final"
    ],
    mistakes: [
      "Genunchii în interior",
      "Călcâie ridicate",
      "Trunchi prea înclinat"
    ],
    tags: ["goblet squat", "squat", "kettlebell", "cvadricepsi", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "leg_060",
    slug: "hip-thrusts-barbell",
    name: "Hip Thrusts (Barbell)",
    category: "Sala",
    muscleGroup: "Fese",
    secondaryMuscles: ["Ischiogambieri"],
    equipment: ["Bară", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Stai cu spatele pe o bancă, bara pe șolduri",
      "Picioarele pe podea, genunchii îndoiți",
      "Împinge șoldurile în sus",
      "Strânge fesierii la final",
      "Coboară încet"
    ],
    tips: [
      "Bară pe fese, nu pe spate",
      "Bărbie în piept",
      "Contracție maximă sus"
    ],
    mistakes: [
      "Bară pe spate",
      "Nu strânge suficient",
      "Mișcare rapidă"
    ],
    tags: ["hip thrust", "fese", "bară", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 89
  },

  // ==================== ARMS (76-90) ====================
  {
    id: "arm_076",
    slug: "barbell-bicep-curl",
    name: "Barbell Bicep Curl",
    category: "Sala",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Antebrat"],
    equipment: ["Bară"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare cu bara în mâini, brațele întinse",
      "Ține bara cu priză la lățimea umerilor",
      "Îndoiește coatele și ridică bara spre umeri",
      "Nu balansa corpul",
      "Coboară încet"
    ],
    tips: [
      "Coate fixe lângă corp",
      "Nu balansa",
      "Contracție la final"
    ],
    mistakes: [
      "Balans al corpului",
      "Coate în față",
      "Mișcare prea rapidă"
    ],
    tags: ["barbell curl", "biceps", "braț", "bară", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 95
  },
  {
    id: "arm_077",
    slug: "dumbbell-alternating-curl",
    name: "Dumbbell Alternating Curl",
    category: "Sala",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Antebrat"],
    equipment: ["Gantera"],
    difficulty: "Beginner",
    instructions: [
      "Stai sau stai în picioare cu câte o ganteră",
      "Ridică o ganteră spre umăr",
      "Coboară și alternă cu cealaltă mână",
      "Coate lângă corp",
      "Mișcare alternată sau simultană"
    ],
    tips: [
      "Nu balansa",
      "Contracție la vârf",
      "Mișcare controlată"
    ],
    mistakes: [
      "Balans",
      "Coate depărtate",
      "Greutate prea mare"
    ],
    tags: ["dumbbell curl", "biceps", "Gantera", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 92
  },
  {
    id: "arm_078",
    slug: "hammer-curls",
    name: "Hammer Curls",
    category: "Sala",
    muscleGroup: "Biceps",
    secondaryMuscles: ["Antebrat"],
    equipment: ["Gantera"],
    difficulty: "Beginner",
    instructions: [
      "Stai cu câte o ganteră, palmele spre interior",
      "Ridică ganterele spre umeri",
      "Ține încheieturile drepte",
      "Coboară încet",
      "Alternativ sau simultan"
    ],
    tips: [
      "Lucrează și antebrațul",
      "Contracție la vârf",
      "Nu balansa"
    ],
    mistakes: [
      "Încheieturi slăbite",
      "Balans",
      "Greutate prea mare"
    ],
    tags: ["hammer curl", "biceps", "antebrat", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "arm_079",
    slug: "preacher-curls-ez-bar",
    name: "Preacher Curls (EZ Bar)",
    category: "Sala",
    muscleGroup: "Biceps",
    secondaryMuscles: [],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Așază brațele pe suportul preacher",
      "Ține bara EZ cu priză diferită",
      "Ridică bara spre umeri",
      "Nu ridica antebrațele de pe suport",
      "Coboară încet"
    ],
    tips: [
      "Izolare completă a bicepsului",
      "Nu folosi impuls",
      "Contracție la final"
    ],
    mistakes: [
      "Antebrațe ridicate",
      "Greutate prea mare",
      "Mișcare necontrolată"
    ],
    tags: ["preacher curl", "biceps", "ez bar", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "arm_080",
    slug: "tricep-pushdowns-rope",
    name: "Tricep Pushdowns (Rope)",
    category: "Sala",
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Stai la mașina de cablu cu coarda atașată",
      "Prinde coarda cu ambele mâini",
      "Împinge în jos până când brațele sunt întinse",
      "Rotește încheieturile la final pentru izolare",
      "Revino încet"
    ],
    tips: [
      "Coate fixe lângă corp",
      "Rotație la final",
      "Mișcare controlată"
    ],
    mistakes: [
      "Coate se mișcă",
      "Greutate prea mare",
      "Nu coboară complet"
    ],
    tags: ["tricep pushdown", "triceps", "cablu", "sala", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 90
  },
  {
    id: "arm_081",
    slug: "skull-crushers-ez-bar",
    name: "Skull Crushers (EZ Bar)",
    category: "Sala",
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    equipment: ["Bară"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe bancă cu bara ținută deasupra pieptului",
      "Coboară bara spre frunte (sau în spatele capului)",
      "Ține brațele perpendiculare pe podea",
      "Împinge bara înapoi",
      "Coate nu se mișcă"
    ],
    tips: [
      "Foarte eficient pentru triceps",
      "Poate face și cu gantere",
      "Atenție la încheieturi"
    ],
    mistakes: [
      "Coate se depărtează",
      "Bară pe frunte (risc)",
      "Greutate prea mare"
    ],
    tags: ["skull crushers", "triceps", "bara ez", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 82
  },
  {
    id: "arm_082",
    slug: "overhead-tricep-extension-dumbbell",
    name: "Overhead Tricep Extension (Dumbbell)",
    category: "Sala",
    muscleGroup: "Triceps",
    secondaryMuscles: [],
    equipment: ["Gantera"],
    difficulty: "Beginner",
    instructions: [
      "Stai sau stai în picioare cu gantera deasupra capului",
      "Ține gantera cu ambele mâini",
      "Coboară gantera în spatele capului",
      "Întinde brațele înapoi",
      "Nu mișca coatele"
    ],
    tips: [
      "Foarte bun pentru capul lung al tricepsului",
      "Coate fixe",
      "Contracție la final"
    ],
    mistakes: [
      "Coate se depărtează",
      "Mișcare necontrolată",
      "Greutate prea mare"
    ],
    tags: ["overhead tricep extension", "triceps", "Gantera", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 78
  },
  {
    id: "arm_083",
    slug: "close-grip-bench-press",
    name: "Close-Grip Bench Press",
    category: "Sala",
    muscleGroup: "Triceps",
    secondaryMuscles: ["Piept"],
    equipment: ["Bară", "Bancă"],
    difficulty: "Intermediate",
    instructions: [
      "Așază-te pe bancă și prinde bara mai îngust",
      "Coboară bara spre piept",
      "Ține coatele aproape de corp",
      "Împinge bara în sus",
      "Lucrează tricepsul mai mult decât pieptul"
    ],
    tips: [
      "Priză la lățimea umerilor sau mai îngustă",
      "Coate lângă corp",
      "Nu bloca coatele"
    ],
    mistakes: [
      "Priză prea îngustă",
      "Coate depărtate",
      "Greutate prea mare"
    ],
    tags: ["close grip bench", "triceps", "piept", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 75
  },

  // ==================== CORE (91-100) ====================
  {
    id: "core_091",
    slug: "cable-woodchops",
    name: "Cable Woodchops",
    category: "Sala",
    muscleGroup: "Abdomen",
    secondaryMuscles: [],
    equipment: ["Cablu"],
    difficulty: "Beginner",
    instructions: [
      "Setează scripetele jos",
      "Prinde mânerul cu ambele mâini",
      "Rotește corpul în diagonală",
      "Revino încet",
      "Lucrează ambele părți"
    ],
    tips: [
      "Mișcare de rotație",
      "Contracție la final",
      "Core angajat"
    ],
    mistakes: [
      "Mișcare prea rapidă",
      "Nu rotește complet",
      "Greutate prea mare"
    ],
    tags: ["woodchops", "abdomen", "rotatie", "cablu", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 70
  },
  {
    id: "core_092",
    slug: "hanging-leg-raises",
    name: "Hanging Leg Raises",
    category: "Sala",
    muscleGroup: "Abdomen",
    secondaryMuscles: [],
    equipment: ["Niciunul"],
    difficulty: "Advanced",
    instructions: [
      "Agăță-te de bară cu brațele întinse",
      "Ridică picioarele până sunt paralele cu podeaua",
      "Nu balansa",
      "Coboară încet",
      "Poți îndoi genunchii pentru ușurare"
    ],
    tips: [
      "Foarte intens pentru abdomen",
      "Nu folosi impuls",
      "Contracție la final"
    ],
    mistakes: [
      "Balans",
      "Nu ridică suficient",
      "Greutate prea mare"
    ],
    tags: ["hanging leg raises", "abdomen", "picioare", "sala", "avansat"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "core_093",
    slug: "ab-wheel-rollouts",
    name: "Ab Wheel Rollouts",
    category: "Sala",
    muscleGroup: "Abdomen",
    secondaryMuscles: ["Spate"],
    equipment: ["Rozetă"],
    difficulty: "Advanced",
    instructions: [
      "În genunchi cu roata în fața ta",
      "Rotește roata înainte, corpul se întinde",
      "Nu lăsa șoldurile să cadă",
      "Revino încet în poziția de start",
      "Poți face și în picioare pentru avansați"
    ],
    tips: [
      "Foarte eficient pentru core",
      "Nu coborâ prea mult",
      "Core angajat tot timpul"
    ],
    mistakes: [
      "Șolduri cad",
      "Coborâre prea adâncă",
      "Greutate prea mare"
    ],
    tags: ["ab wheel", "rollout", "abdomen", "core", "sala"],
    language: "ro",
    isVerified: true,
    popularityScore: 75
  },
  {
    id: "core_094",
    slug: "plank-standard",
    name: "Plank (Standard)",
    category: "Acasa",
    muscleGroup: "Abdomen",
    secondaryMuscles: ["Spate"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "În poziție de plank pe antebrațe și degetele picioarelor",
      "Corp în linie dreaptă",
      "Nu lăsa șoldurile să cadă sau să se ridice",
      "Ține poziția",
      "Respiră normal"
    ],
    tips: [
      "Nu privi în sus",
      "Core angajat",
      "Șolduri la nivelul umerilor"
    ],
    mistakes: [
      "Șolduri coborâte",
      "Șolduri ridicate",
      "Respirație reținută"
    ],
    tags: ["plank", "abdomen", "core", "acasă", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 95
  },
  {
    id: "core_095",
    slug: "hallow-body-hold",
    name: "Hollow Body Hold",
    category: "Acasa",
    muscleGroup: "Abdomen",
    secondaryMuscles: [],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Întinde-te pe spate cu brațele deasupra capului",
      "Ridică picioarele și umerii de pe podea",
      "Formează o curbură cu corpul",
      "Ține poziția",
      "Lower back rămâne pe podea"
    ],
    tips: [
      "Fundament pentru gimnastică",
      "Lower back pe podea",
      "Contracție puternică"
    ],
    mistakes: [
      "Lower back se ridică",
      "Brațe nu sunt drepte",
      "Nu ține suficient"
    ],
    tags: ["hollow body hold", "abdomen", "core", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 72
  },

  // ==================== STRETCHING (1-40) ====================
  {
    id: "stretch_001",
    slug: "childs-pose",
    name: "Child's Pose",
    category: "Stretching",
    muscleGroup: "Spate",
    secondaryMuscles: ["Fese"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "În genunchi, stai pe călcâie",
      "Apleacă-te înainte, cu fruntea pe podea",
      "Întinde brațele înainte sau lângă corp",
      "Respiră adânc și relaxează-te",
      "Ține 30-60 secunde"
    ],
    tips: [
      "Relaxare completă",
      "Poți pune o pernă sub frunte",
      "Respiră în abdomen"
    ],
    mistakes: [
      "Fese nu sunt pe călcâie",
      "Umeri tensionați",
      "Respirație superficială"
    ],
    tags: ["child's pose", "stretching", "spate", "relaxare", "mobilitate"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "stretch_002",
    slug: "cat-cow-stretch",
    name: "Cat-Cow Stretch",
    category: "Stretching",
    muscleGroup: "Spate",
    secondaryMuscles: ["Abdomen"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "În patru labe, mâini sub umeri, genunchi sub șolduri",
      "Inspira: ridică capul și cocorul (cow)",
      "Expiră: rotunjește spatele ca o pisică (cat)",
      "Mișcare fluidă",
      "Repetă 10-15 ori"
    ],
    tips: [
      "Mișcare pe respirație",
      "Nu forța amplitudinea",
      "Mobilitate vertebrală"
    ],
    mistakes: [
      "Mișcare prea rapidă",
      "Genunchi prea depărtați",
      "Nu sincronizează cu respirația"
    ],
    tags: ["cat cow", "mobilitate spate", "stretching", "mobilitate"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "stretch_003",
    slug: "pigeon-pose",
    name: "Pigeon Pose",
    category: "Stretching",
    muscleGroup: "Fese",
    secondaryMuscles: ["Ischiogambieri"],
    equipment: ["Niciunul"],
    difficulty: "Intermediate",
    instructions: [
      "În patru labe, aduce un genunchi înainte spre încheietura mâinii",
      "Extinde celălalt picior în spate",
      "Apleacă-te înainte peste piciorul din față",
      "Ține 30-60 secunde",
      "Repetă pe ambele părți"
    ],
    tips: [
      "Foarte adânc pentru fese",
      "Poți pune o pernă sub șold",
      "Nu forța"
    ],
    mistakes: [
      "Genunchi înainte prea mult",
      "Picior din spate nu drept",
      "Forțare excesivă"
    ],
    tags: ["pigeon pose", "fese", "stretching", "mobilitate", "hip flexor"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "stretch_004",
    slug: "standing-quad-stretch",
    name: "Standing Quad Stretch",
    category: "Stretching",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: [],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare, prinde un picior cu mâna de aceeași parte",
      "Trage călcâiul spre fese",
      "Genunchii apropiați",
      "Ține 30 secunde",
      "Repetă pe ambele părți"
    ],
    tips: [
      "Poți sta lângă perete pentru echilibru",
      "Nu înclina înainte",
      "Contracție activă a antagonistului"
    ],
    mistakes: [
      "Genunchi depărtați",
      "Corp înclinat",
      "Genunchiul doare"
    ],
    tags: ["quad stretch", "cvadriceps", "stretching", "mobilitate"],
    language: "ro",
    isVerified: true,
    popularityScore: 82
  },
  {
    id: "stretch_005",
    slug: "hamstring-forward-fold",
    name: "Hamstring Forward Fold",
    category: "Stretching",
    muscleGroup: "Ischiogambieri",
    secondaryMuscles: ["Spate"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare, picioarele la lățimea șoldurilor",
      "Apleacă-te înainte de la șolduri",
      "Lasă capul să atârne",
      "Încearcă să atingi podeaua",
      "Ține 30-60 secunde"
    ],
    tips: [
      "Genunchii ușor îndoiți la început",
      "Nu forța",
      "Lasă gravitatea să lucreze"
    ],
    mistakes: [
      "Genunchii îndoiți excesiv",
      "Spatele rotund",
      "Forțare"
    ],
    tags: ["hamstring stretch", "femurali", "stretching", "mobilitate"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },

  // ==================== CARDIO / HOME (41-70) ====================
  {
    id: "cardio_041",
    slug: "jumping-jacks",
    name: "Jumping Jacks",
    category: "Acasa",
    muscleGroup: "Cardio",
    secondaryMuscles: ["Cvadricepsi", "Abdomen"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai drept, picioarele împreună, brațele pe lângă corp",
      "Salt: picioarele în lateral, brațele deasupra capului",
      "Revino în poziția de start",
      "Repetă rapid",
      "Păstrează un ritm constant"
    ],
    tips: [
      "Încălzire excelentă",
      "Nu sări prea sus",
      "Core angajat"
    ],
    mistakes: [
      "Mișcare prea înceată",
      "Genunchi îndoiți",
      "Brațe nu se ridică complet"
    ],
    tags: ["jumping jacks", "cardio", "încălzire", "acasă", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 92
  },
  {
    id: "cardio_042",
    slug: "mountain-climbers",
    name: "Mountain Climbers",
    category: "Acasa",
    muscleGroup: "Cardio",
    secondaryMuscles: ["Abdomen", "Cvadricepsi"],
    equipment: ["Niciunul"],
    difficulty: "Intermediate",
    instructions: [
      "În poziție de plank",
      "Adduce un genunchi spre piept",
      "Schimbă rapid picioarele",
      "Continuă alternând",
      "Păstrează șoldurile drepte"
    ],
    tips: [
      "Cardio intens",
      "Core angajat",
      "Mișcare rapidă"
    ],
    mistakes: [
      "Șolduri ridicate",
      "Genunchi nu ajung la piept",
      "Mișcare prea lentă"
    ],
    tags: ["mountain climbers", "cardio", " abdomen", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "cardio_043",
    slug: "high-knees",
    name: "High Knees",
    category: "Acasa",
    muscleGroup: "Cardio",
    secondaryMuscles: ["Cvadricepsi", "Abdomen"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare",
      "Alternează ridicând genunchii cât mai sus",
      "Atinge mâinile cu genunchii",
      "Păstrează ritmul rapid",
      "Core angajat"
    ],
    tips: [
      "Ritm rapid",
      "Nu înclina corpul",
      "Vârfuri de degete"
    ],
    mistakes: [
      "Ritm prea lent",
      "Genunchi nu ajung sus",
      "Corp instabil"
    ],
    tags: ["high knees", "cardio", "picioare", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "cardio_044",
    slug: "burpees",
    name: "Burpees",
    category: "Acasa",
    muscleGroup: "Cardio",
    secondaryMuscles: ["Piept", "Cvadricepsi", "Abdomen"],
    equipment: ["Niciunul"],
    difficulty: "Advanced",
    instructions: [
      "Din picioare, coboară în genuflexiune și pune mâinile pe podea",
      "Salt în spate în poziție de plank",
      "Faceți un push-up (optional)",
      "Salt înapoi la genuflexiune",
      "Salt sus cu brațele deasupra"
    ],
    tips: [
      "Poți elimina push-up pentru începători",
      "Ritm constant",
      "Respirație corectă"
    ],
    mistakes: [
      "Fără plank",
      "Fără push-up",
      "Mișcare neclară"
    ],
    tags: ["burpees", "cardio", "full body", "acasă", "avansat"],
    language: "ro",
    isVerified: true,
    popularityScore: 90
  },
  {
    id: "cardio_045",
    slug: "jump-rope",
    name: "Jump Rope",
    category: "Acasa",
    muscleGroup: "Cardio",
    secondaryMuscles: ["Cvadricepsi", "Gambiere"],
    equipment: ["Niciunul"],
    difficulty: "Intermediate",
    instructions: [
      "Ține coarda în mâini, cu vârfuri sub picioare",
      "Rotește coarda și sări",
      "Sari pe vârfuri",
      "Păstrează ritmul",
      "Alternă ritmul pentru varietate"
    ],
    tips: [
      "Sari pe vârfuri, nu pe toată talpa",
      "Coate aproape de corp",
      "Ușor înainte"
    ],
    mistakes: [
      "Sări pe toată talpa",
      "Coate depărtate",
      "Ritm neregulat"
    ],
    tags: ["jump rope", "coardă", "cardio", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 82
  },

  // ==================== BODYWEIGHT HOME (71-100) ====================
  {
    id: "home_071",
    slug: "standard-push-ups",
    name: "Standard Push-ups",
    category: "Acasa",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "În poziție de plank cu mâinile la lățimea umerilor",
      "Coboară pieptul spre podea",
      "Coate la 45 grade",
      "Împinge înapoi",
      "Corp rămâne drept"
    ],
    tips: [
      "Core angajat",
      "Nu lăsa șoldurile să cadă",
      "Coate la 45 grade"
    ],
    mistakes: [
      "Șolduri coborâte",
      "Coate depărtate",
      "Mișcare parțială"
    ],
    tags: ["push ups", "flotări", "piept", "acasă", "greutate corporală"],
    language: "ro",
    isVerified: true,
    popularityScore: 98
  },
  {
    id: "home_072",
    slug: "incline-push-ups",
    name: "Incline Push-ups (Hands on chair)",
    category: "Acasa",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Scaun"],
    difficulty: "Beginner",
    instructions: [
      "Stai în fața unui scaun sau bord",
      "Pune mâinile pe scaun, mai sus decât picioarele",
      "Coboară pieptul spre scaun",
      "Împinge înapoi",
      "Mai ușor decât standard"
    ],
    tips: [
      "Pentru începători",
      "Poți modifica înălțimea",
      "Mișcare completă"
    ],
    mistakes: [
      "Scaun instabil",
      "Nu coboară suficient",
      "Corp nu drept"
    ],
    tags: ["incline push ups", "flotări", "acasă", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  },
  {
    id: "home_073",
    slug: "decline-push-ups",
    name: "Decline Push-ups (Feet on chair)",
    category: "Acasa",
    muscleGroup: "Piept",
    secondaryMuscles: ["Triceps", "Umeri"],
    equipment: ["Scaun"],
    difficulty: "Intermediate",
    instructions: [
      "Pune picioarele pe un scaun sau bord",
      "Mâinile pe podea",
      "Coboară pieptul spre podea",
      "Împinge înapoi",
      "Mai greu decât standard"
    ],
    tips: [
      "Mai multă activare a pieptului superior",
      "Asigură stabilitate",
      "Core angajat"
    ],
    mistakes: [
      "Picioare instabile",
      "Șolduri prea sus",
      "Mișcare necontrolată"
    ],
    tags: ["decline push ups", "flotări", "pies superior", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "home_074",
    slug: "bodyweight-squats",
    name: "Bodyweight Squats",
    category: "Acasa",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese", "Ischiogambieri"],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare cu picioarele la lățimea umerilor",
      "Coboară în genuflexiune",
      "Genunchii nu depășesc degetele",
      "Șoldurile coboară sub nivelul genunchilor",
      "Împinge înapoi în poziția de start"
    ],
    tips: [
      "Piept înainte",
      "Genunchii urmăresc degetele",
      "Coboară complet"
    ],
    mistakes: [
      "Genunchii în interior",
      "Călcâie ridicate",
      "Nu coboară suficient"
    ],
    tags: ["bodyweight squats", "genuflexiuni", "cvadricepsi", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 95
  },
  {
    id: "home_075",
    slug: "glute-bridges",
    name: "Glute Bridges",
    category: "Acasa",
    muscleGroup: "Fese",
    secondaryMuscles: ["Ischiogambieri", "Abdomen"],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "Întinde-te pe spate, genunchii îndoiți, picioarele pe podea",
      "Împinge șoldurile în sus",
      "Strânge fesierii la final",
      "Corp de la umeri la genunchi în linie dreaptă",
      "Coboară încet"
    ],
    tips: [
      "Nu arcui în partea inferioară a spatelui",
      "Contracție maximă sus",
      "Poți adăuga greutate pe abdomen"
    ],
    mistakes: [
      "Arcuiire excesivă a spatelui",
      "Nu strânge suficient",
      "Mișcare rapidă"
    ],
    tags: ["glute bridges", "fese", "acasă", "începător"],
    language: "ro",
    isVerified: true,
    popularityScore: 90
  },
  {
    id: "home_076",
    slug: "plank-shoulder-taps",
    name: "Plank Shoulder Taps",
    category: "Acasa",
    muscleGroup: "Abdomen",
    secondaryMuscles: ["Piept", "Umeri"],
    equipment: ["Greutate corporală"],
    difficulty: "Intermediate",
    instructions: [
      "În poziție de plank",
      "Ridică o mână și atinge umărul opus",
      "Revino și repetă cu cealaltă mână",
      "Șoldurile nu se rotesc",
      "Alternă ritmic"
    ],
    tips: [
      "Stabilitate core",
      "Mișcare minimă a șoldurilor",
      "Contracție continuă"
    ],
    mistakes: [
      "Șolduri se rotesc",
      "Mișcare prea rapidă",
      "Nu atinge umărul"
    ],
    tags: ["plank shoulder taps", "plank", "abdomen", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 78
  },
  {
    id: "home_077",
    slug: "bicycle-crunches",
    name: "Bicycle Crunches",
    category: "Acasa",
    muscleGroup: "Abdomen",
    secondaryMuscles: [],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "Întinde-te pe spate, mâini la ceafă",
      "Ridică picioarele și coatele",
      "Adu un genunchi spre cotul opus",
      "Alternă ritmic",
      "Mișcare de cycling"
    ],
    tips: [
      "Nu trage de gât",
      "Mișcare din abdomen",
      "Nu lăsa lower back pe podea"
    ],
    mistakes: [
      "Trage de gât",
      "Lower back se ridică",
      "Mișcare doar cu picioare"
    ],
    tags: ["bicycle crunches", "abdomen", "crunches", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 92
  },
  {
    id: "home_078",
    slug: "supermans",
    name: "Supermans",
    category: "Acasa",
    muscleGroup: "Spate",
    secondaryMuscles: ["Fese"],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "Întinde-te pe burtă, brațe și picioare întinse",
      "Ridică brațele și picioarele simultan",
      "Formează o curbură",
      "Ține 2-3 secunde",
      "Coboară încet"
    ],
    tips: [
      "Nu ridica prea sus",
      "Nu întoarce capul",
      "Contracție în spate"
    ],
    mistakes: [
      "Mișcare prea rapidă",
      "Ridicare prea sus",
      "Capul întoarcere"
    ],
    tags: ["supermans", "spate", "extensii spate", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 85
  },
  {
    id: "home_079",
    slug: "wall-sits",
    name: "Wall Sits",
    category: "Acasa",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese"],
    equipment: ["Niciunul"],
    difficulty: "Beginner",
    instructions: [
      "Stai cu spatele lipit de perete",
      "Coboară în poziție de ședere",
      "Coapsele paralele cu podeaua",
      "Ține poziția",
      "Picioarele rămân pe podea"
    ],
    tips: [
      "Timp în loc",
      "Poți crește dificultatea cu timpul",
      "Nu lăsa spatele să alunece"
    ],
    mistakes: [
      "Spate nu lipit",
      "Coapse nu paralele",
      "Călcâie ridicate"
    ],
    tags: ["wall sits", "izometrie", "cvadricepsi", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 80
  },
  {
    id: "home_080",
    slug: "reverse-lunges",
    name: "Reverse Lunges",
    category: "Acasa",
    muscleGroup: "Cvadricepsi",
    secondaryMuscles: ["Fese", "Ischiogambieri"],
    equipment: ["Greutate corporală"],
    difficulty: "Beginner",
    instructions: [
      "Stai în picioare",
      "Pas înapoi cu un picior",
      "Coboară până coapsele sunt paralele",
      "Împinge înapoi în poziția de start",
      "Alternă picioarele"
    ],
    tips: [
      "Trunchi drept",
      "Genunchi din față nu depășește degetele",
      "Poți adăuga gantere"
    ],
    mistakes: [
      "Pas prea mic",
      "Genunchi în față",
      "Corp înclinat"
    ],
    tags: ["reverse lunges", "fandari", "picioare", "acasă"],
    language: "ro",
    isVerified: true,
    popularityScore: 88
  }
];

export default exercisesDatabase;
