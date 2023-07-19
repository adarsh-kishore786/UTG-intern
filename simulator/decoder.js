function createDecoder(chunks)
{
    const {width, height, channels, colorspace} = chunks[0]
    const pixels = []
    const qoiChunks = chunks
    let chunkIndex = 1
    let prevColor = new Color(0, 0, 0, 0)
    const seenPixels = Array.from({length: 64}, () => new Color(0, 0, 0, 255))

    return () => {
        if(chunkIndex === qoiChunks.length){
            return new DecodeSimulatorState(pixels, seenPixels, prevColor, chunkIndex)
        }
        if(chunkIndex > qoiChunks.length)
        {
            throw new Error("Simulation has already been completed.")
        }
        const insertColorToSeen = color => {
            seenPixels[(color.r * 3 + color.g * 5 + color.b * 7 + color.a * 11) % 64] = {...color}
        }

        const writeColor = color => {
            const {r, g, b, a} = color
            if(channels === 4){
                pixels.push({r, g, b, a})
            }
            else{
                pixels.push({r, g, b})
            }
        }
        console.log(qoiChunks, chunkIndex)
        if(qoiChunks[chunkIndex].tag === "QOI_OP_RGB")
        {
            prevColor.r = qoiChunks[chunkIndex].data.r
            prevColor.g = qoiChunks[chunkIndex].data.g
            prevColor.b = qoiChunks[chunkIndex].data.b
            writeColor(prevColor)
            insertColorToSeen(prevColor)
        }
        else if(qoiChunks[chunkIndex].tag === "QOI_OP_RGBA")
        {
            prevColor.r = qoiChunks[chunkIndex].data.r
            prevColor.g = qoiChunks[chunkIndex].data.g
            prevColor.b = qoiChunks[chunkIndex].data.b
            prevColor.a = qoiChunks[chunkIndex].data.a;
            writeColor(prevColor)
            insertColorToSeen(prevColor)
        }
        else if(qoiChunks[chunkIndex].tag === "QOI_OP_RUN")
        {
            const runLength = qoiChunks[chunkIndex].data.run + 1;
            for(let i=0;i<runLength;i++){
                writeColor(prevColor)
            }
        }
        else if(qoiChunks[chunkIndex].tag === "QOI_OP_INDEX")
        {
            const index = qoiChunks[chunkIndex].data.index
            const color = seenPixels[index]
            writeColor(color)
            prevColor.r = color.r
            prevColor.g = color.g
            prevColor.b = color.b
            prevColor.a = color.a
        }
        else if(qoiChunks[chunkIndex].tag === "QOI_OP_DIFF")
        {
            let {dr, dg, db} = qoiChunks[chunkIndex].data
            dr -= 2
            dg -= 2
            db -= 2
            prevColor.r += dr
            prevColor.g += dg
            prevColor.b += db
            writeColor(prevColor)
            insertColorToSeen(prevColor)
        }
        else if(qoiChunks[chunkIndex].tag === "QOI_OP_LUMA"){
            let {dg, dr_dg, db_dg} = qoiChunks[chunkIndex].data
            dg-=32
            dr_dg-=8
            db_dg-=8
            const dr = dr_dg + dg
            const db = db_dg + dg
            prevColor.r += dr;
            prevColor.g += dg;
            prevColor.b += db;
            writeColor(prevColor);
            insertColorToSeen(prevColor)
        }
        chunkIndex++
        return new DecodeSimulatorState(pixels, seenPixels, prevColor, chunkIndex)
    }
}