let jsonData

const uploadButton = document.getElementById("upload_button")
const curQoiChunk = document.querySelector(".cur-qoi-chunk")

uploadButton.addEventListener('click', async () => {
    const fileInput = document.getElementById("jsonFileInput")
    const url = fileInput.files[0].name
    jsonData = await getJSON(url)
})

function run(data)
{
    curQoiChunk.innerHTML += 
    `<div class="qoi-chunk">
        <div class="tag">QOI_OP_RUN</div>
        <div class="data">
            <p class="t-white">Run length: ${data.run}</p>
        </div>
    </div>`
}

function index(data)
{
    curQoiChunk.innerHTML =
    `<div class="qoi-chunk">
        <div class="tag">QOI_OP_INDEX</div>
        <div class="data">
            <p class="t-white">Index: ${data.index}</p>
        </div>
    </div>`
}

function diff(data)
{
    curQoiChunk.innerHTML =
    `<div class="qoi-chunk">
        <div class="tag">QOI_OP_DIFF</div>
        <div class="data">
            <p class="t-red">DR: ${data.dr}</p>
            <p class="t-green">DG: ${data.dg}</p>
            <p class="t-blue">DB: ${data.db}</p>
        </div>
    </div>`
}

function luma(data)
{
    curQoiChunk.innerHTML =
    `<div class="qoi-chunk">
        <div class="tag">QOI_OP_LUMA</div>
        <div class="data">
            <p class="t-red">DG: ${data.dg}</p>
            <p class="t-green">DR_DG: ${data.dr_dg}</p>
            <p class="t-blue">DB_DG: ${data.db_dg}</p>
        </div>
    </div>`
}
function rgb(data)
{
    curQoiChunk.innerHTML =
    `<div class="qoi-chunk">
        <div class="tag">QOI_OP_RGB</div>
        <div class="data">
            <p class="t-red">R: ${data.r}</p>
            <p class="t-green">G: ${data.g}</p>
            <p class="t-blue">B: ${data.b}</p>
        </div>
    </div>`
}
function rgba(data)
{
    curQoiChunk.innerHTML =
    `<div class="qoi-chunk">
        <div class="tag">QOI_OP_RGB</div>
        <div class="data">
            <p class="t-red">R: ${data.r}</p>
            <p class="t-green">G: ${data.g}</p>
            <p class="t-blue">B: ${data.b}</p>
            <p class="t-white">A: ${data.a}</p>
        </div>
    </div>`
}

function header(data)
{
    curQoiChunk.innerHTML = 
    `<div class="qoi-chunk">
        <div class="tag">QOI_HEADER</div>
        <div class="data">
            <p class="t-white">QOIF</p>
            <p class="t-white">Width: ${data.width}</p>
            <p class="t-white">Height: ${data.height}</p>
            <p class="t-white">Channels: ${data.channels}</p>
            <p class="t-white">Colorspace: RGB</p>
        </div>
    </div>`
}

function end()
{
    curQoiChunk.innerHTML =
    `<div class="qoi-chunk">
        <div class="tag">QOI_END_MARKER</div>
        <div class="data">
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x00</p>
            <p class="t-white">Byte: 0x01</p>
        </div>
    </div>`
}

async function dSimulate()
{
    const mySimulator = createDecoder(jsonData)
    const pixelArrayDiv = document.getElementById('pixel-array')
    const hashArrayDiv = document.getElementById('hash-array');
    
    for (var i = 0; i < 10; i++) 
    {
        const divElem = document.createElement('div')
        for (var j = 0; j < 10; j++) 
        {
            const tempButton = document.createElement('button')
            var color = "#000";
            tempButton.classList.add('pixel-button')
            tempButton.style.backgroundColor = color
            divElem.appendChild(tempButton);
        }
        pixelArrayDiv.append(divElem);
    }
    let pixelCaption = document.createElement('h3');
    pixelCaption.innerText = "Pixels";
    pixelCaption.style.textAlign = "center";
    pixelCaption.style.color = "#fff";
    pixelArrayDiv.append(pixelCaption);

    for (let j = 0; j < 8; j++) {
        let rowDiv = document.createElement('div');
        for (let k = 0; k < 8; k++) {
            let tempButton = document.createElement('button');
            tempButton.classList.add('hash-button');
            tempButton.style.backgroundColor = "#000";

            rowDiv.appendChild(tempButton);
        }
        hashArrayDiv.append(rowDiv);

    }

    const buttonObject = document.getElementsByClassName('pixel-button');
    const hashObject = document.getElementsByClassName('hash-button');

    let prev = 0
    let counter = 0

    let intervalId = setInterval(() => {
        if(counter === jsonData.length)
        {
            clearInterval(intervalId)
        }
        const state = mySimulator()
        const pixels = state.outputPixels
        const hash = state.hashMap
        const {curChunk} = state
        console.log(counter);

        if (counter == 0) {
            let hashCaption = document.createElement('h3');
            hashCaption.innerText = "Hash Table";
            hashCaption.style.textAlign = "center";
            hashCaption.style.color = "#fff";
            hashArrayDiv.append(hashCaption);
        }

        if(pixels.length!=prev)
        {
            for (let index = 0; index < 64; index++) {
                console.log(hashObject[index]);
                hashObject[index].style.backgroundColor = `rgb(${hash[index].r},${hash[index].g},${hash[index].b})`
            }
            
            for(let i=prev;i<pixels.length;i++)
            {
                buttonObject[i].style.backgroundColor = `rgb(${pixels[i].r},${pixels[i].g},${pixels[i].b})`
            }
            prev = pixels.length
        }
        if(curChunk<jsonData.length)
        {
            if(jsonData[curChunk].tag === "QOI_HEADER")
            {
                header(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_OP_RUN")
            {
                run(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_OP_DIFF")
            {
                diff(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_OP_LUMA")
            {
                luma(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_OP_INDEX")
            {
                index(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_OP_RGB")
            {
                rgb(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_OP_RGBA")
            {
                rgba(jsonData[curChunk].data)
            }
            else if(jsonData[curChunk].tag === "QOI_END_MARKER")
            {
                end()
            }
        }

        counter++
        
    }, 300)
}

const simulate =  document.getElementById("simulate")
simulate.addEventListener('click', dSimulate)
