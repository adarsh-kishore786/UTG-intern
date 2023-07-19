#!/usr/bin/env node
const sharp = require('sharp');
const fs = require('fs');
const {qoiEncoder, qoiDecoder} = require('./qoi');
const { convertToPNG,convertToBinary } = require('./png');

async function decompressImage(inputPath, outputPath)
{
  const buffer = await fs.promises.readFile(inputPath)
  const pixelData = qoiDecoder(buffer).buffer
  await fs.promises.writeFile(outputPath, pixelData)
}

async function compressImage(inputPath, outputPath)
{
  try {
    // Read the image data
    const data = await sharp(inputPath).raw().toBuffer();
    const info = await sharp(inputPath).metadata();
    const { width, height, channels } = info;

    // Prepare pixel values buffer
    const pixelValues = Buffer.alloc(width * height * channels)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * channels;

        for (let c = 0; c < channels; c++) {
          const channelValue = data[pixelIndex + c];
          pixelValues[pixelIndex + c] = channelValue;
        }
      }
    }

    // Get the sizes of the input image
    const inputImageSize = fs.statSync(inputPath).size;
    const binaryFileSize = pixelValues.byteLength

    //Measure time taken by PNG for comparison
    console.time("Time taken by PNG compression is ")
    const binaryOutputPath = "output.bin";
    convertToBinary(inputPath, binaryOutputPath, () => {
      // The callback ensures that the binary file is created before calling the next function
      convertToPNG(binaryOutputPath);
      console.timeEnd("Time taken by PNG compression is ")
    });

    // Call your custom compression function
    console.time("Time taken by QOI compression is ")
    const compressedData = qoiEncoder(pixelValues, width, height, channels)
    console.timeEnd("Time taken by QOI compression is ")

    // Write the compressed result to a file
    await fs.promises.writeFile(outputPath, compressedData);

    // Get the size of the compressed file
    const compressedFileSize = fs.statSync(outputPath).size;

    console.log('Input PNG image size:', inputImageSize, 'bytes');
    console.log('Compressed QOI image size:', compressedFileSize, 'bytes');
    console.log('Compression ratio of PNG: ', (binaryFileSize / inputImageSize).toFixed(2));
    console.log('Compression ratio of QOI:', (binaryFileSize / compressedFileSize).toFixed(2));
    console.log('Compressed result saved to', outputPath);
  } catch (err) {
    console.error('Error compressing image:', err);
  }
}

// Extract the command line arguments
const inputPath = process.argv[2]
const outputPath = process.argv[3]

console.log(inputPath, outputPath)

// Check if input and output paths are provided
if (!inputPath || !outputPath) {
  console.error('Usage: node qoi.js <inputPath> <outputPath>');
  process.exit(1);
}

// Call the appropriate function based on the file extensions
compressImage(inputPath, outputPath);