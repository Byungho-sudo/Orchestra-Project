"use client"

import { useState } from "react"

export function useProjectModals() {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isMetadataEditOpen, setIsMetadataEditOpen] = useState(false)
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false)

  return {
    closeAddModuleModal: () => setIsAddModuleOpen(false),
    closeDeleteProjectModal: () => setIsDeleteOpen(false),
    closeEditModuleModal: () => setIsEditModuleOpen(false),
    closeEditProjectModal: () => setIsEditOpen(false),
    closeMetadataEditModal: () => setIsMetadataEditOpen(false),
    isAddModuleOpen,
    isDeleteOpen,
    isEditModuleOpen,
    isEditOpen,
    isMetadataEditOpen,
    openAddModuleModal: () => setIsAddModuleOpen(true),
    openDeleteProjectModal: () => setIsDeleteOpen(true),
    openEditModuleModal: () => setIsEditModuleOpen(true),
    openEditProjectModal: () => setIsEditOpen(true),
    openMetadataEditModal: () => setIsMetadataEditOpen(true),
  }
}
