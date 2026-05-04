let dataset;
let dots        = []; // stave page dots
let scatterDots = []; // scatter page dots

// page state
// "stave"   = main stave overview (page 1)
// "scatter" = scatter plot per decade (page 2)
let currentPage = "stave";

// nav button regions 
let navScatter = { x: 0, y: 0, w: 150, h: 28 };
let navBack    = { x: 30, y: 30, w: 130, h: 28 };

// side panel state for scatter page
// opens when a decade title is clicked
let panelOpen   = false;
let panelDecade = null;
let panelX      = null;
let panelTarget = null;
let panelW      = 300;

// decade descriptions written by amina
let decadeDescriptions = {
  "1960s": {
    title: "60s — Sunshine With a Few Clouds",
    lines: [
      "There is a strong cluster of happy, high",
      "energy tracks driven by the likes of the",
      "Beatles and Elvis Presley.",
      "Rock N Roll takes the cake here!",
      "",
      "This could be the post-war optimism",
      "coming through.",
      "",
      "The less dense cluster of mellow tracks",
      "are still noticeable, led by a more",
      "soulful and bluesy vibe.",
      "",
      "Is this introspection emerging in an",
      "otherwise happy soundscape?"
    ]
  },
  "1970s": {
    title: "70s — The Storm After the Calm?",
    lines: [
      "Looks like there's a dip in valence…",
      "but the energy is maintained.",
      "",
      "There's anti-war sentiment from John",
      "Lennon and Creedence Clearwater Revival.",
      "",
      "Sad emotions and yearning from the",
      "love songs of the era pull the mood lower.",
      "",
      "However, more genre emergences are",
      "clear from the wider dispersion of dots."
    ]
  },
  "1980s": {
    title: "80s — Neon Outfits... and Music Too",
    lines: [
      "Both high valence and energy seem",
      "to dominate here.",
      "",
      "Queen were obviously the trailblazers",
      "of energetic rock anthems.",
      "",
      "This is perhaps expected. The 80s is",
      "known for its commercial flamboyance",
      "and technological optimism.",
      "",
      "Music here seemed to be a highly",
      "energised and polished form of escapism.",
      "The 80s is notorious for its many",
      "economic and social justice issues."
    ]
  },
  "1990s": {
    title: "90s — Angsty Teen Phase?",
    lines: [
      "The clear rise in sad but relatively",
      "energetic tracks could reflect the 90s",
      "popular grunge and alternative era.",
      "",
      "We also witness hip-hop's mostly happy",
      "rise to the mainstream through Kriss Kross,",
      "Will Smith and Coolio.",
      "",
      "This is the first decade where sad but",
      "upbeat prevails in the mainstream.",
      "Is this rebellion speaking?"
    ]
  },
  "2000s": {
    title: "00s — Musical Synergy",
    lines: [
      "Looks like a landslide return to both",
      "high valence and energy, but with lots",
      "of tracks sitting at the midpoint.",
      "",
      "This was the rise of highly produced",
      "commercial pop and hip-hop from artists",
      "like Britney Spears, Madonna and Eminem.",
      "",
      "The mix of emotions reflect this era's",
      "digital transition and globalisation,",
      "including Enrique Iglesias' 'Hero'."
    ]
  },
  "2010s": {
    title: "10s — Melancholic Headbangers",
    lines: [
      "Low valence and high energy seems to",
      "be popular again, with pop and hip-hop",
      "still in the lead.",
      "",
      "This is the era where music streaming",
      "took over — the era Gen Z grew up on.",
      "It's pretty sad, right?",
      "",
      "This emotional distance surely reflects",
      "the anxiety-riddled effects of social",
      "media, hyperconnectivity and the economy."
    ]
  },
  "2020s": {
    title: "20s — It's Doomsday... Let's Dance!",
    lines: [
      "A more present day look into the 2020s",
      "reveals that low valence dominance",
      "prevailed.",
      "",
      "Yet again pop and hip-hop leads.",
      "However energy seems to diminish.",
      "",
      "This must be the introspection of the",
      "infamous pandemic era — the unpredictability",
      "of what was to come for the world meant",
      "more mellow sadness persisted."
    ]
  }
};

// clickable decade title regions on scatter page
let decadeTitleRegions = [];

