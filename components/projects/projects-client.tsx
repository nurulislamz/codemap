"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { AppPanel } from "@/components/shared";
import {
  projectStatuses,
  type Project,
  type ProjectStatus,
} from "@/lib/firebase/projects";
import type {
  DeleteProjectInput,
  SaveProjectInput,
} from "@/lib/projects/actions";
import {
  deleteLocalProject,
  getLocalProjects,
  saveLocalProject,
} from "@/lib/projects/local-project-storage";
import { formatAttemptDate } from "@/lib/leetcode/leetcode-formatters";

type ProjectsClientProps = {
  initialProjects?: Project[];
  saveProjectAction: (input: SaveProjectInput) => Promise<void>;
  deleteProjectAction: (input: DeleteProjectInput) => Promise<void>;
};

type ProjectsResponse = {
  projects?: Project[];
};

const statusLabels: Record<ProjectStatus, string> = {
  idea: "Idea",
  in_progress: "In progress",
  completed: "Completed",
};

const statusPillClasses: Record<ProjectStatus, string> = {
  idea: "bg-slate-400/10 text-slate-300",
  in_progress: "bg-amber-400/10 text-amber-300",
  completed: "bg-emerald-400/10 text-emerald-300",
};

export function ProjectsClient({
  initialProjects = [],
  saveProjectAction,
  deleteProjectAction,
}: ProjectsClientProps) {
  const { status: authStatus, user, getIdToken, signInWithGoogle } = useAuth();
  const [projects, setProjects] = useState(initialProjects);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const shouldSaveLocally = authStatus !== "signed-in";

  const loadProjects = useCallback(
    async (signal?: AbortSignal) => {
      if (authStatus !== "signed-in" || !user) {
        setProjects(getLocalProjects());
        return;
      }

      try {
        const idToken = await getIdToken();
        const response = await fetch("/api/projects", {
          cache: "no-store",
          headers: idToken ? { authorization: `Bearer ${idToken}` } : {},
          signal,
        });

        if (!response.ok) {
          console.warn(`Projects request failed: ${response.status}`);
          return;
        }

        const data = (await response.json()) as ProjectsResponse;
        setProjects(data.projects ?? []);
      } catch (error) {
        if (!signal?.aborted) {
          console.warn("Projects request failed", error);
        }
      }
    },
    [authStatus, getIdToken, user],
  );

  useEffect(() => {
    if (authStatus === "loading") {
      return;
    }

    const controller = new AbortController();
    // Defer off the synchronous effect body to avoid a cascading render.
    const timeoutId = window.setTimeout(() => void loadProjects(controller.signal), 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [authStatus, loadProjects]);

  function persistProject(input: {
    projectId?: string | null;
    title: string;
    notes: string;
    status: ProjectStatus;
  }) {
    setMessage(null);
    startTransition(async () => {
      if (shouldSaveLocally) {
        const now = new Date().toISOString();
        const existing = projects.find(
          (project) => project.projectId === input.projectId,
        );

        saveLocalProject({
          projectId: input.projectId ?? crypto.randomUUID(),
          title: input.title,
          notes: input.notes,
          status: input.status,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        });
        setProjects(getLocalProjects());
        setMessage("Saved locally.");
        return;
      }

      try {
        const idToken = await getIdToken();

        if (!idToken) {
          setMessage("Sign in again before saving.");
          return;
        }

        await saveProjectAction({ ...input, idToken });
        setMessage("Saved.");
        await loadProjects();
      } catch (saveError) {
        console.error("Failed to save project", saveError);
        setMessage("Project could not be saved. Try again.");
      }
    });
  }

  function addProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("Give the project a title first.");
      return;
    }

    persistProject({
      title: trimmedTitle,
      notes: notes.trim(),
      status: "idea",
    });
    setTitle("");
    setNotes("");
  }

  function updateStatus(project: Project, status: ProjectStatus) {
    persistProject({
      projectId: project.projectId,
      title: project.title,
      notes: project.notes,
      status,
    });
  }

  function removeProject(projectId: string) {
    setMessage(null);
    startTransition(async () => {
      if (shouldSaveLocally) {
        deleteLocalProject(projectId);
        setProjects(getLocalProjects());
        setMessage("Deleted.");
        return;
      }

      try {
        const idToken = await getIdToken();

        if (!idToken) {
          setMessage("Sign in again before deleting.");
          return;
        }

        await deleteProjectAction({ projectId, idToken });
        setMessage("Deleted.");
        await loadProjects();
      } catch (deleteError) {
        console.error("Failed to delete project", deleteError);
        setMessage("Project could not be deleted. Try again.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {shouldSaveLocally && authStatus !== "loading" ? (
        <div className="rounded-xl border border-[#ff8b3d]/30 bg-[#41271d] p-4 text-sm leading-6 text-[#ffd6ba]">
          You are not signed in. Projects will save to this browser only.{" "}
          {authStatus === "signed-out" ? (
            <>
              <button
                type="button"
                className="cursor-pointer font-bold underline underline-offset-4"
                onClick={() => void signInWithGoogle()}
              >
                Sign in
              </button>{" "}
              to persist them.
            </>
          ) : null}
        </div>
      ) : null}

      <AppPanel className="p-7">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Add a project</h2>
        <p className="mt-2 text-base text-slate-300/72">
          Capture something you want to build or learn next.
        </p>

        <form className="mt-5 space-y-4" onSubmit={addProject}>
          <label className="block text-sm font-semibold text-slate-300">
            Title
            <input
              type="text"
              value={title}
              maxLength={120}
              placeholder="e.g. Build a rate limiter in Go"
              className="mt-2 w-full rounded-xl border border-[#26364d] bg-[#101a2a] p-3 text-sm text-slate-100 outline-none transition focus:border-[#6747ff]"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-300">
            Notes
            <textarea
              value={notes}
              rows={3}
              maxLength={2000}
              placeholder="Why it matters, links, first steps..."
              className="mt-2 w-full rounded-xl border border-[#26364d] bg-[#101a2a] p-3 text-sm text-slate-100 outline-none transition focus:border-[#6747ff]"
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="cursor-pointer rounded-xl bg-[#6747ff] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#775bff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Add project"}
            </button>
            {message ? (
              <p className="text-sm font-semibold text-slate-400" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </form>
      </AppPanel>

      <AppPanel className="p-7">
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Projects</h2>
        <p className="mt-2 text-base text-slate-300/72">
          {projects.length} saved.
        </p>

        <div className="mt-5 space-y-3">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.projectId}
                className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold leading-snug text-white">{project.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusPillClasses[project.status]}`}
                      >
                        {statusLabels[project.status]}
                      </span>
                    </div>
                    {project.notes ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300/76">
                        {project.notes}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs font-medium text-slate-300/60">
                      Added {formatAttemptDate(project.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <select
                      value={project.status}
                      disabled={isPending}
                      aria-label={`${project.title} status`}
                      className="cursor-pointer rounded-xl border border-[#26364d] bg-[#101a2a] px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-[#6747ff] disabled:cursor-not-allowed disabled:opacity-60"
                      onChange={(event) =>
                        updateStatus(project, event.target.value as ProjectStatus)
                      }
                    >
                      {projectStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isPending}
                      aria-label={`Delete ${project.title}`}
                      className="cursor-pointer rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-300 transition hover:border-[#ff6f91]/60 hover:text-[#ff6f91] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => removeProject(project.projectId)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0b1320]/55 p-4 text-sm text-slate-300/70">
              No projects yet. Add the first one above.
            </div>
          )}
        </div>
      </AppPanel>
    </div>
  );
}
