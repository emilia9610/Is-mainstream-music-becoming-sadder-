let dataset;
let dots = []; //stores each dot's position and song information for hover detection

function preload() {
  dataset = loadTable("1960_2025.csv", "header");
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  noLoop();
}

function windowResized() {
  // if the browser window changes size, resize the canvas to match
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

  drawLegend(x, y, paperW);
  drawStaves(x, y, paperW, paperH);
  drawDots(x, y, paperW, paperH);
}

// draws a small legend explaining green = happy, red = sad
function drawLegend(x, y, paperW) {
  let lineX = x + (paperW - paperW * 0.85) / 2;

  noStroke();
  textFont("Georgia, serif");
  textSize(8);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);

  // green upturned symbol
  fill(60, 140, 80);
  text("▲ score > 50 (happier song)", lineX, y + 78);

  // red downturned symbol
  fill(180, 50, 50);
  text("▼ score < 50 (sadder song)", lineX + 160, y + 78);

  // brief note about the formula
  fill(140);
  textSize(7.5);
  textStyle(ITALIC);
  text("score based on Russell's Circumplex Model (1980)·higher on stave = happier", lineX, y + 92);
  textStyle(NORMAL);
}

function drawStaves(x, y, paperW, paperH) {
  let topMargin = 110;
  let bottomMargin = 60;
  let staveAreaHeight = paperH - topMargin - bottomMargin;

  // 7 staves, one per decade: 60s, 70s, 80s, 90s, 00s, 10s, 20s
  let numStaves = 7;
  let staveSpacing = staveAreaHeight / numStaves;

  // each stave has 5 lines spaced 6px apart
  let lineSpacing = 6;
  let lineLength = paperW * 0.85;
  let lineX = x + (paperW - lineLength) / 2;

  stroke(0);
  strokeWeight(0.8);

  for (let i = 0; i < numStaves; i++) {
    let staveY = y + topMargin + i * staveSpacing;
    for (let l = 0; l < 5; l++) {
      let yPos = staveY + l * lineSpacing;
      line(lineX, yPos, lineX + lineLength, yPos);
    }
  }
}

// Russell's Circumplex Model happiness score
// combines 6 audio features weighted by their relevance to emotional valence:
//   val   × 0.40  — spotify's direct happiness measure (most reliable)
//   dnce  × 0.20  — danceability: upbeat songs = happier
//   nrgy  × 0.10  — energy: maps to arousal axis of Russell's model
//   bpm   × 0.05  — tempo: faster = happier, normalised 60–200  0–100
//   acous × 0.15  — acousticness inverted: acoustic = more emotionally raw/sad
//   key   × 0.10  — major key = 100 (happy), minor key = 0 (sad)
// weights sum to 1.0 = output always 0–100
function calcScore(val, nrgy, dnce, acous, keyStr, bpm) {
  // major = happy (100), minor = sad (0), unknown = neutral (50)
  let keyScore = 50;
  if (keyStr && keyStr.trim() !== "") {
    keyScore = keyStr.toLowerCase().includes("minor") ? 0 : 100;
  }

  // invert acousticness — high acoustic = sadder, so we flip it
  let acoustInverted = 100 - acous;

  // normalise BPM: 60 = slowest/saddest, 200 = fastest/happiest
  let normBPM = constrain(map(bpm, 60, 200, 0, 100), 0, 100);

  return (val            * 0.40)
       + (dnce           * 0.20)
       + (nrgy           * 0.10)
       + (normBPM        * 0.05)
       + (acoustInverted * 0.15)
       + (keyScore       * 0.10);
}

// rows in the loaded CSV (1960s–2010s), up to 10 songs per decade
function buildDecadeSongs() {
  let decades = [
    { label: "1960s", start: 1960, end: 1969, songs: [] },
    { label: "1970s", start: 1970, end: 1979, songs: [] },
    { label: "1980s", start: 1980, end: 1989, songs: [] },
    { label: "1990s", start: 1990, end: 1999, songs: [] },
    { label: "2000s", start: 2000, end: 2009, songs: [] },
    { label: "2010s", start: 2010, end: 2019, songs: [] },
    { label: "2020s", start: 2020, end: 2029, songs: [] },
  ];

  let rows = dataset.getRowCount();
  let currentChartDecade = -1;

  for (let r = 0; r < rows; r++) {
    let title  = dataset.getString(r, 1);  // title
    let artist = dataset.getString(r, 2);  // artist
    let yr     = dataset.getString(r, 4);  // year
    let keyStr = dataset.getString(r, 5);  // key
    let bpmStr = dataset.getString(r, 6);  // bpm
    let nrgStr = dataset.getString(r, 7);  // energy
    let dncStr = dataset.getString(r, 8);  // danceability
    let valStr = dataset.getString(r, 11); // valence
    let acoStr = dataset.getString(r, 13); // acousticness

    // detect decade header rows (e.g. title="1960", year="")
    if (title && title.match(/^\d{4}$/) && (!yr || yr.trim() === "")) {
      currentChartDecade = int(title);
      continue;
    }

    // skip rows with missing data
    if (!title || !valStr || valStr.trim() === "" || !yr || yr.trim() === "") continue;

    let rowYear = int(yr);
    let val     = int(valStr);
    if (rowYear < 1950 || rowYear > 2030 || isNaN(val)) continue;

    // default missing features to neutral 50 so the formula still works
    let nrgy = (nrgStr && nrgStr.trim() !== "") ? int(nrgStr) : 50;
    let dnce = (dncStr && dncStr.trim() !== "") ? int(dncStr) : 50;
    let acou = (acoStr && acoStr.trim() !== "") ? int(acoStr) : 50;
    let bpm  = (bpmStr && bpmStr.trim() !== "") ? float(bpmStr) : 120;

    // calculate happiness score using Russell's model
    let score = calcScore(val, nrgy, dnce, acou, keyStr, bpm);

    let groupYear = (currentChartDecade > 0) ? currentChartDecade : rowYear;
    let decade    = floor(groupYear / 10) * 10;

    if (decade < 1960 || decade > 2020) continue;

    for (let d = 0; d < decades.length; d++) {
      if (decade === decades[d].start) {
        if (decades[d].songs.length < 10) {
          // store score + all individual values for the tooltip breakdown
          decades[d].songs.push({
            score, val, nrgy, dnce, acou,
            bpm: round(bpm), key: keyStr,
            title, artist
          });
        }
        break; // stop searching once found
      }
    }
  }

  return decades;
}

