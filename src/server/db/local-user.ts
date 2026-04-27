import { stableUuidFromString } from "@/server/ids/stable-uuid";

// Personal-use app: single local owner. If you later reintroduce auth, replace this
// with a per-session user id.
export const LOCAL_USER_ID = stableUuidFromString("local-owner");
