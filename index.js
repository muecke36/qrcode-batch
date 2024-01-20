const cmd = require('commander');
const fs = require('fs');
const qr = require('qrcode');
const gm = require('gm');
const PdfPrinter = require("pdfmake");
const fonts = {
  Courier: {
    normal: "Courier",
    bold: "Courier-Bold",
    italics: "Courier-Oblique",
    bolditalics: "Courier-BoldOblique",
  },
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
  Times: {
    normal: "Times-Roman",
    bold: "Times-Bold",
    italics: "Times-Italic",
    bolditalics: "Times-BoldItalic",
  },
  Symbol: {
    normal: "Symbol",
  },
  ZapfDingbats: {
    normal: "ZapfDingbats",
  },
};
const printer = new PdfPrinter(fonts);

cmd
  .option("-w, --width <width>", "QR code width", 400)
  .option("-s, --source <path>", "source file", "input.txt")
  .option("-d, --destination <path>", "destination directory", "output")
  .option("--pdf <path-to-pdf>", "PDF file to be generated", "")
  .option("-p, --prefix <text>", "data prefix", "")
  .option("--dark <color>", "dark color for QR code and text", "#000000")
  .option("--light <color>", "light color for background", "#ffffff")
  .parse();

const options = cmd.opts();
console.log(options);
const qrOptions = {
  width: options.width,
  margin: 4,
  errorCorrectionLevel: "high",
  color: {
    dark: options.dark,
    light: options.light,
  },
};

const texts = fs.readFileSync(options.source, "utf-8").trim().split("\r\n");

if (!options.pdf) {
  for (let i = 0; i < texts.length; i += 1) {
    encode(texts[i]);
  }
} else {
  const rows = [];
  const qrsize = 80;
  for (let i = 0; i < texts.length; i += 5) {
    const row = [];
    for (let j = 0; j < 5; j++) {
      if (texts[i + j]) {
        row.push({
          stack: [
            { qr: texts[i + j], fit: qrsize, alignment: "center" },
            { text: texts[i + j], alignment: "center", margin: [0, 6, 0, 0] },
          ],
        });
      }
    }
    rows.push(row);
  }
  const cellSize = 80;
  var docDefinition = {
    pageMargins: [20, 25, 10, 10],
    pageSize: "A4",
    defaultStyle: {
      font: "Helvetica",
    },
    content: [
      {
        layout: "qrtable",
        table: {
          widths: [cellSize, cellSize, cellSize, cellSize, cellSize],
          body: rows,
        },
      },
    ],
  };
  const padding = 15;
  var myTableLayouts = {
    qrtable: {
      paddingLeft: function () {
        return padding;
      },
      paddingRight: function () {
        return padding;
      },
      paddingTop: function () {
        return padding;
      },
      paddingBottom: function () {
        return padding;
      },
    },
  };
  var pdfDoc = printer.createPdfKitDocument(docDefinition, {
    tableLayouts: myTableLayouts,
  });
  pdfDoc.pipe(fs.createWriteStream(options.pdf));
  pdfDoc.end();
}

function encode(text) {
  const textToEncode = options.prefix + text;
  const file = `${options.destination}/${text}.png`;

  qr.toFile(file, textToEncode, qrOptions, function (error) {
    if (error) {
      throw error;
    }
    console.log("Encoded: " + file);

    addText(text);
  });
}

function addText(text) {
  const textToAdd = options.prefix + text;
  const file = `${options.destination}/${text}.png`;

  const qrWidth = options.width;
  const qrHeight = options.width;

  const image = {
    width: qrWidth,
    height: qrHeight * 1.1,
  };

  const textArea = {
    x: 0,
    y: qrHeight * 0.95,
    width: qrWidth,
    height: qrHeight * 0.1,
  };

  const textOptions = {
    x: 0,
    y: qrHeight * 0.065,
    size: qrHeight * 0.065,
    font: "Roboto-Regular.ttf",
  };

  gm(file)
    .gravity("North")
    .extent(image.width, image.height)
    .region(textArea.width, textArea.height, textArea.x, textArea.y)
    .background(options.light)
    .gravity("North")
    .fill(options.dark)
    .fontSize(textOptions.size)
    .font(textOptions.font)
    .drawText(textOptions.x, textOptions.y, textToAdd)
    .write(file, function (error) {
      if (error) {
        throw error;
      }
      console.log("Converted: " + file);
    });
}