function drawDots(x, y, paperW, paperH) {
  let decadeData = buildDecadeSongs();

  let topMargin = 110;
  let bottomMargin = 60;
  let staveAreaHeight = paperH - topMargin - bottomMargin;

  let numStaves = 7;
  let staveSpacing = staveAreaHeight / numStaves;

  let lineSpacing = 6;
  let lineLength = paperW * 0.85;
  let lineX = x + (paperW - lineLength) / 2;

  // clear dots array
  dots = [];

  for (let i = 0; i < decadeData.length; i++) {
    let label = decadeData[i].label;
    let songs = decadeData[i].songs;

    // top and bottom of this stave's 5 lines
    let staveTop = y + topMargin + i * staveSpacing;
    let staveBot = staveTop + 4 * lineSpacing;

    for (let songIndex = 0; songIndex < songs.length; songIndex++) {
      let s = songs[songIndex];

      // center each dot across the stave
      let segmentCenter = (songIndex + 0.5) / songs.length;
      let noteX = lineX + lineLength * segmentCenter;

      // map happiness SCORE (not raw val) to vertical position on stave
      // high score = near top (happier), low score = near bottom (sadder)
      let noteY = map(s.score, 0, 100, staveBot, staveTop);

      // green if score >= 50 (happier), red if below (sadder)
      let isHappy   = s.score >= 50;
      let noteColor = isHappy ? color(55, 130, 70) : color(175, 45, 45);

      // draw the dot (notehead + stem)
      drawDot(noteX, noteY, isHappy, noteColor, lineSpacing);

      // save position and song info for hover tooltip
      dots.push({
        x: noteX, y: noteY,
        title: s.title, artist: s.artist,
        score: round(s.score),
        val: s.val, nrgy: s.nrgy,
        dnce: s.dnce, acou: s.acou,
        bpm: s.bpm, key: s.key
      });
    }

    // decade label on the left of each stave
    noStroke();
    fill(0);
    textFont("Georgia, serif");
    textSize(8);
    textStyle(BOLD);
    textAlign(RIGHT, CENTER);
    text(label, lineX - 8, staveTop + 2 * lineSpacing);
  }

  drawTooltip();
}

// draws a single dot (filled oval notehead + stem)
// isHappy = true, stem goes up (upturned)
// isHappy = false, stem goes down (downturned)
function drawDot(nx, ny, isHappy, noteColor, lineSpacing) {
  let stemLength = lineSpacing * 3.5; // length of the stem
  let headW      = lineSpacing * 1.3; // notehead width
  let headH      = lineSpacing * 0.9; // notehead height

  // draw notehead, filled oval, slightly tilted
  push();
  translate(nx, ny);
  rotate(-PI / 10); // slight tilt like a real notehead
  noStroke();
  fill(noteColor);
  ellipse(0, 0, headW, headH);
  pop();

  // draw stem
  stroke(noteColor);
  strokeWeight(1.5);
  if (isHappy) {
    // upturned stem — goes up from right side of notehead
    line(nx + headW * 0.4, ny - headH * 0.2, nx + headW * 0.4, ny - stemLength);
  } else {
    // downturned stem — goes down from left side of notehead
    line(nx - headW * 0.4, ny + headH * 0.2, nx - headW * 0.4, ny + stemLength);
  }

  noStroke();
}

// shows tooltip when mouse is within 10px of a dot
function drawTooltip() {
  for (let i = 0; i < dots.length; i++) {
    let d = dots[i];

    if (dist(mouseX, mouseY, d.x, d.y) < 10) {
      let tooltipW = 185;
      let tooltipH = 105;
      let padding  = 8;

      // position tooltip, flip if too close to edge
      let tx = d.x + 12;
      let ty = d.y - tooltipH - 6;
      if (tx + tooltipW > width) tx = d.x - tooltipW - 12;
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
      text(d.artist, tx + padding, ty + padding + 13);

      // combined score
      let isHappy = d.score >= 50;
      textStyle(NORMAL);
      fill(isHappy ? color(55, 130, 70) : color(175, 45, 45));
      textSize(7.5);
      text("score: " + d.score + "  (" + (isHappy ? "happier ▲" : "sadder ▼") + ")",
           tx + padding, ty + padding + 27);

      // feature breakdown
      fill(140);
      textSize(7);
      text("val: " + d.val + "   energy: " + d.nrgy + "   dance: " + d.dnce + "   bpm: " + d.bpm,
           tx + padding, ty + padding + 42);

      // acousticness
      text("acoustic: " + d.acou, tx + padding, ty + padding + 54);

      // key — green if major, red if minor
      let keyCol = d.key && d.key.toLowerCase().includes("minor")
                   ? color(175, 45, 45) : color(55, 130, 70);
      fill(keyCol);
      text("key: " + (d.key || "unknown"), tx + padding, ty + padding + 66);

      // model credit
      fill(190);
      textSize(6);
      textStyle(ITALIC);
      text("Russell's Circumplex Model (1980)", tx + padding, ty + padding + 80);

      break;
    }
  }
}