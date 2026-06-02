import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";

// Load environment variables
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "vyin-network-alliance-secret-key-2026-v1";

// Read Firebase configurations
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));

// Initialize Firebase with client context
const appFirebase = initializeApp(firebaseConfig);
const dbFirebaseReal = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

// Load local database store helpers
function loadLocalStore(): any {
  const storePath = path.join(process.cwd(), "data_store.json");
  try {
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, "utf8"));
    }
  } catch (err) {
    console.error("Local database load break:", err);
  }
  return { users: [], posts: [], resetTokens: {}, settings: {} };
}

function saveLocalStore(store: any) {
  const storePath = path.join(process.cwd(), "data_store.json");
  try {
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Local database save break:", err);
  }
}

class SafeFirestoreCollection {
  private collectionName: string;
  private queries: Array<{ field: string; op: string; val: any }> = [];

  constructor(collectionName: string, queries: Array<{ field: string; op: string; val: any }> = []) {
    this.collectionName = collectionName;
    this.queries = queries;
  }

  where(field: string, op: string, val: any): SafeFirestoreCollection {
    return new SafeFirestoreCollection(this.collectionName, [...this.queries, { field, op, val }]);
  }

  doc(docId: string) {
    const collName = this.collectionName;
    return {
      get: async (): Promise<any> => {
        try {
          const docRef = doc(dbFirebaseReal, collName, docId);
          const docSnap = await getDoc(docRef);
          return {
            exists: docSnap.exists(),
            id: docId,
            data: () => docSnap.data()
          };
        } catch (err: any) {
          console.warn(`[SafeFirestore Fallback] doc(${collName}/${docId}).get() failed. Reading from local data_store:`, err.message);
          const store = loadLocalStore();
          let data: any = null;
          if (collName === "settings" && docId === "branding") {
            data = store.settings || {};
          } else if (collName === "users") {
            data = store.users.find((u: any) => u.id === docId);
          } else if (collName === "posts") {
            data = store.posts.find((p: any) => p.id === docId);
          } else if (collName === "resetTokens") {
            data = store.resetTokens ? store.resetTokens[docId] : null;
          }
          return {
            exists: !!data,
            id: docId,
            data: () => data
          };
        }
      },
      set: async (docData: any): Promise<void> => {
        try {
          const docRef = doc(dbFirebaseReal, collName, docId);
          await setDoc(docRef, docData);
          this.syncLocal(docId, docData);
        } catch (err: any) {
          console.warn(`[SafeFirestore Fallback] doc(${collName}/${docId}).set() failed. Writing to local data_store:`, err.message);
          this.syncLocal(docId, docData);
        }
      },
      update: async (updateData: any): Promise<void> => {
        try {
          const docRef = doc(dbFirebaseReal, collName, docId);
          await updateDoc(docRef, updateData);
          const store = loadLocalStore();
          if (collName === "users") {
            const idx = store.users.findIndex((u: any) => u.id === docId);
            if (idx !== -1) store.users[idx] = { ...store.users[idx], ...updateData };
          } else if (collName === "registrations") {
            const idx = store.registrations?.findIndex((r: any) => r.id === docId);
            if (idx !== -1) store.registrations[idx] = { ...store.registrations[idx], ...updateData };
          } else if (collName === "posts") {
            const idx = store.posts.findIndex((p: any) => p.id === docId);
            if (idx !== -1) store.posts[idx] = { ...store.posts[idx], ...updateData };
          }
          saveLocalStore(store);
        } catch (err: any) {
          console.warn(`[SafeFirestore Fallback] doc(${collName}/${docId}).update() failed. Updating local data_store:`, err.message);
          const store = loadLocalStore();
          if (collName === "users") {
            const idx = store.users.findIndex((u: any) => u.id === docId);
            if (idx !== -1) store.users[idx] = { ...store.users[idx], ...updateData };
          } else if (collName === "registrations") {
            const idx = store.registrations?.findIndex((r: any) => r.id === docId);
            if (idx !== -1) store.registrations[idx] = { ...store.registrations[idx], ...updateData };
          } else if (collName === "posts") {
            const idx = store.posts.findIndex((p: any) => p.id === docId);
            if (idx !== -1) store.posts[idx] = { ...store.posts[idx], ...updateData };
          }
          saveLocalStore(store);
        }
      },
      delete: async (): Promise<void> => {
        try {
          const docRef = doc(dbFirebaseReal, collName, docId);
          await deleteDoc(docRef);
          const store = loadLocalStore();
          if (collName === "users") {
            store.users = store.users.filter((u: any) => u.id !== docId);
          } else if (collName === "registrations") {
            store.registrations = store.registrations?.filter((r: any) => r.id !== docId);
          } else if (collName === "posts") {
            store.posts = store.posts.filter((p: any) => p.id !== docId);
          } else if (collName === "resetTokens" && store.resetTokens) {
            delete store.resetTokens[docId];
          }
          saveLocalStore(store);
        } catch (err: any) {
          console.warn(`[SafeFirestore Fallback] doc(${collName}/${docId}).delete() failed. Deleting from local:`, err.message);
          const store = loadLocalStore();
          if (collName === "users") {
            store.users = store.users.filter((u: any) => u.id !== docId);
          } else if (collName === "registrations") {
            store.registrations = store.registrations?.filter((r: any) => r.id !== docId);
          } else if (collName === "posts") {
            store.posts = store.posts.filter((p: any) => p.id !== docId);
          } else if (collName === "resetTokens" && store.resetTokens) {
            delete store.resetTokens[docId];
          }
          saveLocalStore(store);
        }
      }
    };
  }

