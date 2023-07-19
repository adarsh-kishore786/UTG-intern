// const sharp = require('sharp');

// async function convertToPNG(rawBuffer, width, height, channels) {
//   return await sharp(rawBuffer, { raw: { width, height, channels } })
//     .png()
//     .toBuffer();
// }

// module.exports = {convertToPNG}





const fs = require('fs');
const PNG = require('pngjs').PNG;
const { performance } = require('perf_hooks');

// const inputPath = 'img2.png';
// const binaryOutputPath = 'output.bin';
// const pngOutputPath = 'output.png';

// Function to convert a PNG image to binary data
function convertToBinary(inputFilePath, binaryOutputFilePath, callback) {
  // Read the PNG image from the file
  fs.createReadStream(inputFilePath)
    .pipe(new PNG())
    .on('parsed', function () {
      // Convert the PNG image to binary data (assuming 0 represents white and 1 represents black)
      const binaryData = [];
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const index = (this.width * y + x) << 2;
          const r = this.data[index]; // Red channel
          const g = this.data[index + 1]; // Green channel
          const b = this.data[index + 2]; // Blue channel
          const isBlackPixel = r === 0 && g === 0 && b === 0;
          binaryData.push(isBlackPixel ? 1 : 0);
        }
      }

      // Convert binary data to a Buffer and write it to a file
      const binaryBuffer = Buffer.from(binaryData);
      fs.writeFileSync(binaryOutputFilePath, binaryBuffer);
      // console.log('PNG image converted to binary file successfully.');

      // Callback to signal the completion of the conversion
      callback();
    });
}

// Function to convert binary data to a PNG image
function convertToPNG(binaryOutputFilePath) {
  // Read the binary data from the file
  const binaryData = fs.readFileSync(binaryOutputFilePath);

  // Calculate the width and height of the image based on the length of the binary data
  const dataSize = binaryData.length;
  const width = Math.ceil(Math.sqrt(dataSize));
  const height = Math.ceil(dataSize / width);

  // Create a new PNG instance with the specified width and height
  const png = new PNG({ width, height });

  // Fill the PNG image with the binary data
  for (let i = 0; i < dataSize; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    const color = binaryData[i] === 1 ? 0 : 255; // Assuming 1 represents black and 0 represents white
    const index = (y * png.width + x) << 2;
    png.data[index] = color; // Red channel
    png.data[index + 1] = color; // Green channel
    png.data[index + 2] = color; // Blue channel
    png.data[index + 3] = 255; // Alpha channel (fully opaque)
  }

  // Create a writable stream and pipe the PNG image to it
  // const writableStream = fs.createWriteStream(pngOutputFilePath);
  // png.pack().pipe(writableStream);

  // Handle the 'finish' event to log the successful conversion and measure the time taken
  
  // console.log('Binary data converted to PNG successfully.');
  // const endTime = performance.now();
  // const timeTaken = endTime - startTime;
  // console.log('Time taken for the conversion:', timeTaken, 'milliseconds');
  

  // Handle any potential errors during the conversion
  // writableStream.on('error', (err) => {
  //   console.error('Error during conversion:', err);
  // });
}

// Call the functions with the input and output file paths

// convertToBinary(inputPath, binaryOutputPath, () => {
//   // The callback ensures that the binary file is created before calling the next function
//   // const startTime = performance.now();
//   convertToPNG(binaryOutputPath,startTime);
// });

module.exports={convertToBinary,convertToPNG};
