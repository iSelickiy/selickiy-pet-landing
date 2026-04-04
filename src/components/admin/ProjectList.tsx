'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Button from '@/components/ui/Button'

interface Project {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  cardType: 'EXTERNAL_LINK' | 'DETAIL_PAGE'
  sortOrder: number
  [key: string]: unknown
}

interface ProjectListProps {
  initialProjects: Project[]
}

export default function ProjectList({ initialProjects }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = projects.findIndex((p) => p.id === active.id)
    const newIndex = projects.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(projects, oldIndex, newIndex)
    setProjects(reordered)

    await fetch('/api/projects/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить проект?')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const handleTogglePublish = async (project: Project) => {
    const newStatus = project.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: newStatus } : p))
      )
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Проекты</h1>
        <Link href="/admin/projects/new">
          <Button>Создать проект</Button>
        </Link>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <SortableItem
                key={project.id}
                project={project}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {projects.length === 0 && (
        <p className="text-gray-500 text-center py-12">Проектов пока нет</p>
      )}
    </div>
  )
}

function SortableItem({
  project,
  onDelete,
  onTogglePublish,
}: {
  project: Project
  onDelete: (id: string) => void
  onTogglePublish: (project: Project) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 px-1"
        title="Перетащить"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{project.title}</p>
      </div>

      {/* Card type indicator */}
      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
        {project.cardType === 'EXTERNAL_LINK' ? 'Ссылка' : 'Страница'}
      </span>

      {/* Status badge */}
      <span
        className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
          project.status === 'PUBLISHED'
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {project.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTogglePublish(project)}
        >
          {project.status === 'PUBLISHED' ? 'Снять' : 'Опубликовать'}
        </Button>
        <Link href={`/admin/projects/${project.id}`}>
          <Button variant="secondary" size="sm">
            Редактировать
          </Button>
        </Link>
        <Button variant="danger" size="sm" onClick={() => onDelete(project.id)}>
          Удалить
        </Button>
      </div>
    </div>
  )
}
