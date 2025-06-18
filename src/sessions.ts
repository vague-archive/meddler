import type * as Party from "partykit/server"
import * as Schemas from "./schemas"
import { json, notFound } from "./utils/response"
import { type SessionConnection } from "./session"

export const SINGLETON_ROOM_ID = "sessions"

export default class Sessions implements Party.Server {
    constructor(readonly room: Party.Room) { }

    async onRequest(req: Party.Request) {
        if (this.room.id !== SINGLETON_ROOM_ID) {
            return notFound()
        }

        if (req.method === "GET") {
            return json({ sessions: await this.getActiveSessions() } as Schemas.SessionListResponse)
        }

        if (req.method === "POST") {
            const sessionList = await this.updateSessionInfo(req)
            this.room.broadcast(JSON.stringify({ kind: "sessionUpdate", sessions: sessionList } as Schemas.ServerSessionUpdate))
            return json({ sessions: sessionList } as Schemas.SessionListResponse)
        }

        if (req.method === "DELETE") {
            await this.room.storage.deleteAll();
            this.room.broadcast(JSON.stringify({ kind: "sessionUpdate", sessions: [] } as Schemas.ServerSessionUpdate))
            return json({ sessions: [] } as Schemas.SessionListResponse)
        }

        return notFound()
    }

    async updateSessionInfo(req: Party.Request) {
        const body = await req.json()
        const update = Schemas.SessionRequestSchema.parse(body)

        if (update.action === "delete") {
            await this.room.storage.delete(update.id);
            return await this.getActiveSessions()
        }

        const persistedInfo = await this.room.storage.get<Schemas.SessionInfo>(update.id)
        if (!persistedInfo && update.action === "leave") {
            return await this.getActiveSessions()
        }

        const info = persistedInfo ?? {
            id: update.id,
            connections: 0,
            users: []
        }

        info.connections = update.connections

        if (update.username) {
            if (update.action === "join") {
                info.users = info.users.filter(user => user.username !== update.username)
                info.users.unshift({
                    username: update.username,
                    joinedAt: new Date().toISOString(),
                    present: true
                })
            } else if (update.action === "changeTool") {
                info.users = info.users.map(user => {
                    if (user.username === update.username) {
                        user.currentTool = update.toolName
                    }
                    return user
                })
            } else {
                info.users = info.users.map(user => {
                    if (user.username === update.username) {
                        user.present = false
                        user.leftAt = new Date().toISOString()
                    }
                    return user
                })
            }
        }

        console.log("updated info", info)
        await this.room.storage.put(update.id, info)
        return await this.getActiveSessions()
    }

    async onConnect(conn: SessionConnection) {
        // Send current sessions to the newly connected client
        const sessions = await this.getActiveSessions();
        conn.send(JSON.stringify({ kind: "sessionUpdate", sessions }));
    }

    async onClose(conn: SessionConnection) {
        // No-op for sessions room
    }

    async onMessage(message: string, sender: SessionConnection) {
        // No-op for sessions room
    }

    async getActiveSessions(): Promise<Schemas.SessionInfo[]> {
        const sessions = await this.room.storage.list<Schemas.SessionInfo>();
        return [...sessions.values()]
    }
} 