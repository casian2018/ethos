/**
 * Ethos Fitness App - Extended Seed Script
 * Seeds data for user PJ9ZNto2VpVaIiIHGnH9B2N3t203 and creates demo users/competitions
 * 
 * Usage: npx ts-node --project tsconfig.json scripts/seed-user.ts
 */

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJKJ9ZNto2VpVaIiIHGnH9B2N3t203",
  authDomain: "ethos-23570.firebaseapp.com",
  projectId: "ethos-23570",
  storageBucket: "ethos-23570.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your user ID
const MAIN_USER_ID = "PJ9ZNto2VpVaIiIHGnH9B2N3t203";

// Helper functions
const randomId = () => Math.random().toString(36).substring(2, 15);
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seedMainUserProfile() {
  console.log("👤 Seeding main user profile...");
  
  const userData = {
    id: MAIN_USER_ID,
    email: "opreacasian@gmail.com",
    displayName: "Oprea Casian",
    photoURL: null,
    age: 27,
    birthDate: "1998-03-14",
    gender: "male",
    city: "București",
    fitnessLevel: "intermediate",
    height: 175,
    weight: 72,
    bmi: 23.5,
    goals: ["muscle-gain", "endurance", "weight-loss"],
    preferredSports: ["gym", "running", "HIIT"],
    medicalConditions: [],
    daysPerWeek: 4,
    workoutDuration: 60,
    lookingForBuddy: true,
    createdAt: serverTimestamp(),
    streakDays: 7,
    totalWorkouts: 45,
    achievements: ["first-workout", "week-streak"]
  };
  
  await setDoc(doc(db, "users", MAIN_USER_ID), userData);
  console.log("  ✓ Created main user profile");
  
  return MAIN_USER_ID;
}

async function seedStepsAndCalories() {
  console.log("👟 Seeding steps and calories...");
  
  // Generate 30 days of step and calorie data
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    
    // More realistic step patterns
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseSteps = isWeekend ? 4000 : 8000;
    const steps = baseSteps + Math.floor(Math.random() * 8000);
    
    // Calories based on steps
    const calories = Math.floor(steps * 0.04) + 1500; // BMR + activity
    
    const dailyStats = {
      userId: MAIN_USER_ID,
      date: Timestamp.fromDate(date),
      steps,
      calories,
      activeMinutes: Math.floor(steps / 100),
      distance: Math.round(steps * 0.7 / 1000 * 10) / 10, // km
      floors: Math.floor(steps / 300),
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, "daily_stats"), dailyStats);
    await addDoc(collection(db, "steps"), {
      ...dailyStats,
      type: "steps"
    });
  }
  
  console.log("  ✓ Created 30 days of steps and calories data");
}

