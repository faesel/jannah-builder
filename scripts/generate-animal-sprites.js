const { drawPixelRect, drawPixelCircle, newCanvas, save } = require('./generate-sprites');

const colours = {
  bird: {
    body: '#4A90D9',
    wing: '#3A7BC8',
    beak: '#E8A64C',
    eye: '#1A1A1A',
  },
  rabbit: {
    fur: '#E0D5C0',
    earInner: '#F0B0B0',
    eye: '#1A1A1A',
    nose: '#D89AA1',
    tail: '#F4EEE3',
  },
  deer: {
    body: '#C4873B',
    legs: '#A06B2F',
    antlers: '#8B6B3D',
    eye: '#1A1A1A',
    nose: '#7B4A1F',
  },
  squirrel: {
    body: '#B5651D',
    tail: '#C4873B',
    eye: '#1A1A1A',
    nose: '#7B3F00',
    ear: '#D18A3F',
  },
};

function withContext(drawFn) {
  const canvas = newCanvas();
  const ctx = canvas.getContext('2d');
  drawFn(ctx);
  return canvas;
}

function drawBirdSide(ctx, facing = 'right', headOffsetY = 0) {
  const isRight = facing === 'right';
  const headX = isRight ? 20 : 12;
  const beakX = isRight ? 23 : 6;
  const wingX = isRight ? 10 : 17;
  const eyeX = isRight ? 21 : 10;

  drawPixelCircle(ctx, 16, 18, 4, colours.bird.body);
  drawPixelCircle(ctx, headX, 14 + headOffsetY, 3, colours.bird.body);
  drawPixelRect(ctx, beakX, 14 + headOffsetY, 3, 1, colours.bird.beak);
  drawPixelRect(ctx, wingX, 13, 5, 2, colours.bird.wing);
  drawPixelRect(ctx, eyeX, 14 + headOffsetY, 1, 1, colours.bird.eye);
  drawPixelRect(ctx, 14, 22, 1, 3, colours.bird.beak);
  drawPixelRect(ctx, 18, 22, 1, 3, colours.bird.beak);
}

function drawBirdUp(ctx) {
  drawPixelCircle(ctx, 16, 18, 5, colours.bird.body);
  drawPixelCircle(ctx, 16, 11, 3, colours.bird.body);
  drawPixelRect(ctx, 10, 14, 4, 5, colours.bird.wing);
  drawPixelRect(ctx, 18, 14, 4, 5, colours.bird.wing);
  drawPixelRect(ctx, 15, 7, 2, 2, colours.bird.beak);
  drawPixelRect(ctx, 14, 23, 1, 3, colours.bird.beak);
  drawPixelRect(ctx, 17, 23, 1, 3, colours.bird.beak);
}

function drawBirdDown(ctx) {
  drawPixelCircle(ctx, 16, 19, 5, colours.bird.body);
  drawPixelCircle(ctx, 16, 13, 4, colours.bird.body);
  drawPixelRect(ctx, 10, 16, 4, 3, colours.bird.wing);
  drawPixelRect(ctx, 18, 16, 4, 3, colours.bird.wing);
  drawPixelRect(ctx, 15, 17, 2, 2, colours.bird.beak);
  drawPixelRect(ctx, 14, 12, 1, 1, colours.bird.eye);
  drawPixelRect(ctx, 18, 12, 1, 1, colours.bird.eye);
  drawPixelRect(ctx, 14, 24, 1, 3, colours.bird.beak);
  drawPixelRect(ctx, 17, 24, 1, 3, colours.bird.beak);
}

