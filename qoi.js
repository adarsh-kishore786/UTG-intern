//Algorithm details
const qoiHeaderSize = 14
const qoiEndMarker = [0, 0, 0, 0, 0, 0, 0, 1]
const qoiEndMarkerSize = qoiEndMarker.length

//Tags used for various chunks
const qoiOpRun = 0xc0
const qoiOpIndex = 0x00
const qoiOpDiff = 0x40
const qoiOpDiffLuma = 0x80
const qoiOpRGB = 0xfe
const qoiOpRGBA = 0xff

const qoiChunkMask = 0xc0
const qoiRunLength = 0x3f
const qoiHashIndex = 0x3f

const qoiDiffRed = 0x30
const qoiDiffGreen = 0x0c
const qoiDiffBlue = 0x03

const qoiLumaGreen = 0x3f
const qoiLumaDR_DG = 0xf0
const qoiLumaDB_DG = 0x0f

function Color(r, g, b, a)
{
  this.r = r
  this.g = g
  this.b = b
  this.a = a
}

function PixelData(width, height, channels, colorSpace, buffer)
{
  this.width = width
  this.height = height
  this.channels = channels
  this.colorSpace = colorSpace
  this.buffer = buffer
}

function colorsEqual(c0, c1)
{
  return c0.r === c1.r && c0.g === c1.g && c0.b === c1.b && c0.a === c1.a
}

function colorDiff(c0, c1)
{
  return new Color(c0.r - c1.r, c0.g - c1.g, c0.b - c1.b, c0.a - c1.a)
}

function qoiEncoder(imageBuffer, width, height, channels, colorspace=1) 
{
  //Image Details
  const imageSize = height * width * channels
  const maxSize = height * width * (channels + 1) + qoiHeaderSize + qoiEndMarkerSize
  const lastPixel = imageSize - channels
  const pixelValues = new Uint8Array(imageBuffer)
  const encodedBytes = new Uint8Array(maxSize)

  //Pointer to our encodedBytes array
  let index = 0

  //Function to write 32 bits to array
  const write32 = (value) => {
     encodedBytes[index++] = (value & 0xff000000)>>24
     encodedBytes[index++] = (value & 0x00ff0000)>>16
     encodedBytes[index++] = (value & 0x0000ff00)>>8
     encodedBytes[index++] = (value & 0x000000ff)>>0
  }

  //Function to write 8bits to array
  const write8 = (value) => {
    encodedBytes[index++] = value
  }

  //Write fileHeader
  write32(0x716f6966)
  write32(width)
  write32(height)
  write8(channels)
  write8(colorspace)

  //Variable to store previously seen color and seenPixels array
  let prevColor = new Color(0, 0, 0, 255)
  const seenPixels = Array.from({length: 64}, () => new Color(0, 0, 0, 0))
  let runLength = 0

  //Loop through each pixel of the image
  for(let offset=0;offset<=lastPixel;offset+=channels)
  {
      const curColor = new Color(pixelValues[offset+0], pixelValues[offset+1], pixelValues[offset+2], channels === 4 ?    
      pixelValues[offset+3] : prevColor.a)

      if(colorsEqual(curColor, prevColor))
      {
        runLength++
        if(runLength === 62 || offset === lastPixel)
        {
           write8(qoiOpRun | (runLength - 1))
           runLength = 0
        }
      }
      else
      {
         if(runLength > 0)
         {
            write8(qoiOpRun | (runLength - 1))
            runLength = 0
         }

         const hash = (curColor.r * 3 + curColor.g * 5 + curColor.b * 7 + curColor.a * 11) % 64
         if(colorsEqual(curColor, seenPixels[hash]))
         {
            write8(qoiOpIndex | hash)
         }
         else
         {
           seenPixels[hash] = {...curColor}
           const diff = colorDiff(curColor, prevColor)
           const dr_dg = diff.r - diff.g
           const db_dg = diff.b - diff.g
           
           if(diff.a === 0)
           {
               const diffSmall = (diff.r >= -2 && diff.r <= 1) && (diff.g >= -2 && diff.g <= 1) && (diff.b >= -2 && diff.b <= 1)
               const diffLumaSmall = (diff.g >= -32 && diff.g <= 31) && (dr_dg >= -8 && dr_dg <= 7) && (db_dg >= -8 && db_dg <= 7)
               if(diffSmall)
               {
                 write8(qoiOpDiff | (diff.r + 2)<<4 | (diff.g + 2)<<2 | (diff.b + 2)<<0)
               }
               else if(diffLumaSmall)
               {
                  write8(qoiOpDiffLuma | (diff.g + 32))
                  write8((dr_dg + 8)<<4 | (db_dg + 8))
               }
               else
               {
                 write8(qoiOpRGB)
                 write8(curColor.r)
                 write8(curColor.g)
                 write8(curColor.b)
               }
           }
           else
           {
               write8(qoiOpRGBA)
               write8(curColor.r)
               write8(curColor.g)
               write8(curColor.b)
               write8(curColor.a)
           }
         }
      }
    
    prevColor = {...curColor}
  }

  //Write the end marker
  qoiEndMarker.forEach(byte => write8(byte))

  return Buffer.from(encodedBytes.slice(0, index))
}