async function seedWorkouts() {
  console.log("💪 Seeding workouts...");
  
  const workoutTypes = ["strength", "cardio", "HIIT", "yoga", "stretching"];
  const workouts = [
    { name: "Antrenament Picioare + Glutei", type: "strength", exercises: [
      { name: "Genuflexiuni cu haltera", sets: 4, reps: 12, weight: 50 },
      { name: "Fandări", sets: 3, reps: 12, weight: 20 },
      { name: "Ridicări pe vârfuri", sets: 4, reps: 15, weight: 25 },
      { name: "Hip thrust", sets: 3, reps: 12, weight: 60 }
    ]},
    { name: "Upper Body Push", type: "strength", exercises: [
      { name: "Împins la piept", sets: 4, reps: 10, weight: 60 },
      { name: "Împins la umeri", sets: 3, reps: 12, weight: 25 },
      { name: "Triceps dips", sets: 3, reps: 15, weight: 0 },
      { name: "Flotări", sets: 3, reps: 20, weight: 0 }
    ]},
    { name: "Upper Body Pull", type: "strength", exercises: [
      { name: "Tracțiuni", sets: 4, reps: 8, weight: 0 },
      { name: "Ramat cu bara", sets: 4, reps: 10, weight: 40 },
      { name: "Pull over", sets: 3, reps: 12, weight: 20 },
      { name: "Curl cu bara", sets: 3, reps: 12, weight: 25 }
    ]},
    { name: "HIIT Full Body", type: "HIIT", exercises: [
      { name: "Burpees", duration: 1, reps: 15 },
      { name: "Mountain climbers", duration: 1, reps: 30 },
      { name: "Jump squats", duration: 1, reps: 15 },
      { name: "High knees", duration: 1, reps: 30 },
      { name: "Plank jacks", duration: 1, reps: 20 }
    ]},
    { name: "Cardio Intervals", type: "cardio", exercises: [
      { name: "Alergare sprint", duration: 1, reps: 8 },
      { name: "Alergare moderată", duration: 2, reps: 5 },
      { name: "Mers rapid", duration: 2, reps: 3 }
    ]},
    { name: "Yoga Recovery", type: "yoga", exercises: [
      { name: "Salutul soarelui", duration: 5, reps: 5 },
      { name: "Cobra stretch", duration: 2, reps: 5 },
      { name: "Downward dog", duration: 3, reps: 3 },
      { name: "Pigeon pose", duration: 3, reps: 2 }
    ]},
    { name: "Abs & Core", type: "strength", exercises: [
      { name: "Crunches", sets: 4, reps: 25, weight: 0 },
      { name: "Leg raises", sets: 3, reps: 20, weight: 0 },
      { name: "Plank", duration: 3, reps: 60 },
      { name: "Russian twists", sets: 3, reps: 30, weight: 10 }
    ]},
    { name: "Full Body Circuit", type: "HIIT", exercises: [
      { name: "Push ups", duration: 1, reps: 15 },
      { name: "Jump lunges", duration: 1, reps: 12 },
      { name: "Kettlebell swings", duration: 1, reps: 20 },
      { name: "Box jumps", duration: 1, reps: 12 }
    ]}
  ];
  
  // Create 20 workouts for main user
  for (let i = 0; i < 20; i++) {
    const workoutTemplate = workouts[i % workouts.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const workoutDate = new Date();
    workoutDate.setDate(workoutDate.getDate() - daysAgo);
    
    const workout = {
      id: `workout_${randomId()}`,
      userId: MAIN_USER_ID,
      name: workoutTemplate.name,
      type: workoutTemplate.type,
      exercises: workoutTemplate.exercises,
      duration: 30 + Math.floor(Math.random() * 45),
      caloriesBurned: 200 + Math.floor(Math.random() * 250),
      completed: true,
      date: Timestamp.fromDate(workoutDate),
      notes: i % 3 === 0 ? "Great workout! Feeling strong." : "",
      heartRateAvg: 130 + Math.floor(Math.random() * 30),
      heartRateMax: 170 + Math.floor(Math.random() * 20)
    };
    
    await addDoc(collection(db, "workouts"), workout);
  }
  
  console.log("  ✓ Created 20 workouts for main user");
}

async function seedSleepRecords() {
  console.log("😴 Seeding sleep records...");
  
  const sleepQuality = ["poor", "fair", "good", "excellent"];
  const chronotypes = ["bear", "wolf", "lion", "dolphin"];
  
  for (let day = 0; day < 30; day++) {
    const sleepDate = new Date();
    sleepDate.setDate(sleepDate.getDate() - day);
    
    // Random bedtime between 22:00 and 01:00
    const bedtime = new Date(sleepDate);
    bedtime.setHours(22 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
    
    // Wake time between 06:00 and 09:00
    const wakeTime = new Date(sleepDate);
    wakeTime.setDate(wakeTime.getDate() + 1);
    wakeTime.setHours(6 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
    
    const duration = 5.5 + Math.random() * 3; // 5.5-8.5 hours
    const quality = sleepQuality[Math.floor(Math.random() * sleepQuality.length)];
    
    const sleepData = {
      userId: MAIN_USER_ID,
      date: Timestamp.fromDate(sleepDate),
      bedtime: Timestamp.fromDate(bedtime),
      wakeTime: Timestamp.fromDate(wakeTime),
      duration: Math.round(duration * 10) / 10,
      quality,
      deepSleep: Math.round(duration * 0.18 * 10) / 10,
      lightSleep: Math.round(duration * 0.52 * 10) / 10,
      remSleep: Math.round(duration * 0.22 * 10) / 10,
      awakeTime: Math.round(duration * 0.08 * 10) / 10,
      heartRateAvg: 58 + Math.floor(Math.random() * 12),
      heartRateMin: 48 + Math.floor(Math.random() * 8),
      steps: Math.floor(Math.random() * 6000) + 3000,
      notes: quality === "poor" ? "Dificultăți la adormire" : "",
      chronotype: chronotypes[Math.floor(Math.random() * chronotypes.length)]
    };
    
    await addDoc(collection(db, "sleep_records"), sleepData);
    await addDoc(collection(db, "sleepRecords"), sleepData);
  }
  
  console.log("  ✓ Created 30 sleep records");
}

async function seedDemoUsers() {
  console.log("👥 Seeding demo users...");
  
  const demoUsers = [
    {
      id: "demo_maria_123",
      email: "maria@example.com",
      displayName: "Maria Popescu",
      photoURL: null,
      age: 28,
      birthDate: "1996-05-15",
      gender: "female",
      city: "București",
      fitnessLevel: "intermediate",
      height: 165,
      weight: 62,
      bmi: 22.8,
      goals: ["muscle-gain", "endurance"],
      preferredSports: ["gym", "running", "yoga"],
      medicalConditions: [],
      daysPerWeek: 4,
      workoutDuration: 60,
      lookingForBuddy: true,
      createdAt: serverTimestamp(),
      streakDays: 12,
      totalWorkouts: 87,
      achievements: ["first-workout", "week-streak", "early-bird"]
    },
    {
      id: "demo_alex_456",
      email: "alex@example.com",
      displayName: "Alex Ionescu",
      photoURL: null,
      age: 35,
      birthDate: "1989-08-22",
      gender: "male",
      city: "Cluj-Napoca",
      fitnessLevel: "advanced",
      height: 180,
      weight: 82,
      bmi: 25.3,
      goals: ["muscle-gain", "strength"],
      preferredSports: ["gym", "football"],
      medicalConditions: ["back-pain"],
      daysPerWeek: 5,
      workoutDuration: 90,
      lookingForBuddy: false,
      createdAt: serverTimestamp(),
      streakDays: 45,
      totalWorkouts: 234,
      achievements: ["month-streak", "gym-rat", "heavy-lifter"]
    },
    {
      id: "demo_elena_789",
      email: "elena@example.com",
      displayName: "Elena Dumitrescu",
      photoURL: null,
      age: 24,
      birthDate: "2000-02-10",
      gender: "female",
      city: "Timișoara",
      fitnessLevel: "beginner",
      height: 170,
      weight: 70,
      bmi: 24.2,
      goals: ["weight-loss", "flexibility"],
      preferredSports: ["yoga", "swimming"],
      medicalConditions: [],
      daysPerWeek: 3,
      workoutDuration: 45,
      lookingForBuddy: true,
      createdAt: serverTimestamp(),
      streakDays: 5,
      totalWorkouts: 23,
      achievements: ["first-workout"]
    },
    {
      id: "demo_cristi_321",
      email: "cristi@example.com",
      displayName: "Cristian Marinescu",
      photoURL: null,
      age: 42,
      birthDate: "1982-11-30",
      gender: "male",
      city: "București",
      fitnessLevel: "intermediate",
      height: 175,
      weight: 78,
      bmi: 25.5,
      goals: ["general-health", "stress-relief"],
      preferredSports: ["running", "cycling"],
      medicalConditions: ["hypertension"],
      daysPerWeek: 4,
      workoutDuration: 50,
      lookingForBuddy: false,
      createdAt: serverTimestamp(),
      streakDays: 20,
      totalWorkouts: 156,
      achievements: ["week-streak", "consistent"]
    },
    {
      id: "demo_ana_654",
      email: "ana@example.com",
      displayName: "Ana Georgescu",
      photoURL: null,
      age: 31,
      birthDate: "1993-07-18",
      gender: "female",
      city: "Iași",
      fitnessLevel: "intermediate",
      height: 162,
      weight: 58,
      bmi: 22.1,
      goals: ["muscle-gain", "tone-up"],
      preferredSports: ["gym", "HIIT"],
      medicalConditions: [],
      daysPerWeek: 5,
      workoutDuration: 60,
      lookingForBuddy: true,
      createdAt: serverTimestamp(),
      streakDays: 18,
      totalWorkouts: 98,
      achievements: ["first-workout", "week-streak", "HIIT-master"]
    }
  ];
  
  for (const user of demoUsers) {
    await setDoc(doc(db, "users", user.id), user);
    console.log(`  ✓ Created demo user: ${user.displayName}`);
  }
  
  return demoUsers.map(u => u.id);
}

async function seedCompetitions() {
  console.log("🏆 Seeding competitions...");
  
  const competitions = [
    {
      name: "Provocarea de 30 de Zile",
      description: "Antrenează-te în fiecare zi pentru 30 de zile consecutiv!",
      challengeType: "consistent-trainer",
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      dailyStepGoal: 10000,
      prize: "Medalie de Aur + 500 XP",
      participants: [MAIN_USER_ID, "demo_maria_123", "demo_alex_456"],
      createdBy: "demo_maria_123"
    },
    {
      name: "Step Hero Challenge",
      description: "Cel mai mare număr de pași în 2 săptămâni",
      challengeType: "step-hero",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      dailyStepGoal: 15000,
      prize: "Cupa Step Hero + 300 XP",
      participants: [MAIN_USER_ID, "demo_cristi_321", "demo_elena_789"],
      createdBy: "demo_cristi_321"
    },
    {
      name: "Martie - Luna Transformării",
      description: "Provocarea lunară de transformare fizică",
      challengeType: "weight-loss",
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      dailyStepGoal: 8000,
      prize: "Trofeu + 400 XP",
      participants: [MAIN_USER_ID, "demo_ana_654", "demo_elena_789", "demo_maria_123"],
      createdBy: "demo_ana_654"
    },
    {
      name: "Yoga Mind 7 Days",
      description: "7 zile consecutive de yoga pentru minte sănătoasă",
      challengeType: "meditation-mind",
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      dailyStepGoal: 5000,
      prize: "Badge Yoga Master + 200 XP",
      participants: [MAIN_USER_ID, "demo_elena_789"],
      createdBy: "demo_elena_789"
    },
    {
      name: "HIIT Warriors",
      description: "Provocarea HIIT pentru arderea maximă de calorii",
      challengeType: "hiit-challenge",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      dailyStepGoal: 7000,
      prize: "Badge HIIT Warrior + 350 XP",
      participants: [MAIN_USER_ID, "demo_alex_456", "demo_ana_654"],
      createdBy: "demo_alex_456"
    }
  ];
  
  for (const comp of competitions) {
    const competitionData = {
      name: comp.name,
      description: comp.description,
      challengeType: comp.challengeType,
      createdBy: comp.createdBy,
      participants: comp.participants,
      startDate: Timestamp.fromDate(comp.startDate),
      endDate: Timestamp.fromDate(comp.endDate),
      dailyStepGoal: comp.dailyStepGoal,
      prize: comp.prize,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "competitions"), competitionData);
    
    // Add participant progress entries
    for (const participantId of comp.participants) {
      const progress = {
        competitionId: docRef.id,
        userId: participantId,
        totalSteps: Math.floor(Math.random() * 50000) + 10000,
        workoutsCompleted: Math.floor(Math.random() * 10) + 1,
        joinedAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000))
      };
      await addDoc(collection(db, "competition_progress"), progress);
    }
    
    console.log(`  ✓ Created competition: ${comp.name}`);
  }
}