function preload() {
  dataset = loadTable("1960_2025.csv", "header");
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.querySelector("main"));
  frameRate(60);
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
  background(255, 252, 235); // soft cream background

  if (currentPage === "stave") {
    drawTitle();
    drawA4Paper();
    drawNavButton();
  } else if (currentPage === "scatter") {
    drawScatterPage();
    animatePanel();
    if (panelX !== null) drawSidePanel();
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
  // major = happy (100)
  // minor = sad (0)
  // unknown = neutral (50)
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

// groups top 10 songs per decade — 1960s through 2020s
// uses currentChartDecade from header rows to group songs correctly
function buildDecadeSongs() {
  let decades = [
    { label: "1960s", start: 1960, songs: [], allSongs: [] },
    { label: "1970s", start: 1970, songs: [], allSongs: [] },
    { label: "1980s", start: 1980, songs: [], allSongs: [] },
    { label: "1990s", start: 1990, songs: [], allSongs: [] },
    { label: "2000s", start: 2000, songs: [], allSongs: [] },
    { label: "2010s", start: 2010, songs: [], allSongs: [] },
    { label: "2020s", start: 2020, songs: [], allSongs: [] },
  ];

  let rows = dataset.getRowCount();
  let currentChartDecade = -1;

  for (let r = 0; r < rows; r++) {
    let title  = dataset.getString(r, 1);  // title column
    let artist = dataset.getString(r, 2);  // artist column
    let yr     = dataset.getString(r, 4);  // year column
    let keyStr = dataset.getString(r, 5);  // key
    let bpmStr = dataset.getString(r, 6);  // bpm
    let nrgStr = dataset.getString(r, 7);  // energy
    let dncStr = dataset.getString(r, 8);  // danceability
    let valStr = dataset.getString(r, 11); // valence
    let acoStr = dataset.getString(r, 13); // acousticness

    // detect header rows e.g. title="2020", year="" means 2020s section starts
    if (title && title.match(/^\d{4}$/) && (!yr || yr.trim() === "")) {
      currentChartDecade = int(title);
      continue;
    }

    // skip rows with missing title, year or valence
    if (!title || !valStr || valStr.trim() === "" || !yr || yr.trim() === "") continue;

    let rowYear = int(yr);
    let val     = int(valStr);
    if (rowYear < 1950 || rowYear > 2030 || isNaN(val)) continue;

    // default missing features to neutral 50 so the formula still works
    let nrgy = (nrgStr && nrgStr.trim() !== "") ? int(nrgStr)   : 50;
    let dnce = (dncStr && dncStr.trim() !== "") ? int(dncStr)   : 50;
    let acou = (acoStr && acoStr.trim() !== "") ? int(acoStr)   : 50;
    let bpm  = (bpmStr && bpmStr.trim() !== "") ? float(bpmStr) : 120;

    let score = calcScore(val, nrgy, dnce, acou, keyStr, bpm);

    // use chart section decade from header, fall back to release year decade
    let groupYear = (currentChartDecade > 0) ? currentChartDecade : rowYear;
    let decade    = floor(groupYear / 10) * 10;

    // include all decades 1960–2020
    if (decade < 1960 || decade > 2020) continue;

    let song = { score, val, nrgy, dnce, acou, bpm: round(bpm), key: keyStr, title, artist };

    for (let d = 0; d < decades.length; d++) {
      if (decade === decades[d].start) {
        if (decades[d].songs.length < 10) decades[d].songs.push(song); // top 10 for stave
        decades[d].allSongs.push(song);  // all songs for scatter
        break;
      }
    }
  }

  return decades;
}

// Russell quadrant colour
// maps val + nrgy onto Russell's four emotional quadrants
// val >= 50 + nrgy >= 50 = happy & energetic = golden yellow
// val >= 50 + nrgy <  50 = happy & calm      = teal green
// val <  50 + nrgy >= 50 = sad & energetic   = burnt orange
// val <  50 + nrgy <  50 = sad & calm        = deep purple
function getMoodColor(val, nrgy) {
  if (val >= 50 && nrgy >= 50) return color(210, 165, 25);  // happy & energetic
  if (val >= 50 && nrgy <  50) return color(50,  145, 110); // happy & calm
  if (val <  50 && nrgy >= 50) return color(195,  75, 35);  // sad & energetic
  return                              color(90,   60, 150);  // sad & calm
}

function getMoodLabel(val, nrgy) {
  if (val >= 50 && nrgy >= 50) return "happy & energetic";
  if (val >= 50 && nrgy <  50) return "happy & calm";
  if (val <  50 && nrgy >= 50) return "sad & energetic";
  return                              "sad & calm";
}

// PAGE 1
// STAVE
function drawTitle() {
  noStroke();
  fill(0);
  textFont("Georgia, serif");
  textSize(28);
  textStyle(ITALIC);
  textAlign(CENTER, CENTER);
  text("is mainstream music becoming sadder?", width / 2, 40);
}

// navigation button to scatter page
// bottom right
function drawNavButton() {
  navScatter.x = width - navScatter.w - 30;
  navScatter.y = height - navScatter.h - 20;

  fill(30, 60, 120);
  stroke(30, 60, 120);
  strokeWeight(1);
  rect(navScatter.x, navScatter.y, navScatter.w, navScatter.h, 14);

  fill(255);
  textFont("Georgia, serif");
  textSize(15);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  text("scatter plots →", navScatter.x + navScatter.w / 2, navScatter.y + navScatter.h / 2);
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
  textSize(12);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);

  // green upturned symbol
  fill(60, 140, 80);
  text("▲ score > 50 (happier song)", lineX, y + 60);

  // red downturned symbol
  fill(180, 50, 50);
  text("▼ score < 50 (sadder song)", lineX + 160, y + 60);

  // brief note about the formula
  fill(140);
  textSize(7.5);
  textStyle(ITALIC);
  text("score based on Russell's Circumplex Model (1980) higher on stave = happier", lineX, y + 80);
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

  drawTooltipStave();
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
function drawTooltipStave() {
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
      textSize(11);
      textStyle(BOLD);
      textAlign(LEFT, TOP);
      text(d.title, tx + padding, ty + padding);

      // artist
      textStyle(ITALIC);
      fill(100);
      textSize(10);
      text(d.artist, tx + padding, ty + padding + 13);

      // combined score
      let isHappy = d.score >= 50;
      textStyle(NORMAL);
      fill(isHappy ? color(55, 130, 70) : color(175, 45, 45));
      textSize(10);
      text("score: " + d.score + "  (" + (isHappy ? "happier ▲" : "sadder ▼") + ")",
           tx + padding, ty + padding + 30);

      // feature breakdown
      fill(140);
      textSize(9);
      text("val: " + d.val + "   energy: " + d.nrgy + "   dance: " + d.dnce + "   bpm: " + d.bpm,
           tx + padding, ty + padding + 48);

      // acousticness
      text("acoustic: " + d.acou, tx + padding, ty + padding + 62);

      // key — green if major, red if minor
      let keyCol = d.key && d.key.toLowerCase().includes("minor")
                   ? color(175, 45, 45) : color(55, 130, 70);
      fill(keyCol);
      text("key: " + (d.key || "unknown"), tx + padding, ty + padding + 76);

      // model credit
      fill(190);
      textSize(8);
      textStyle(ITALIC);
      text("Russell's Circumplex Model (1980)", tx + padding, ty + padding + 100);

      break;
    }
  }
}
// PAGE 2
// SCATTER GRAPHS
function drawScatterPage() {
  let decadeData = buildDecadeSongs();
  scatterDots         = []; // clear scatter dots each frame
  decadeTitleRegions  = []; // clear clickable title regions each frame

  // back button
  fill(30, 60, 120);
  stroke(30, 60, 120);
  strokeWeight(1);
  rect(navBack.x, navBack.y, navBack.w, navBack.h, 14);

  fill(255);
  textFont("Georgia, serif");
  textSize(15);
  textStyle(NORMAL);
  textAlign(CENTER, CENTER);
  text("← stave view", navBack.x + navBack.w / 2, navBack.y + navBack.h / 2);

  // page title 
  noStroke();
  fill(20);
  textSize(20);
  textStyle(ITALIC);
  textAlign(LEFT, CENTER);
  text("deeper dive — valence vs energy per decade", navBack.x + navBack.w + 18, navBack.y + 14);

  // mood colour key
  let keyX = width - 260;
  let keyY = navBack.y + 4;

  noStroke();
  textFont("Georgia, serif");
  textSize(12);
  textStyle(NORMAL);
  textAlign(LEFT, CENTER);

  fill(210, 165, 25);  circle(keyX,       keyY + 6,  8);
  fill(50);            text("happy & energetic", keyX + 10, keyY + 6);
  fill(50, 145, 110);  circle(keyX + 130,  keyY + 6,  8);
  fill(50);            text("happy & calm",      keyX + 140, keyY + 6);
  fill(195, 75, 35);   circle(keyX,       keyY + 20, 8);
  fill(50);            text("sad & energetic",   keyX + 10, keyY + 20);
  fill(90, 60, 150);   circle(keyX + 130,  keyY + 20, 8);
  fill(50);            text("sad & calm",        keyX + 140, keyY + 20);

  // 7 scatter plots in a grid
  // 4 top row, 3 bottom row 
  let pad   = 35;
  let topY  = 80;
  let cols  = 4;
  let gapX  = 18;
  let gapY  = 45;
  let cellW = (width - pad * 2 - gapX * (cols - 1)) / cols;
  let cellH = (height - topY - pad - gapY) / 2;

  for (let i = 0; i < decadeData.length; i++) {
    let col   = i % cols;
    let row   = floor(i / cols);
    let plotX = pad + col * (cellW + gapX);
    let plotY = topY + row * (cellH + gapY);

    drawScatterPlot(plotX, plotY, cellW, cellH,
    decadeData[i].label, decadeData[i].allSongs);
  }

  // scatter tooltip
  drawTooltipScatter();
}

