function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function colorToHex(color) {
    [r, g, b] = color.substring(4, color.length-1).split(',').map(t => Number(t));
    // console.log(r, g, b);
    var temp = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    // console.log(temp + "\n");
    return temp;
}

function rgbToHex(r, g, b) {
    // console.log(r, g, b);
    var temp = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    // console.log(temp + "\n");
    return temp;
  }

const changeColor = (event, button) => {
    button.style.backgroundColor = event.target.value;
    const divElem = document.getElementById('color-picker');
    divElem.remove();
}

const colorPicker = event => {
    var buttons = document.getElementsByClassName('pixel-button');
    for (var button of buttons) {
        if (button.classList.contains('pixel-button-active')) 
            button.classList.remove('pixel-button-active');
    }

    event.target.classList.add('pixel-button-active');
    const labelElement = document.createElement('label');
    labelElement.setAttribute('for', 'colorpicker');
    labelElement.innerText = `Color Picker (${event.target.style.backgroundColor}): `;

    const inputElement = document.createElement('input');
    inputElement.type = 'color'; 
    // inputElement.setAttribute('data-jscolor', '{}');
    inputElement.id = 'colorpicker';
    inputElement.setAttribute('value', colorToHex(event.target.style.backgroundColor));
    inputElement.addEventListener('change', (e) => changeColor(e, event.target));
    inputElement.style.backgroundColor = event.target.style.backgroundColor;
    
    let divElem = document.getElementById('color-picker');
    if (!divElem) {
        divElem = document.createElement('div');
        divElem.id = 'color-picker';
    } else {
        divElem.getElementsByTagName('label')[0].remove();
        divElem.getElementsByTagName('input')[0].remove();
    }
    // for (var child in divElem) {
    //     divElem[child].remove();
    // }

    divElem.appendChild(labelElement);
    divElem.appendChild(inputElement);

    document.getElementById('container').append(divElem);
}

const downloadPixels = () => {
    let downloadObj = {
        width: 10,
        height: 10,
        channels: 3,
        colorSpace: 1,
        pixels: [],
    };
    const buttonObject = document.getElementsByClassName('pixel-button');
    const buttonColors = Object.values(buttonObject).map(button => button.style.backgroundColor);
    
    for (let buttonColor of buttonColors) {
        let color = buttonColor.substring(4, buttonColor.length-1).split(',').map(t => Number(t));
        let tempObj = {};
        tempObj['r'] = color[0];
        tempObj['g'] = color[1];
        tempObj['b'] = color[2];
        downloadObj['pixels'].push(tempObj);
    }
    console.log(downloadObj);

    var fileName = "output.json";

    const a = document.createElement('a');
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(downloadObj));
    a.setAttribute('download', fileName);
    a.click();
}

const pixelArrayDiv = document.getElementById('pixel-array');

for (var i = 0; i < 10; i++) {
    const divElem = document.createElement('div');
    for (var j = 0; j < 10; j++) {
        const tempButton = document.createElement('button');
        var color = "#000";
        tempButton.classList.add('pixel-button');
        tempButton.style.backgroundColor = color;
        tempButton.addEventListener('click', colorPicker);
        divElem.appendChild(tempButton);
    }
    pixelArrayDiv.append(divElem);
}

const loadImage = event => {
    const imgObj = {
        'width': 10,
        'height': 10,
        'channels': 3,
        'colorSpace': 1,
        'pixels': []
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const imgURL = "../camera-icon.png";
    const img = new Image();
    img.src = imgURL;
    img.onload = () => {
        canvas.width = 10;
        canvas.height = 10;

        ctx.drawImage(img, 0, 0);

        const rgba = ctx.getImageData(0, 0, 10, 10).data;

        for (let i = 0; i < rgba.length; i += 4) {
            var tempObj = {}
            // Modify pixel data
            tempObj['r'] = rgba[i]; // R value
            tempObj['g'] = rgba[i + 1]; // G value
            tempObj['b'] = rgba[i + 2]; // B value
            imgObj['pixels'].push(tempObj);
        }
        console.log(imgObj);

        let pixels = imgObj['pixels'];

        const buttons = Object.values(document.getElementsByClassName('pixel-button'));
        
        for (let index in buttons) {
            let button = buttons[index];

            let color = rgbToHex(...Object.values(pixels[index]));
            button.style.backgroundColor = color;
        }
    }
}

let submitButton = document.getElementById('download-json');
submitButton.addEventListener('click', downloadPixels);

let loadImageButton = document.getElementById("preload-image");
loadImageButton.addEventListener('click', loadImage);