async function seedForumPosts(demoUserIds: string[]) {
  console.log("💬 Seeding forum posts...");
  
  const posts = [
    {
      title: "Cele mai bune proteine pentru masă musculară",
      content: "Sunt în căutarea celor mai bune surse de proteine pentru a construi masă musculară. Mănânc carne de pui, ouă, dar ce alte opțiuni am? Voi mânca și pește, dar nu sunt sigur care sunt cele mai bune opțiuni pentru a crește aportul de proteine.",
      category: "nutritie",
      difficulty: "beginner"
    },
    {
      title: "Cum să îmi îmbunătățesc somnul",
      content: "Am probleme cu adormitul seara. Am încercat melatonină și ceaiuri, dar nu funcționează. Ce alte strategii recomandați? Poate meditația sau exerciții de respirație?",
      category: "biohacking",
      difficulty: "intermediate"
    },
    {
      title: "Formă corectă la genuflexiuni",
      content: "Am început să fac genuflexiuni recent și vreau să mă asigur că am forma corectă pentru a evita accidentările. Care sunt greșelile comune pe care ar trebui să le evit?",
      category: "workout-tips",
      difficulty: "beginner"
    },
    {
      title: "Motivație pentru începători",
      content: "Abia am început să mă antrenez și uneori mă simt descurajat. Cum v-ați menținut motivația în primele luni? Ce sfaturi aveți pentru a rămâne consistent?",
      category: "suport",
      difficulty: "beginner"
    },
    {
      title: "Dieta keto - merită?",
      content: "Am auzit multe despre dieta keto. Este eficientă pentru pierderea în greutate? Care sunt experiențele voastre cu această dietă? Există riscuri?",
      category: "nutritie",
      difficulty: "intermediate"
    },
    {
      title: "Rutina de dimineață pentru productivitate",
      content: "Vreau să îmi creez o rutină de dimineață care să mă ajute să fiu mai productiv. Ce recomandați? Exerciții, meditație, expunere la lumină?",
      category: "biohacking",
      difficulty: "intermediate"
    },
    {
      title: "Cum să evit plateau-ul în pierdere",
      content: "Am pierdut 5 kg în ultima lună, dar acum nu mai scad. Ce pot face pentru a depăși acest plateau? Ar trebui să schimb ceva în dietă?",
      category: "suport",
      difficulty: "advanced"
    },
    {
      title: "Antrenament pentru abdomen",
      content: "Care sunt cele mai eficiente exerciții pentru abdomen? Fac abdomene dar nu văd rezultate. Este posibil că am nevoie de alt tip de exerciții?",
      category: "workout-tips",
      difficulty: "intermediate"
    },
    {
      title: "Suplimente - ce să iau?",
      content: "Sunt nou în lumea suplimentelor. Ce suplimente sunt esențiale pentru un antrenament eficient? Creantină, proteine,BCAA?",
      category: "nutritie",
      difficulty: "beginner"
    },
    {
      title: "Cum să mă antrenez acasă fără echipament",
      content: "Nu am acces la o sală de forță. Ce exerciții pot face acasă fără echipament? Am doar o saltea și o bandă de rezistență.",
      category: "workout-tips",
      difficulty: "beginner"
    },
    {
      title: "Importanța recuperării între antrenamente",
      content: "Am observat că mă antrenez prea mult și nu mai văd progrese. Cât de importantă este recuperarea și câte zile de pauză ar trebui să am?",
      category: "workout-tips",
      difficulty: "intermediate"
    },
    {
      title: "Ghid pentru începători în sală",
      content: "Voi începe să mă antrenez în sală și sunt puțin intimidat. Ce ar trebui să știu? Cum să folosesc echipamentele în siguranță?",
      category: "suport",
      difficulty: "beginner"
    }
  ];
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const authorId = demoUserIds[i % demoUserIds.length];
    const daysAgo = Math.floor(Math.random() * 14);
    
    const postData = {
      title: post.title,
      content: post.content,
      authorId,
      category: post.category,
      difficulty: post.difficulty,
      likes: demoUserIds.slice(0, Math.floor(Math.random() * 3)),
      dislikes: [],
      commentCount: Math.floor(Math.random() * 8),
      createdAt: Timestamp.fromDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)),
      isVerifiedExpert: i < 3
    };
    
    const docRef = await addDoc(collection(db, "forum_posts"), postData);
    
    // Add some replies
    if (i < 8) {
      for (let j = 0; j < Math.floor(Math.random() * 4) + 1; j++) {
        const replyAuthor = demoUserIds[(i + j + 1) % demoUserIds.length];
        const reply = {
          postId: docRef.id,
          authorId: replyAuthor,
          content: [
            "Foarte utilă informația, mulțumesc!",
            "Sunt de acord cu tine. Am încercat asta și funcționează.",
            "Interesant punct de vedere. Ai mai multe detalii?",
            "Eu am avut o experiență similară. Recomand!",
            "Nu ai menționat despre X. Ar fi util pentru cei care abia încep."
          ][Math.floor(Math.random() * 5)],
          likes: [],
          createdAt: Timestamp.fromDate(new Date(Date.now() - (daysAgo - 1) * 24 * 60 * 60 * 1000))
        };
        await addDoc(collection(db, "forum_replies"), reply);
      }
    }
    
    console.log(`  ✓ Created forum post: ${post.title}`);
  }
}