function drawRabbitSide(ctx, facing = 'right', headOffsetY = 0) {
  const isRight = facing === 'right';
  const headX = isRight ? 20 : 12;
  const earX = isRight ? 18 : 10;
  const innerEarX = isRight ? 19 : 11;
  const eyeX = isRight ? 21 : 10;
  const tailX = isRight ? 9 : 23;
  const noseX = isRight ? 23 : 8;

  drawPixelCircle(ctx, 14, 21, 5, colours.rabbit.fur);
  drawPixelCircle(ctx, tailX, 21, 2, colours.rabbit.tail);
  drawPixelCircle(ctx, headX, 16 + headOffsetY, 4, colours.rabbit.fur);
  drawPixelRect(ctx, earX, 7 + headOffsetY, 2, 8, colours.rabbit.fur);
  drawPixelRect(ctx, isRight ? earX + 3 : earX + 3, 6 + headOffsetY, 2, 8, colours.rabbit.fur);
  drawPixelRect(ctx, innerEarX, 8 + headOffsetY, 1, 6, colours.rabbit.earInner);
  drawPixelRect(ctx, isRight ? innerEarX + 3 : innerEarX + 3, 7 + headOffsetY, 1, 6, colours.rabbit.earInner);
  drawPixelRect(ctx, eyeX, 15 + headOffsetY, 1, 1, colours.rabbit.eye);
  drawPixelRect(ctx, noseX, 17 + headOffsetY, 1, 1, colours.rabbit.nose);
  drawPixelRect(ctx, 12, 25, 2, 3, colours.rabbit.fur);
  drawPixelRect(ctx, 17, 25, 2, 3, colours.rabbit.fur);
}

function drawRabbitUp(ctx) {
  drawPixelCircle(ctx, 16, 20, 5, colours.rabbit.fur);
  drawPixelCircle(ctx, 16, 14, 4, colours.rabbit.fur);
  drawPixelRect(ctx, 12, 5, 2, 9, colours.rabbit.fur);
  drawPixelRect(ctx, 18, 5, 2, 9, colours.rabbit.fur);
  drawPixelRect(ctx, 13, 6, 1, 7, colours.rabbit.earInner);
  drawPixelRect(ctx, 19, 6, 1, 7, colours.rabbit.earInner);
  drawPixelCircle(ctx, 16, 25, 2, colours.rabbit.tail);
}

function drawRabbitDown(ctx) {
  drawPixelCircle(ctx, 16, 20, 5, colours.rabbit.fur);
  drawPixelCircle(ctx, 16, 14, 4, colours.rabbit.fur);
  drawPixelRect(ctx, 12, 5, 2, 9, colours.rabbit.fur);
  drawPixelRect(ctx, 18, 5, 2, 9, colours.rabbit.fur);
  drawPixelRect(ctx, 13, 6, 1, 7, colours.rabbit.earInner);
  drawPixelRect(ctx, 19, 6, 1, 7, colours.rabbit.earInner);
  drawPixelRect(ctx, 14, 13, 1, 1, colours.rabbit.eye);
  drawPixelRect(ctx, 18, 13, 1, 1, colours.rabbit.eye);
  drawPixelRect(ctx, 16, 16, 1, 1, colours.rabbit.nose);
  drawPixelRect(ctx, 13, 25, 2, 3, colours.rabbit.fur);
  drawPixelRect(ctx, 18, 25, 2, 3, colours.rabbit.fur);
}

function drawDeerSide(ctx, facing = 'right', headOffsetY = 0) {
  const isRight = facing === 'right';
  const bodyX = isRight ? 8 : 8;
  const headX = isRight ? 23 : 9;
  const antlerBaseX = isRight ? 20 : 8;
  const noseX = isRight ? 26 : 5;
  const eyeX = isRight ? 24 : 8;
  const backLegX = isRight ? 10 : 20;
  const frontLegX = isRight ? 19 : 9;

  drawPixelRect(ctx, bodyX, 17, 16, 9, colours.deer.body);
  drawPixelRect(ctx, 7, 18, 3, 2, colours.deer.legs);
  drawPixelRect(ctx, backLegX, 26, 2, 4, colours.deer.legs);
  drawPixelRect(ctx, frontLegX, 26, 2, 4, colours.deer.legs);
  drawPixelCircle(ctx, headX, 14 + headOffsetY, 4, colours.deer.body);
  drawPixelRect(ctx, antlerBaseX, 6 + headOffsetY, 2, 8, colours.deer.antlers);
  drawPixelRect(ctx, isRight ? antlerBaseX - 2 : antlerBaseX + 2, 8 + headOffsetY, 2, 2, colours.deer.antlers);
  drawPixelRect(ctx, isRight ? antlerBaseX + 4 : antlerBaseX - 4, 6 + headOffsetY, 2, 8, colours.deer.antlers);
  drawPixelRect(ctx, isRight ? antlerBaseX + 6 : antlerBaseX - 6, 8 + headOffsetY, 2, 2, colours.deer.antlers);
  drawPixelRect(ctx, eyeX, 13 + headOffsetY, 1, 1, colours.deer.eye);
  drawPixelRect(ctx, noseX, 16 + headOffsetY, 1, 1, colours.deer.nose);
}

