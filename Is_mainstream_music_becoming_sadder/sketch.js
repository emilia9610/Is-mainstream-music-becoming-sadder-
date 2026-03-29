let dataset;
let dots = []; //stores eacg dot's position and song information for hover detection

function preload() {
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
// triggers a single redeaw everytime the mouse moves so hover is detected
function mouseMoved() {
  redraw();
}

function draw() {
  background(245, 240, 230); // soft cream background
  drawTitle();
  drawA4Paper();
}

function drawTitle() {
  noStroke();
  fill(0);
  textFont("Georgia, serif");
  textSize(28);
  textStyle(ITALIC);
  textAlign(CENTER, CENTER);
  text("is mainstream music becoming sadder?", width / 2, 40);
}

function drawA4Paper() {
  let a4Ratio = 1.4142; // height = width * ratio

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
  let x = (width - paperW) / 2;
  let y = (height - paperH) / 2;

  // shadow around the paper
  drawingContext.shadowOffsetX = 4;
  drawingContext.shadowOffsetY = 4;
  drawingContext.shadowBlur    = 25;
  drawingContext.shadowColor   = "rgba(0, 0, 0, 0.25)";

  // draw the paper
  fill(255);
  noStroke();
  rect(x, y, paperW, paperH, 6);

  // reset shadow for the content
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur    = 0;
  drawingContext.shadowColor   = "rgba(0, 0, 0, 0)";

  drawStaves(x, y, paperW, paperH);
  drawDots(x, y, paperW, paperH);
}

function drawStaves(x, y, paperW, paperH) {
  let topMargin = 120;
  let bottomMargin = 80;
  let staveAreaHeight = paperH - topMargin - bottomMargin;

  let numStaves = 10; // one per year (2010-2019)
  let staveSpacing = staveAreaHeight / numStaves;

  let lineSpacing = 5;     // space between the 5 lines of each stave
  let lineLength = paperW * 0.85;
  let lineX = x + (paperW - lineLength) / 2;

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

// (2010-2019) with up to 10 valence values each
function buildYearSongs() {
  let years = [];
  for (let yr = 2010; yr <= 2019; yr++) {
    years.push({ year: yr, songs: [] });
  }

  // rows in the loaded CSV
  let rows = dataset.getRowCount();
  for (let r = 0; r < rows; r++) {
    let rowYear = dataset.getNum(r, "year");
    let val     = dataset.getNum(r, "val");
    let title   = dataset.getString(r, "title");
    let artist  = dataset.getString(r, "artist");

    // search the years for the matching year using yearIndex
    for (let yearIndex = 0; yearIndex < years.length; yearIndex++) {
      if (years[yearIndex].year === rowYear) {
        // 10 songs per year
        if (years[yearIndex].songs.length < 10) {
          years[yearIndex].songs.push({ val, title, artist });
        }
        break; // stop searching once found
      }
    }
  }

  return years;
}

function drawDots(x, y, paperW, paperH) {
  // per-year from the loaded CSV
  let yearData = buildYearSongs();

  let topMargin = 120;
  let bottomMargin = 80;
  let staveAreaHeight = paperH - topMargin - bottomMargin;

  let numStaves = 10;
  let staveSpacing = staveAreaHeight / numStaves;

  let lineSpacing = 5;
  let lineLength = paperW * 0.85;
  let lineX = x + (paperW - lineLength) / 2;
// clear dots array
  dots = [];

  for (let i = 0; i < yearData.length; i++) {
    let year  = yearData[i].year;
    let songs = yearData[i].songs;

    let staveTop = y + topMargin + i * staveSpacing;
    let staveBot = staveTop + 4 * lineSpacing;

    // iterate songs using songIndex and center segment position
    for (let songIndex = 0; songIndex < songs.length; songIndex++) {
      // center each dot across the stave
      let segmentCenter = (songIndex + 0.5) / songs.length;
      let dotX = lineX + lineLength * segmentCenter;
      // map valence 0-100 to vertical position between bottom and top stave lines
      let dotY = map(songs[songIndex].val, 0, 100, staveBot, staveTop);

      noStroke();
      fill(0);
      circle(dotX, dotY, 6);
      // save dot information for hover detection
      dots.push({
        x: dotX,
        y: dotY,
        title: songs[songIndex].title,
        artist: songs[songIndex].artist,
        val: songs[songIndex].val
      });
    }

    // year
    textFont("Georgia, serif");
    textSize(7);
    textStyle(NORMAL);
    textAlign(RIGHT, CENTER);
    fill(0);
    text(year, lineX - 6, staveTop + 2 * lineSpacing);
  }

  drawTooltip();
}
// if mouse is within 8px of the dot centre
function drawTooltip() {
  for (let i = 0; i < dots.length; i++) {
    let d = dots[i];

    if (dist(mouseX, mouseY, d.x, d.y) < 8) {
      let tooltipW = 160;
      let tooltipH = 44;
      let padding  = 8;

      // keep tool tip inside the canvas
      let tx = d.x + 10;
      let ty = d.y - tooltipH - 6;
      if (tx + tooltipW > width) tx = d.x - tooltipW - 10;
      if (ty < 0)                ty = d.y + 10;

      // pop up shadow
      drawingContext.shadowOffsetX = 2;
      drawingContext.shadowOffsetY = 2;
      drawingContext.shadowBlur    = 8;
      drawingContext.shadowColor   = "rgba(0, 0, 0, 0.18)";

      // tool tip box
      fill(255, 253, 248);
      stroke(200);
      strokeWeight(0.8);
      rect(tx, ty, tooltipW, tooltipH, 4);

      // reset shadow
      drawingContext.shadowBlur  = 0;
      drawingContext.shadowColor = "rgba(0, 0, 0, 0)";

      // song title
      noStroke();
      fill(20);
      textFont("Georgia, serif");
      textSize(8.5);
      textStyle(BOLD);
      textAlign(LEFT, TOP);
      text(d.title, tx + padding, ty + padding);

      // artist
      textStyle(ITALIC);
      fill(100);
      textSize(7.5);
      text(d.artist, tx + padding, ty + padding + 14);

      // valence score
      textStyle(NORMAL);
      fill(150);
      textSize(7);
      text("valence: " + d.val, tx + padding, ty + padding + 26);

      break;
    }
  }
}