async function seedActivityFeed() {
  console.log("📱 Seeding activity feed...");
  
  const activityTypes = ["workout", "achievement", "buddy", "competition", "streak", "forum"];
  
  for (let i = 0; i < 25; i++) {
    const userId = Math.random() > 0.5 ? MAIN_USER_ID : "demo_maria_123";
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const daysAgo = Math.floor(Math.random() * 7);
    
    let activity: Record<string, unknown> = {
      userId,
      type,
      createdAt: Timestamp.fromDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000))
    };
    
    switch (type) {
      case "workout":
        activity = {
          ...activity,
          workoutName: ["Antrenament Picioare", "Cardio", "Yoga", "HIIT", "Upper Body"][Math.floor(Math.random() * 5)],
          duration: 30 + Math.floor(Math.random() * 60),
          calories: 200 + Math.floor(Math.random() * 300)
        };
        break;
      case "achievement":
        const achievements = ["first-workout", "week-streak", "early-bird", "gym-rat"];
        activity = {
          ...activity,
          achievementId: achievements[Math.floor(Math.random() * achievements.length)],
          achievementName: "A atins un obiectiv nou!"
        };
        break;
      case "streak":
        activity = {
          ...activity,
          streakDays: 5 + Math.floor(Math.random() * 20),
          message: "zile de streak consecutive!"
        };
        break;
      case "competition":
        activity = {
          ...activity,
          competitionName: ["Provocarea de 30 de Zile", "Step Hero"][Math.floor(Math.random() * 2)],
          action: "s-a alăturat"
        };
        break;
    }
    
    await addDoc(collection(db, "activity_feed"), activity);
  }
  
  console.log("  ✓ Created activity feed entries");
}

