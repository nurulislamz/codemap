import "server-only"

import { getFirestoreDb } from "@/lib/firebase/firestore";
import {
    leetcodeAttemptEventSchema,
    type LeetCodeAttemptEvent,
    type LeetCodeAttemptEventInput,
} from "@/lib/firebase/leetcode";

export async function createLeetCodeAttempt(
    input: LeetCodeAttemptEventInput,
    userId: string,
): Promise<LeetCodeAttemptEvent> {
    const attempt = leetcodeAttemptEventSchema.parse(input);
    
    const ref = getLeetCodeAttemptsCollection(userId).doc(attempt.attemptId);
    
    if (attempt.durationSeconds <= 0) {
        throw new Error("Attempt duration must be greater than 0 seconds");
    }

    await ref.set(attempt);
    return attempt;
}

export async function getAllLeetCodeAttempts(userId: string): Promise<LeetCodeAttemptEvent[]> { 
    const snapshot = await getLeetCodeAttemptsCollection(userId).get();
    
    return snapshot.docs.map(doc => doc.data() as LeetCodeAttemptEvent);
}

export async function getLeetCodeAttempts(
    problemId: string | number,
    userId: string,
): Promise<LeetCodeAttemptEvent[]> { 
    const snapshot = await getLeetCodeAttemptsCollection(userId)
        .where("problemId", "==", String(problemId))
        .get();
    
    return snapshot.docs.map(doc => doc.data() as LeetCodeAttemptEvent);
}

export async function getLatestLeetCodeAttempt(userId: string): Promise<LeetCodeAttemptEvent | null> {
    const snapshot = await getLeetCodeAttemptsCollection(userId)
        .orderBy("startedAt", "desc")
        .limit(1)
        .get();
    
    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as LeetCodeAttemptEvent;
}

export async function getAnySuccessfulLeetCodeAttempt(
    problemId: string,
    userId: string,
): Promise<boolean> {
    const snapshot = await getLeetCodeAttemptsCollection(userId)
        .where("problemId", "==", problemId)
        .where("isSuccessful", "==", true)
        .orderBy("startedAt", "desc")
        .limit(1)
        .get();
        
    return !snapshot.empty;
}

function getLeetCodeAttemptsCollection(userId: string) {
    return getFirestoreDb()
        .collection("users")
        .doc(userId)
        .collection("leetcodeAttempts");
}
