import { db } from "@/config/firebase";
import { Company, CreateCompanyInput, toDate } from "@/constants/types";
import firebase from "firebase/compat/app";

// ─────────────────────────────────────────────────
// Create Company
// ─────────────────────────────────────────────────
export const createCompany = async (
  ownerId: string,
  input: CreateCompanyInput,
  logoUrl?: string
): Promise<{ companyId: string | null; error: string | null }> => {
  try {
    const ref = db.collection("companies").doc();
    const now = firebase.firestore.FieldValue.serverTimestamp();

    await ref.set({
      id: ref.id,
      name: input.name,
      logo: logoUrl || "",
      coverImage: "",
      description: input.description || "",
      industry: input.industry || "",
      location: input.location || "",
      website: input.website || "",
      size: input.size || "",
      ownerId,
      adminIds: [ownerId],
      followersCount: 0,
      postsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { companyId: ref.id, error: null };
  } catch (error: any) {
    return { companyId: null, error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get Company by ID
// ─────────────────────────────────────────────────
export const getCompany = async (
  companyId: string
): Promise<{ company: Company | null; error: string | null }> => {
  try {
    const doc = await db.collection("companies").doc(companyId).get();
    if (!doc.exists) return { company: null, error: "Company not found" };

    const d = doc.data()!;
    return {
      company: {
        ...d,
        id: doc.id,
        createdAt: toDate(d.createdAt),
        updatedAt: toDate(d.updatedAt),
      } as Company,
      error: null,
    };
  } catch (error: any) {
    return { company: null, error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get User's Companies
// ─────────────────────────────────────────────────
export const getUserCompanies = async (
  userId: string
): Promise<{ companies: Company[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("companies")
      .where("adminIds", "array-contains", userId)
      .orderBy("createdAt", "desc")
      .get();

    const companies = snapshot.docs.map((doc) => {
      const d = doc.data();
      return { ...d, id: doc.id, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt) } as Company;
    });

    return { companies, error: null };
  } catch (error: any) {
    return { companies: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Update Company
// ─────────────────────────────────────────────────
export const updateCompany = async (
  companyId: string,
  updates: Partial<Company>
): Promise<{ error: string | null }> => {
  try {
    await db.collection("companies").doc(companyId).update({
      ...updates,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Follow/Unfollow Company
// ─────────────────────────────────────────────────
export const followCompany = async (
  userId: string,
  companyId: string
): Promise<{ error: string | null }> => {
  try {
    const followId = `${userId}_${companyId}`;
    await db.collection("companyFollows").doc(followId).set({
      userId,
      companyId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("companies").doc(companyId).update({
      followersCount: firebase.firestore.FieldValue.increment(1),
    });

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const unfollowCompany = async (
  userId: string,
  companyId: string
): Promise<{ error: string | null }> => {
  try {
    const followId = `${userId}_${companyId}`;
    await db.collection("companyFollows").doc(followId).delete();

    await db.collection("companies").doc(companyId).update({
      followersCount: firebase.firestore.FieldValue.increment(-1),
    });

    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const checkIfFollowingCompany = async (
  userId: string,
  companyId: string
): Promise<boolean> => {
  try {
    const doc = await db.collection("companyFollows").doc(`${userId}_${companyId}`).get();
    return doc.exists;
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────
// Get Company Analytics
// ─────────────────────────────────────────────────
export const getCompanyAnalytics = async (
  companyId: string
): Promise<{
  totalPosts: number;
  totalApplications: number;
  totalViews: number;
  error: string | null;
}> => {
  try {
    // Get posts by company
    const posts = await db
      .collection("posts")
      .where("companyId", "==", companyId)
      .get();

    const postIds = posts.docs.map((d) => d.id);

    // Count applications across all company posts
    let totalApplications = 0;
    for (const postId of postIds) {
      const apps = await db
        .collection("jobApplications")
        .where("postId", "==", postId)
        .get();
      totalApplications += apps.size;
    }

    // Sum views (likesCount as proxy for engagement)
    let totalViews = 0;
    posts.docs.forEach((doc) => {
      totalViews += doc.data().likesCount || 0;
    });

    return {
      totalPosts: posts.size,
      totalApplications,
      totalViews,
      error: null,
    };
  } catch (error: any) {
    return { totalPosts: 0, totalApplications: 0, totalViews: 0, error: error.message };
  }
};