async function seedAchievements() {
  console.log("🏅 Seeding achievements...");
  
  const achievements = [
    { id: "first-workout", name: "Primul Antrenament", description: "Ai completat primul antrenament", icon: "🎯", points: 50 },
    { id: "week-streak", name: "Săptămână de Streak", description: "7 zile consecutive de antrenament", icon: "🔥", points: 100 },
    { id: "month-streak", name: "Lună de Streak", description: "30 de zile consecutive de antrenament", icon: "💎", points: 500 },
    { id: "early-bird", name: "Păsărele", description: "Antrenament înainte de ora 7 dimineața", icon: "🌅", points: 75 },
    { id: "night-owl", name: "Noapte Albă", description: "Antrenament după ora 22", icon: "🦉", points: 75 },
    { id: "gym-rat", name: "Fanul Sălii", description: "20 de antrenamente în sală", icon: "🏋️", points: 150 },
    { id: "heavy-lifter", name: "Halterofil", description: "Ridică 100kg la genuflexiuni", icon: "💪", points: 200 },
    { id: "marathon-runner", name: "Maratonist", description: "Alergare de 42km în total", icon: "🏃", points: 300 },
    { id: "yoga-master", name: "Maestru Yoga", description: "30 de sesiuni de yoga", icon: "🧘", points: 200 },
    { id: "social-butterfly", name: "Fluture Social", description: "10 parteneri de antrenament", icon: "🦋", points: 100 },
    { id: "consistent", name: "Consistent", description: "Antrenament de 3 ori pe săptămână timp de o lună", icon: "📅", points: 150 },
    { id: "hydrated", name: "Hidratat", description: "Bea 2L de apă zilnic timp de o săptămână", icon: "💧", points: 50 }
  ];

  for (const achievement of achievements) {
    await setDoc(doc(db, "achievements", achievement.id), achievement);
  }
  
  console.log("  ✓ Created achievements");
}

