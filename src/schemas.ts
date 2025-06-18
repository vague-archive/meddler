import { z } from "zod"

export const ClientChangeToolSchema = z.object({
  kind: z.literal("changeTool"),
  toolName: z.string(),
})
export type ClientChangeTool = z.infer<typeof ClientChangeToolSchema>

export const ClientTextSchema = z.object({
  kind: z.literal("text"),
  text: z.string().min(1),
})
export type ClientText = z.infer<typeof ClientTextSchema>

export const ClientWriteFileSchema = z.object({
  kind: z.literal("writeFile"),
  path: z.string().min(1),
  content: z.string().min(1),
})
export type ClientWriteFile = z.infer<typeof ClientWriteFileSchema>

export const ClientPaletteImageUploadSchema = z.object({
  kind: z.literal("paletteImageUpload"),
  path: z.string().min(1),
  versionId: z.string().min(1),
})
export type ClientPaletteImageUpload = z.infer<typeof ClientPaletteImageUploadSchema>

const ClientCursorUpdateSchema = z.object({
  kind: z.literal("cursorUpdate"),
  tool: z.string().optional(),
  x: z.number(),
  y: z.number(),
})
export type ClientCursorUpdate = z.infer<typeof ClientCursorUpdateSchema>

export const ClientMessageSchema = z.discriminatedUnion("kind", [
  ClientChangeToolSchema,
  ClientTextSchema,
  ClientWriteFileSchema,
  ClientPaletteImageUploadSchema,
  ClientCursorUpdateSchema,
])
export type ClientMessage = z.infer<typeof ClientMessageSchema>

const ServerTextSchema = z.object({
  kind: z.literal("text"),
  text: z.string(),
  clientId: z.string(),
  username: z.string(),
})
export type ServerText = z.infer<typeof ServerTextSchema>

const ServerWriteFileSchema = z.object({
  kind: z.literal("writeFile"),
  path: z.string().min(1),
  content: z.string().min(1),
  clientId: z.string(),
  username: z.string(),
})
export type ServerWriteFile = z.infer<typeof ServerWriteFileSchema>

const ServerPaletteImageUploadSchema = z.object({
  kind: z.literal("paletteImageUpload"),
  path: z.string().min(1),
  versionId: z.string(),
  clientId: z.string(),
  username: z.string(),
})
export type ServerPaletteImageUpload = z.infer<typeof ServerPaletteImageUploadSchema>

export const SessionInfoSchema = z.object({
  id: z.string(),
  connections: z.number(),
  users: z.array(z.object({
    username: z.string(),
    joinedAt: z.string(),
    leftAt: z.string().optional(),
    present: z.boolean(),
    currentTool: z.string().optional(),
  })),
})
export type SessionInfo = z.infer<typeof SessionInfoSchema>

export const SessionJoinRequestSchema = z.object({
  action: z.literal("join"),
  id: z.string(),
  connections: z.number(),
  username: z.string(),
})
export type SessionJoinRequest = z.infer<typeof SessionJoinRequestSchema>

export const SessionLeaveRequestSchema = z.object({
  action: z.literal("leave"),
  id: z.string(),
  connections: z.number(),
  username: z.string(),
})
export type SessionLeaveRequest = z.infer<typeof SessionLeaveRequestSchema>

export const SessionDeleteRequestSchema = z.object({
  action: z.literal("delete"),
  id: z.string(),
  username: z.string(),
})
export type SessionDeleteRequest = z.infer<typeof SessionDeleteRequestSchema>

export const SessionChangeToolSchema = z.object({
  action: z.literal("changeTool"),
  toolName: z.string(),
  id: z.string(),
  connections: z.number(),
  username: z.string(),
})
export type SessionChangeTool = z.infer<typeof SessionChangeToolSchema>

export const SessionRequestSchema = z.discriminatedUnion("action", [
  SessionJoinRequestSchema,
  SessionLeaveRequestSchema,
  SessionDeleteRequestSchema,
  SessionChangeToolSchema,
])
export type SessionRequest = z.infer<typeof SessionRequestSchema>

const ServerSessionUpdateSchema = z.object({
  kind: z.literal("sessionUpdate"),
  sessions: z.array(SessionInfoSchema),
})
export type ServerSessionUpdate = z.infer<typeof ServerSessionUpdateSchema>

const ServerCursorUpdateSchema = z.object({
  kind: z.literal("cursorUpdate"),
  tool: z.string().optional(),
  x: z.number(),
  y: z.number(),
  clientId: z.string(),
  username: z.string(),
})
export type ServerCursorUpdate = z.infer<typeof ServerCursorUpdateSchema>

export const ServerMessageSchema = z.discriminatedUnion("kind", [
  ServerTextSchema,
  ServerWriteFileSchema,
  ServerPaletteImageUploadSchema,
  ServerSessionUpdateSchema,
  ServerCursorUpdateSchema,
])
export type ServerMessage = z.infer<typeof ServerMessageSchema>

export const SessionListResponseSchema = z.object({
  sessions: z.array(SessionInfoSchema),
})
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>
