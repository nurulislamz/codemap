import { ProjectsClient } from "@/components/projects/projects-client";
import { removeProject, saveProject } from "@/lib/projects/actions";
import { listProjectsForRequest } from "@/lib/projects/db-server";
import { Icon, SectionHero } from "@/components/shared";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects",
};

export default async function ProjectsPage() {
  const projects = await listProjectsForRequest();

  return (
    <div className="space-y-5 pb-4">
      <SectionHero
        icon={<Icon name="layers" className="h-9 w-9" />}
        title="Projects"
        description="A running list of projects you want to build, with status and notes."
      />

      <ProjectsClient
        initialProjects={projects}
        saveProjectAction={saveProject}
        deleteProjectAction={removeProject}
      />
    </div>
  );
}