function drawScatterPlot(px, py, pw, ph, label, songs) {
  let innerPad = 28; // space for axis labels
  let plotX    = px + innerPad;
  let plotY    = py + 18;
  let plotW    = pw - innerPad - 8;
  let plotH    = ph - 18 - 18;

  // plot background with subtle shadow
  drawingContext.shadowOffsetX = 2;
  drawingContext.shadowOffsetY = 2;
  drawingContext.shadowBlur    = 8;
  drawingContext.shadowColor   = "rgba(0,0,0,0.08)";
  fill(255, 253, 248);
  noStroke();
  rect(plotX, plotY, plotW, plotH, 4);
  drawingContext.shadowBlur  = 0;
  drawingContext.shadowColor = "rgba(0,0,0,0)";

  // decade title
  // clickable, turns purple on hover
  let titleHov = mouseX > plotX && mouseX < plotX + plotW &&
                 mouseY > plotY - 16 && mouseY < plotY;
  let isOpen   = panelOpen && panelDecade === label;

  noStroke();
  fill((titleHov || isOpen) ? color(100, 80, 180) : 25);
  textFont("Georgia, serif");
  textSize(10);
  textStyle(BOLD);
  textAlign(LEFT, BOTTOM);
  text(label, plotX, plotY - 3);

  // underline when hovered or panel open for this decade
  if (titleHov || isOpen) {
    let tw = textWidth(label);
    stroke(100, 80, 180);
    strokeWeight(0.8);
    line(plotX, plotY - 2, plotX + tw, plotY - 2);
  }

  // store clickable region for mousePressed
  decadeTitleRegions.push({
    label,
    x: plotX, y: plotY - 16,
    w: plotW, h: 16
  });

  // quadrant crosshair
  // valence = 50, 
  // energy = 50
  let midX = map(50, 0, 100, plotX, plotX + plotW);
  let midY = map(50, 0, 100, plotY + plotH, plotY);

  stroke(215);
  strokeWeight(0.7);
  drawingContext.setLineDash([4, 5]);
  line(midX, plotY, midX, plotY + plotH);
  line(plotX, midY, plotX + plotW, midY);
  drawingContext.setLineDash([]);

  // quadrant corner labels
  noStroke();
  textFont("Georgia, serif");
  textSize(6);
  textStyle(ITALIC);
  fill(200);
  textAlign(LEFT,  TOP);    text("happy\nenerge-\ntic",   plotX + 3,          plotY + 3);
  textAlign(RIGHT, TOP);    text("sad\nenerge-\ntic",     plotX + plotW - 3,   plotY + 3);
  textAlign(LEFT,  BOTTOM); text("happy\ncalm",           plotX + 3,          plotY + plotH - 3);
  textAlign(RIGHT, BOTTOM); text("sad\ncalm",             plotX + plotW - 3,   plotY + plotH - 3);
  textStyle(NORMAL);

  // axis ticks
  stroke(210);
  strokeWeight(0.5);
  fill(160);
  textSize(6);
  textAlign(CENTER, TOP);
  for (let v = 0; v <= 100; v += 50) {
    let tx = map(v, 0, 100, plotX, plotX + plotW);
    line(tx, plotY + plotH, tx, plotY + plotH + 3);
    noStroke();
    text(v, tx, plotY + plotH + 4);
    stroke(210);
  }
  textAlign(RIGHT, CENTER);
  for (let e = 0; e <= 100; e += 50) {
    let ty = map(e, 0, 100, plotY + plotH, plotY);
    line(plotX - 3, ty, plotX, ty);
    noStroke();
    text(e, plotX - 4, ty);
    stroke(210);
  }

  // axis labels
  noStroke();
  fill(150);
  textSize(6);
  textStyle(ITALIC);
  textAlign(CENTER, TOP);
  text("valence →", plotX + plotW / 2, plotY + plotH + 12);

  push();
  translate(plotX - 20, plotY + plotH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("energy →", 0, 0);
  pop();
  textStyle(NORMAL);

  // plot border
  stroke(195);
  strokeWeight(0.7);
  noFill();
  rect(plotX, plotY, plotW, plotH, 4);

  // dots
  // coloured by Russell mood quadrant
  // dot size scales with danceability — more danceable = bigger dot
  for (let i = 0; i < songs.length; i++) {
    let s      = songs[i];
    let sx     = map(s.val,  0, 100, plotX, plotX + plotW);
    let sy     = map(s.nrgy, 0, 100, plotY + plotH, plotY);
    let dotCol = getMoodColor(s.val, s.nrgy);

    // dot size driven by danceability (5–12px range)
    let dotSize = map(s.dnce, 0, 100, 5, 12);

    let isHov = dist(mouseX, mouseY, sx, sy) < dotSize + 3;

    // glow on hover
    if (isHov) {
      noStroke();
      fill(red(dotCol), green(dotCol), blue(dotCol), 45);
      circle(sx, sy, dotSize * 3);
    }

    // main dot
    fill(dotCol);
    noStroke();
    circle(sx, sy, isHov ? dotSize * 1.5 : dotSize);

    // white glint
    fill(255, 255, 255, 120);
    circle(sx - dotSize * 0.18, sy - dotSize * 0.18, dotSize * 0.35);

    // store for tooltip
    scatterDots.push({
      x: sx, y: sy, dotSize,
      title: s.title, artist: s.artist,
      val: s.val, nrgy: s.nrgy,
      dnce: s.dnce, acou: s.acou,
      bpm: s.bpm, key: s.key,
      score: round(s.score),
      mood: getMoodLabel(s.val, s.nrgy)
    });
  }
}

// tooltip for scatter page
// shows all column info
function drawTooltipScatter() {
  for (let i = 0; i < scatterDots.length; i++) {
    let d = scatterDots[i];
    if (dist(mouseX, mouseY, d.x, d.y) < d.dotSize + 3) {
      let tooltipW = 220;
      let tooltipH = 145;
      let padding  = 8;

      let tx = d.x + 14;
      let ty = d.y - tooltipH - 8;
      if (tx + tooltipW > width)  tx = d.x - tooltipW - 14;
      if (ty < 0)                 ty = d.y + 14;
      if (ty + tooltipH > height) ty = height - tooltipH - 8;

      // tooltip shadow
      drawingContext.shadowOffsetX = 2;
      drawingContext.shadowOffsetY = 2;
      drawingContext.shadowBlur    = 10;
      drawingContext.shadowColor   = "rgba(0,0,0,0.18)";

      fill(255, 253, 248);
      stroke(200);
      strokeWeight(0.8);
      rect(tx, ty, tooltipW, tooltipH, 4);

      drawingContext.shadowBlur  = 0;
      drawingContext.shadowColor = "rgba(0,0,0,0)";

      // title
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
      text(d.artist, tx + padding, ty + padding + 18);

      // mood label
      // coloured by quadrant
      textStyle(NORMAL);
      fill(getMoodColor(d.val, d.nrgy));
      textSize(7.5);
      text("mood: " + d.mood, tx + padding, ty + padding + 35);

      // all columns
      fill(140);
      textSize(7);
      text("val: " + d.val + "   energy: " + d.nrgy + "   dance: " + d.dnce,
           tx + padding, ty + padding + 52);
      text("bpm: " + d.bpm + "   acoustic: " + d.acou,
           tx + padding, ty + padding + 66);

      // key
      let keyCol = d.key && d.key.toLowerCase().includes("minor")
                   ? color(175, 45, 45) : color(55, 130, 70);
      fill(keyCol);
      text("key: " + (d.key || "unknown"), tx + padding, ty + padding + 80);

      // score
      let isHappy = d.score >= 50;
      fill(isHappy ? color(55, 130, 70) : color(175, 45, 45));
      text("Russell score: " + d.score, tx + padding, ty + padding + 90);

      // dot size hint
      fill(180);
      textSize(6);
      textStyle(ITALIC);
      text("dot size = danceability", tx + padding, ty + padding + 108);

      break;
    }
  }
}

// side panel
// slides in from the right when a decade title is clicked
function animatePanel() {
  if (panelTarget === null) return;

  // lerp smoothly toward target position
  // smooth movement
  panelX = lerp(panelX, panelTarget, 0.12);

  // snap when close enough and stop looping
  if (abs(panelX - panelTarget) < 0.5) {
    panelX = panelTarget;
    if (!panelOpen) {
      panelX      = null;
      panelTarget = null;
    }
    noLoop();
  }
}

function openPanel(label) {
  panelOpen   = true;
  panelDecade = label;
  panelX      = panelX !== null ? panelX : width; // start off-screen right
  panelTarget = width - panelW;
  loop(); // start animation loop
}

function closePanel() {
  panelOpen   = false;
  panelDecade = null;
  panelTarget = width; // slide back off screen
}

function drawSidePanel() {
  let info = decadeDescriptions[panelDecade];
  if (!info) return;

  let pad = 22;
  let cx  = panelX + pad;

  // panel shadow
  drawingContext.shadowOffsetX = -4;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur    = 20;
  drawingContext.shadowColor   = "rgba(0,0,0,0.2)";

  // panel background
  fill(30 , 60, 120);
  noStroke();
  rect(panelX, 0, panelW, height);

  drawingContext.shadowBlur  = 0;
  drawingContext.shadowColor = "rgba(0,0,0,0)";

// close hint at the very top
noStroke();
fill(180, 210, 255);
textFont("Georgia, serif");
textSize(9);
textStyle(ITALIC);
textAlign(RIGHT, TOP);
text("click " + panelDecade + " again to close", panelX + panelW - pad, 10);

// decade heading below it
fill(220, 235, 255);textSize(18);
textStyle(ITALIC);
textAlign(LEFT, TOP);
text(info.title, cx, 36);

// divider line
stroke(80, 110, 180);
strokeWeight(0.8);
line(cx, 62, panelX + panelW - pad, 62);

// descriptive text
noStroke();
fill(220, 235, 255);
textFont("Georgia, serif");
textSize(15);
textStyle(NORMAL);
textAlign(LEFT, TOP);

let lineY = 72;
  let lineH = 15;

  for (let i = 0; i < info.lines.length; i++) {
    if (info.lines[i] === "") {
      lineY += 6; // blank line = small gap
    } else {
      text(info.lines[i], cx, lineY);
      lineY += lineH;
    }
  }
}

// navigation

function mousePressed() {
  if (currentPage === "stave") {
    // click scatter button → go to scatter page
    if (mouseX > navScatter.x && mouseX < navScatter.x + navScatter.w &&
        mouseY > navScatter.y && mouseY < navScatter.y + navScatter.h) {
      currentPage = "scatter";
      redraw();
    }
  } else if (currentPage === "scatter") {
    // click back button → go to stave page
    if (mouseX > navBack.x && mouseX < navBack.x + navBack.w &&
        mouseY > navBack.y && mouseY < navBack.y + navBack.h) {
      currentPage = "stave";
      closePanel();
      redraw();
      return;
    }

    // click decade title
    // open or close side panel
    for (let i = 0; i < decadeTitleRegions.length; i++) {
      let r = decadeTitleRegions[i];
      if (mouseX > r.x && mouseX < r.x + r.w &&
          mouseY > r.y && mouseY < r.y + r.h) {
        if (panelOpen && panelDecade === r.label) {
          closePanel();
        } else {
          openPanel(r.label);
        }
        return;
      }
    }
  }
}