function drawDeerUp(ctx) {
  drawPixelRect(ctx, 11, 11, 10, 14, colours.deer.body);
  drawPixelCircle(ctx, 16, 8, 4, colours.deer.body);
  drawPixelRect(ctx, 13, 2, 2, 8, colours.deer.antlers);
  drawPixelRect(ctx, 18, 2, 2, 8, colours.deer.antlers);
  drawPixelRect(ctx, 11, 4, 2, 2, colours.deer.antlers);
  drawPixelRect(ctx, 20, 4, 2, 2, colours.deer.antlers);
  drawPixelRect(ctx, 12, 25, 2, 5, colours.deer.legs);
  drawPixelRect(ctx, 18, 25, 2, 5, colours.deer.legs);
}

function drawDeerDown(ctx) {
  // Walking downward (toward viewer) — body at top, head at bottom
  drawPixelRect(ctx, 13, 2, 2, 6, colours.deer.antlers); // antlers peeking above
  drawPixelRect(ctx, 18, 2, 2, 6, colours.deer.antlers);
  drawPixelRect(ctx, 11, 6, 10, 12, colours.deer.body); // body top
  drawPixelRect(ctx, 12, 4, 2, 4, colours.deer.legs); // front legs
  drawPixelRect(ctx, 18, 4, 2, 4, colours.deer.legs);
  drawPixelCircle(ctx, 16, 22, 4, colours.deer.body); // head at bottom
  drawPixelRect(ctx, 14, 22, 1, 1, colours.deer.eye);
  drawPixelRect(ctx, 18, 22, 1, 1, colours.deer.eye);
  drawPixelRect(ctx, 16, 25, 1, 1, colours.deer.nose);
  drawPixelRect(ctx, 12, 18, 2, 5, colours.deer.legs); // hind legs
  drawPixelRect(ctx, 18, 18, 2, 5, colours.deer.legs);
}

function drawSquirrelSide(ctx, facing = 'right', headOffsetY = 0) {
  const isRight = facing === 'right';
  const bodyX = isRight ? 16 : 16;
  const headX = isRight ? 21 : 11;
  const tailMainX = isRight ? 10 : 22;
  const tailTipX = isRight ? 8 : 24;
  const eyeX = isRight ? 22 : 10;
  const noseX = isRight ? 24 : 7;
  const earX = isRight ? 20 : 10;

  drawPixelCircle(ctx, bodyX, 21, 5, colours.squirrel.body);
  drawPixelCircle(ctx, tailMainX, 16, 4, colours.squirrel.tail);
  drawPixelCircle(ctx, tailTipX, 12, 3, colours.squirrel.tail);
  drawPixelCircle(ctx, headX, 15 + headOffsetY, 3, colours.squirrel.body);
  drawPixelRect(ctx, earX, 10 + headOffsetY, 2, 2, colours.squirrel.ear);
  drawPixelRect(ctx, isRight ? earX + 2 : earX + 2, 9 + headOffsetY, 2, 2, colours.squirrel.ear);
  drawPixelRect(ctx, eyeX, 14 + headOffsetY, 1, 1, colours.squirrel.eye);
  drawPixelRect(ctx, noseX, 16 + headOffsetY, 1, 1, colours.squirrel.nose);
  drawPixelRect(ctx, 14, 25, 2, 3, colours.squirrel.body);
  drawPixelRect(ctx, 18, 25, 2, 3, colours.squirrel.body);
}

function drawSquirrelUp(ctx) {
  // Walking upward (away from viewer) — head at top, tail at bottom
  drawPixelCircle(ctx, 16, 10, 3, colours.squirrel.body); // head
  drawPixelRect(ctx, 13, 6, 2, 2, colours.squirrel.ear);
  drawPixelRect(ctx, 17, 6, 2, 2, colours.squirrel.ear);
  drawPixelCircle(ctx, 16, 17, 5, colours.squirrel.body); // body
  drawPixelCircle(ctx, 16, 24, 4, colours.squirrel.tail); // tail bottom
  drawPixelCircle(ctx, 16, 28, 3, colours.squirrel.tail); // tail tip
  drawPixelRect(ctx, 13, 22, 2, 3, colours.squirrel.body); // feet
  drawPixelRect(ctx, 17, 22, 2, 3, colours.squirrel.body);
}

