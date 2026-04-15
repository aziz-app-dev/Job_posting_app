import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {
  ApplicationStatus,
  CreateApplicationInput,
  JobApplication,
  toDate,
} from "@/constants/types";
import { createNotification } from "./notificationService";

const db = firebase.firestore();

// ─────────────────────────────────────────────────
// Apply for a Job
// ─────────────────────────────────────────────────
export const applyForJob = async (
  input: CreateApplicationInput,
  applicantId: string,
  applicantName: string,
  applicantAvatar: string,
  applicantTitle: string,
  applicantEmail?: string
): Promise<{ applicationId?: string; error: string | null }> => {
  try {
    // Check if user already applied
    const existingApplication = await db
      .collection("jobApplications")
      .where("postId", "==", input.postId)
      .where("applicantId", "==", applicantId)
      .get();

    if (!existingApplication.empty) {
      return { error: "You have already applied for this job" };
    }

    // Create application
    const applicationData = {
      postId: input.postId,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      applicantId,
      applicantName,
      applicantAvatar,
      applicantTitle,
      applicantEmail: applicantEmail || null,
      recruiterId: input.recruiterId,
      message: input.message || null,
      resumeUrl: input.resumeUrl || null,
      status: "applied" as ApplicationStatus,
      statusHistory: [{
        status: "applied",
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      }],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("jobApplications").add(applicationData);

    // Send notification to recruiter
    await createNotification({
      recipientId: input.recruiterId,
      senderId: applicantId,
      senderName: applicantName,
      senderAvatar: applicantAvatar,
      type: "job_application",
      postId: input.postId,
      jobTitle: input.jobTitle,
      companyName: input.companyName,
      applicationId: docRef.id,
      applicantMessage: input.message
        ? input.message.length > 50
          ? input.message.substring(0, 50) + "..."
          : input.message
        : undefined,
    });

    return { applicationId: docRef.id, error: null };
  } catch (error: any) {
    console.error("Error applying for job:", error);
    return { error: error.message || "Failed to submit application" };
  }
};

// ─────────────────────────────────────────────────
// Check if User Already Applied
// ─────────────────────────────────────────────────
export const checkIfApplied = async (
  postId: string,
  userId: string
): Promise<{ hasApplied: boolean; applicationId?: string; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("jobApplications")
      .where("postId", "==", postId)
      .where("applicantId", "==", userId)
      .get();

    if (snapshot.empty) {
      return { hasApplied: false, error: null };
    }

    return {
      hasApplied: true,
      applicationId: snapshot.docs[0].id,
      error: null,
    };
  } catch (error: any) {
    console.error("Error checking application status:", error);
    return { hasApplied: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get Applications for a Job Post (for recruiters)
// ─────────────────────────────────────────────────
export const getJobApplications = async (
  postId: string
): Promise<{ applications: JobApplication[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("jobApplications")
      .where("postId", "==", postId)
      .orderBy("createdAt", "desc")
      .get();

    const applications: JobApplication[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        applicantId: data.applicantId,
        applicantName: data.applicantName,
        applicantAvatar: data.applicantAvatar,
        applicantTitle: data.applicantTitle,
        applicantEmail: data.applicantEmail,
        recruiterId: data.recruiterId,
        message: data.message,
        resumeUrl: data.resumeUrl,
        status: data.status,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: toDate(h.timestamp),
        })),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    });

    return { applications, error: null };
  } catch (error: any) {
    console.error("Error fetching job applications:", error);
    return { applications: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get All Applications Received by Recruiter
// ─────────────────────────────────────────────────
export const getRecruiterApplications = async (
  recruiterId: string
): Promise<{ applications: JobApplication[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("jobApplications")
      .where("recruiterId", "==", recruiterId)
      .orderBy("createdAt", "desc")
      .get();

    const applications: JobApplication[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        applicantId: data.applicantId,
        applicantName: data.applicantName,
        applicantAvatar: data.applicantAvatar,
        applicantTitle: data.applicantTitle,
        applicantEmail: data.applicantEmail,
        recruiterId: data.recruiterId,
        message: data.message,
        resumeUrl: data.resumeUrl,
        status: data.status,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: toDate(h.timestamp),
        })),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    });

    return { applications, error: null };
  } catch (error: any) {
    console.error("Error fetching recruiter applications:", error);
    return { applications: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get User's Submitted Applications
// ─────────────────────────────────────────────────
export const getUserApplications = async (
  userId: string
): Promise<{ applications: JobApplication[]; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("jobApplications")
      .where("applicantId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const applications: JobApplication[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        postId: data.postId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        applicantId: data.applicantId,
        applicantName: data.applicantName,
        applicantAvatar: data.applicantAvatar,
        applicantTitle: data.applicantTitle,
        applicantEmail: data.applicantEmail,
        recruiterId: data.recruiterId,
        message: data.message,
        resumeUrl: data.resumeUrl,
        status: data.status,
        statusHistory: (data.statusHistory || []).map((h: any) => ({
          ...h,
          timestamp: toDate(h.timestamp),
        })),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    });

    return { applications, error: null };
  } catch (error: any) {
    console.error("Error fetching user applications:", error);
    return { applications: [], error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Update Application Status (for recruiters)
// ─────────────────────────────────────────────────
export const updateApplicationStatus = async (
  applicationId: string,
  status: ApplicationStatus,
  note?: string,
  recruiterName?: string,
  recruiterAvatar?: string
): Promise<{ error: string | null }> => {
  try {
    const statusEntry: any = {
      status,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (note) statusEntry.note = note;

    await db.collection("jobApplications").doc(applicationId).update({
      status,
      statusHistory: firebase.firestore.FieldValue.arrayUnion(statusEntry),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Send notification to applicant about status change
    const appDoc = await db.collection("jobApplications").doc(applicationId).get();
    if (appDoc.exists) {
      const appData = appDoc.data()!;
      const { APPLICATION_STATUS_CONFIG } = require("@/constants/types");
      const statusLabel = APPLICATION_STATUS_CONFIG[status]?.label || status;

      await createNotification({
        recipientId: appData.applicantId,
        senderId: appData.recruiterId,
        senderName: recruiterName || "Recruiter",
        senderAvatar: recruiterAvatar || "",
        type: "status_update",
        postId: appData.postId,
        jobTitle: appData.jobTitle,
        companyName: appData.companyName,
        applicationId,
        applicantMessage: `Your application status changed to: ${statusLabel}`,
      });
    }

    return { error: null };
  } catch (error: any) {
    console.error("Error updating application status:", error);
    return { error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get Application by ID
// ─────────────────────────────────────────────────
export const getApplicationById = async (
  applicationId: string
): Promise<{ application: JobApplication | null; error: string | null }> => {
  try {
    const doc = await db.collection("jobApplications").doc(applicationId).get();

    if (!doc.exists) {
      return { application: null, error: "Application not found" };
    }

    const data = doc.data()!;
    return {
      application: {
        id: doc.id,
        postId: data.postId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        applicantId: data.applicantId,
        applicantName: data.applicantName,
        applicantAvatar: data.applicantAvatar,
        applicantTitle: data.applicantTitle,
        applicantEmail: data.applicantEmail,
        recruiterId: data.recruiterId,
        message: data.message,
        resumeUrl: data.resumeUrl,
        status: data.status,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error fetching application:", error);
    return { application: null, error: error.message };
  }
};

// ─────────────────────────────────────────────────
// Get Applications Count for a Job Post
// ─────────────────────────────────────────────────
export const getApplicationsCount = async (
  postId: string
): Promise<{ count: number; error: string | null }> => {
  try {
    const snapshot = await db
      .collection("jobApplications")
      .where("postId", "==", postId)
      .get();

    return { count: snapshot.size, error: null };
  } catch (error: any) {
    console.error("Error counting applications:", error);
    return { count: 0, error: error.message };
  }
};
