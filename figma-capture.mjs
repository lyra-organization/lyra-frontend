import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const FIGMA_URL = 'https://www.figma.com/design/7CW62B9BgbLOjjAHeDbNlO/lyra?node-id=0-1&t=3eZlY7byLttm2Nzb-1';

async function main() {
  mkdirSync('/Users/omarsaleh/Desktop/lyra/figma-screens', { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Loading Figma file...');
  await page.goto(FIGMA_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(8000);

  // Close any cookie banner
  try {
    const optOut = page.locator('button:has-text("Opt out")');
    if (await optOut.isVisible({ timeout: 2000 })) await optOut.click();
  } catch {}

  // Close any sign-up banner
  try {
    const closeBtn = page.locator('[aria-label="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 2000 })) await closeBtn.click();
  } catch {}

  await page.waitForTimeout(1000);

  // Zoom to fit all
  await page.keyboard.press('Shift+1');
  await page.waitForTimeout(2000);

  // The frames are laid out horizontally. We'll click on each frame area,
  // then zoom to selection with Shift+2, screenshot, then go back.
  // From the overview, the frames are roughly at these x positions (relative):
  // Let's just double-click each frame to zoom in

  const screenNames = [
    'onboarding',
    'sign-up-apple',
    'sign-up-profile',
    'home',
    'match-profile',
    'proximity-radar',
  ];

  // Get canvas element
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) { console.log('No canvas found'); return; }

  // The 6 frames are evenly spaced across the canvas
  // From the overview screenshot, they span roughly from 3% to 75% of width
  // and are centered vertically around 35% of height
  const startX = box.x + box.width * 0.06;
  const endX = box.x + box.width * 0.73;
  const centerY = box.y + box.height * 0.35;
  const frameSpacing = (endX - startX) / 5;

  for (let i = 0; i < 6; i++) {
    const frameX = startX + (i * frameSpacing);

    console.log(`Capturing ${screenNames[i]}... clicking at (${Math.round(frameX)}, ${Math.round(centerY)})`);

    // Click frame to select it
    await page.mouse.click(frameX, centerY);
    await page.waitForTimeout(500);

    // Double-click to enter frame
    await page.mouse.dblclick(frameX, centerY);
    await page.waitForTimeout(500);

    // Zoom to selection
    await page.keyboard.press('Shift+2');
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: `/Users/omarsaleh/Desktop/lyra/figma-screens/${i + 1}-${screenNames[i]}.png`,
      fullPage: false,
    });
    console.log(`Saved ${screenNames[i]}.png`);

    // Zoom back to fit all
    await page.keyboard.press('Shift+1');
    await page.waitForTimeout(1000);

    // Click away to deselect
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
