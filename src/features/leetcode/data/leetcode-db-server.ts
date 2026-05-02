import "server-only"

import { LOCAL_USER_ID } from "@/backend/db/local-user";
import { getFirestoreDb } from "@/backend/firebase/firestore";
import {
    leetcodeAttemptEventSchema,
    type LeetCodeAttemptEvent,
} from "@/backend/firebase/leetcode";

export async function createLeetCodeAttempt(input: LeetCodeAttemptEvent): Promise<LeetCodeAttemptEvent> {
    const attempt = leetcodeAttemptEventSchema.parse(input);
    
    const ref = getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
        .doc(attempt.problemId.toString());
    
    if (attempt.durationSeconds <= 0) {
        throw new Error("Attempt duration must be greater than 0 seconds");
    }

    await ref.set(attempt);
    return attempt;
}

export async function getAllLeetCodeAttempts(): Promise<LeetCodeAttemptEvent[]> { 
    const snapshot = await getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
        .get();
    
    return snapshot.docs.map(doc => doc.data() as LeetCodeAttemptEvent);
}

export async function getLeetCodeAttempts(problemId: number): Promise<LeetCodeAttemptEvent[]> { 
    const snapshot = await getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
        .where("problemId", "==", problemId.toLocaleString)
        .get();
    
    return snapshot.docs.map(doc => doc.data() as LeetCodeAttemptEvent);
}

export async function getLatestLeetCodeAttempt(): Promise<LeetCodeAttemptEvent | null> {
    const snapshot = await getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
        .orderBy("startedAt", "desc")
        .limit(1)
        .get();
    
    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as LeetCodeAttemptEvent;
}

export async function getAnySuccessfulLeetCodeAttempt(problemId: string): Promise<boolean> {
    const snapshot = await getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
        .where("problemId", "==", problemId)
        .where("isSuccessful", "==", true)
        .orderBy("startedAt", "desc")
        .limit(1)
        .get();
        
    return !snapshot.empty;
}
