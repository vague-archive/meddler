import type * as Party from "partykit/server"
import * as Schemas from "./schemas"
import { json, notFound } from "./utils/response"
import { SINGLETON_ROOM_ID } from "./sessions"
import { decodeClientMessage, MESSAGE_TYPES } from "./utils/BinaryMessage"
import { BinaryReader } from "./utils/BinaryReader"
import { BinaryWriter } from "./utils/BinaryWriter"

type ConnectionState = {
    username: string;
    currentTool?: string;
}

export type SessionConnection = Party.Connection<ConnectionState>;

export default class Session implements Party.Server {
    constructor(readonly room: Party.Room) { }

    async onRequest(req: Party.Request) {
        if (req.method === "GET") {
            const session = await this.room.storage.get<Schemas.SessionInfo>(this.room.id);
            if (!session) {
                return notFound();
            }
            return json(session);
        }

        return notFound();
    }

    async onConnect(conn: SessionConnection, ctx: Party.ConnectionContext) {
        const url = new URL(ctx.request.url)
        const username = url.searchParams.get("username")
        const currentTool = url.searchParams.get("currentTool")
        if (!username) {
            return conn.close()
        }

        conn.state = {
            username,
            currentTool: currentTool ?? "",
        }

        // Update sessions list
        await this.updateSessionsList("join", conn);
    }

    async onClose(conn: SessionConnection) {
        // Update sessions list
        await this.updateSessionsList("leave", conn);
    }

    private broadcastWithServerFields(message: ArrayBuffer, sender: SessionConnection, excludeSender: boolean = false) {
        if (!sender.state) return;
        const originalBuffer = new Uint8Array(message);
        // Calculate exact required size: 8 bytes for length prefixes + actual string lengths
        const additionalSize = 8 + sender.id.length + sender.state.username.length;
        const writer = new BinaryWriter(new Uint8Array(originalBuffer.length + additionalSize));
        writer.buffer.set(originalBuffer);
        writer.offset = originalBuffer.length;
        writer.writeString(sender.id);
        writer.writeString(sender.state.username);
        const finalBuffer = writer.buffer.slice(0, writer.offset);
        this.room.broadcast(finalBuffer, excludeSender ? [sender.id] : []);
    }

    messageHandlers: Record<Schemas.ClientMessage['kind'], (message: Schemas.ClientMessage | ArrayBuffer, sender: SessionConnection) => void> = {
        changeTool: (message, sender) => {
            if (!sender.state) return;
            const msg = message as Schemas.ClientChangeTool;
            sender.setState({
                ...sender.state,
                currentTool: msg.toolName
            })
            this.updateSessionsList("changeTool", sender)
        },
        text: (message, sender) => {
            this.broadcastWithServerFields(message as ArrayBuffer, sender, true);
        },
        writeFile: (message, sender) => {
            this.broadcastWithServerFields(message as ArrayBuffer, sender, true);
        },
        paletteImageUpload: (message, sender) => {
            this.broadcastWithServerFields(message as ArrayBuffer, sender, true);
        },
        cursorUpdate: (message, sender) => {
            this.broadcastWithServerFields(message as ArrayBuffer, sender, true);
        }
    }

    async onMessage(message: ArrayBuffer, sender: SessionConnection) {
        try {
            const buffer = new Uint8Array(message);
            const reader = new BinaryReader(buffer);
            const messageType = reader.readUint8();

            // Map numeric message type to string kind
            const messageKind = Object.entries(MESSAGE_TYPES).find(([_, value]) => value === messageType)?.[0] as Schemas.ClientMessage['kind'];

            // Only handle the message if we have a handler for this type
            const handler = messageKind ? this.messageHandlers[messageKind] : undefined;
            if (handler) {
                // For changeTool, we still need to decode to update state
                if (messageKind === "changeTool") {
                    const parsed: Schemas.ClientMessage = decodeClientMessage(buffer);
                    handler(parsed, sender);
                } else {
                    // For other messages, just pass the raw buffer
                    handler(message, sender);
                }
            } else {
                console.log("No handler for message type:", messageType);
            }
        } catch (err) {
            console.error("Error processing message:", err);
        }
    }

    private async updateSessionsList(action: "join" | "leave" | "changeTool", conn: SessionConnection) {
        const body = {
            action,
            id: this.room.id,
            connections: [...this.room.getConnections()].length,
            username: conn.state?.username ?? "",
            toolName: conn.state?.currentTool ?? ""
        };

        return this.room.context.parties.sessions.get(SINGLETON_ROOM_ID).fetch({
            method: "POST",
            body: JSON.stringify(body)
        })
    }
} 