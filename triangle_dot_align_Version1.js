let pos, vel, target;
let baseSize = 110;
let maxStretch = 50;
let maxSquash = 38;
let maxSkew = 0.45; // radians
let rot = 0;
let dotCornerIndex = 0; // which corner is marked (0, 1, or 2)

function setup() {
  createCanvas(600, 600);
  pos = createVector(width/2, height/2);
  vel = createVector(0, 0);
  target = pos.copy();
  angleMode(RADIANS);
}

function draw() {
  background(25);

  // Move towards target
  let dir = p5.Vector.sub(target, pos);
  let dist = dir.mag();
  let speed = map(dist, 0, width, 0, 12);
  if (dist > 2) {
    dir.normalize();
    vel.lerp(dir.mult(speed), 0.13);
    pos.add(vel);
  } else {
    vel.mult(0.8);
    pos.add(vel);
  }

  // --- Compute rotation: chosen corner (dot) points toward target ---
  // Build triangle points in local space (centered at 0,0, upright)
  let h = (baseSize) * sqrt(3)/2;
  let w = baseSize;
  let localTri = [
    createVector(0, -h/2),     // corner 0 (top by default)
    createVector(-w/2, h/2),   // corner 1 (bottom left)
    createVector(w/2, h/2)     // corner 2 (bottom right)
  ];

  // Get the global position of the marked corner
  let baseRot = 0; // the triangle is upright at rotation 0
  let cornerLocal = localTri[dotCornerIndex];
  let cornerGlobal = p5.Vector.add(pos, p5.Vector.fromAngle(rot + baseRot).mult(cornerLocal.y)
                                        .add(p5.Vector.fromAngle(rot + baseRot + HALF_PI).mult(cornerLocal.x)));

  // Find angle from triangle center to target, and from center to corner
  let angleToTarget = atan2(target.y - pos.y, target.x - pos.x);
  let angleCorner = atan2(cornerLocal.y, cornerLocal.x);

  // The rotation needed to align the marked corner to the target
  let desiredRot = angleToTarget - angleCorner;
  rot = lerpAngle(rot, desiredRot, 0.18);

  // --- Transform logic (relative to movement) ---
  // Forward/backward: stretch/squash based on velocity in "up" direction
  let vForward = p5.Vector.fromAngle(rot).dot(vel);
  let stretch = 0;
  if (vForward > 0.5)  stretch = map(vForward, 0, 12, 0, maxStretch); // moving forward
  if (vForward < -0.5) stretch = map(vForward, 0, -12, 0, -maxSquash);  // moving backward

  // Left/right: skew based on sideways velocity
  let vSide = p5.Vector.fromAngle(rot + HALF_PI).dot(vel);
  let skew = 0;
  if (vSide < -0.5) skew = map(vSide, 0, -12, 0, -maxSkew); // left
  if (vSide > 0.5)  skew = map(vSide, 0, 12, 0, maxSkew);   // right

  // --- Drawing ---
  push();
  translate(pos.x, pos.y);
  rotate(rot);
  shearX(skew);

  // Triangle points (local)
  h = (baseSize + stretch) * sqrt(3)/2;
  w = baseSize + abs(stretch)/2;
  let tri = [
    createVector(0, -h/2),       // corner 0 (dot by default)
    createVector(-w/2, h/2),     // corner 1
    createVector(w/2, h/2)       // corner 2
  ];

  fill(50, 180, 255);
  stroke(255, 220, 70);
  strokeWeight(4);
  beginShape();
  for (let p of tri) vertex(p.x, p.y);
  endShape(CLOSE);

  // Draw dot on marked corner
  fill(255, 0, 80);
  noStroke();
  ellipse(tri[dotCornerIndex].x, tri[dotCornerIndex].y, 18, 18);

  // Draw centroid
  fill(255, 255, 0);
  let cx = (tri[0].x + tri[1].x + tri[2].x) / 3;
  let cy = (tri[0].y + tri[1].y + tri[2].y) / 3;
  ellipse(cx, cy, 12, 12);

  pop();

  // UI text
  fill(255);
  textSize(18);
  textAlign(LEFT, TOP);
  text("Click: Marked corner (dot) always points at mouse", 12, 12);
}

// Smooth angle interpolation, handling wrapping
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > PI) diff -= TWO_PI;
  while (diff < -PI) diff += TWO_PI;
  return a + diff * t;
}

function mousePressed() {
  target = createVector(mouseX, mouseY);
}