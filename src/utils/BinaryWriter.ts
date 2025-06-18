export class BinaryWriter {
  buffer: Uint8Array
  offset: number // this is the current offset in bytes

  private bitOffset: number // current offset in bits within the given byte for bools
  private dataView: DataView
  static encoder = new TextEncoder()

  constructor(buffer: Uint8Array | number | null, byteOffset: number = 0) {
    this.buffer = typeof buffer === "number" ? new Uint8Array(buffer) : (buffer ?? new Uint8Array())
    this.dataView = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength)
    this.offset = byteOffset
    this.bitOffset = 0
  }

  writeBool(value: boolean) {
    this.buffer[this.offset] |= (value ? 1 : 0) << this.bitOffset++
    if (this.bitOffset == 8) {
      this.offset++
      this.bitOffset = 0
    }
  }

  writeUInt8(value: number) {
    if (256 <= value || value < 0) {
      throw new Error(`OverflowException: Tried to write byte ${value}, must be 0-255`)
    }
    this.dataView.setUint8(this.offset, value)
    this.offset += 1
  }

  writeUInt16(value: number) {
    if (65536 <= value || value < 0) {
      throw new Error(`OverflowException: Tried to write ushort ${value}, must be 0-65535`)
    }
    this.dataView.setUint16(this.offset, value, true)
    this.offset += 2
  }

  writeInt16(value: number) {
    if (32768 <= value || value < -32768) {
      throw new Error(`OverflowException: Tried to write short ${value}, must be -32768-32767`)
    }
    this.dataView.setInt16(this.offset, value, true)
    this.offset += 2
  }

  writeUInt32(value: number) {
    if (0xffffffff < value || value < 0) {
      throw new Error(`OverflowException: Tried to write uint ${value}, must be 0-4294967295`)
    }
    this.dataView.setUint32(this.offset, value, true)
    this.offset += 4
  }

  writeInt32(value: number) {
    if (2147483648 <= value || value < -2147483648) {
      throw new Error(`OverflowException: Tried to write int ${value}, must be -2147483648-2147483647`)
    }
    this.dataView.setInt32(this.offset, value, true)
    this.offset += 4
  }

  writeByte(value: number) {
    this.writeUInt8(value)
  }

  writeBytes(bytes: ArrayBuffer) {
    this.writeUInt32(bytes.byteLength)
    this.buffer.set(new Uint8Array(bytes), this.offset)
    this.offset += bytes.byteLength
  }

  writeFloat(value: number) {
    this.dataView.setFloat32(this.offset, value, true)
    this.offset += 4
  }

  writeDouble(value: number) {
    this.dataView.setFloat64(this.offset, value, true)
    this.offset += 8
  }

  writeString(str: string) {
    const serializedString = BinaryWriter.encoder.encode(str)
    this.writeUInt32(serializedString.length)
    this.buffer.set(serializedString, this.offset)
    this.offset += serializedString.length
  }
}
