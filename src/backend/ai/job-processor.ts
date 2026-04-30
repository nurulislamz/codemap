import "server-only";

export async function processQueuedAiJobs(
  input: { limit: number },
): Promise<{ processed: number; errors: Array<{ jobId: string; error: string }> }> {
  void input;
  return { processed: 0, errors: [] };
}
