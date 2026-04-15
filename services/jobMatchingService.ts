import { db } from "@/config/firebase";
import { Post } from "@/constants/types";
import { createNotification } from "./notificationService";
import { UserProfile } from "./userService";

interface MatchResult {
  userId: string;
  matchScore: number;
  matchReasons: string[];
}

// Find users whose job preferences match a job post
export const findMatchingUsers = async (
  jobPost: Post
): Promise<MatchResult[]> => {
  try {
    // Get all users who are open to work
    const usersSnapshot = await db
      .collection("users")
      .where("jobPreferences.openToWork", "==", true)
      .get();

    const matchedUsers: MatchResult[] = [];

    usersSnapshot.docs.forEach((doc) => {
      const user = doc.data() as UserProfile;

      // Skip the job poster
      if (user.uid === jobPost.authorId) return;

      const matchReasons: string[] = [];
      let matchScore = 0;

      const jobPrefs = user.jobPreferences;
      if (!jobPrefs) return;

      // Check skills match with job requirements
      if (jobPost.requirements && jobPrefs.skills) {
        const matchedSkills = jobPrefs.skills.filter((skill) =>
          jobPost.requirements?.some(
            (req) => req.toLowerCase().includes(skill.toLowerCase()) ||
                     skill.toLowerCase().includes(req.toLowerCase())
          )
        );
        if (matchedSkills.length > 0) {
          matchScore += matchedSkills.length * 20;
          matchReasons.push(`Skills: ${matchedSkills.slice(0, 3).join(", ")}`);
        }
      }

      // Check job type match
      if (jobPost.jobType && jobPrefs.desiredJobTypes?.includes(jobPost.jobType)) {
        matchScore += 15;
        matchReasons.push(`Job type: ${jobPost.jobType}`);
      }

      // Check location match
      if (jobPost.location && jobPrefs.desiredLocations) {
        const locationMatch = jobPrefs.desiredLocations.some(
          (loc) =>
            loc.toLowerCase().includes(jobPost.location.toLowerCase()) ||
            jobPost.location.toLowerCase().includes(loc.toLowerCase()) ||
            loc.toLowerCase() === "remote"
        );
        if (locationMatch) {
          matchScore += 15;
          matchReasons.push(`Location: ${jobPost.location}`);
        }
      }

      // Check experience level match
      if (jobPost.experienceLevel && jobPrefs.experienceLevel === jobPost.experienceLevel) {
        matchScore += 10;
        matchReasons.push(`Experience: ${jobPost.experienceLevel}`);
      }

      // Check salary range match
      if (
        jobPost.salaryMin &&
        jobPost.salaryMax &&
        jobPrefs.expectedSalaryMin &&
        jobPrefs.expectedSalaryMax
      ) {
        const salaryOverlap =
          jobPost.salaryMax >= jobPrefs.expectedSalaryMin &&
          jobPost.salaryMin <= jobPrefs.expectedSalaryMax;
        if (salaryOverlap) {
          matchScore += 10;
          matchReasons.push("Salary in range");
        }
      }

      // Check topics/interests match
      if (jobPost.topics && user.interests) {
        const matchedTopics = user.interests.filter((interest) =>
          jobPost.topics.some(
            (topic) =>
              topic.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(topic.toLowerCase())
          )
        );
        if (matchedTopics.length > 0) {
          matchScore += matchedTopics.length * 5;
          if (matchReasons.length < 3) {
            matchReasons.push(`Interests: ${matchedTopics.slice(0, 2).join(", ")}`);
          }
        }
      }

      // Only include users with a minimum match score
      if (matchScore >= 20 && matchReasons.length > 0) {
        matchedUsers.push({
          userId: user.uid,
          matchScore,
          matchReasons,
        });
      }
    });

    // Sort by match score (highest first)
    matchedUsers.sort((a, b) => b.matchScore - a.matchScore);

    // Limit to top 50 matches to avoid notification spam
    return matchedUsers.slice(0, 50);
  } catch (error) {
    console.error("Find matching users error:", error);
    return [];
  }
};

// Send job match notifications to all matched users
export const notifyMatchedUsers = async (
  jobPost: Post,
  authorName: string,
  authorAvatar: string
): Promise<{ notifiedCount: number; error: string | null }> => {
  try {
    const matchedUsers = await findMatchingUsers(jobPost);

    if (matchedUsers.length === 0) {
      return { notifiedCount: 0, error: null };
    }

    let notifiedCount = 0;

    // Send notifications in batches to avoid overwhelming
    for (const match of matchedUsers) {
      const matchReason = match.matchReasons.slice(0, 2).join(" | ");

      await createNotification({
        recipientId: match.userId,
        senderId: jobPost.authorId,
        senderName: authorName,
        senderAvatar: authorAvatar,
        type: "job_match",
        postId: jobPost.id,
        postThumbnail: jobPost.thumbnailUrl || jobPost.mediaUrl || undefined,
        jobTitle: jobPost.title,
        companyName: jobPost.companyName || authorName,
        matchReason: matchReason,
      });

      notifiedCount++;
    }

    return { notifiedCount, error: null };
  } catch (error: any) {
    console.error("Notify matched users error:", error);
    return { notifiedCount: 0, error: error.message || "Failed to notify users" };
  }
};

// Check if a specific user matches a job post
export const checkUserJobMatch = async (
  userId: string,
  jobPost: Post
): Promise<{ isMatch: boolean; matchReasons: string[] }> => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return { isMatch: false, matchReasons: [] };
    }

    const user = userDoc.data() as UserProfile;
    const jobPrefs = user.jobPreferences;

    if (!jobPrefs || !jobPrefs.openToWork) {
      return { isMatch: false, matchReasons: [] };
    }

    const matchReasons: string[] = [];

    // Check skills
    if (jobPost.requirements && jobPrefs.skills) {
      const matchedSkills = jobPrefs.skills.filter((skill) =>
        jobPost.requirements?.some((req) =>
          req.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (matchedSkills.length > 0) {
        matchReasons.push(`Your skills match: ${matchedSkills.join(", ")}`);
      }
    }

    // Check job type
    if (jobPost.jobType && jobPrefs.desiredJobTypes?.includes(jobPost.jobType)) {
      matchReasons.push(`${jobPost.jobType} position`);
    }

    // Check location
    if (jobPost.location && jobPrefs.desiredLocations) {
      const locationMatch = jobPrefs.desiredLocations.some((loc) =>
        loc.toLowerCase().includes(jobPost.location.toLowerCase())
      );
      if (locationMatch) {
        matchReasons.push(`Location: ${jobPost.location}`);
      }
    }

    return {
      isMatch: matchReasons.length > 0,
      matchReasons,
    };
  } catch (error) {
    console.error("Check user job match error:", error);
    return { isMatch: false, matchReasons: [] };
  }
};
