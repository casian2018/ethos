#!/usr/bin/env python3
"""
Seed Firebase Auth + Firestore with rich demo data for Ethos.

Requirements:
  pip install firebase-admin

Examples:
  python3 scripts/seed_firestore.py --service-account-file /absolute/path/service-account.json
  python3 scripts/seed_firestore.py --service-account-file /absolute/path/service-account.json --main-user-id YOUR_AUTH_UID --main-email you@example.com
  python3 scripts/seed_firestore.py --use-application-default --main-user-id YOUR_AUTH_UID

Important:
  The service account email and unique ID are not enough to authenticate on their own.
  You still need either:
  - a downloaded service-account JSON key file, or
  - Google Application Default Credentials.
"""

from __future__ import annotations

import argparse
import os
import random
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import firebase_admin
from firebase_admin import auth, credentials, firestore


PROJECT_ID = "ethos-23570"
SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@ethos-23570.iam.gserviceaccount.com"
SERVICE_ACCOUNT_UNIQUE_ID = "109224516738900705327"
SEED_TAG = "ethos-demo-v3"
DEMO_PASSWORD = "EthosDemo123!"
DEFAULT_MAIN_UID = "PJ9ZNto2VpVaIiIHGnH9B2N3t203"
DEFAULT_MAIN_EMAIL = "opreacasian@gmail.com"

rng = random.Random(23570)


@dataclass(frozen=True)
class SeedUser:
  uid: str
  email: str | None
  first_name: str
  last_name: str
  city: str
  gender: str
  sex: str
  height: int
  weight: int
  body_fat: float | None
  age: int
  education: str
  occupation: str
  hobbies: list[str]
  medical_conditions: list[str]
  injuries: list[str]
  experience_level: str
  activity_level: str
  goals: list[str]
  priority_goal: str
  motivation_type: str
  preferred_sports: list[str]
  training_environment: str
  home_equipment: list[str]
  days_per_week: int
  workout_duration: int
  sleep_hours: float
  stress_level: str
  daily_steps: int
  dietary_preference: str
  food_allergies: list[str]
  foods_to_avoid: list[str]
  meals_per_day: int
  water_intake_liters: float
  supplements: list[str]
  looking_for_buddy: bool
  level: int
  karma: int
  badge: str
  create_auth: bool = True
  password: str | None = DEMO_PASSWORD

  @property
  def display_name(self) -> str:
    return f"{self.first_name} {self.last_name}".strip()

  @property
  def birth_date(self) -> str:
    base_year = datetime.now(timezone.utc).year - self.age
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    return f"{base_year:04d}-{month:02d}-{day:02d}"


def utc_now() -> datetime:
  return datetime.now(timezone.utc).replace(microsecond=0)


def day_key(offset_days: int = 0) -> str:
  target = utc_now() + timedelta(days=offset_days)
  return target.date().isoformat()


def days_ago(days: int, hour: int = 9, minute: int = 0) -> datetime:
  target = utc_now() - timedelta(days=days)
  return target.replace(hour=hour, minute=minute, second=0, microsecond=0)


def days_ahead(days: int, hour: int = 18, minute: int = 0) -> datetime:
  target = utc_now() + timedelta(days=days)
  return target.replace(hour=hour, minute=minute, second=0, microsecond=0)


def calc_bmi(height_cm: int, weight_kg: int) -> float:
  meters = height_cm / 100
  return round(weight_kg / (meters * meters), 1)


def quality_score(total_sleep_minutes: int, efficiency: int, deep_minutes: int, rem_minutes: int, awake_minutes: int) -> int:
  score = 55
  score += min(max(total_sleep_minutes - 390, -120), 120) // 6
  score += (efficiency - 80)
  score += min(deep_minutes, 120) // 4
  score += min(rem_minutes, 150) // 5
  score -= min(awake_minutes, 90) // 4
  return max(45, min(98, int(score)))


def create_profile_payload(user: SeedUser) -> dict[str, Any]:
  return {
    "id": user.uid,
    "email": user.email or "",
    "firstName": user.first_name,
    "lastName": user.last_name,
    "displayName": user.display_name,
    "phoneNumber": "+40 700 000 000",
    "birthDate": user.birth_date,
    "age": user.age,
    "gender": user.gender,
    "sex": user.sex,
    "height": user.height,
    "weight": user.weight,
    "bmi": calc_bmi(user.height, user.weight),
    "bodyFatPercentage": user.body_fat,
    "city": user.city,
    "education": user.education,
    "occupation": user.occupation,
    "hobbies": user.hobbies,
    "medicalConditions": user.medical_conditions,
    "injuries": user.injuries,
    "experienceLevel": user.experience_level,
    "fitnessLevel": user.experience_level,
    "activityLevel": user.activity_level,
    "goals": user.goals,
    "priorityGoal": user.priority_goal,
    "motivationType": user.motivation_type,
    "preferredSports": user.preferred_sports,
    "trainingEnvironment": user.training_environment,
    "homeEquipment": user.home_equipment,
    "daysPerWeek": user.days_per_week,
    "workoutDuration": user.workout_duration,
    "sleepHours": user.sleep_hours,
    "stressLevel": user.stress_level,
    "dailySteps": user.daily_steps,
    "dietaryPreference": user.dietary_preference,
    "foodAllergies": user.food_allergies,
    "foodsToAvoid": user.foods_to_avoid,
    "mealsPerDay": user.meals_per_day,
    "waterIntakeLiters": user.water_intake_liters,
    "supplements": user.supplements,
    "lookingForBuddy": user.looking_for_buddy,
    "onboardingComplete": True,
    "level": user.level,
    "karma": user.karma,
    "badge": user.badge,
    "createdAt": utc_now(),
    "updatedAt": utc_now(),
    "_seedTag": SEED_TAG,
  }


def initialize_admin(args: argparse.Namespace) -> firestore.Client:
  if firebase_admin._apps:
    return firestore.client()

  if args.service_account_file:
    if not os.path.exists(args.service_account_file):
      raise FileNotFoundError(f"Service account file not found: {args.service_account_file}")
    cred = credentials.Certificate(args.service_account_file)
  elif args.use_application_default:
    cred = credentials.ApplicationDefault()
  else:
    raise RuntimeError(
      "Authentication is missing. Use --service-account-file or --use-application-default.\n"
      f"Service account reference: {SERVICE_ACCOUNT_EMAIL} ({SERVICE_ACCOUNT_UNIQUE_ID})"
    )

  firebase_admin.initialize_app(cred, {"projectId": args.project_id})
  return firestore.client()