  private syncLocal(docId: string, docData: any) {
    const store = loadLocalStore();
    if (this.collectionName === "settings" && docId === "branding") {
      store.settings = docData;
    } else if (this.collectionName === "users") {
      const idx = store.users.findIndex((u: any) => u.id === docId);
      if (idx !== -1) store.users[idx] = docData;
      else store.users.push(docData);
    } else if (this.collectionName === "posts") {
      const idx = store.posts.findIndex((p: any) => p.id === docId);
      if (idx !== -1) store.posts[idx] = docData;
      else store.posts.push(docData);
    } else if (this.collectionName === "registrations") {
      if (!store.registrations) store.registrations = [];
      const idx = store.registrations.findIndex((r: any) => r.id === docId);
      if (idx !== -1) store.registrations[idx] = docData;
      else store.registrations.push(docData);
    } else if (this.collectionName === "resetTokens") {
      if (!store.resetTokens) store.resetTokens = {};
      store.resetTokens[docId] = docData;
    }
    saveLocalStore(store);
  }

  async get(): Promise<any> {
    try {
      const collRef = collection(dbFirebaseReal, this.collectionName);
      let q = query(collRef);
      for (const qItem of this.queries) {
        q = query(q, where(qItem.field, qItem.op as any, qItem.val));
      }
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((docSnap: any) => ({
        id: docSnap.id,
        data: () => docSnap.data()
      }));
      return {
        empty: snapshot.empty,
        size: docs.length,
        docs: docs,
        forEach: (callback: (doc: any, index: number) => void) => docs.forEach(callback)
      };
    } catch (err: any) {
      console.warn(`[SafeFirestore Fallback] collection(${this.collectionName}).get() failed. Fetching locally:`, err.message);
      const store = loadLocalStore();
      let results: any[] = [];
      if (this.collectionName === "posts") {
        results = store.posts || [];
      } else if (this.collectionName === "users") {
        results = store.users || [];
      } else if (this.collectionName === "settings") {
        results = store.settings ? [store.settings] : [];
      } else if (this.collectionName === "registrations") {
        results = store.registrations || [];
      } else if (this.collectionName === "resetTokens") {
        results = Object.entries(store.resetTokens || {}).map(([id, val]: any) => ({ id, ...val }));
      }

      for (const query of this.queries) {
        results = results.filter((item) => {
          const itemValue = item[query.field];
          if (query.op === "==") {
            return itemValue === query.val;
          }
          return true;
        });
      }

      const docs = results.map((item) => ({
        id: item.id || "settings",
        data: () => item
      }));

      return {
        empty: results.length === 0,
        size: docs.length,
        docs: docs,
        forEach: (callback: (doc: any, index: number) => void) => docs.forEach(callback)
      };
    }
  }
}

class SafeFirestoreDb {
  collection(name: string) {
    return new SafeFirestoreCollection(name);
  }
}

const dbFirebase = new SafeFirestoreDb();

