export class BinaryReader {
    offset: number
    bitOffset: number
    dataView: DataView
    decoder: TextDecoder

    bytes: Uint8Array

    /**
     *
     * @param bytes a Uint8Array representing the data to read
     * @param byteOffset an offset into the byte array to start reading from
     *
     */
    constructor(bytes: Uint8Array, byteOffset: number = 0) {
        this.offset = byteOffset
        this.bitOffset = 0
        this.bytes = bytes
        this.dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        this.decoder = new TextDecoder()
    }

    /**
     *
     * @returns true if there are more bytes to read
     */
    peek(): boolean {
        return this.offset < this.bytes.length
    }

    readBool(): boolean {
        const ret = !!(this.dataView.getUint8(this.offset) & (1 << this.bitOffset++))
        if (this.bitOffset == 8) {
            this.bitOffset = 0
            this.offset++
        }
        return ret
    }

    readByte(): number {
        return this.readUint8()
    }

    readBytes(): Uint8Array {
        const length = this.readUint32()
        const ret = this.bytes.slice(this.offset, length + this.offset)
        this.offset += length
        return ret
    }

    readUint8(): number {
        this.getNextOffset(1)

        return this.dataView.getUint8(this.offset++)
    }

    readUint16(): number {
        this.getNextOffset(2)

        const ret = this.dataView.getUint16(this.offset, true)
        this.offset += 2
        return ret
    }

    readInt16(): number {
        this.getNextOffset(2)

        const ret = this.dataView.getInt16(this.offset, true)
        this.offset += 2
        return ret
    }

    readUint32(): number {
        this.getNextOffset(4)

        const ret = this.dataView.getUint32(this.offset, true)
        this.offset += 4
        return ret
    }

    readInt32(): number {
        this.getNextOffset(4)

        const ret = this.dataView.getInt32(this.offset, true)
        this.offset += 4
        return ret
    }

    readDouble(): number {
        this.getNextOffset(8)

        const ret = this.dataView.getFloat64(this.offset, true)
        this.offset += 8
        return ret
    }

    readFloat(): number {
        this.getNextOffset(4)

        const ret = this.dataView.getFloat32(this.offset, true)
        this.offset += 4
        return ret
    }

    readString(): string {
        this.getNextOffset(4)

        const length = this.readUint32()
        const bytes = this.bytes.subarray(this.offset, this.offset + length)
        const str = this.decoder.decode(bytes)
        this.offset += length
        return str
    }

    getNextOffset(byteLength: number) {
        if (this.bitOffset > 0) {
            this.bitOffset = 0
            this.offset++
        }

        if (this.offset + byteLength > this.bytes.length) {
            throw new Error(`Tried to read ${byteLength} bytes, but only ${this.bytes.length - this.offset} remain`)
        }
    }
} 