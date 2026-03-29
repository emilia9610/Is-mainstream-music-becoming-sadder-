function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  noLoop();
}

function draw() {
  background(245, 240, 230); // soft cream background
  drawA4Paper();
}

function drawA4Paper() {
  const a4Ratio = 1.4142; // height = width * ratio

  // paper width based on screen size
  let paperW = width * 0.6;
  let paperH = paperW * a4Ratio;

  // if too tall for screen, scale down
  if (paperH > height * 0.85) {
    paperH = height * 0.85;
    paperW = paperH / a4Ratio;
  }

  // center the paper
  const x = (width - paperW) / 2;
  const y = (height - paperH) / 2;

  // draw the paper
  fill(255);
  noStroke();
  rect(x, y, paperW, paperH, 6);

  // stave lines
  drawStaves(x, y, paperW, paperH);
}


function drawStaves(x, y, paperW, paperH) {
  const topMargin = 120;
  const bottomMargin = 80;
  const staveAreaHeight = paperH - topMargin - bottomMargin;

  const numStaves = 8;
  const staveSpacing = staveAreaHeight / numStaves;

  const lineSpacing = 5;     // space between the 5 lines of each stave
  const lineLength = paperW * 0.85;
  const lineX = x + (paperW - lineLength) / 2;

  stroke(0);
  strokeWeight(1);

  for (let i = 0; i < numStaves; i++) {
    let staveY = y + topMargin + i * staveSpacing;

    for (let l = 0; l < 5; l++) {
      let yPos = staveY + l * lineSpacing;
      line(lineX, yPos, lineX + lineLength, yPos);
    }
  }
}
