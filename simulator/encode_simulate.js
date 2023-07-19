let jsonData
let globalChunks = []

async function getJSON(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data
}

const uploadButton = document.getElementById("upload_button")
const encoderChunks = document.querySelector("#container.qoi-chunks")

uploadButton.addEventListener('click', async () => {
    const fileInput = document.getElementById("jsonFileInput")
    const url = fileInput.files[0].name
    console.log(url)
    jsonData = await getJSON(url)
    console.log(jsonData)
})

function run(data) {
    encoderChunks.innerHTML +=
        `<div class="qoi-chunk">
        <div class="tag">QOI_OP_RUN</div>
        <div class="data">
            <p class="t-white">Run length: ${data.run}</p>
        </div>
    </div>`
}

function index(data) {
    encoderChunks.innerHTML +=
        `<div class="qoi-chunk">
        <div class="tag">QOI_OP_INDEX</div>
        <div class="data">
            <p class="t-white">Index: ${data.index}</p>
        </div>
    </div>`
}

function diff(data) {
    encoderChunks.innerHTML +=
        `<div class="qoi-chunk">
        <div class="tag">QOI_OP_DIFF</div>
        <div class="data">
            <p class="t-red">DR: ${data.dr}</p>
            <p class="t-green">DG: ${data.dg}</p>
            <p class="t-blue">DB: ${data.db}</p>
        </div>
    </div>`
}

function luma(data) {
    encoderChunks.innerHTML +=
        `<div class="qoi-chunk">
        <div class="tag">QOI_OP_LUMA</div>
        <div class="data">
            <p class="t-red">DG: ${data.dg}</p>
            <p class="t-green">DR_DG: ${data.dr_dg}</p>
            <p class="t-blue">DB_DG: ${data.db_dg}</p>
        </div>
    </div>`
}
function rgb(data) {
    encoderChunks.innerHTML +=
        `<div class="qoi-chunk">
        <div class="tag">QOI_OP_RGB</div>
        <div class="data">
            <p class="t-red">R: ${data.r}</p>
            <p class="t-green">G: ${data.g}</p>
            <p class="t-blue">B: ${data.b}</p>
        </div>
    </div>`
}
function rgba(data) {
    encoderChunks.innerHTML +=
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

function header(data) {
    encoderChunks.innerHTML +=
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

function end() {
    encoderChunks.innerHTML +=
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

async function eSimulate() {
    const { width, height, channels, colorspace, pixels } = jsonData
    const mySimulator = createEncoder(pixels, width, height, channels, colorspace)

    const pixelArrayDiv = document.getElementById('pixel-array');
    const hashArrayDiv = document.getElementById('hash-array');

    for (var i = 0; i < 10; i++) {
        const divElem = document.createElement('div');
        for (var j = 0; j < 10; j++) {
            const tempButton = document.createElement('button');
            var color = "#000";
            tempButton.classList.add('pixel-button');
            tempButton.style.backgroundColor = color;
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



    let ind = 0
    let prev = 0

    let counter = 0

    const buttonObject = document.getElementsByClassName('pixel-button');
    const hashObject = document.getElementsByClassName('hash-button');
    let intervalId = setInterval(() => {
        counter++

        if (ind < pixels.length)
            buttonObject[ind].style.backgroundColor = `rgb(${pixels[ind].r},${pixels[ind].g},${pixels[ind].b})`

        const state = mySimulator()
        // console.log(state)
        chunks = state.qoiChunks
        hash = state.hashMap
        console.log(hash);
        console.log("Current pixel: ", state.curPixel)
        if (chunks.length != prev) {
            for (let i = prev; i < chunks.length; i++) {
                globalChunks.push(chunks[i])
                const tag = chunks[i].tag
                for (let index = 0; index < 64; index++) {
                    console.log(hashObject[index]);
                    hashObject[index].style.backgroundColor = `rgb(${hash[index].r},${hash[index].g},${hash[index].b})`
                }
                if (ind == 0) {
                    let hashCaption = document.createElement('h3');
                    hashCaption.innerText = "Hash Table";
                    hashCaption.style.textAlign = "center";
                    hashCaption.style.color = "#fff";
                    hashArrayDiv.append(hashCaption);
                }
                    
                if (tag === "QOI_OP_RUN") {
                    run(chunks[i].data)
                }
                else if (tag === "QOI_OP_INDEX") {
                    index(chunks[i].data)
                }
                else if (tag === "QOI_OP_DIFF") {
                    diff(chunks[i].data)
                }
                else if (tag === "QOI_OP_LUMA") {
                    luma(chunks[i].data)
                }
                else if (tag === "QOI_OP_RGB") {
                    rgb(chunks[i].data)
                }
                else if (tag === "QOI_OP_RGBA") {
                    rgba(chunks[i].data)
                }
                else if (tag === "QOI_HEADER") {
                    header(chunks[i].data)
                }
                else if (tag === "QOI_END_MARKER") {
                    end()
                }
            }
            prev = chunks.length
        }
        ind++
        if (counter === pixels.length + 2) {
            clearInterval(intervalId)
            const submitButton = document.getElementById('download-json');
            submitButton.addEventListener('click', downloadQOI);
        }

    }, 300)
}




const downloadQOI = () => {
    const fileName = "output_qoi.json";
    console.log(globalChunks)
    const a = document.createElement('a');
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(globalChunks));
    a.setAttribute('download', fileName);
    a.click();
}

const simulate = document.getElementById("simulate")
simulate.addEventListener('click', eSimulate)