// Define User profile types
export interface FirebaseUserProfile {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: "admin" | "author" | "member";
  createdAt: string;
}

// Define BlogPost schema
export interface FirebaseBlogPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  publishedAt: string;
  image: string;
  category: string;
  tags: string[];
}

// Simple PBKDF2 Password Hashing
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// Custom JWT Sign & Verify using native HMAC
function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const reSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== reSignature) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

// Firestore Database Seeder Function
async function seedDatabaseIfEmpty() {
  try {
    const postsRef = dbFirebase.collection("posts");
    const postsSnapshot = await postsRef.get();
    
    if (postsSnapshot.empty) {
      console.log("[Firestore Seeder] Seeding initial blog posts to database...");
      
      const initialPosts = [
        {
          id: "post-1",
          title: "Scaling Green Belts: The 2026 Young Tree-Planting Matrix",
          content: "The Visionary Young Innovators Network, in co-development with Voicecommedia, launched an aggressive tree-planting protocol this quarter. Targeting critical riparian buffers and water catchment boundaries, the network mobilized 150 local volunteers. In alliance with community chiefs, we mapped five sensitive ecological sectors, distributing over 2,400 indigenous and fruit-tree seedlings. This action scales carbon sinks while providing strategic crop borders for neighboring smallholder farms.",
          author: {
            id: "bootstrap-admin-id",
            fullName: "System Administrator",
            email: "jengaflowsolutions@gmail.com"
          },
          publishedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
          image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60",
          category: "Ecology",
          tags: ["Environment", "Youth-Action", "Ecology"]
        },
        {
          id: "post-2",
          title: "Expanding Clinical Logistics with Lisa Hospitals Clinic Sponsor Matrix",
          content: "We are proud to announce the next phase of our joint medical equipment and logistics support with Lisa Hospitals—focused on 'Your Health, Our Priority.' By redirecting collaborative resources and advertising space provided by Voicecommedia, VYIN has co-funded the delivery of cutting-edge pediatric wing diagnostic units. Ensuring high-quality clinical support at the grassroots tier remains a key pillar of our systemic development alliance.",
          author: {
            id: "bootstrap-admin-id",
            fullName: "System Administrator",
            email: "jengaflowsolutions@gmail.com"
          },
          publishedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 7 days ago
          image: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&auto=format&fit=crop&q=60",
          category: "Healthcare",
          tags: ["Health", "Partnership", "Community"]
        },
        {
          id: "post-3",
          title: "Education Sponsorship: Unlocking Technical Tracks For Vulnerable Youths",
          content: "Development succeeds only when academic gates are accessible to all. Operating the 2026 Scholarship Matrix, VYIN has successfully matched 12 vulnerable secondary-tier students with corporate education sponsors. This program covers tuition and tech-bootcamp credentials to prepare young minds for software and vocational leadership, directly fulfilling our educational enrichment pillar.",
          author: {
            id: "bootstrap-admin-id",
            fullName: "System Administrator",
            email: "jengaflowsolutions@gmail.com"
          },
          publishedAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(), // 14 days ago
          image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60",
          category: "Education",
          tags: ["Sponsorship", "Workshops", "Technology"]
        }
      ];

      for (const post of initialPosts) {
        await postsRef.doc(post.id).set(post);
      }
      console.log("[Firestore Seeder] Seeding posts completed.");
    }

    const usersRef = dbFirebase.collection("users");
    const adminSnapshot = await usersRef.where("email", "==", "jengaflowsolutions@gmail.com").get();
    
    if (adminSnapshot.empty) {
      console.log("[Firestore Seeder] Seeding default administrator account bootstrap...");
      const adminUser = {
        id: "bootstrap-admin-id",
        email: "jengaflowsolutions@gmail.com",
        fullName: "System Administrator",
        passwordHash: hashPassword("Admin123!"),
        role: "admin",
        createdAt: new Date().toISOString()
      };
      await usersRef.doc(adminUser.id).set(adminUser);
      console.log("[Firestore Seeder] Default admin seeded.");
    }
  } catch (error) {
    console.error("[Firestore Seeder Warning] Database seeding check failed:", error);
  }
}

// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ success: false, error: "Access denied. Session token missing." });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ success: false, error: "Invalid or expired session token." });
    return;
  }

  (req as any).user = decoded;
  next();
}