function drawSquirrelDown(ctx) {
  // Single tail peeking up behind (viewed from front)
  drawPixelCircle(ctx, 16, 8, 4, colours.squirrel.tail);
  drawPixelCircle(ctx, 16, 5, 3, colours.squirrel.tail);
  drawPixelCircle(ctx, 16, 20, 5, colours.squirrel.body);
  drawPixelCircle(ctx, 16, 14, 4, colours.squirrel.body);
  drawPixelRect(ctx, 13, 9, 2, 2, colours.squirrel.ear);
  drawPixelRect(ctx, 17, 9, 2, 2, colours.squirrel.ear);
  drawPixelRect(ctx, 14, 13, 1, 1, colours.squirrel.eye);
  drawPixelRect(ctx, 18, 13, 1, 1, colours.squirrel.eye);
  drawPixelRect(ctx, 16, 16, 1, 1, colours.squirrel.nose);
  drawPixelRect(ctx, 14, 25, 2, 3, colours.squirrel.body);
  drawPixelRect(ctx, 17, 25, 2, 3, colours.squirrel.body);
}

function generateBirdSprites() {
  [1, 3, 1].forEach((offset, index) => {
    save(withContext((ctx) => drawBirdSide(ctx, 'right', offset)), 'animals', `bird_feed${index + 1}.png`);
  });

  save(withContext((ctx) => drawBirdUp(ctx)), 'animals', 'bird_up.png');
  save(withContext((ctx) => drawBirdDown(ctx)), 'animals', 'bird_down.png');
  save(withContext((ctx) => drawBirdSide(ctx, 'left')), 'animals', 'bird_left.png');
  save(withContext((ctx) => drawBirdSide(ctx, 'right')), 'animals', 'bird_right.png');
}

function generateRabbitSprites() {
  [1, 3, 1].forEach((offset, index) => {
    save(withContext((ctx) => drawRabbitSide(ctx, 'right', offset)), 'animals', `rabbit_feed${index + 1}.png`);
  });

  save(withContext((ctx) => drawRabbitUp(ctx)), 'animals', 'rabbit_up.png');
  save(withContext((ctx) => drawRabbitDown(ctx)), 'animals', 'rabbit_down.png');
  save(withContext((ctx) => drawRabbitSide(ctx, 'left')), 'animals', 'rabbit_left.png');
  save(withContext((ctx) => drawRabbitSide(ctx, 'right')), 'animals', 'rabbit_right.png');
}

function generateDeerSprites() {
  [1, 3, 1].forEach((offset, index) => {
    save(withContext((ctx) => drawDeerSide(ctx, 'right', offset)), 'animals', `deer_feed${index + 1}.png`);
  });

  save(withContext((ctx) => drawDeerUp(ctx)), 'animals', 'deer_up.png');
  save(withContext((ctx) => drawDeerDown(ctx)), 'animals', 'deer_down.png');
  save(withContext((ctx) => drawDeerSide(ctx, 'left')), 'animals', 'deer_left.png');
  save(withContext((ctx) => drawDeerSide(ctx, 'right')), 'animals', 'deer_right.png');
}

function generateSquirrelSprites() {
  [1, 3, 1].forEach((offset, index) => {
    save(withContext((ctx) => drawSquirrelSide(ctx, 'right', offset)), 'animals', `squirrel_feed${index + 1}.png`);
  });

  save(withContext((ctx) => drawSquirrelUp(ctx)), 'animals', 'squirrel_up.png');
  save(withContext((ctx) => drawSquirrelDown(ctx)), 'animals', 'squirrel_down.png');
  save(withContext((ctx) => drawSquirrelSide(ctx, 'left')), 'animals', 'squirrel_left.png');
  save(withContext((ctx) => drawSquirrelSide(ctx, 'right')), 'animals', 'squirrel_right.png');
}

function generateAnimalSprites() {
  console.log('🎨 Generating animal animation sprites...');
  generateBirdSprites();
  generateRabbitSprites();
  generateDeerSprites();
  generateSquirrelSprites();
  console.log('✅ Animal animation sprites generated!');
}

generateAnimalSprites();