def ensure_auth_user(user: SeedUser) -> str:
  if not user.create_auth or not user.email:
    return user.uid

  try:
    existing = auth.get_user(user.uid)
    auth.update_user(
      existing.uid,
      display_name=user.display_name,
      email=user.email,
    )
    return existing.uid
  except auth.UserNotFoundError:
    pass

  try:
    created = auth.create_user(
      uid=user.uid,
      email=user.email,
      password=user.password or DEMO_PASSWORD,
      display_name=user.display_name,
      email_verified=True,
      disabled=False,
    )
    return created.uid
  except auth.EmailAlreadyExistsError:
    existing = auth.get_user_by_email(user.email)
    if existing.uid != user.uid:
      print(
        f"Warning: email {user.email} already belongs to {existing.uid}. "
        f"Firestore data will still use {user.uid}.",
        file=sys.stderr,
      )
    return existing.uid


def upsert_document(ref: firestore.DocumentReference, payload: dict[str, Any], merge: bool = False) -> None:
  ref.set(payload, merge=merge)


def build_main_user(args: argparse.Namespace) -> SeedUser:
  use_repo_default = not args.main_user_id and not args.skip_default_main_user
  if use_repo_default:
    main_uid = DEFAULT_MAIN_UID
    main_email = DEFAULT_MAIN_EMAIL
  else:
    main_uid = args.main_user_id or "seed_demo_owner"
    main_email = args.main_email or ("demo.owner@ethos.example.com" if not args.main_user_id else None)

  return SeedUser(
    uid=main_uid,
    email=main_email,
    first_name="Casian" if main_uid == DEFAULT_MAIN_UID else "Demo",
    last_name="Oprea" if main_uid == DEFAULT_MAIN_UID else "Owner",
    city="Bucuresti",
    gender="male",
    sex="male",
    height=182,
    weight=84,
    body_fat=15.5,
    age=27,
    education="University",
    occupation="Engineer",
    hobbies=["running", "reading", "travel", "strength training"],
    medical_conditions=["none"],
    injuries=[],
    experience_level="intermediate",
    activity_level="active",
    goals=["muscle-gain", "strength", "better-sleep"],
    priority_goal="muscle-gain",
    motivation_type="performance",
    preferred_sports=["gym", "running", "swimming"],
    training_environment="gym",
    home_equipment=["dumbbells", "bench", "yoga-mat"],
    days_per_week=5,
    workout_duration=70,
    sleep_hours=7.6,
    stress_level="medium",
    daily_steps=9200,
    dietary_preference="high-protein",
    food_allergies=["gluten"] if args.seed_allergies else [],
    foods_to_avoid=["ultra-processed snacks"],
    meals_per_day=4,
    water_intake_liters=3.2,
    supplements=["creatine", "vitamin-d"],
    looking_for_buddy=True,
    level=18,
    karma=540,
    badge="Pro",
    create_auth=not args.main_user_id or args.create_main_auth,
    password=args.main_password if args.create_main_auth else None,
  )