function qoiDecoder(qoiBuffer)
{
  let prevColor = new Color(0, 0, 0, 255)
  const seenPixels = Array.from({length: 64}, () => new Color(0, 0, 0, 255))
  qoiBuffer = new Uint8Array(qoiBuffer)

  let readIndex = 0
  let writeIndex = 0

  const read32 = () => (
    (qoiBuffer[readIndex++]<<24) |
    (qoiBuffer[readIndex++]<<16) |
    (qoiBuffer[readIndex++]<<8) |
    (qoiBuffer[readIndex++]<<0)
  )

  const read8 = () => qoiBuffer[readIndex++]

  if(qoiBuffer.byteLength < qoiHeaderSize + qoiEndMarker)
  {
    throw new Error("Invalid QOI file")
  }

  if(read32() != 0x716f6966)
  {
    throw new Error("Invalid QOI file")
  }

  const width = read32()
  const height = read32()
  const channels = read8()
  const colorspace = read8()

  const pixelBufferSize = width * height * channels
  const pixelBuffer = new Uint8Array(pixelBufferSize)

  const writeColor = color => {
     pixelBuffer[writeIndex++] = color.r
     pixelBuffer[writeIndex++] = color.g
     pixelBuffer[writeIndex++] = color.b
     if(channels === 4){
      pixelBuffer[writeIndex++] = color.a
     }
  }

  const insertColorToSeen = color => {
    seenPixels[(color.r * 3 + color.g * 5 + color.b * 7 + color.a * 11) % 64] = {...color}
  }

  while(readIndex < qoiBuffer.byteLength - qoiEndMarkerSize)
  {
      const byte = read8()

      if(byte === qoiOpRGB)
      {
        prevColor.r = read8()
        prevColor.g = read8()
        prevColor.b = read8()
        writeColor(prevColor)
        insertColorToSeen(prevColor)
      }
      else if(byte === qoiOpRGBA)
      {
        prevColor.r = read8()
        prevColor.g = read8()
        prevColor.b = read8()
        prevColor.a = read8()
        writeColor(prevColor)
        insertColorToSeen(prevColor)
      }
      else if((byte & qoiChunkMask) === qoiOpRun)
      {
         const runLength = (byte & qoiRunLength) + 1
         for(let i=0;i<runLength;i++)
         {
            writeColor(prevColor)
         }
      }
      else if((byte & qoiChunkMask) === qoiOpIndex)
      {
         const index = byte & qoiHashIndex
         const color = seenPixels[index]
         writeColor(color)
         prevColor.r = color.r
         prevColor.g = color.g
         prevColor.b = color.b
         prevColor.a = color.a
      }
      else if((byte & qoiChunkMask) === qoiOpDiff)
      {
         const dr = ((byte & qoiDiffRed) >> 4) - 2
         const dg = ((byte & qoiDiffGreen) >> 2) - 2
         const db = ((byte & qoiDiffBlue) >> 0) - 2
         prevColor.r = (prevColor.r + dr) & 0xff
         prevColor.g = (prevColor.g + dg) & 0xff
         prevColor.b = (prevColor.b + db) & 0xff
         writeColor(prevColor)
         insertColorToSeen(prevColor)
      }
      else if((byte & qoiChunkMask) === qoiOpDiffLuma)
      {
         const byte2 = read8()
         const dg = (byte & qoiLumaGreen) - 32
         const dr_dg = ((byte2 & qoiLumaDR_DG) >> 4) - 8
         const db_dg = ((byte2 & qoiLumaDB_DG) >> 0) - 8
         const dr = dr_dg + dg
         const db = db_dg + dg
         prevColor.r = (prevColor.r + dr) & 0xff
         prevColor.g = (prevColor.g + dg) & 0xff
         prevColor.b = (prevColor.b + db) & 0xff
         writeColor(prevColor)
         insertColorToSeen(prevColor)
      }
  }

  return new PixelData(width, height, channels, colorspace, pixelBuffer)
}

module.exports = {qoiEncoder, qoiDecoder}