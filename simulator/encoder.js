function createEncoder(pixels, width, height, channels, colorspace=1)
{
    let runLength = 0
    const chunks = []
    let pixelIndex = 0
    let prevColor = new Color(0, 0, 0, 255)
    const seenPixels = Array.from({length: 64}, () => new Color(0, 0, 0, 0))
    
    return () => {
        if(chunks.length === 0)
        {
            chunks.push({
                tag: "QOI_HEADER",
                data: {
                    magicNumber: "qoif",
                    width,
                    height,
                    channels,
                    colorspace,
                }
            })

            return new EncodeSimulatorState(chunks, runLength, seenPixels, prevColor, pixelIndex)
        }

        if(pixelIndex === pixels.length)
        {
            chunks.push({
                tag: "QOI_END_MARKER",
                data: {
                    b0: 0,
                    b1: 0,
                    b2: 0,
                    b3: 0,
                    b4: 0,
                    b5: 0,
                    b6: 0,
                    b7: 1
                }
            })

            pixelIndex++
            return new EncodeSimulatorState(chunks, runLength, seenPixels, prevColor, pixelIndex)
        }

        if(pixelIndex > pixels.length)
        {
            throw new Error("Simulation has already been completed.")
        }

        const insertColorToSeen = color => {
            seenPixels[(color.r * 3 + color.g * 5 + color.b * 7 + color.a * 11) % 64] = {...color}
        }

        const {r, g, b} = pixels[pixelIndex]
        const curColor = new Color(r, g, b, channels === 4 ? pixels[pixelIndex].a : prevColor.a)

        if(colorsEqual(curColor,prevColor))
        {
            runLength++
            if(runLength === 62 || pixelIndex === pixels.length-1){
                const run = {
                    tag: "QOI_OP_RUN",
                    data: {
                        run:runLength-1
                    }
                }
                chunks.push(run);
                runLength = 0;
            }
        }
        else
        {
            if(runLength > 0)
            {
                const run = {
                    tag: "QOI_OP_RUN",
                    data: {
                        run: runLength-1
                    }
                }
                chunks.push(run);
                runLength = 0;
            }
            const hash = (curColor.r * 3 + curColor.g * 5 + curColor.b * 7 + curColor.a * 11) % 64
            if(colorsEqual(curColor, seenPixels[hash]))
            {
                const index = {
                    tag:"QOI_OP_INDEX",
                    data: {
                        index:hash
                    }
                }
                chunks.push(index)
            }
            else
            {
                insertColorToSeen(curColor)
                const diff = colorDiff(curColor, prevColor)
                const dr_dg = diff.r - diff.g
                const db_dg = diff.b - diff.g

                if(diff.a==0)
                {
                    const diffSmall = (diff.r >= -2 && diff.r <= 1) && (diff.g >= -2 && diff.g <= 1) && (diff.b >= -2 && diff.b <= 1)
                    const diffLumaSmall = (diff.g >= -32 && diff.g <= 31) && (dr_dg >= -8 && dr_dg <= 7) && (db_dg >= -8 && db_dg <= 7)
                    if(diffSmall)
                    {

                        const difference = {
                            tag:"QOI_OP_DIFF",
                            data:{
                                dr:diff.r+2,
                                dg:diff.g+2,
                                db:diff.b+2
                            }
                        }
                        chunks.push(difference)
                    }
                    else if(diffLumaSmall)
                    {
                        const luma = {
                            tag:"QOI_OP_LUMA",
                            data:{
                                dg:diff.g+32,
                                dr_dg:dr_dg+8,
                                db_dg:db_dg+8
                            }
                        }
                        chunks.push(luma)
                    }
                    else
                    {
                        const rgb = {
                            tag:"QOI_OP_RGB",
                            data:{
                                r:curColor.r,
                                g:curColor.g,
                                b:curColor.b
                            }
                        }
                        chunks.push(rgb)
                    }
                }
                else
                {
                    const rgba = {
                        tag:"QOI_OP_RGBA",
                        data:{
                            r:curColor.r,
                            g:curColor.g,
                            b:curColor.b,
                            a:curColor.a
                        }
                    }
                    chunks.push(rgba)
                }
            }
        }
        pixelIndex++;
        prevColor = {...curColor}
        return new EncodeSimulatorState(chunks, runLength, seenPixels, prevColor, pixelIndex)
    }
}
