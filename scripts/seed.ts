/**
 * Ethos Fitness App - Database Seed Script
 * Run this script to populate Firestore with demo data
 * 
 * Usage: npx ts-node scripts/seed.ts
 * Or: npm run seed
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

// Firebase configuration - update with your project details
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ethos-23570.firebaseapp.com",
  projectId: "ethos-23570",
  storageBucket: "ethos-23570.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to generate random dates within a range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to generate random ID
const randomId = () => Math.random().toString(36).substring(2, 15);

// User IDs for references
const userIds: string[] = [];
const workoutIds: string[] = [];
const competitionIds: string[] = [];
const forumPostIds: string[] = [];

// ============ SEED FUNCTIONS ============

async function seedUsers() {
  console.log("🌱 Seeding users...");
  
  const users = [
    {
      id: "user_demo_1",
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
      id: "user_demo_2",
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
      id: "user_demo_3",
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
      id: "user_demo_4",
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
      id: "user_demo_5",
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

  for (const user of users) {
    userIds.push(user.id);
    await setDoc(doc(db, "users", user.id), user);
    console.log(`  ✓ Created user: ${user.displayName}`);
  }
  
  return userIds;
}

async function seedWorkouts() {
  console.log("💪 Seeding workouts...");
  
  const workoutTypes = ["strength", "cardio", "yoga", "HIIT", "stretching"];
  const exercises = {
    strength: [
      { name: "Genuflexiuni cu haltera", sets: 4, reps: 12, weight: 40 },
      { name: "Împins la piept", sets: 4, reps: 10, weight: 50 },
      { name: "Răsuciri cu bara", sets: 3, reps: 15, weight: 30 },
      { name: "Flotări", sets: 3, reps: 20, weight: 0 },
      { name: "Fandări", sets: 3, reps: 12, weight: 15 }
    ],
    cardio: [
      { name: "Alergare pe bandă", duration: 30, incline: 1 },
      { name: "Ciclistica", duration: 25, resistance: 8 },
      { name: "Elliptical", duration: 20, resistance: 5 }
    ],
    yoga: [
      { name: "Salutul soarelui", duration: 5, reps: 10 },
      { name: "Posea warrior", duration: 3, reps: 3 },
      { name: "Cobra stretch", duration: 2, reps: 5 },
      { name: "Downward dog", duration: 3, reps: 3 }
    ],
    HIIT: [
      { name: "Burpees", duration: 1, reps: 15 },
      { name: "Mountain climbers", duration: 1, reps: 20 },
      { name: "Jump squats", duration: 1, reps: 15 },
      { name: "High knees", duration: 1, reps: 30 }
    ],
    stretching: [
      { name: "Stretching cvadriceps", duration: 2 },
      { name: "Stretching femurali", duration: 2 },
      { name: "Stretching umeri", duration: 2 }
    ]
  };

  const workoutNames = {
    strength: ["Antrenament Picioare", "Antrenament Piept", "Antrenament Spate", "Full Body", "Upper Body"],
    cardio: ["Cardio Dimineața", "HIIT Cardio", "Endurance Training"],
    yoga: ["Yoga Relaxare", "Yoga Dimineața", "Yoga Stretch"],
    HIIT: ["HIIT 30 min", "Tabata", "Full Body HIIT"],
    stretching: ["Stretching Full Body", "Recovery Day"]
  };

  // Generate workouts for each user
  for (let i = 0; i < 25; i++) {
    const userId = userIds[i % userIds.length];
    const type = workoutTypes[i % workoutTypes.length];
    const workoutExercises = exercises[type as keyof typeof exercises];
    const names = workoutNames[type as keyof typeof workoutNames];
    
    const daysAgo = Math.floor(Math.random() * 30);
    const workoutDate = new Date();
    workoutDate.setDate(workoutDate.getDate() - daysAgo);
    
    const workout = {
      id: `workout_${randomId()}`,
      userId,
      name: names[i % names.length],
      type,
      exercises: workoutExercises,
      duration: 30 + Math.floor(Math.random() * 60),
      caloriesBurned: 150 + Math.floor(Math.random() * 300),
      completed: true,
      date: Timestamp.fromDate(workoutDate),
      notes: i % 3 === 0 ? "Great workout! Feeling strong." : "",
      heartRateAvg: 120 + Math.floor(Math.random() * 40),
      heartRateMax: 160 + Math.floor(Math.random() * 30)
    };
    
    const docRef = await addDoc(collection(db, "workouts"), workout);
    workoutIds.push(docRef.id);
    console.log(`  ✓ Created workout: ${workout.name}`);
  }
}

async function seedSleepData() {
  console.log("😴 Seeding sleep data...");
  
  const sleepQuality = ["poor", "fair", "good", "excellent"];
  const chronotypes = ["bear", "wolf", "lion", "dolphin"];
  
  // Generate 4 weeks of sleep data for each user
  for (const userId of userIds) {
    const chronotype = chronotypes[Math.floor(Math.random() * chronotypes.length)];
    
    for (let day = 0; day < 28; day++) {
      const sleepDate = new Date();
      sleepDate.setDate(sleepDate.getDate() - day);
      
      // Randomize sleep metrics
      const bedtime = new Date(sleepDate);
      bedtime.setHours(22 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
      
      const wakeTime = new Date(sleepDate);
      wakeTime.setDate(wakeTime.getDate() + 1);
      wakeTime.setHours(6 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
      
      const duration = 5 + Math.random() * 4; // 5-9 hours
      const quality = sleepQuality[Math.floor(Math.random() * sleepQuality.length)];
      
      const sleepData = {
        userId,
        date: Timestamp.fromDate(sleepDate),
        bedtime: Timestamp.fromDate(bedtime),
        wakeTime: Timestamp.fromDate(wakeTime),
        duration: Math.round(duration * 10) / 10,
        quality,
        deepSleep: Math.round(duration * 0.2 * 10) / 10,
        lightSleep: Math.round(duration * 0.5 * 10) / 10,
        remSleep: Math.round(duration * 0.2 * 10) / 10,
        awakeTime: Math.round(duration * 0.1 * 10) / 10,
        heartRateAvg: 55 + Math.floor(Math.random() * 15),
        heartRateMin: 45 + Math.floor(Math.random() * 10),
        steps: Math.floor(Math.random() * 5000),
        notes: quality === "poor" ? "Had trouble falling asleep" : "",
        chronotype
      };
      
      await addDoc(collection(db, "sleep_records"), sleepData);
    }
    console.log(`  ✓ Created sleep data for user ${userId}`);
  }
}

async function seedForumPosts() {
  console.log("💬 Seeding forum posts...");
  
  const categories = ["nutritie", "biohacking", "workout-tips", "suport", "discutii"];
  const difficulties = ["beginner", "intermediate", "advanced"];
  
  const posts = [
    {
      title: "Cele mai bune proteine pentru masă musculară",
      content: "Sunt în căutarea celor mai bune surse de proteine pentru a construi masă musculară. Mănânc carne de pui, ouă, dar ce alte opțiuni am?",
      category: "nutritie",
      difficulty: "beginner"
    },
    {
      title: "Cum să îmi îmbunătățesc somnul",
      content: "Am probleme cu adormitul seara. Am încercat melatonină și ceaiuri, dar nu funcționează. Ce alte strategii recomandați?",
      category: "biohacking",
      difficulty: "intermediate"
    },
    {
      title: "Formă corectă la genuflexiuni",
      content: "Am început să fac genuflexiuni recent și vreau să mă asigur că am forma corectă pentru a evita accidentările.",
      category: "workout-tips",
      difficulty: "beginner"
    },
    {
      title: "Motivație pentru începători",
      content: "Abia am început să mă antrenez și uneori mă simt descurajat. Cum v-ați menținut motivația în primele luni?",
      category: "suport",
      difficulty: "beginner"
    },
    {
      title: "Dieta keto - merită?",
      content: "Am auzit multe despre dieta keto. Este eficientă pentru pierderea în greutate? Care sunt experiențele voastre?",
      category: "nutritie",
      difficulty: "intermediate"
    },
    {
      title: "Rutina de dimineață pentru productivitate",
      content: "Vreau să îmi creez o rutină de dimineață care să mă ajute să fiu mai productiv. Ce recomandați?",
      category: "biohacking",
      difficulty: "intermediate"
    },
    {
      title: "Cum să evit plateau-ul în pierdere",
      content: "Am pierdut 5 kg în ultima lună, dar acum nu mai scad. Ce pot face pentru a depăși acest plateau?",
      category: "suport",
      difficulty: "advanced"
    },
    {
      title: "Antrenament pentru abdomen",
      content: "Care sunt cele mai eficiente exerciții pentru abdomen? Faccrisuri dar nu văd rezultate.",
      category: "workout-tips",
      difficulty: "intermediate"
    },
    {
      title: "Suplimente - ce să iau?",
      content: "Sunt nou în lumea suplimentelor. Ce suplimente sunt esențiale pentru un antrenament eficient?",
      category: "nutritie",
      difficulty: "beginner"
    },
    {
      title: "Cum să mă antrenez acasă fără echipament",
      content: "Nu am acces la o sală de forță. Ce exerciții pot face acasă fără echipament?",
      category: "workout-tips",
      difficulty: "beginner"
    }
  ];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const userId = userIds[i % userIds.length];
    const daysAgo = Math.floor(Math.random() * 14);
    
    const postData = {
      title: post.title,
      content: post.content,
      authorId: userId,
      category: post.category,
      difficulty: post.difficulty,
      likes: [],
      dislikes: [],
      commentCount: Math.floor(Math.random() * 10),
      createdAt: Timestamp.fromDate(new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)),
      isVerifiedExpert: i < 3
    };
    
    const docRef = await addDoc(collection(db, "forum_posts"), postData);
    forumPostIds.push(docRef.id);
    console.log(`  ✓ Created forum post: ${post.title}`);
  }
}

async function seedCompetitions() {
  console.log("🏆 Seeding competitions...");
  
  const competitions = [
    {
      name: "Provocarea de 30 de Zile",
      description: "Antrenează-te în fiecare zi pentru 30 de zile consecutiv!",
      challengeType: "consistent-trainer",
      dailyStepGoal: 10000,
      prize: "Medalie de Aur + 500 XP",
      days: 30
    },
    {
      name: "Step Hero Challenge",
      description: "Cel mai mare număr de pași în 2 săptămâni",
      challengeType: "step-hero",
      dailyStepGoal: 15000,
      prize: "Cupa Step Hero + 300 XP",
      days: 14
    },
    {
      name: "Luna lui Martie - Pierdere în Greutate",
      description: "Competiție de pierdere în greutate pentru luna martie",
      challengeType: "hydration-hero",
      dailyStepGoal: 8000,
      prize: "Trofeu + 400 XP",
      days: 31
    },
    {
      name: "Yoga Mind 7 Days",
      description: "7 zile consecutive de yoga pentru minte sănătoasă",
      challengeType: "meditation-mind",
      dailyStepGoal: 5000,
      prize: "Badge Yoga Master + 200 XP",
      days: 7
    },
    {
      name: "Winter Warriors",
      description: "Nu lăsa frigul să te oprească!",
      challengeType: "sleep-master",
      dailyStepGoal: 10000,
      prize: "Badge Winter Warrior + 350 XP",
      days: 21
    }
  ];

  for (const comp of competitions) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * comp.days));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + comp.days);
    
    const competitionData = {
      name: comp.name,
      description: comp.description,
      challengeType: comp.challengeType,
      createdBy: userIds[Math.floor(Math.random() * userIds.length)],
      participants: userIds.slice(0, 3 + Math.floor(Math.random() * 3)),
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      dailyStepGoal: comp.dailyStepGoal,
      prize: comp.prize,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "competitions"), competitionData);
    competitionIds.push(docRef.id);
    console.log(`  ✓ Created competition: ${comp.name}`);
  }
}

async function seedBuddies() {
  console.log("🤝 Seeding buddy relationships...");
  
  const buddyRequests = [
    { from: userIds[0], to: userIds[2], sport: "running", status: "accepted" },
    { from: userIds[2], to: userIds[0], sport: "yoga", status: "accepted" },
    { from: userIds[0], to: userIds[4], sport: "gym", status: "pending" },
    { from: userIds[1], to: userIds[3], sport: "football", status: "accepted" },
    { from: userIds[3], to: userIds[1], sport: "running", status: "accepted" },
    { from: userIds[4], to: userIds[0], sport: "HIIT", status: "pending" }
  ];

  for (const buddy of buddyRequests) {
    const buddyData = {
      ...buddy,
      createdAt: Timestamp.fromDate(randomDate(new Date(2024, 0, 1), new Date()))
    };
    await addDoc(collection(db, "buddy_requests"), buddyData);
    console.log(`  ✓ Created buddy request: ${buddy.from} → ${buddy.to}`);
  }
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
    console.log(`  ✓ Created achievement: ${achievement.name}`);
  }
}

async function seedActivityFeed() {
  console.log("📱 Seeding activity feed...");
  
  const activityTypes = ["workout", "achievement", "buddy", "competition", "streak"];
  
  for (let i = 0; i < 30; i++) {
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
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
          workoutId: workoutIds[Math.floor(Math.random() * workoutIds.length)],
          workoutName: ["Antrenament Picioare", "Cardio", "Yoga", "HIIT"][Math.floor(Math.random() * 4)],
          duration: 30 + Math.floor(Math.random() * 60),
          calories: 200 + Math.floor(Math.random() * 300)
        };
        break;
      case "achievement":
        activity = {
          ...activity,
          achievementId: ["week-streak", "first-workout", "early-bird"][Math.floor(Math.random() * 3)],
          achievementName: "A atins un obiectiv!"
        };
        break;
      case "streak":
        activity = {
          ...activity,
          streakDays: 5 + Math.floor(Math.random() * 20),
          message: "zile de streak consecutive!"
        };
        break;
    }
    
    await addDoc(collection(db, "activity_feed"), activity);
  }
  console.log("  ✓ Created activity feed entries");
}

async function seedAvailabilitySlots() {
  console.log("📅 Seeding availability slots...");
  
  const sports = ["running", "gym", "yoga", "cycling", "swimming"];
  const cities = ["București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța"];
  
  for (const userId of userIds) {
    for (let i = 0; i < 3; i++) {
      const daysAhead = 1 + Math.floor(Math.random() * 7);
      const slotDate = new Date();
      slotDate.setDate(slotDate.getDate() + daysAhead);
      slotDate.setHours(8 + Math.floor(Math.random() * 10), 0, 0);
      
      const slot = {
        userId,
        sport: sports[Math.floor(Math.random() * sports.length)],
        city: cities[Math.floor(Math.random() * cities.length)],
        dateTime: Timestamp.fromDate(slotDate),
        locationType: Math.random() > 0.5 ? "free" : "paid",
        preferredGender: ["any", "male", "female"][Math.floor(Math.random() * 3)],
        status: "available",
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "availability_slots"), slot);
    }
  }
  console.log("  ✓ Created availability slots");
}

// ============ MAIN SEED FUNCTION ============

async function seedDatabase() {
  console.log("\n🚀 Starting Ethos Database Seed...\n");
  
  try {
    await seedUsers();
    await seedWorkouts();
    await seedSleepData();
    await seedForumPosts();
    await seedCompetitions();
    await seedBuddies();
    await seedAchievements();
    await seedActivityFeed();
    await seedAvailabilitySlots();
    
    console.log("\n✅ Database seeding completed successfully!");
    console.log(`📊 Created:`);
    console.log(`   - ${userIds.length} users`);
    console.log(`   - ${workoutIds.length} workouts`);
    console.log(`   - ${competitionIds.length} competitions`);
    console.log(`   - ${forumPostIds.length} forum posts`);
    console.log(`   - Multiple sleep records`);
    console.log(`   - Buddy relationships`);
    console.log(`   - Achievements`);
    console.log(`   - Activity feed entries`);
    console.log(`   - Availability slots`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
  
  process.exit(0);
}

// Run the seed
seedDatabase();
