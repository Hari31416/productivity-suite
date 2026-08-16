import { db } from '@/core/db'
import type { Project, ProjectWithCount, CreateProjectInput, UpdateProjectInput } from '../types'

export const projectRepository = {
  async getAllProjects(includeArchived: boolean = false): Promise<Project[]> {
    if (includeArchived) {
      return db.projects.toArray()
    }
    return db.projects.filter((p) => !p.archived).toArray()
  },

  async getProjectsWithCounts(includeArchived: boolean = false): Promise<ProjectWithCount[]> {
    const projects = await this.getAllProjects(includeArchived)
    const tasks = await db.tasks.toArray()

    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id && !t.archived)
      const completedTaskCount = projectTasks.filter((t) => t.status === 'done').length
      return {
        ...project,
        taskCount: projectTasks.length,
        completedTaskCount
      }
    })
  },

  async getProjectById(id: string): Promise<Project | undefined> {
    return db.projects.get(id)
  },

  async createProject(projectData: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString()
    const project: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      archived: projectData.archived ?? false,
      createdAt: now,
      updatedAt: now
    }
    await db.projects.add(project)
    return project
  },

  async updateProject(id: string, updates: UpdateProjectInput): Promise<Project> {
    const existing = await db.projects.get(id)
    if (!existing) {
      throw new Error(`Project with ID ${id} not found`)
    }

    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await db.projects.put(updated)
    return updated
  },

  async archiveProject(id: string, archived: boolean = true): Promise<Project> {
    return this.updateProject(id, { archived })
  },

  async deleteProject(id: string, deleteTasks: boolean = false): Promise<void> {
    await db.transaction('rw', db.projects, db.tasks, db.subtasks, async () => {
      const projectTasks = await db.tasks.where('projectId').equals(id).toArray()

      if (deleteTasks) {
        for (const task of projectTasks) {
          await db.subtasks.where('taskId').equals(task.id).delete()
          await db.tasks.delete(task.id)
        }
      } else {
        for (const task of projectTasks) {
          await db.tasks.update(task.id, {
            projectId: undefined,
            updatedAt: new Date().toISOString()
          })
        }
      }

      await db.projects.delete(id)
    })
  }
}
