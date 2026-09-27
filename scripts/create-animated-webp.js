/**
 * Encodes multiple WebP screenshots into an official RIFF/VP8X animated WebP.
 * https://developers.google.com/speed/webp/docs/riff_container#extended_file_format
 */
export function createAnimatedWebp(frames, width, height, durationMs = 1200) {
  const anmfChunks = [];

  for (const frameBuf of frames) {
    let offset = 12;
    const subChunks = [];

    while (offset < frameBuf.length) {
      const chunkId = frameBuf.toString('ascii', offset, offset + 4);
      const chunkSize = frameBuf.readUInt32LE(offset + 4);
      const paddedSize = chunkSize + (chunkSize % 2);
      const chunkTotalLen = 8 + paddedSize;

      if (chunkId === 'VP8 ' || chunkId === 'VP8L' || chunkId === 'ALPH') {
        subChunks.push(frameBuf.subarray(offset, offset + chunkTotalLen));
      }
      offset += chunkTotalLen;
    }

    const payload = Buffer.concat(subChunks);
    const anmfHeader = Buffer.alloc(16);
    anmfHeader.writeUIntLE(0, 0, 3);
    anmfHeader.writeUIntLE(0, 3, 3);
    anmfHeader.writeUIntLE(width - 1, 6, 3);
    anmfHeader.writeUIntLE(height - 1, 9, 3);
    anmfHeader.writeUIntLE(durationMs, 12, 3);
    anmfHeader.writeUInt8(0x02, 15);

    const anmfPayload = Buffer.concat([anmfHeader, payload]);
    const anmfChunkHeader = Buffer.alloc(8);
    anmfChunkHeader.write('ANMF', 0, 4, 'ascii');
    anmfChunkHeader.writeUInt32LE(anmfPayload.length, 4);

    const padding = anmfPayload.length % 2 === 1 ? Buffer.alloc(1) : Buffer.alloc(0);
    anmfChunks.push(Buffer.concat([anmfChunkHeader, anmfPayload, padding]));
  }

  const vp8x = Buffer.alloc(18);
  vp8x.write('VP8X', 0, 4, 'ascii');
  vp8x.writeUInt32LE(10, 4);
  vp8x.writeUInt8(0x02, 8);
  vp8x.writeUIntLE(width - 1, 12, 3);
  vp8x.writeUIntLE(height - 1, 15, 3);

  const anim = Buffer.alloc(14);
  anim.write('ANIM', 0, 4, 'ascii');
  anim.writeUInt32LE(6, 4);
  anim.writeUInt32LE(0x00000000, 8);
  anim.writeUInt16LE(0, 12);

  const body = Buffer.concat([vp8x, anim, ...anmfChunks]);
  const riffHeader = Buffer.alloc(12);
  riffHeader.write('RIFF', 0, 4, 'ascii');
  riffHeader.writeUInt32LE(body.length + 4, 4);
  riffHeader.write('WEBP', 8, 4, 'ascii');

  return Buffer.concat([riffHeader, body]);
}
