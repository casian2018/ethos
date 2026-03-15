"use client";

import { useState, type ReactNode } from "react";
import {
  activityLevelOptions,
  buildDisplayName,
  calculateAge,
  calculateBMI,
  dietaryPreferenceOptions,
  equipmentOptions,
  experienceOptions,
  formatTagList,
  fromCommaSeparatedInput,
  genderOptions,
  getOptionLabel,
  goalOptions,
  medicalConditionOptions,
  motivationOptions,
  profileToFormState,
  sexOptions,
  sportOptions,
  stressLevelOptions,
  toCommaSeparatedInput,
  trainingEnvironmentOptions,
  type DetailedUserProfile,
  type LocalizedOption,
  type ProfileFormState,
} from "@/lib/profile";

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type MultiValueField = "goals" | "preferredSports" | "medicalConditions" | "homeEquipment";

interface ProfileDetailsWizardProps {
  email?: string;
  initialData?: Partial<DetailedUserProfile> | null;
  language?: "ro" | "en";
  mode?: "register" | "setup";
  saving?: boolean;
  submitLabel?: string;
  onExit?: () => void;
  onSubmit: (formState: ProfileFormState) => Promise<void> | void;
}

const TOTAL_STEPS = 7;

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-slate-700">{children}</label>;
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${props.className || ""}`}
    />
  );
}

function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 ${props.className || ""}`}
    />
  );
}

