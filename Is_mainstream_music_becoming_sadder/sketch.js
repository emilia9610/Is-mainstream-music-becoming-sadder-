let dataset;

function preload(){
dataset = loadTable("top10s2.csv", "header");}

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
  noStroke();
  fill(0);
  textFont("Georgia, serif");
  textSize(28);
  textStyle(ITALIC);
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

  //shadow around the paper
  drawingContext.shadowOffsetX = 4;
  drawingContext.shadowOffsetY = 4;
  drawingContext.shadowBlur    = 25;
  drawingContext.shadowColor = "rgba(0, 0, 0, 0.25)";

  // draw the paper
  fill(255);
  noStroke();
  rect(x, y, paperW, paperH, 6);

  // stave lines
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur    = 0;
  drawingContext.shadowColor   = "rgba(0, 0, 0, 0)";


  drawStaves(x, y, paperW, paperH);
  drawDots(x, y, paperW, paperH);

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
function drawDots (x,y, paperW, paperH){
  let topMargin = 120;
  let lineSpacing = 5;
  let lineLength = paperW * 0.85;
  let lineX = x + (paperW - lineLength) / 2;

  // valence score from the first row of the CSV aka test
  let val = dataset.getNum(0, "val");

  // top and bottom of the first stave's 5 lines
  // y-position of the top stave line
  let staveTop = y + topMargin;
  // bottom stave line (4 gaps = 5 lines)
  let staveBot = staveTop + 4 * lineSpacing; 

  let dotX = lineX + lineLength * 0.5;
  // place the dot horizontally in the centre of the stave
  let dotY = map(val, 0, 100, staveBot, staveTop);

  noStroke();
  fill(0);
  circle(dotX, dotY, 6);
}
