function Color(r, g, b, a)
{
  this.r = r
  this.g = g
  this.b = b
  this.a = a
}

function DecodeSimulatorState(outputPixels, hashMap, prevColor, curChunk)
{
    this.outputPixels = outputPixels
    this.hashMap = hashMap
    this.prevColor = prevColor
    this.curChunk = curChunk
}

function EncodeSimulatorState(qoiChunks, runLength, hashMap, prevColor, curPixel)
{
    this.qoiChunks = qoiChunks
    this.runLength = runLength
    this.hashMap = hashMap
    this.prevColor = prevColor
    this.curPixel = curPixel
}

function colorsEqual(c0, c1)
{
  return c0.r === c1.r && c0.g === c1.g && c0.b === c1.b && c0.a === c1.a
}

function colorDiff(c0, c1)
{
  return new Color(c0.r - c1.r, c0.g - c1.g, c0.b - c1.b, c0.a - c1.a)
}

async function getJSON(url) 
{
    const response = await fetch(url);
    const data = await response.json();
    return data
}