function OptionButton({
  option,
  selected,
  language,
  onClick,
}: {
  option: LocalizedOption;
  selected: boolean;
  language: "ro" | "en";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 px-4 py-3 text-left transition ${
        selected
          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-3">
        {option.emoji && <span className="text-xl">{option.emoji}</span>}
        <div>
          <div className="font-medium">{language === "ro" ? option.labelRo : option.labelEn}</div>
          {(option.descriptionRo || option.descriptionEn) && (
            <p className="mt-1 text-xs text-slate-500">
              {language === "ro" ? option.descriptionRo : option.descriptionEn}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function ChipPreview({ values }: { values: string[] }) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function ProfileDetailsWizard({
  email,
  initialData,
  language = "ro",
  mode = "setup",
  saving = false,
  submitLabel,
  onExit,
  onSubmit,
}: ProfileDetailsWizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const [formState, setFormState] = useState<ProfileFormState>(() =>
    profileToFormState(initialData, email ? { email } : {})
  );
  const age = calculateAge(formState.birthDate);
  const bmi = calculateBMI(Number(formState.height), Number(formState.weight));
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const updateField = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const updateCommaSeparatedField = (
    field: "hobbies" | "injuries" | "foodAllergies" | "foodsToAvoid" | "supplements",
    value: string
  ) => {
    updateField(field, fromCommaSeparatedInput(value) as ProfileFormState[typeof field]);
  };

  const toggleMultiValue = (field: MultiValueField, value: string) => {
    setFormState((current) => {
      const currentValues = current[field];
      if (field === "medicalConditions" || field === "homeEquipment") {
        if (value === "none") {
          return { ...current, [field]: ["none"] };
        }

        const withoutNone = currentValues.filter((item) => item !== "none");
        const nextValues = withoutNone.includes(value)
          ? withoutNone.filter((item) => item !== value)
          : [...withoutNone, value];

        return {
          ...current,
          [field]: nextValues.length > 0 ? nextValues : ["none"],
        };
      }

      return {
        ...current,
        [field]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  const canContinue = () => {
    switch (step) {
      case 0:
        return Boolean(formState.firstName.trim() && formState.lastName.trim() && formState.city.trim());
      case 1:
        return Boolean(
          formState.birthDate &&
            formState.gender &&
            formState.sex &&
            formState.height &&
            formState.weight
        );
      case 2:
        return Boolean(
          formState.experienceLevel &&
            formState.activityLevel &&
            formState.goals.length > 0 &&
            formState.priorityGoal &&
            formState.motivationType &&
            formState.daysPerWeek &&
            formState.workoutDuration
        );
      case 3:
        return Boolean(
          formState.trainingEnvironment &&
            formState.preferredSports.length > 0 &&
            formState.homeEquipment.length > 0
        );
      case 4:
        return Boolean(
          formState.medicalConditions.length > 0 &&
            formState.sleepHours &&
            formState.stressLevel &&
            formState.dailySteps
        );
      case 5:
        return Boolean(
          formState.dietaryPreference &&
            formState.mealsPerDay &&
            formState.waterIntakeLiters
        );
      case 6:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!canContinue() || step === 6) {
      return;
    }

    setStep((current) => (current + 1) as WizardStep);
  };

  const prevStep = () => {
    if (step === 0) {
      onExit?.();
      return;
    }

    setStep((current) => (current - 1) as WizardStep);
  };

  const headline =
    mode === "register"
      ? "Hai să construim profilul complet înainte să creăm contul."
      : "Completează sau actualizează profilul ca antrenamentele și nutriția să fie personalizate corect.";

  const finalSubmitLabel =
    submitLabel || (mode === "register" ? "Creează contul și profilul" : "Salvează profilul complet");

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-slate-500">
          <span>Pasul {step + 1} din {TOTAL_STEPS}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-slate-50 p-5">
        <h1 className="text-xl font-semibold text-slate-900">
          {mode === "register" ? "🌱 Înregistrare cu onboarding complet" : "🧬 Profil detaliat Ethos"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{headline}</p>
        {email && (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            Cont: {email}
          </p>
        )}
      </div>

      {step === 0 && (
        <div>
          <SectionTitle
            title="Cine ești"
            description="Datele de bază ne ajută să construim profilul public și să păstrăm personalizarea coerentă."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Prenume *</FieldLabel>
              <InputField
                value={formState.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                placeholder="Oprea"
              />
            </div>
            <div>
              <FieldLabel>Nume *</FieldLabel>
              <InputField
                value={formState.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                placeholder="Ionescu"
              />
            </div>
            <div>
              <FieldLabel>Nume afișat</FieldLabel>
              <InputField
                value={formState.displayName}
                onChange={(event) => updateField("displayName", event.target.value)}
                placeholder="Lasă gol pentru numele complet"
              />
            </div>
            <div>
              <FieldLabel>Telefon</FieldLabel>
              <InputField
                value={formState.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                placeholder="+40 7xx xxx xxx"
              />
            </div>
            <div>
              <FieldLabel>Oraș *</FieldLabel>
              <InputField
                value={formState.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="București"
              />
            </div>
            <div>
              <FieldLabel>Educație</FieldLabel>
              <InputField
                value={formState.education}
                onChange={(event) => updateField("education", event.target.value)}
                placeholder="Universitate"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Ocupație</FieldLabel>
              <InputField
                value={formState.occupation}
                onChange={(event) => updateField("occupation", event.target.value)}
                placeholder="Product designer, software engineer, student..."
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Hobby-uri</FieldLabel>
              <TextareaField
                value={toCommaSeparatedInput(formState.hobbies)}
                onChange={(event) => updateCommaSeparatedField("hobbies", event.target.value)}
                placeholder="citit, drumeții, gătit, gaming"
              />
              <p className="mt-2 text-xs text-slate-500">Separă valorile prin virgulă.</p>
              <ChipPreview values={formState.hobbies} />
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <SectionTitle
            title="Corp și identitate"
            description="Aici colectăm datele necesare pentru calcule fiziologice și personalizare sigură."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Data nașterii *</FieldLabel>
              <InputField
                type="date"
                value={formState.birthDate}
                onChange={(event) => updateField("birthDate", event.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <FieldLabel>Înălțime (cm) *</FieldLabel>
              <InputField
                type="number"
                min="100"
                max="250"
                value={formState.height}
                onChange={(event) => updateField("height", event.target.value)}
                placeholder="180"
              />
            </div>
            <div>
              <FieldLabel>Greutate (kg) *</FieldLabel>
              <InputField
                type="number"
                min="30"
                max="300"
                value={formState.weight}
                onChange={(event) => updateField("weight", event.target.value)}
                placeholder="80"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Body fat %</FieldLabel>
              <InputField
                type="number"
                min="0"
                max="60"
                value={formState.bodyFatPercentage}
                onChange={(event) => updateField("bodyFatPercentage", event.target.value)}
                placeholder="18"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Gen *</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {genderOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    option={option}
                    selected={formState.gender === option.value}
                    language={language}
                    onClick={() => updateField("gender", option.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Sex biologic *</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                {sexOptions.map((option) => (
                  <OptionButton
                    key={option.value}
                    option={option}
                    selected={formState.sex === option.value}
                    language={language}
                    onClick={() => updateField("sex", option.value)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">Vârstă estimată</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{age || "-"}</p>
            </div>
            <div className="rounded-3xl bg-sky-50 p-4">
              <p className="text-sm font-medium text-sky-700">BMI estimat</p>
              <p className="mt-1 text-2xl font-bold text-sky-900">{bmi || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <SectionTitle
            title="Bază de antrenament"
            description="Aceste câmpuri sunt citite direct de generatorul de workout și de calculele de target."
          />

          <div>
            <FieldLabel>Nivel de experiență *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {experienceOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.experienceLevel === option.value}
                  language={language}
                  onClick={() => updateField("experienceLevel", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Nivel de activitate zilnică *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {activityLevelOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.activityLevel === option.value}
                  language={language}
                  onClick={() => updateField("activityLevel", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Obiective *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {goalOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.goals.includes(option.value)}
                  language={language}
                  onClick={() => toggleMultiValue("goals", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Obiectiv principal *</FieldLabel>
              <select
                value={formState.priorityGoal}
                onChange={(event) => updateField("priorityGoal", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Alege obiectivul principal</option>
                {formState.goals.map((goal) => (
                  <option key={goal} value={goal}>
                    {getOptionLabel(goalOptions, goal, language)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Motivație principală *</FieldLabel>
              <select
                value={formState.motivationType}
                onChange={(event) => updateField("motivationType", event.target.value as ProfileFormState["motivationType"])}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Alege motivația dominantă</option>
                {motivationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {language === "ro" ? option.labelRo : option.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Zile disponibile pe săptămână *</FieldLabel>
              <InputField
                type="number"
                min="1"
                max="7"
                value={formState.daysPerWeek}
                onChange={(event) => updateField("daysPerWeek", event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Durată preferată per sesiune (minute) *</FieldLabel>
              <InputField
                type="number"
                min="15"
                max="180"
                step="5"
                value={formState.workoutDuration}
                onChange={(event) => updateField("workoutDuration", event.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <SectionTitle
            title="Mediu și preferințe"
            description="Asta influențează exercițiile propuse, echipamentul folosit și tipurile de sport recomandate."
          />

          <div>
            <FieldLabel>Unde te antrenezi cel mai des *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {trainingEnvironmentOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.trainingEnvironment === option.value}
                  language={language}
                  onClick={() => updateField("trainingEnvironment", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Sporturi preferate *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {sportOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.preferredSports.includes(option.value)}
                  language={language}
                  onClick={() => toggleMultiValue("preferredSports", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Echipament disponibil *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {equipmentOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.homeEquipment.includes(option.value)}
                  language={language}
                  onClick={() => toggleMultiValue("homeEquipment", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formState.lookingForBuddy}
                onChange={(event) => updateField("lookingForBuddy", event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p className="font-medium text-slate-900">Vrei să fii vizibil pentru workout buddies?</p>
                <p className="text-sm text-slate-500">
                  Dacă activezi opțiunea, datele tale sportive vor fi folosite și pentru matching.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <SectionTitle
            title="Sănătate și recuperare"
            description="Generatorul de workout citește explicit aceste câmpuri pentru a evita recomandări riscante."
          />

          <div>
            <FieldLabel>Condiții medicale *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {medicalConditionOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.medicalConditions.includes(option.value)}
                  language={language}
                  onClick={() => toggleMultiValue("medicalConditions", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <FieldLabel>Accidentări, dureri sau limitări</FieldLabel>
            <TextareaField
              value={toCommaSeparatedInput(formState.injuries)}
              onChange={(event) => updateCommaSeparatedField("injuries", event.target.value)}
              placeholder="umeri sensibili, genunchi, durere lombară"
            />
            <ChipPreview values={formState.injuries} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel>Somn mediu / noapte *</FieldLabel>
              <InputField
                type="number"
                min="3"
                max="12"
                step="0.5"
                value={formState.sleepHours}
                onChange={(event) => updateField("sleepHours", event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Pași zilnici *</FieldLabel>
              <InputField
                type="number"
                min="0"
                step="500"
                value={formState.dailySteps}
                onChange={(event) => updateField("dailySteps", event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Stres *</FieldLabel>
              <select
                value={formState.stressLevel}
                onChange={(event) => updateField("stressLevel", event.target.value as ProfileFormState["stressLevel"])}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">Selectează nivelul</option>
                {stressLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {language === "ro" ? option.labelRo : option.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <SectionTitle
            title="Nutriție și obiceiuri alimentare"
            description="Aceste detalii sunt folosite de pagina de nutriție pentru target-uri și sugestii relevante."
          />

          <div>
            <FieldLabel>Stil alimentar *</FieldLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {dietaryPreferenceOptions.map((option) => (
                <OptionButton
                  key={option.value}
                  option={option}
                  selected={formState.dietaryPreference === option.value}
                  language={language}
                  onClick={() => updateField("dietaryPreference", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Alergii sau intoleranțe</FieldLabel>
              <TextareaField
                value={toCommaSeparatedInput(formState.foodAllergies)}
                onChange={(event) => updateCommaSeparatedField("foodAllergies", event.target.value)}
                placeholder="lactate, arahide, gluten"
              />
              <ChipPreview values={formState.foodAllergies} />
            </div>
            <div>
              <FieldLabel>Alimente pe care vrei să le eviți</FieldLabel>
              <TextareaField
                value={toCommaSeparatedInput(formState.foodsToAvoid)}
                onChange={(event) => updateCommaSeparatedField("foodsToAvoid", event.target.value)}
                placeholder="fast food, zahăr lichid, alcool"
              />
              <ChipPreview values={formState.foodsToAvoid} />
            </div>
            <div>
              <FieldLabel>Suplimente</FieldLabel>
              <TextareaField
                value={toCommaSeparatedInput(formState.supplements)}
                onChange={(event) => updateCommaSeparatedField("supplements", event.target.value)}
                placeholder="creatină, omega 3, magneziu"
              />
              <ChipPreview values={formState.supplements} />
            </div>
            <div className="grid gap-4">
              <div>
                <FieldLabel>Mese pe zi *</FieldLabel>
                <InputField
                  type="number"
                  min="2"
                  max="8"
                  value={formState.mealsPerDay}
                  onChange={(event) => updateField("mealsPerDay", event.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Țintă apă / zi (litri) *</FieldLabel>
                <InputField
                  type="number"
                  min="1"
                  max="8"
                  step="0.1"
                  value={formState.waterIntakeLiters}
                  onChange={(event) => updateField("waterIntakeLiters", event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <SectionTitle
            title="Rezumat final"
            description="Verifică datele înainte de salvare. Acest profil va fi citit de login, profil, workout și nutrition."
          />

          <div className="space-y-4 rounded-3xl bg-slate-50 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Identitate</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {buildDisplayName(formState.firstName, formState.lastName, formState.displayName)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formState.city} • {age} ani
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Corp</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formState.height} cm / {formState.weight} kg
                </p>
                <p className="mt-1 text-sm text-slate-500">BMI estimat: {bmi || "-"}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Antrenament</p>
                <p className="mt-2 text-sm text-slate-700">
                  {getOptionLabel(experienceOptions, formState.experienceLevel, language)} •{" "}
                  {getOptionLabel(activityLevelOptions, formState.activityLevel, language)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formState.daysPerWeek} zile / săptămână • {formState.workoutDuration} min / sesiune
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">Nutriție</p>
                <p className="mt-2 text-sm text-slate-700">
                  {getOptionLabel(dietaryPreferenceOptions, formState.dietaryPreference, language)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formState.mealsPerDay} mese / zi • {formState.waterIntakeLiters}L apă
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Obiective</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {formatTagList(formState.goals, goalOptions, language).map((goal) => (
                  <span
                    key={goal}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Context medical și alimentar</p>
              <p className="mt-2 text-sm text-slate-700">
                Condiții medicale: {formatTagList(formState.medicalConditions, medicalConditionOptions, language).join(", ")}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Alergii: {formState.foodAllergies.length > 0 ? formState.foodAllergies.join(", ") : "niciuna"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
        <button
          type="button"
          onClick={prevStep}
          className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 sm:min-w-[140px]"
        >
          {step === 0 ? "Înapoi" : "Pasul anterior"}
        </button>

        {step < 6 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canContinue()}
            className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continuă
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSubmit(formState)}
            disabled={saving}
            className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Se salvează..." : finalSubmitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
