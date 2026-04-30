import "server-only"

import { LOCAL_USER_ID } from "@/backend/db/local-user";
import { getFirestoreDb } from "@/backend/firebase/firestore";
import { LeetCodeAttemptEvent, LeetCodeAttemptEventWrite } from "@/backend/firebase/leetcode";
import { validateLeetCodeAttemptEventWrite } from "@/backend/firebase/schema/firestore-guard";

export async function createLeetCodeAttempt(input: LeetCodeAttemptEventWrite): Promise<LeetCodeAttemptEvent> {
    const validatedInput = validateLeetCodeAttemptEventWrite(input);
    
    const startedAt = new Date(validatedInput.startedAt);
    const endedAt = new Date(validatedInput.endedAt);
    
    const ref = getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
        .doc();

    const attempt: LeetCodeAttemptEvent = {
        ...validatedInput,
        durationSeconds: Math.max(
            0,
            Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
        ),
        userId: LOCAL_USER_ID,
        language: validatedInput.language ?? null,
        failureReason: validatedInput.failureReason ?? null,
        notes: validatedInput.notes ?? null,
        attemptId: ref.id
    }
    
    if (attempt.durationSeconds <= 0) {
        throw new Error("Attempt duration must be greater than 0 seconds");
    }

    await ref.set(attempt);
    return attempt;
}

export async function getLeetCodeAttempts(): Promise<LeetCodeAttemptEvent[]> { 
    const snapshot = await getFirestoreDb()
        .collection("users")
        .doc(LOCAL_USER_ID)
        .collection("leetcodeAttempts")
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
        .limit(1)
        .get();
        
    return !snapshot.empty;
}
