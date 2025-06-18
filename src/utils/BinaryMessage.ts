import { BinaryWriter } from "./BinaryWriter";
import { BinaryReader } from "./BinaryReader";
import * as Schemas from "../schemas";

// Message type IDs for binary encoding
export const MESSAGE_TYPES = {
    changeTool: 1,
    text: 2,
    writeFile: 3,
    paletteImageUpload: 4,
    cursorUpdate: 5,
    sessionUpdate: 6,
} as const;

export function encodeClientMessage(message: Schemas.ClientMessage): Uint8Array {
    // Calculate required size based on message type
    let requiredSize = 1; // 1 byte for message type

    switch (message.kind) {
        case "changeTool":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.toolName).length; // 4 bytes for length + string bytes
            break;
        case "text":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.text).length;
            break;
        case "writeFile":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.path).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.content).length;
            break;
        case "paletteImageUpload":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.path).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.versionId).length;
            break;
        case "cursorUpdate":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.tool ?? "").length;
            requiredSize += 4 + 4; // 4 bytes each for x and y floats
            break;
    }

    const writer = new BinaryWriter(new Uint8Array(requiredSize));

    switch (message.kind) {
        case "changeTool":
            writer.writeUInt8(MESSAGE_TYPES.changeTool);
            writer.writeString(message.toolName);
            break;
        case "text":
            writer.writeUInt8(MESSAGE_TYPES.text);
            writer.writeString(message.text);
            break;
        case "writeFile":
            writer.writeUInt8(MESSAGE_TYPES.writeFile);
            writer.writeString(message.path);
            writer.writeString(message.content);
            break;
        case "paletteImageUpload":
            writer.writeUInt8(MESSAGE_TYPES.paletteImageUpload);
            writer.writeString(message.path);
            writer.writeString(message.versionId);
            break;
        case "cursorUpdate":
            writer.writeUInt8(MESSAGE_TYPES.cursorUpdate);
            writer.writeString(message.tool ?? "");
            writer.writeFloat(message.x);
            writer.writeFloat(message.y);
            break;
    }

    return writer.buffer.slice(0, writer.offset);
}

export function decodeClientMessage(buffer: Uint8Array): Schemas.ClientMessage {
    const reader = new BinaryReader(buffer);
    const messageType = reader.readUint8();

    switch (messageType) {
        case MESSAGE_TYPES.changeTool:
            return {
                kind: "changeTool",
                toolName: reader.readString()
            };
        case MESSAGE_TYPES.text:
            return {
                kind: "text",
                text: reader.readString()
            };
        case MESSAGE_TYPES.writeFile:
            return {
                kind: "writeFile",
                path: reader.readString(),
                content: reader.readString()
            };
        case MESSAGE_TYPES.paletteImageUpload:
            const path = reader.readString();
            const versionId = reader.readString();

            return {
                kind: "paletteImageUpload",
                path,
                versionId
            };
        case MESSAGE_TYPES.cursorUpdate:
            return {
                kind: "cursorUpdate",
                tool: reader.readString() || undefined,
                x: reader.readFloat(),
                y: reader.readFloat()
            };
        default:
            throw new Error(`Unknown message type: ${messageType}`);
    }
}

export function encodeServerMessage(message: Schemas.ServerMessage): Uint8Array {
    // Calculate required size based on message type
    let requiredSize = 1; // 1 byte for message type

    switch (message.kind) {
        case "text":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.text).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.clientId).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.username).length;
            break;
        case "writeFile":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.path).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.content).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.clientId).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.username).length;
            break;
        case "paletteImageUpload":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.path).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.versionId).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.clientId).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.username).length;
            break;
        case "cursorUpdate":
            requiredSize += 4 + BinaryWriter.encoder.encode(message.tool ?? "").length;
            requiredSize += 4 + 4; // 4 bytes each for x and y floats
            requiredSize += 4 + BinaryWriter.encoder.encode(message.clientId).length;
            requiredSize += 4 + BinaryWriter.encoder.encode(message.username).length;
            break;
    }

    const writer = new BinaryWriter(new Uint8Array(requiredSize));

    switch (message.kind) {
        case "text":
            writer.writeUInt8(MESSAGE_TYPES.text);
            writer.writeString(message.text);
            writer.writeString(message.clientId);
            writer.writeString(message.username);
            break;
        case "writeFile":
            writer.writeUInt8(MESSAGE_TYPES.writeFile);
            writer.writeString(message.path);
            writer.writeString(message.content);
            writer.writeString(message.clientId);
            writer.writeString(message.username);
            break;
        case "paletteImageUpload":
            writer.writeUInt8(MESSAGE_TYPES.paletteImageUpload);
            writer.writeString(message.path);
            writer.writeString(message.versionId);
            writer.writeString(message.clientId);
            writer.writeString(message.username);
            break;
        case "cursorUpdate":
            writer.writeUInt8(MESSAGE_TYPES.cursorUpdate);
            writer.writeString(message.tool ?? "");
            writer.writeFloat(message.x);
            writer.writeFloat(message.y);
            writer.writeString(message.clientId);
            writer.writeString(message.username);
            break;
    }

    return writer.buffer.slice(0, writer.offset);
}

export function decodeServerMessage(buffer: Uint8Array): Schemas.ServerMessage {
    const reader = new BinaryReader(buffer);
    const messageType = reader.readUint8();

    switch (messageType) {
        case MESSAGE_TYPES.text:
            return {
                kind: "text",
                text: reader.readString(),
                clientId: reader.readString(),
                username: reader.readString()
            };
        case MESSAGE_TYPES.writeFile:
            return {
                kind: "writeFile",
                path: reader.readString(),
                content: reader.readString(),
                clientId: reader.readString(),
                username: reader.readString()
            };
        case MESSAGE_TYPES.paletteImageUpload:
            const path = reader.readString();
            const versionId = reader.readString();

            return {
                kind: "paletteImageUpload",
                path,
                versionId,
                clientId: reader.readString(),
                username: reader.readString()
            };
        case MESSAGE_TYPES.cursorUpdate:
            return {
                kind: "cursorUpdate",
                tool: reader.readString() || undefined,
                x: reader.readFloat(),
                y: reader.readFloat(),
                clientId: reader.readString(),
                username: reader.readString()
            };
        default:
            throw new Error(`Unknown message type: ${messageType}`);
    }
} 