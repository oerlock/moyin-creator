export interface PlatformProject {
  id: string;
  name: string;
  updatedAt: string;
}

export interface PlatformAdapter {
  listProjects(): Promise<PlatformProject[]>;
  saveProject(project: PlatformProject): Promise<void>;
  deleteProject(id: string): Promise<void>;
}
