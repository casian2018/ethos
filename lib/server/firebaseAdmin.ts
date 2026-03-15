import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const FIREBASE_ADMIN_APP_NAME = "ethos-admin";

type RawServiceAccount = ServiceAccount & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

let cachedServiceAccount: ServiceAccount | null = null;

function getServiceAccountSource(): string {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inlineJson) {
    return inlineJson;
  }

  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (!serviceAccountPath) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON."
    );
  }

  return readFileSync(resolve(serviceAccountPath), "utf8");
}

function normalizeServiceAccount(rawAccount: RawServiceAccount): ServiceAccount {
  const projectId = rawAccount.project_id || rawAccount.projectId;
  const clientEmail = rawAccount.client_email || rawAccount.clientEmail;
  const privateKey = (rawAccount.private_key || rawAccount.privateKey || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase service account JSON is missing project_id, client_email, or private_key.");
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

export function getFirebaseServiceAccount(): ServiceAccount {
  if (cachedServiceAccount) {
    return cachedServiceAccount;
  }

  let parsedAccount: RawServiceAccount;

  try {
    parsedAccount = JSON.parse(getServiceAccountSource()) as RawServiceAccount;
  } catch (error) {
    throw new Error(
      `Invalid Firebase service account JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    );
  }

  cachedServiceAccount = normalizeServiceAccount(parsedAccount);
  return cachedServiceAccount;
}

export function getFirebaseAdminApp(): App {
  const existingApp = getApps().find((app) => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existingApp) {
    return getApp(FIREBASE_ADMIN_APP_NAME);
  }

  const serviceAccount = getFirebaseServiceAccount();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined;

  return initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket,
    },
    FIREBASE_ADMIN_APP_NAME
  );
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getFirebaseAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}