async function seedBuddyRequests() {
  console.log("🤝 Seeding buddy requests...");
  
  const buddies = [
    { from: MAIN_USER_ID, to: "demo_maria_123", sport: "gym", status: "accepted" },
    { from: "demo_alex_456", to: MAIN_USER_ID, sport: "running", status: "accepted" },
    { from: MAIN_USER_ID, to: "demo_elena_789", sport: "yoga", status: "pending" },
    { from: "demo_cristi_321", to: MAIN_USER_ID, sport: "cycling", status: "pending" }
  ];

  for (const buddy of buddies) {
    const buddyData = {
      ...buddy,
      createdAt: Timestamp.fromDate(randomDate(new Date(2024, 0, 1), new Date()))
    };
    await addDoc(collection(db, "buddy_requests"), buddyData);
  }
  
  console.log("  ✓ Created buddy requests");
}

async function seedAvailabilitySlots() {
  console.log("📅 Seeding availability slots...");
  
  const sports = ["gym", "running", "yoga", "cycling", "swimming", "football", "tennis", "HIIT"];
  const cities = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Craiova"];
  const locations = [
    { name: "Sala Sporturilor", address: "Str. Principală Nr. 1" },
    { name: "Parcul Central", address: "Aleea Parcului" },
    { name: "World Class", address: "Bulevardi Victoria" },
    { name: "Stay Fit", address: "Str. Libertății" },
    { name: "Smart Gym", address: "Str. Mihai Viteazul" },
    { name: "Stadion Municipal", address: "Str. Sportului Nr. 5" },
    { name: "Piscina Olimpică", address: "Bulevardi Dunărea" },
    { name: "Studio Yoga", address: "Str. Pacea Nr. 12" }
  ];
  
  // Create many slots for main user
  for (let i = 0; i < 15; i++) {
    const daysAhead = 1 + Math.floor(Math.random() * 14);
    const slotDate = new Date();
    slotDate.setDate(slotDate.getDate() + daysAhead);
    slotDate.setHours(7 + Math.floor(Math.random() * 12), 0, 0);
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    const isPaid = Math.random() > 0.5;
    
    const slot = {
      hostId: MAIN_USER_ID,
      hostName: "Oprea Casian",
      sportType: sports[Math.floor(Math.random() * sports.length)],
      city: cities[Math.floor(Math.random() * cities.length)],
      dateTime: Timestamp.fromDate(slotDate),
      duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
      genderPreference: ["anyone", "M", "F"][Math.floor(Math.random() * 3)],
      location: {
        name: location.name,
        address: location.address,
        isPaid,
        price: isPaid ? Math.floor(Math.random() * 50) + 10 : undefined,
        priceNote: isPaid ? `${Math.floor(Math.random() * 50) + 10} RON` : undefined,
      },
      status: "open",
      buddyId: null,
      description: ["Antrenament intens", "Sesiune de grup", "Începători bineveniți", "Nivel avansat", "Relaxat și prietenos"][Math.floor(Math.random() * 5)],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await addDoc(collection(db, "availability_slots"), slot);
  }
  
  // Create slots for demo users
  const demoUserIds = ["demo_maria_123", "demo_alex_456", "demo_elena_789", "demo_cristi_321", "demo_ana_654"];
  const demoNames = ["Maria Popescu", "Alex Ionescu", "Elena Dumitrescu", "Cristian Marinescu", "Ana Georgescu"];
  
  for (let u = 0; u < demoUserIds.length; u++) {
    for (let i = 0; i < 5 + Math.floor(Math.random() * 5); i++) {
      const daysAhead = 1 + Math.floor(Math.random() * 14);
      const slotDate = new Date();
      slotDate.setDate(slotDate.getDate() + daysAhead);
      slotDate.setHours(7 + Math.floor(Math.random() * 12), 0, 0);
      
      const location = locations[Math.floor(Math.random() * locations.length)];
      const isPaid = Math.random() > 0.6;
      
      const slot = {
        hostId: demoUserIds[u],
        hostName: demoNames[u],
        sportType: sports[Math.floor(Math.random() * sports.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        dateTime: Timestamp.fromDate(slotDate),
        duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
        genderPreference: ["anyone", "M", "F"][Math.floor(Math.random() * 3)],
        location: {
          name: location.name,
          address: location.address,
          isPaid,
          price: isPaid ? Math.floor(Math.random() * 50) + 10 : undefined,
          priceNote: isPaid ? `${Math.floor(Math.random() * 50) + 10} RON` : undefined,
        },
        status: "open",
        buddyId: null,
        description: ["Antrenament intens", "Sesiune de grup", "Începători bineveniți", "Nivel avansat", "Relaxat și prietenos"][Math.floor(Math.random() * 5)],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "availability_slots"), slot);
    }
  }
  
  console.log("  ✓ Created availability slots for all users");
}

// Main execution
async function seedDatabase() {
  console.log("\n🚀 Starting Ethos Database Seed for user " + MAIN_USER_ID + "...\n");
  
  try {
    await seedMainUserProfile();
    await seedStepsAndCalories();
    await seedWorkouts();
    await seedSleepRecords();
    const demoUserIds = await seedDemoUsers();
    await seedCompetitions();
    await seedForumPosts(demoUserIds);
    await seedActivityFeed();
    await seedAchievements();
    await seedBuddyRequests();
    await seedAvailabilitySlots();
    
    console.log("\n✅ Database seeding completed successfully!");
    console.log(`\n📊 Created data for user: ${MAIN_USER_ID}`);
    console.log(`   - 30 days of step & calorie data`);
    console.log(`   - 20 workouts`);
    console.log(`   - 30 sleep records`);
    console.log(`   - 5 demo users`);
    console.log(`   - 5 competitions with progress`);
    console.log(`   - 12 forum posts with replies`);
    console.log(`   - Activity feed entries`);
    console.log(`   - 12 achievements`);
    console.log(`   - Buddy relationships`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
  
  process.exit(0);
}

seedDatabase();
