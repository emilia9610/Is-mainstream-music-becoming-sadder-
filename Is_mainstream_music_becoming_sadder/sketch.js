function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  noLoop();
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
function draw() {
  background(245, 240, 230); // soft cream background
  drawTitle();
  drawA4Paper();
}

function drawTitle(){
  fill(0);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("is mainstream music becoming sadder?", width / 2, 40);
}

function drawA4Paper() {
  const a4Ratio = 1.4142; // height = width * ratio

  // paper width based on screen size
  let paperW = width * 0.6;
  let paperH = paperW * a4Ratio;

  // if too tall for screen, scale down
  // limit height so the paper does not cover the title
  if (paperH > height * 0.8) {
    paperH = height * 0.8;
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