def build_demo_users() -> list[SeedUser]:
  return [
    SeedUser(
      uid="seed_demo_maria",
      email="demo.maria@ethos.example.com",
      first_name="Maria",
      last_name="Popescu",
      city="Bucuresti",
      gender="female",
      sex="female",
      height=167,
      weight=61,
      body_fat=22.0,
      age=28,
      education="Master",
      occupation="Marketing Manager",
      hobbies=["pilates", "running", "coffee"],
      medical_conditions=["none"],
      injuries=[],
      experience_level="intermediate",
      activity_level="active",
      goals=["weight-loss", "mobility"],
      priority_goal="weight-loss",
      motivation_type="confidence",
      preferred_sports=["running", "yoga", "gym"],
      training_environment="hybrid",
      home_equipment=["yoga-mat", "resistance-bands"],
      days_per_week=4,
      workout_duration=55,
      sleep_hours=7.9,
      stress_level="medium",
      daily_steps=11000,
      dietary_preference="mediterranean",
      food_allergies=[],
      foods_to_avoid=["fried food"],
      meals_per_day=3,
      water_intake_liters=2.8,
      supplements=["magnesium"],
      looking_for_buddy=True,
      level=16,
      karma=480,
      badge="Runner",
    ),
    SeedUser(
      uid="seed_demo_alex",
      email="demo.alex@ethos.example.com",
      first_name="Alex",
      last_name="Ionescu",
      city="Cluj-Napoca",
      gender="male",
      sex="male",
      height=186,
      weight=88,
      body_fat=14.0,
      age=33,
      education="University",
      occupation="Product Designer",
      hobbies=["football", "lifting", "gaming"],
      medical_conditions=["back-pain"],
      injuries=["lower-back"],
      experience_level="advanced",
      activity_level="very_active",
      goals=["strength", "muscle-gain"],
      priority_goal="strength",
      motivation_type="performance",
      preferred_sports=["gym", "football", "basketball"],
      training_environment="gym",
      home_equipment=["barbell", "bench"],
      days_per_week=6,
      workout_duration=90,
      sleep_hours=7.1,
      stress_level="high",
      daily_steps=8500,
      dietary_preference="balanced",
      food_allergies=[],
      foods_to_avoid=[],
      meals_per_day=4,
      water_intake_liters=3.5,
      supplements=["creatine", "whey"],
      looking_for_buddy=True,
      level=21,
      karma=730,
      badge="Heavy Lifter",
    ),
    SeedUser(
      uid="seed_demo_elena",
      email="demo.elena@ethos.example.com",
      first_name="Elena",
      last_name="Dumitrescu",
      city="Timisoara",
      gender="female",
      sex="female",
      height=171,
      weight=68,
      body_fat=24.0,
      age=25,
      education="University",
      occupation="Architect",
      hobbies=["swimming", "reading", "yoga"],
      medical_conditions=["none"],
      injuries=[],
      experience_level="beginner",
      activity_level="moderate",
      goals=["general-health", "better-sleep"],
      priority_goal="better-sleep",
      motivation_type="health",
      preferred_sports=["yoga", "swimming", "pilates"],
      training_environment="hybrid",
      home_equipment=["yoga-mat"],
      days_per_week=3,
      workout_duration=45,
      sleep_hours=8.1,
      stress_level="low",
      daily_steps=7800,
      dietary_preference="vegetarian",
      food_allergies=[],
      foods_to_avoid=["red meat"],
      meals_per_day=4,
      water_intake_liters=2.6,
      supplements=["omega-3"],
      looking_for_buddy=True,
      level=10,
      karma=260,
      badge="Wellness",
    ),
    SeedUser(
      uid="seed_demo_cristi",
      email="demo.cristi@ethos.example.com",
      first_name="Cristian",
      last_name="Marinescu",
      city="Brasov",
      gender="male",
      sex="male",
      height=178,
      weight=79,
      body_fat=18.0,
      age=40,
      education="High School",
      occupation="Sales Lead",
      hobbies=["cycling", "hiking", "coffee"],
      medical_conditions=["hypertension"],
      injuries=[],
      experience_level="intermediate",
      activity_level="moderate",
      goals=["general-health", "endurance"],
      priority_goal="general-health",
      motivation_type="energy",
      preferred_sports=["cycling", "running", "gym"],
      training_environment="outdoor",
      home_equipment=["stationary-bike"],
      days_per_week=4,
      workout_duration=60,
      sleep_hours=6.9,
      stress_level="medium",
      daily_steps=9800,
      dietary_preference="balanced",
      food_allergies=[],
      foods_to_avoid=["too much sugar"],
      meals_per_day=3,
      water_intake_liters=3.0,
      supplements=["electrolytes"],
      looking_for_buddy=False,
      level=14,
      karma=390,
      badge="Consistent",
    ),
    SeedUser(
      uid="seed_demo_ana",
      email="demo.ana@ethos.example.com",
      first_name="Ana",
      last_name="Georgescu",
      city="Iasi",
      gender="female",
      sex="female",
      height=163,
      weight=57,
      body_fat=20.0,
      age=31,
      education="Master",
      occupation="HR Specialist",
      hobbies=["HIIT", "dance", "meal prep"],
      medical_conditions=["none"],
      injuries=[],
      experience_level="intermediate",
      activity_level="active",
      goals=["muscle-gain", "recomposition"],
      priority_goal="recomposition",
      motivation_type="discipline",
      preferred_sports=["gym", "running", "dancing"],
      training_environment="gym",
      home_equipment=["dumbbells", "resistance-bands"],
      days_per_week=5,
      workout_duration=65,
      sleep_hours=7.4,
      stress_level="medium",
      daily_steps=8700,
      dietary_preference="high-protein",
      food_allergies=[],
      foods_to_avoid=["soda"],
      meals_per_day=4,
      water_intake_liters=2.9,
      supplements=["protein"],
      looking_for_buddy=True,
      level=17,
      karma=520,
      badge="HIIT",
    ),
    SeedUser(
      uid="seed_demo_vlad",
      email="demo.vlad@ethos.example.com",
      first_name="Vlad",
      last_name="Stan",
      city="Constanta",
      gender="male",
      sex="male",
      height=181,
      weight=76,
      body_fat=13.0,
      age=29,
      education="University",
      occupation="Software Engineer",
      hobbies=["tennis", "surf", "lifting"],
      medical_conditions=["none"],
      injuries=[],
      experience_level="advanced",
      activity_level="active",
      goals=["strength", "mobility"],
      priority_goal="strength",
      motivation_type="performance",
      preferred_sports=["tennis", "gym", "swimming"],
      training_environment="hybrid",
      home_equipment=["dumbbells", "pull-up-bar"],
      days_per_week=5,
      workout_duration=75,
      sleep_hours=7.2,
      stress_level="medium",
      daily_steps=8300,
      dietary_preference="pescatarian",
      food_allergies=[],
      foods_to_avoid=["fast food"],
      meals_per_day=4,
      water_intake_liters=3.1,
      supplements=["creatine"],
      looking_for_buddy=True,
      level=19,
      karma=610,
      badge="Athlete",
    ),
  ]


def seed_users(db: firestore.Client, main_user: SeedUser, demo_users: list[SeedUser], merge_main_profile: bool) -> None:
  all_users = [main_user, *demo_users]
  for user in all_users:
    ensure_auth_user(user)
    upsert_document(db.collection("users").document(user.uid), create_profile_payload(user), merge=user.uid == main_user.uid and merge_main_profile)