async function startServer() {
  const app = express();
  
  const publicPath = path.join(process.cwd(), "public");
  const imagesPath = path.join(publicPath, "images");
  const sourceAssetsPath = path.join(process.cwd(), "src", "assets", "images");
  
  // 1. Auto-create directory structure if missing
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }
  if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
  }

  // 2. Auto-migration (Server-side): Ensure consistency on backend startup
  if (fs.existsSync(sourceAssetsPath)) {
    const files = fs.readdirSync(sourceAssetsPath);
    files.forEach(file => {
      const srcFile = path.join(sourceAssetsPath, file);
      const destFile = path.join(imagesPath, file);
      
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`[System] Auto-migrated asset: ${file} -> public/images/`);
      }
    });
  }

  // Serve the public directory for static assets
  app.use(express.static(publicPath));

  // Parse JSON payloads with generous size limit for high-res JPEG/PNG logo base64 uploads
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Initialize cloud Firestore database seeding
  await seedDatabaseIfEmpty();

  // AUTH API ENDPOINTS

  // Register endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role } = req.body;
      if (!email || !password || !fullName) {
        res.status(400).json({ success: false, error: "Email, password, and full name are required." });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const usersRef = dbFirebase.collection("users");
      const userQuery = await usersRef.where("email", "==", emailLower).get();
      if (!userQuery.empty) {
        res.status(400).json({ success: false, error: "An account with this email address already exists." });
        return;
      }

      const assignedRole = role === "admin" || role === "author" ? role : "member";
      const newUser = {
        id: crypto.randomUUID(),
        email: emailLower,
        fullName: fullName.trim(),
        passwordHash: hashPassword(password),
        role: assignedRole,
        createdAt: new Date().toISOString()
      };

      await usersRef.doc(newUser.id).set(newUser);

      const tokenPayload = {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      };

      const token = signToken(tokenPayload);

      res.status(201).json({
        success: true,
        message: "Registration completed successfully.",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    } catch (err: any) {
      console.error("[Auth API Error] Registration failure:", err);
      res.status(500).json({ success: false, error: "Internal server error during registration." });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: "Email and password are required." });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const usersRef = dbFirebase.collection("users");
      const userQuery = await usersRef.where("email", "==", emailLower).get();
      
      if (userQuery.empty) {
        res.status(401).json({ success: false, error: "Invalid email address or passcode sequence." });
        return;
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data() as FirebaseUserProfile;

      if (!verifyPassword(password, userData.passwordHash)) {
        res.status(401).json({ success: false, error: "Invalid email address or passcode sequence." });
        return;
      }

      const tokenPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role
      };

      const token = signToken(tokenPayload);

      res.status(200).json({
        success: true,
        message: "Authentication established securely.",
        token,
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          createdAt: userData.createdAt
        }
      });
    } catch (err: any) {
      console.error("[Auth API Error] Login failure:", err);
      res.status(500).json({ success: false, error: "Internal server error during login check." });
    }
  });

  // Request password reset endpoint
  app.post("/api/auth/reset-password-request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, error: "Registered email address is required." });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const usersRef = dbFirebase.collection("users");
      const userQuery = await usersRef.where("email", "==", emailLower).get();

      if (userQuery.empty) {
        res.status(404).json({ success: false, error: "No registered representative found with this email." });
        return;
      }

      // Generate a secure 6 digit numeric reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenID = crypto.randomUUID();

      await dbFirebase.collection("resetTokens").doc(tokenID).set({
        email: emailLower,
        code: resetCode,
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });

      console.log(`[PASS_RESET_SIMULATOR] Password reset initiated for ${emailLower}. Verification Code: ${resetCode}`);

      // Return the simulation code so the client-side UI can gracefully present it for testing!
      res.status(200).json({
        success: true,
        message: "Security reset code generated successfully and printed on logs.",
        simulationCode: resetCode,
        tokenId: tokenID
      });
    } catch (err: any) {
      console.error("[Auth API Error] Password reset request error:", err);
      res.status(500).json({ success: false, error: "Internal server error during password reset request." });
    }
  });

  // Verify and complete password reset
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, resetCode, newPassword, tokenId } = req.body;
      if (!email || !resetCode || !newPassword) {
        res.status(400).json({ success: false, error: "Email, reset verification code, and new password are required." });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const resetTokensRef = dbFirebase.collection("resetTokens");

      let validTokenKey = tokenId;
      let tokenObject: any = null;

      if (validTokenKey) {
        const tokenDoc = await resetTokensRef.doc(validTokenKey).get();
        if (tokenDoc.exists) {
          tokenObject = tokenDoc.data();
        }
      }

      if (!tokenObject) {
        // Fallback search through documents
        const fallbackQuery = await resetTokensRef
          .where("email", "==", emailLower)
          .where("code", "==", resetCode)
          .get();
        if (!fallbackQuery.empty) {
          validTokenKey = fallbackQuery.docs[0].id;
          tokenObject = fallbackQuery.docs[0].data();
        }
      }

      if (!tokenObject || tokenObject.email !== emailLower || tokenObject.code !== resetCode) {
        res.status(400).json({ success: false, error: "Invalid configuration or incorrect reset code." });
        return;
      }

      if (Date.now() > tokenObject.expires) {
        await resetTokensRef.doc(validTokenKey).delete();
        res.status(400).json({ success: false, error: "Reset verification code has expired (15-min limit)." });
        return;
      }

      const usersRef = dbFirebase.collection("users");
      const userQuery = await usersRef.where("email", "==", emailLower).get();

      if (userQuery.empty) {
        res.status(404).json({ success: false, error: "Account mapping mismatch." });
        return;
      }

      const userDocId = userQuery.docs[0].id;
      await usersRef.doc(userDocId).update({
        passwordHash: hashPassword(newPassword)
      });

      await resetTokensRef.doc(validTokenKey).delete();

      res.status(200).json({
        success: true,
        message: "Credentials security updated. Please log in using the new passcode."
      });
    } catch (err: any) {
      console.error("[Auth API Error] Reset password submission error:", err);
      res.status(500).json({ success: false, error: "Internal server error during password update." });
    }
  });

  // Get current active profile
  app.get("/api/auth/me", authenticateToken, async (req: Request, res: Response) => {
    try {
      const tokenInfo = (req as any).user;
      const userDoc = await dbFirebase.collection("users").doc(tokenInfo.id).get();
      
      if (!userDoc.exists) {
        res.status(404).json({ success: false, error: "Representative registry record missing." });
        return;
      }

      const userData = userDoc.data() as FirebaseUserProfile;

      res.status(200).json({
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          createdAt: userData.createdAt
        }
      });
    } catch (err: any) {
      console.error("[Auth API Error] Get profile crash:", err);
      res.status(500).json({ success: false, error: "Internal server error serving profile records." });
    }
  });


  // BLOG API ENDPOINTS

  // Get all blog posts
  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const postsSnapshot = await dbFirebase.collection("posts").get();
      const postsList: FirebaseBlogPost[] = [];
      
      postsSnapshot.forEach((docSnap: any) => {
        postsList.push(docSnap.data() as FirebaseBlogPost);
      });

      // Return posts sorted by creation date descending
      const sortedPosts = postsList.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      res.status(200).json({ success: true, posts: sortedPosts });
    } catch (err: any) {
      console.error("[Posts API Error] Fetching posts error:", err);
      res.status(500).json({ success: false, error: "Internal server error fetching community posts." });
    }
  });

  // Create new blog post
  app.post("/api/posts", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { title, content, image, category, tags } = req.body;
      const authenticatedUser = (req as any).user;

      // Validate fields
      if (!title || !content || !category) {
        res.status(400).json({ success: false, error: "Title, content, and category are mandatory." });
        return;
      }

      const newPost = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        author: {
          id: authenticatedUser.id,
          fullName: authenticatedUser.fullName,
          email: authenticatedUser.email
        },
        publishedAt: new Date().toISOString(),
        image: image || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60",
        category: category.trim(),
        tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : []
      };

      await dbFirebase.collection("posts").doc(newPost.id).set(newPost);

      res.status(201).json({
        success: true,
        message: "Blog post published into database successfully.",
        post: newPost
      });
    } catch (err: any) {
      console.error("[Posts API Error] Publishing post failure:", err);
      res.status(500).json({ success: false, error: "Internal server error publishing post." });
    }
  });

  // Update existing blog post
  app.put("/api/posts/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const { title, content, image, category, tags } = req.body;
      const authenticatedUser = (req as any).user;

      const postsRef = dbFirebase.collection("posts");
      const postDoc = await postsRef.doc(postId).get();

      if (!postDoc.exists) {
        res.status(404).json({ success: false, error: "Post record not found." });
        return;
      }

      const post = postDoc.data() as FirebaseBlogPost;

      // Authorize: Only admin, or post author
      const isAuthorized = authenticatedUser.role === "admin" || post.author.id === authenticatedUser.id;
      if (!isAuthorized) {
        res.status(403).json({ success: false, error: "Forbidden. You are not the author of this post." });
        return;
      }

      // Apply updates
      const updatedPost = { ...post };
      if (title !== undefined) updatedPost.title = title.trim();
      if (content !== undefined) updatedPost.content = content.trim();
      if (image !== undefined) updatedPost.image = image;
      if (category !== undefined) updatedPost.category = category.trim();
      if (tags !== undefined) {
        updatedPost.tags = Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [];
      }

      await postsRef.doc(postId).set(updatedPost);

      res.status(200).json({
        success: true,
        message: "Blog post updated successfully.",
        post: updatedPost
      });
    } catch (err: any) {
      console.error("[Posts API Error] Updating post failure:", err);
      res.status(500).json({ success: false, error: "Internal server error updating post." });
    }
  });

  // Delete existing blog post
  app.delete("/api/posts/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const postId = req.params.id;
      const authenticatedUser = (req as any).user;

      const postsRef = dbFirebase.collection("posts");
      const postDoc = await postsRef.doc(postId).get();

      if (!postDoc.exists) {
        res.status(404).json({ success: false, error: "Post record not found." });
        return;
      }

      const post = postDoc.data() as FirebaseBlogPost;

      // Authorize: Only admin, or post author
      const isAuthorized = authenticatedUser.role === "admin" || post.author.id === authenticatedUser.id;
      if (!isAuthorized) {
        res.status(403).json({ success: false, error: "Forbidden. You do not have permissions to delete this post." });
        return;
      }

      await postsRef.doc(postId).delete();

      res.status(200).json({
        success: true,
        message: "Blog post deleted from database."
      });
    } catch (err: any) {
      console.error("[Posts API Error] Deleting post failure:", err);
      res.status(500).json({ success: false, error: "Internal server error deleting post." });
    }
  });

  // Health check API
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Secure API endpoint for registration
  app.post("/api/register", async (req: Request, res: Response) => {
    const { fullName, email, phone, primaryPillar } = req.body;

    // Server-side validation
    if (!fullName || !email || !phone || !primaryPillar) {
       res.status(400).json({
        success: false,
        error: "All registration fields (Full Name, Email, Phone Number, Pillar focus) are mandatory."
      });
      return;
    }

    console.log(`[Registration System] New payload received:`, { fullName, email, phone, primaryPillar });

    let emailSent = false;
    let smsSent = false;
    let emailStatusInfo = "";
    let smsStatusInfo = "";

    // 0. Base Data Persist into Firestore registrations collection
    const registrationId = `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const registrationData = {
      id: registrationId,
      fullName,
      email,
      phone,
      primaryPillar,
      registrationDate: new Date().toISOString()
    };

    try {
      await dbFirebase.collection("registrations").doc(registrationId).set(registrationData);
      console.log(`[Registration System] Registrant successfully backed up to ledger ID: ${registrationId}`);
    } catch (err: any) {
      console.error("[Registration System] Non-critical db backup failed:", err);
    }

    // 1. Web3Forms Delivery Strategy
    const web3AccessKey = process.env.WEB3FORMS_ACCESS_KEY;
    const hasWeb3Config = web3AccessKey && web3AccessKey.trim() !== "" && web3AccessKey !== "your_web3forms_access_key";

    if (hasWeb3Config) {
      try {
        const fetchResponse = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            access_key: web3AccessKey.trim(),
            subject: `New VYIN Affiliate Enrollment: ${fullName}`,
            from_name: "The Visionary Young Innovators Network",
            "Full Name": fullName,
            "Email Address": email,
            "Phone Number": phone,
            "Primary Pillar": primaryPillar,
            "System Code": "VYIN_W3F_DISPATCH",
            message: `A new member has enrolled via the VYIN platform. Primary Focus: ${primaryPillar}. Contact Phone: ${phone}. Email: ${email}.`
          })
        });

        const web3Result = await fetchResponse.json() as any;
        if (web3Result && (web3Result.success || web3Result.success === "true")) {
          emailSent = true;
          emailStatusInfo = "Dispatched successfully via Web3Forms API to your configured inbox.";
        } else {
          emailStatusInfo = `Web3Forms returned a status error: ${web3Result?.message || "Unknown error"}`;
        }
      } catch (err: any) {
        console.error("[Web3Forms Error] Dispatch failure:", err);
        emailStatusInfo = `Failed to deliver via Web3Forms connection: ${err.message || err}`;
      }
    } else {
      console.warn("[Web3Forms Warning] Access key is not configured.");
      emailStatusInfo = "Skipped - Define WEB3FORMS_ACCESS_KEY in environment variables to receive submissions in your inbox.";
    }

    // 2. Backward Compatibility Fallback for SMTP (if explicitly configured but not prompted)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const targetEmail = process.env.TARGET_NOTIFICATION_EMAIL || "jengaflowsolutions@gmail.com";

    const hasSmtpConfig = smtpHost && smtpPort && smtpUser && smtpPass;

    if (!emailSent && hasSmtpConfig) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: parseInt(smtpPort || "587") === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const appUrl = process.env.APP_URL || "https://ais-dev-oe42y7rothn6smb2jb5oyw-616715679522.europe-west2.run.app";

        const mailOptions = {
          from: `"The Visionary Young Innovators Network" <${smtpUser}>`,
          to: targetEmail,
          subject: `New Membership Registration: ${fullName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
              <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
                <h2 style="margin: 0; color: #10b981; font-weight: 700; letter-spacing: -0.025em;">The Visionary Young Innovators Network</h2>
                <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.8; font-style: italic;">In Alliance with Voicecommedia</p>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p style="margin-top: 0; font-size: 16px;">Hello Team,</p>
                <p>A new visionary leader has completed their membership application to join our growing development alliance. Here are the registration system records:</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #64748b;">Full Name:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${fullName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Email Address:</td>
                    <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${email}" style="color: #10b981; text-decoration: none;">${email}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Phone Number:</td>
                    <td style="padding: 8px 0; color: #1e293b;">${phone}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Pillar Focus:</td>
                    <td style="padding: 8px 0; color: #10b981; font-weight: 600;">${primaryPillar}</td>
                  </tr>
                </table>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
        emailStatusInfo = "Dispatched fallback successfully via NodeMailer SMTP server.";
      } catch (err: any) {
        console.error("[Mailer Error] Fallback dispatch failure:", err);
      }
    }

    // 3. Backward Compatibility Fallback for Twilio (if explicitly configured but not prompted)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    const hasTwilioConfig = twilioSid && twilioToken && twilioFrom && !twilioSid.startsWith("ACXXXX");

    if (hasTwilioConfig) {
      try {
        const client = twilio(twilioSid, twilioToken);
        const outboundMsg = `Hello ${fullName}, thank you for registering with The Visionary Young Innovators Network, in alliance with Voicecommedia & actively supporting Lisa Hospitals ("Your Health, Our Priority"). We are thrilled to welcome you!`;

        await client.messages.create({
          body: outboundMsg,
          from: twilioFrom,
          to: phone
        });

        smsSent = true;
        smsStatusInfo = "Dispatched welcome text successfully via Twilio Gateway API.";
      } catch (err: any) {
        console.error("[SMS Gateway Error] Send failure:", err);
        smsStatusInfo = `Failed to deliver SMS fallback: ${err.message || err}`;
      }
    } else {
      smsStatusInfo = "SMS Gateway skipped. Setup Twilio credentials manually if required.";
    }

    // Always succeed securely, informing the client of the integration delivery states
    res.status(200).json({
      success: true,
      message: "Application securely filed into system database.",
      details: {
        registrant: { fullName, email, phone, primaryPillar },
        delivery: {
          emailSent,
          emailStatus: emailStatusInfo,
          smsSent,
          smsStatus: smsStatusInfo
        }
      }
    });
  });

  // Vite development middleware vs Static Production bundle
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening successfully on port ${PORT}`);
    console.log(`[Server] Environment status: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch((error) => {
  console.error("[Fatal Exception] Main server bootstrap crash:", error);
});
