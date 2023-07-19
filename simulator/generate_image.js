function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    // console.log(r, g, b);
    var temp = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    // console.log(temp + "\n");
    return temp;
  }

async function getJSON(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function generateImage() {
    let url = "../output.json";
    
    let dataObj = await getJSON(url);

    let pixels = dataObj['pixels'];
    console.log(pixels);

    for (let i = 0; i < 10; i++) {
        let tempDiv = document.createElement('div');
        for (let j = 0; j < 10; j++) {
            let button = document.createElement('button');
            button.classList.add('pixel-button');

            let color = rgbToHex(...Object.values(pixels[i*10+j]));
            button.style.backgroundColor = color;

            tempDiv.appendChild(button);
        }
        document.getElementById('pixel-array').appendChild(tempDiv);
    }
}

generateImage();