def seed_health_stats(db: firestore.Client, user: SeedUser) -> None:
  for days_back in range(0, 14):
    current_date = days_ago(days_back, 8, 45)
    date_key = current_date.date().isoformat()
    is_weekend = current_date.weekday() >= 5
    base_steps = 6500 if is_weekend else 9000
    steps = base_steps + rng.randint(800, 5200)
    calories = 1850 + int(steps * 0.045)
    active_minutes = max(20, min(110, steps // 120))
    distance = round(steps * 0.00075, 1)
    payload = {
      "userId": user.uid,
      "date": date_key,
      "steps": steps,
      "calories": calories,
      "distance": distance,
      "activeMinutes": active_minutes,
      "source": "Seed import",
      "createdAt": current_date,
      "_seedTag": SEED_TAG,
    }
    doc_id = f"seed_health_{user.uid}_{date_key}"
    upsert_document(db.collection("health_stats").document(doc_id), payload)


def seed_sleep(db: firestore.Client, user: SeedUser) -> None:
  for days_back in range(0, 10):
    date_key = day_key(-days_back)
    asleep_hour = 22 + (days_back % 2)
    asleep_minute = 20 + (days_back * 7) % 25
    asleep = f"{asleep_hour:02d}:{asleep_minute:02d}"
    awake_hour = 6 + (days_back % 3)
    awake_minute = 35 + (days_back * 5) % 20
    awake = f"{awake_hour:02d}:{awake_minute:02d}"
    total_sleep_minutes = 410 + rng.randint(0, 90)
    time_in_bed_minutes = total_sleep_minutes + rng.randint(15, 35)
    deep_minutes = 80 + rng.randint(0, 35)
    rem_minutes = 70 + rng.randint(0, 30)
    light_minutes = max(total_sleep_minutes - deep_minutes - rem_minutes, 180)
    awake_minutes = max(time_in_bed_minutes - total_sleep_minutes, 15)
    efficiency = max(82, min(98, int((total_sleep_minutes / time_in_bed_minutes) * 100)))
    sleep_hours = round(total_sleep_minutes / 60, 1)
    record = {
      "userId": user.uid,
      "date": date_key,
      "asleepTime": asleep,
      "awakeTime": awake,
      "totalSleepMinutes": total_sleep_minutes,
      "timeInBedMinutes": time_in_bed_minutes,
      "deepSleepMinutes": deep_minutes,
      "lightSleepMinutes": light_minutes,
      "remSleepMinutes": rem_minutes,
      "awakeMinutes": awake_minutes,
      "efficiency": efficiency,
      "qualityScore": quality_score(total_sleep_minutes, efficiency, deep_minutes, rem_minutes, awake_minutes),
      "sleepHours": sleep_hours,
      "sourceApp": "Apple Health",
      "confidence": "high",
      "visibleClues": ["sleep stages visible", "bedtime visible", "wake time visible"],
      "notes": ["Seeded demo sleep data"],
      "createdAt": days_ago(days_back, 7, 10),
      "updatedAt": days_ago(days_back, 7, 18),
      "_seedTag": SEED_TAG,
    }
    upsert_document(db.collection("users").document(user.uid).collection("sleep_records").document(date_key), record, merge=True)
    upsert_document(db.collection("sleep_records").document(f"seed_sleep_{user.uid}_{date_key}"), record)
    upsert_document(db.collection("sleepRecords").document(f"seed_sleep_legacy_{user.uid}_{date_key}"), record)


def seed_nutrition(db: firestore.Client, user: SeedUser) -> None:
  today = day_key()
  now = utc_now()
  entries = [
    {
      "id": f"seed_food_{user.uid}_breakfast",
      "name": "Protein oats bowl",
      "rawDescription": "oats with greek yogurt, banana and whey",
      "quantityText": "1 bowl",
      "estimatedWeightGrams": 380,
      "calories": 530,
      "protein": 38,
      "carbs": 62,
      "fat": 12,
      "fiber": 9,
      "sugar": 19,
      "sodiumMg": 180,
      "hydrationMl": 0,
      "recognizedFoods": ["oats", "greek yogurt", "banana", "whey"],
      "warnings": [],
      "analysisNotes": "Seeded breakfast for nutrition dashboard.",
      "analysisConfidence": "high",
      "analysisSource": "fallback",
      "mealType": "breakfast",
      "timestamp": now.replace(hour=8, minute=10),
    },
    {
      "id": f"seed_food_{user.uid}_lunch",
      "name": "Chicken rice bowl",
      "rawDescription": "grilled chicken breast, rice, avocado and salad",
      "quantityText": "1 large bowl",
      "estimatedWeightGrams": 520,
      "calories": 720,
      "protein": 54,
      "carbs": 68,
      "fat": 24,
      "fiber": 8,
      "sugar": 6,
      "sodiumMg": 540,
      "hydrationMl": 0,
      "recognizedFoods": ["chicken", "rice", "avocado", "salad"],
      "warnings": [],
      "analysisNotes": "Seeded lunch for nutrition dashboard.",
      "analysisConfidence": "high",
      "analysisSource": "fallback",
      "mealType": "lunch",
      "timestamp": now.replace(hour=13, minute=5),
    },
    {
      "id": f"seed_food_{user.uid}_snack",
      "name": "Skyr snack",
      "rawDescription": "skyr, almonds and apple",
      "quantityText": "1 snack",
      "estimatedWeightGrams": 260,
      "calories": 290,
      "protein": 24,
      "carbs": 24,
      "fat": 10,
      "fiber": 5,
      "sugar": 17,
      "sodiumMg": 110,
      "hydrationMl": 0,
      "recognizedFoods": ["skyr", "almonds", "apple"],
      "warnings": [],
      "analysisNotes": "Seeded snack for nutrition dashboard.",
      "analysisConfidence": "high",
      "analysisSource": "fallback",
      "mealType": "snack",
      "timestamp": now.replace(hour=17, minute=0),
    },
    {
      "id": f"seed_food_{user.uid}_dinner",
      "name": "Salmon potatoes dinner",
      "rawDescription": "oven salmon with potatoes and vegetables",
      "quantityText": "1 plate",
      "estimatedWeightGrams": 460,
      "calories": 640,
      "protein": 42,
      "carbs": 46,
      "fat": 28,
      "fiber": 7,
      "sugar": 5,
      "sodiumMg": 460,
      "hydrationMl": 0,
      "recognizedFoods": ["salmon", "potatoes", "vegetables"],
      "warnings": [],
      "analysisNotes": "Seeded dinner for nutrition dashboard.",
      "analysisConfidence": "high",
      "analysisSource": "fallback",
      "mealType": "dinner",
      "timestamp": now.replace(hour=20, minute=5),
    },
  ]

  for entry in entries:
    payload = {
      "userId": user.uid,
      "date": today,
      "imageUrl": "",
      "_seedTag": SEED_TAG,
      **entry,
    }
    upsert_document(db.collection("food_entries").document(entry["id"]), payload)

  hydration_payload = {
    "amountMl": 2300,
    "targetMl": int(user.water_intake_liters * 1000),
    "updatedAt": now,
    "createdAt": now,
    "_seedTag": SEED_TAG,
  }
  upsert_document(db.collection("users").document(user.uid).collection("hydration_logs").document(today), hydration_payload, merge=True)

  plan = {
    "title": "Lean muscle performance plan",
    "summary": "High-protein weekday plan built to support strength and steady energy.",
    "dailyTargets": {
      "calories": 2750,
      "protein": 190,
      "carbs": 285,
      "fat": 80,
      "waterLiters": 3.2,
    },
    "meals": [
      {
        "slot": "breakfast",
        "time": "08:00",
        "title": "Protein oats",
        "foods": ["Oats", "Greek yogurt", "Banana", "Whey"],
        "quantity": "1 bowl",
        "calories": 560,
        "protein": 40,
        "carbs": 64,
        "fat": 13,
        "reason": "Fast breakfast with protein and slow carbs.",
      },
      {
        "slot": "lunch",
        "time": "13:00",
        "title": "Chicken rice bowl",
        "foods": ["Chicken breast", "Rice", "Avocado", "Mixed salad"],
        "quantity": "1 large bowl",
        "calories": 760,
        "protein": 55,
        "carbs": 72,
        "fat": 24,
        "reason": "Main recovery meal around training.",
      },
      {
        "slot": "snack",
        "time": "17:00",
        "title": "Skyr + fruit",
        "foods": ["Skyr", "Apple", "Almonds"],
        "quantity": "1 snack",
        "calories": 320,
        "protein": 25,
        "carbs": 26,
        "fat": 10,
        "reason": "Keeps hunger stable between lunch and dinner.",
      },
      {
        "slot": "dinner",
        "time": "20:00",
        "title": "Salmon dinner",
        "foods": ["Salmon", "Potatoes", "Roasted vegetables"],
        "quantity": "1 plate",
        "calories": 690,
        "protein": 44,
        "carbs": 48,
        "fat": 30,
        "reason": "Higher micronutrient dinner with omega-3 fats.",
      },
    ],
    "coachingTips": [
      "Keep protein above 35 g in the first two meals.",
      "Use fruit around training for easier carbs.",
      "Do not skip hydration before lunch.",
    ],
    "shoppingList": [
      "Chicken breast",
      "Salmon fillets",
      "Rice",
      "Oats",
      "Greek yogurt",
      "Skyr",
      "Bananas",
      "Apples",
      "Avocado",
      "Mixed salad",
      "Potatoes",
      "Almonds",
    ],
    "hydrationPlan": [
      "500 ml after waking up",
      "750 ml before lunch",
      "750 ml between lunch and training",
      "1.2 L by bedtime",
    ],
  }

  plan_payload = {
    "title": plan["title"],
    "summary": plan["summary"],
    "goalMode": "gain",
    "language": "en",
    "source": "fallback",
    "isActive": True,
    "plan": plan,
    "createdAt": now - timedelta(days=2),
    "updatedAt": now - timedelta(hours=3),
    "_seedTag": SEED_TAG,
  }
  upsert_document(
    db.collection("users").document(user.uid).collection("nutrition_plans").document(f"seed_plan_{user.uid}_performance"),
    plan_payload,
  )


def seed_workouts(db: firestore.Client, user: SeedUser) -> None:
  saved_workouts = [
    {
      "doc_id": f"seed_workout_template_push_{user.uid}",
      "name": "Upper body push",
      "type": "strength",
      "duration": 65,
      "exercises": ["Bench Press", "Overhead Press", "Incline Dumbbell Press", "Cable Fly"],
      "savedAt": days_ago(2, 10, 0),
    },
    {
      "doc_id": f"seed_workout_template_pull_{user.uid}",
      "name": "Upper body pull",
      "type": "strength",
      "duration": 60,
      "exercises": ["Pull Ups", "Barbell Row", "Lat Pulldown", "Hammer Curl"],
      "savedAt": days_ago(4, 11, 15),
    },
  ]

  for workout in saved_workouts:
    payload = {
      "userId": user.uid,
      "name": workout["name"],
      "type": workout["type"],
      "duration": workout["duration"],
      "exercises": workout["exercises"],
      "savedAt": workout["savedAt"],
      "_seedTag": SEED_TAG,
    }
    upsert_document(db.collection("workouts").document(workout["doc_id"]), payload)

  session_templates = [
    {
      "session_id": f"seed_session_{user.uid}_push",
      "days_back": 1,
      "workoutName": "Upper Body Push",
      "workoutType": "strength",
      "duration": 67,
      "totalVolume": 15240,
      "exercises": [
        ("Bench Press", [(10, 70), (8, 75), (8, 75), (6, 80)]),
        ("Overhead Press", [(10, 35), (8, 40), (8, 40)]),
        ("Incline Dumbbell Press", [(12, 26), (10, 28), (10, 28)]),
      ],
    },
    {
      "session_id": f"seed_session_{user.uid}_legs",
      "days_back": 3,
      "workoutName": "Leg Day Volume",
      "workoutType": "strength",
      "duration": 74,
      "totalVolume": 21480,
      "exercises": [
        ("Back Squat", [(8, 90), (8, 95), (6, 100), (6, 100)]),
        ("Romanian Deadlift", [(10, 80), (10, 85), (8, 90)]),
        ("Walking Lunges", [(12, 20), (12, 20), (10, 22)]),
      ],
    },
    {
      "session_id": f"seed_session_{user.uid}_conditioning",
      "days_back": 6,
      "workoutName": "Conditioning Intervals",
      "workoutType": "cardio",
      "duration": 42,
      "totalVolume": 0,
      "exercises": [
        ("Assault Bike Sprints", [(8, 0), (8, 0), (8, 0)]),
        ("Row Erg", [(500, 0), (500, 0), (500, 0)]),
      ],
    },
  ]

  for template in session_templates:
    session_date = days_ago(template["days_back"], 18, 0)
    session_payload = {
      "userId": user.uid,
      "workoutName": template["workoutName"],
      "workoutType": template["workoutType"],
      "status": "completed",
      "source": "generated",
      "duration": template["duration"],
      "date": session_date.isoformat(),
      "startTime": session_date,
      "endTime": session_date + timedelta(minutes=template["duration"]),
      "totalVolume": template["totalVolume"],
      "createdAt": session_date,
      "updatedAt": session_date + timedelta(minutes=template["duration"]),
      "_seedTag": SEED_TAG,
    }
    session_ref = db.collection("workout_sessions").document(template["session_id"])
    upsert_document(session_ref, session_payload)

    for exercise_index, (exercise_name, sets) in enumerate(template["exercises"]):
      exercise_ref = session_ref.collection("exercises").document(f"seed_exercise_{exercise_index + 1}")
      exercise_payload = {
        "name": exercise_name,
        "targetSets": len(sets),
        "targetReps": sets[0][0],
        "orderIndex": exercise_index,
        "restSeconds": 90 if template["workoutType"] == "strength" else 60,
        "createdAt": session_date,
        "_seedTag": SEED_TAG,
      }
      upsert_document(exercise_ref, exercise_payload)

      for set_index, (reps, weight) in enumerate(sets):
        set_ref = exercise_ref.collection("sets").document(f"seed_set_{set_index + 1}")
        set_payload = {
          "reps": reps,
          "weight": weight,
          "completed": True,
          "timestamp": session_date + timedelta(minutes=exercise_index * 9 + set_index * 2),
          "_seedTag": SEED_TAG,
        }
        upsert_document(set_ref, set_payload)


def seed_forum(db: firestore.Client, users: list[SeedUser]) -> None:
  posts = [
    {
      "doc_id": "seed_forum_post_1",
      "title": "Best high-protein breakfast that actually keeps you full?",
      "content": "I need breakfast ideas that are fast, high protein, and do not crash my energy before lunch.",
      "author": users[1],
      "sport": "gym",
      "goal": "muscle-gain",
      "category": "nutritie",
      "difficulty": "beginner",
      "likes": [users[0].uid, users[2].uid, users[4].uid],
    },
    {
      "doc_id": "seed_forum_post_2",
      "title": "How do you structure a 4-day split for strength + size?",
      "content": "I can train only 4 days each week. I want a split that pushes both strength and hypertrophy without frying recovery.",
      "author": users[2],
      "sport": "gym",
      "goal": "strength",
      "category": "workout-tips",
      "difficulty": "intermediate",
      "likes": [users[0].uid, users[3].uid],
    },
    {
      "doc_id": "seed_forum_post_3",
      "title": "Sleep score is decent but I still wake up tired",
      "content": "My sleep duration looks okay, but mornings still feel heavy. What helped you improve sleep quality, not just hours?",
      "author": users[3],
      "sport": "yoga",
      "goal": "better-sleep",
      "category": "biohacking",
      "difficulty": "intermediate",
      "likes": [users[0].uid, users[1].uid, users[5].uid],
    },
    {
      "doc_id": "seed_forum_post_4",
      "title": "First month in the gym. What mistakes should I avoid?",
      "content": "I just started lifting and I want to avoid the beginner mistakes that slow progress or cause injuries.",
      "author": users[4],
      "sport": "gym",
      "goal": "general-health",
      "category": "suport",
      "difficulty": "beginner",
      "likes": [users[1].uid],
    },
    {
      "doc_id": "seed_forum_post_5",
      "title": "Anyone balancing running performance with leg hypertrophy?",
      "content": "I want better 10k times but also bigger legs. Curious how you organize strength and speed work together.",
      "author": users[5],
      "sport": "running",
      "goal": "endurance",
      "category": "discutii",
      "difficulty": "advanced",
      "likes": [users[0].uid, users[2].uid],
    },
  ]

  replies = [
    ("seed_forum_reply_1", "seed_forum_post_1", users[0], "Greek yogurt + oats + berries + whey works best for me."),
    ("seed_forum_reply_2", "seed_forum_post_1", users[4], "Eggs and toast are still unbeatable if you want something savory."),
    ("seed_forum_reply_3", "seed_forum_post_2", users[1], "Upper/lower works well if you keep one heavy and one pump focus each week."),
    ("seed_forum_reply_4", "seed_forum_post_3", users[2], "A fixed wake-up time helped me more than supplements."),
    ("seed_forum_reply_5", "seed_forum_post_4", users[3], "Start lighter than you think and film the main lifts."),
    ("seed_forum_reply_6", "seed_forum_post_5", users[0], "I separate speed day and squat day by at least 48 hours."),
  ]

  for index, post in enumerate(posts):
    created_at = days_ago(6 - index, 10 + index, 20)
    payload = {
      "title": post["title"],
      "content": post["content"],
      "authorId": post["author"].uid,
      "createdAt": created_at,
      "likes": post["likes"],
      "dislikes": [],
      "sport": post["sport"],
      "goal": post["goal"],
      "category": post["category"],
      "difficulty": post["difficulty"],
      "_seedTag": SEED_TAG,
    }
    upsert_document(db.collection("forum_posts").document(post["doc_id"]), payload)

  for index, (reply_id, post_id, author, content) in enumerate(replies):
    payload = {
      "content": content,
      "authorId": author.uid,
      "postId": post_id,
      "parentReplyId": None,
      "createdAt": days_ago(5 - (index % 4), 15, index * 5 % 55),
      "likes": [],
      "dislikes": [],
      "_seedTag": SEED_TAG,
    }
    upsert_document(db.collection("forum_replies").document(reply_id), payload)


def seed_find_buddy(db: firestore.Client, main_user: SeedUser, demo_users: list[SeedUser]) -> None:
  city_locations = {
    "Bucuresti": [("World Class Downtown", "Calea Victoriei"), ("Parcul Tineretului", "Sincai 1")],
    "Cluj-Napoca": [("18 Gym", "Strada Fabricii 4"), ("Parcul Central", "Cluj Arena")],
    "Timisoara": [("Smartfit", "Bulevardul Republicii"), ("Baza 2", "Aleea Studentilor")],
    "Brasov": [("Belaqva", "Coresi"), ("Tampa Trails", "Aleea de sub Tampa")],
    "Iasi": [("Arena Gym", "Palas Campus"), ("Parcul Copou", "Aleea Mihail Sadoveanu")],
    "Constanta": [("Stay Fit", "Tomis Mall"), ("Plaja Modern", "Faleza")],
  }

  slot_definitions = [
    (main_user, "gym", "Bucuresti", 1, 19, 2, ["seed_demo_maria"], "matched"),
    (main_user, "running", "Bucuresti", 3, 7, 4, [], "open"),
    (demo_users[0], "running", "Bucuresti", 2, 18, 2, [], "open"),
    (demo_users[1], "football", "Cluj-Napoca", 4, 20, 6, ["seed_demo_vlad", "seed_demo_cristi"], "matched"),
    (demo_users[2], "yoga", "Timisoara", 2, 19, 4, [main_user.uid], "matched"),
    (demo_users[3], "cycling", "Brasov", 5, 8, 5, [], "open"),
    (demo_users[4], "gym", "Iasi", 1, 18, 3, [], "open"),
    (demo_users[5], "swimming", "Constanta", 3, 17, 2, [], "open"),
  ]

  user_index = {user.uid: user for user in [main_user, *demo_users]}

  for index, (host, sport, city, future_day, hour, max_participants, extra_participants, status_hint) in enumerate(slot_definitions, start=1):
    location_name, address = city_locations[city][index % len(city_locations[city])]
    participant_ids = [host.uid, *extra_participants]
    participant_names = [user_index[user_id].display_name for user_id in participant_ids if user_id in user_index]
    open_spots = max(max_participants - len(participant_ids), 0)
    status = "closed" if open_spots == 0 else status_hint
    date_time = days_ahead(future_day, hour, 0)
    slot_id = f"seed_slot_{index}"
    payload = {
      "hostId": host.uid,
      "hostName": host.display_name,
      "hostExperienceLevel": host.experience_level,
      "hostGoals": host.goals,
      "hostGender": host.gender,
      "hostAvatarUrl": "",
      "sportType": sport,
      "city": city,
      "dateTime": date_time,
      "duration": 60 if sport in {"gym", "yoga", "swimming"} else 75,
      "maxParticipants": max_participants,
      "participants": participant_ids,
      "participantNames": participant_names,
      "genderPreference": "anyone",
      "location": {
        "name": location_name,
        "address": address,
        "isPaid": sport in {"gym", "swimming"},
        "price": 45 if sport in {"gym", "swimming"} else None,
        "priceNote": "45 RON / session" if sport in {"gym", "swimming"} else None,
      },
      "status": status,
      "description": f"{host.display_name} is looking for {sport} partners in {city}.",
      "matchedAt": date_time - timedelta(hours=6) if len(participant_ids) > 1 else None,
      "createdAt": date_time - timedelta(days=2),
      "updatedAt": date_time - timedelta(hours=8),
      "_seedTag": SEED_TAG,
    }
    slot_ref = db.collection("availability_slots").document(slot_id)
    upsert_document(slot_ref, payload)
    upsert_document(
      slot_ref.collection("chat").document("seed_system_message"),
      {
        "type": "system",
        "userId": "system",
        "userName": "Ethos",
        "content": f"Slot created for {sport} at {location_name}.",
        "createdAt": date_time - timedelta(days=2, minutes=15),
        "_seedTag": SEED_TAG,
      },
    )
    if len(participant_ids) > 1:
      joiner_id = participant_ids[-1]
      joiner_name = user_index[joiner_id].display_name
      upsert_document(
        slot_ref.collection("chat").document("seed_join_message"),
        {
          "type": "system",
          "userId": joiner_id,
          "userName": joiner_name,
          "content": f"{joiner_name} s-a alăturat sesiunii.",
          "createdAt": date_time - timedelta(days=1, hours=3),
          "_seedTag": SEED_TAG,
        },
      )


def seed_events(db: firestore.Client, main_user: SeedUser, demo_users: list[SeedUser]) -> None:
  hosts = [main_user, *demo_users[:5]]
  event_templates = [
    ("seed_event_1", hosts[0], "gym", "Bucuresti", 2, 19, 2, [hosts[1].uid], "Partner chest session"),
    ("seed_event_2", hosts[1], "running", "Bucuresti", 4, 7, 8, [hosts[0].uid, hosts[2].uid], "Tempo run + coffee after"),
    ("seed_event_3", hosts[2], "yoga", "Timisoara", 3, 18, 10, [hosts[3].uid], "Mobility-focused evening yoga"),
    ("seed_event_4", hosts[3], "cycling", "Brasov", 6, 8, 6, [], "Saturday long ride with climbs"),
    ("seed_event_5", hosts[4], "football", "Iasi", 5, 20, 14, [hosts[0].uid, hosts[1].uid, hosts[5].uid], "Casual 7v7 friendly game"),
  ]

  for index, (event_id, host, sport, city, future_day, hour, max_participants, joined_users, description) in enumerate(event_templates, start=1):
    start_time = days_ahead(future_day, hour, 0)
    end_time = start_time + timedelta(minutes=90)
    joined = [host.uid, *joined_users]
    payload = {
      "creatorId": host.uid,
      "creatorName": host.display_name,
      "sportType": sport,
      "city": city,
      "genderPreference": "anyone",
      "startTime": start_time,
      "endTime": end_time,
      "locationName": f"{city} Arena {index}",
      "locationAddress": f"Central district, {city}",
      "isPaid": sport in {"gym", "football"},
      "price": 35 if sport in {"gym", "football"} else 0,
      "priceNote": "Split venue cost" if sport in {"gym", "football"} else "",
      "maxParticipants": max_participants,
      "joinedUsers": joined,
      "description": description,
      "status": "open" if len(joined) < max_participants else "full",
      "createdAt": start_time - timedelta(days=3),
      "updatedAt": start_time - timedelta(hours=10),
      "_seedTag": SEED_TAG,
    }
    event_ref = db.collection("sport_events").document(event_id)
    upsert_document(event_ref, payload)
    upsert_document(
      event_ref.collection("event_chat").document("seed_message_1"),
      {
        "eventId": event_id,
        "userId": host.uid,
        "userName": host.display_name,
        "message": "I booked the venue. Bring good energy.",
        "createdAt": start_time - timedelta(days=1, hours=4),
        "_seedTag": SEED_TAG,
      },
    )
    if joined_users:
      first_joiner = joined_users[0]
      joiner_name = next((user.display_name for user in hosts if user.uid == first_joiner), first_joiner)
      upsert_document(
        event_ref.collection("event_chat").document("seed_message_2"),
        {
          "eventId": event_id,
          "userId": first_joiner,
          "userName": joiner_name,
          "message": "Perfect, I am in. See you there.",
          "createdAt": start_time - timedelta(days=1, hours=2),
          "_seedTag": SEED_TAG,
        },
      )


def seed_competitions(db: firestore.Client, main_user: SeedUser, demo_users: list[SeedUser]) -> None:
  all_users = [main_user, *demo_users]
  competition_templates = [
    {
      "doc_id": "seed_competition_steps",
      "name": "Spring Step Hero",
      "description": "7-day push to hit consistent step volume.",
      "challengeType": "step-hero",
      "participants": [main_user.uid, demo_users[0].uid, demo_users[1].uid, demo_users[3].uid],
      "dailyStepGoal": 12000,
      "prize": "500 XP + Step Hero badge",
      "start_days_ago": 2,
      "duration_days": 8,
    },
    {
      "doc_id": "seed_competition_sleep",
      "name": "Sleep Reset Week",
      "description": "Track quality sleep and recover better before training.",
      "challengeType": "sleep-master",
      "participants": [main_user.uid, demo_users[2].uid, demo_users[4].uid],
      "dailyStepGoal": 7000,
      "prize": "Recovery badge",
      "start_days_ago": 1,
      "duration_days": 7,
    },
    {
      "doc_id": "seed_competition_consistency",
      "name": "Consistency Ladder",
      "description": "Show up five times and stay on top of the board.",
      "challengeType": "consistent-trainer",
      "participants": [main_user.uid, demo_users[1].uid, demo_users[5].uid],
      "dailyStepGoal": 9000,
      "prize": "Coaching call + 700 XP",
      "start_days_ago": 4,
      "duration_days": 12,
    },
  ]

  user_lookup = {user.uid: user for user in all_users}

  for template_index, template in enumerate(competition_templates, start=1):
    start_date = days_ago(template["start_days_ago"], 8, 0)
    end_date = start_date + timedelta(days=template["duration_days"])
    participants = template["participants"]
    created_by = participants[0]
    competition_payload = {
      "name": template["name"],
      "description": template["description"],
      "challengeType": template["challengeType"],
      "createdBy": created_by,
      "participants": participants,
      "startDate": start_date,
      "endDate": end_date,
      "dailyStepGoal": template["dailyStepGoal"],
      "prize": template["prize"],
      "createdAt": start_date - timedelta(days=1),
      "_seedTag": SEED_TAG,
    }
    upsert_document(db.collection("competitions").document(template["doc_id"]), competition_payload)

    for user_id in participants:
      user = user_lookup[user_id]
      target = 70000 if template["challengeType"] == "step-hero" else 7 if template["challengeType"] == "sleep-master" else 5
      progress = 28000 + template_index * 4500 if user_id == main_user.uid else 18000 + rng.randint(5000, 28000)
      challenge_payload = {
        "userId": user_id,
        "challengeType": template["challengeType"],
        "progress": progress if template["challengeType"] == "step-hero" else min(target, 2 + template_index),
        "target": target,
        "completed": False,
        "joinedAt": start_date - timedelta(hours=4),
        "_seedTag": SEED_TAG,
      }
      upsert_document(db.collection("user_challenges").document(f"seed_user_challenge_{template['doc_id']}_{user_id}"), challenge_payload)

      for day_index in range(0, 4):
        entry_date = (start_date + timedelta(days=day_index)).date().isoformat()
        steps = template["dailyStepGoal"] - 2500 + rng.randint(0, 5500)
        entry_payload = {
          "competitionId": template["doc_id"],
          "userId": user.uid,
          "steps": steps,
          "date": entry_date,
          "imageUrl": "",
          "verified": True,
          "createdAt": start_date + timedelta(days=day_index, hours=20),
          "_seedTag": SEED_TAG,
        }
        entry_id = f"seed_comp_entry_{template['doc_id']}_{user.uid}_{entry_date}"
        upsert_document(db.collection("competition_entries").document(entry_id), entry_payload)

    if len(participants) > 1:
      upsert_document(
        db.collection("high_fives").document(f"seed_high_five_{template['doc_id']}"),
        {
          "fromUserId": participants[1],
          "toUserId": main_user.uid,
          "competitionId": template["doc_id"],
          "createdAt": start_date + timedelta(days=1, hours=12),
          "_seedTag": SEED_TAG,
        },
      )


def print_summary(main_user: SeedUser, demo_users: list[SeedUser]) -> None:
  print("\nSeed finished.")
  print(f"Project: {PROJECT_ID}")
  print(f"Main seeded user: {main_user.uid}")
  if main_user.email and main_user.create_auth:
    print(f"Main user email: {main_user.email}")
    print(f"Main user password: {main_user.password or DEMO_PASSWORD}")

  print("\nDemo accounts created/updated:")
  for user in demo_users:
    if user.email:
      print(f"  - {user.display_name}: {user.email} / {user.password or DEMO_PASSWORD}")


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description="Seed Firestore with rich demo data for Ethos.")
  parser.add_argument("--project-id", default=PROJECT_ID)
  parser.add_argument("--service-account-file", default=os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
  parser.add_argument("--use-application-default", action="store_true")
  parser.add_argument("--main-user-id", default=os.getenv("ETHOS_MAIN_USER_ID"))
  parser.add_argument("--main-email", default=os.getenv("ETHOS_MAIN_EMAIL"))
  parser.add_argument("--main-password", default=os.getenv("ETHOS_MAIN_PASSWORD", DEMO_PASSWORD))
  parser.add_argument("--create-main-auth", action="store_true")
  parser.add_argument("--skip-default-main-user", action="store_true")
  parser.add_argument("--seed-allergies", action="store_true")
  return parser.parse_args()


def main() -> int:
  args = parse_args()

  try:
    db = initialize_admin(args)
  except Exception as exc:  # pylint: disable=broad-except
    print(f"Failed to initialize Firebase Admin: {exc}", file=sys.stderr)
    return 1

  main_user = build_main_user(args)
  demo_users = build_demo_users()
  merge_main_profile = bool(args.main_user_id or not args.skip_default_main_user)

  print(f"Seeding Firestore for project {args.project_id}...")
  print(f"Using service account reference: {SERVICE_ACCOUNT_EMAIL} ({SERVICE_ACCOUNT_UNIQUE_ID})")

  try:
    seed_users(db, main_user, demo_users, merge_main_profile=merge_main_profile)
    seed_health_stats(db, main_user)
    seed_sleep(db, main_user)
    seed_nutrition(db, main_user)
    seed_workouts(db, main_user)
    seed_forum(db, [main_user, *demo_users])
    seed_find_buddy(db, main_user, demo_users)
    seed_events(db, main_user, demo_users)
    seed_competitions(db, main_user, demo_users)
  except Exception as exc:  # pylint: disable=broad-except
    print(f"Seeding failed: {exc}", file=sys.stderr)
    return 1

  print_summary(main_user, demo_users)
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
