// End-to-end checks mapped to the assignment document's requirements.
import { test, expect } from '@playwright/test';
import { addDays, addMinutes, format, startOfWeek } from 'date-fns';
import { API } from './config.js';

const SETTINGS_KEY = 'todo.settings';

async function resetDb(request) {
  const tasks = await (await request.get(API)).json();
  await Promise.all(tasks.map((t) => request.delete(`${API}/${t._id}`)));
}

async function seed(request, task) {
  const res = await request.post(API, { data: task });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

const at = (date, h, m = 0) => {
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
};
const today = () => new Date();
const thisMonday = () => startOfWeek(new Date(), { weekStartsOn: 1 });

/** Skip onboarding; notifications off unless a test turns them on (keeps toasts out of the way). */
async function boot(page, settings = {}) {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('e2e-init')) {
        localStorage.clear();
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem('e2e-init', '1');
      }
    },
    [SETTINGS_KEY, { onboarded: true, notificationsEnabled: false, ...settings }]
  );
}

test.beforeEach(async ({ request }) => {
  await resetDb(request);
});

test('onboarding is shown first and "Get Started" opens the home screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Manage What To Do' })).toBeVisible();
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByRole('heading', { name: 'Weekly Progress' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Weekly Progress' })).toBeVisible();
});

test.describe('3.1 Task management', () => {
  test.beforeEach(async ({ page }) => boot(page));

  test('Create: title and date & time are mandatory', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add Task' }).click();
    const sheet = page.getByRole('dialog', { name: 'Add New Task' });
    await sheet.getByRole('button', { name: 'Create task' }).click();
    await expect(sheet.getByText('Task title is required')).toBeVisible();
    await expect(sheet.getByText('Start time is required')).toBeVisible();
    await expect(sheet).toBeVisible();
  });

  test('Create: a task with all attributes is saved to the selected week', async ({ page, request }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Add Task' }).click();
    const sheet = page.getByRole('dialog', { name: 'Add New Task' });
    await sheet.getByLabel('Task title').fill('Finishing Wireframe');
    await sheet.locator('#task-start').fill('23:00');
    await sheet.locator('#task-end').fill('23:45');
    await sheet.locator('#task-date').fill(format(today(), 'yyyy-MM-dd'));
    await sheet.getByRole('radio', { name: 'High' }).click();
    await sheet.getByLabel('Description').fill('Home and search screens');
    await sheet.getByRole('button', { name: 'Create task' }).click();
    await expect(sheet).toBeHidden();

    const row = page.getByTestId('task-row').filter({ hasText: 'Finishing Wireframe' }).first();
    await expect(row).toBeVisible();
    await expect(row).toContainText('High');
    await expect(page.getByTestId('open-card-count')).toHaveText('01');

    const [saved] = await (await request.get(API)).json();
    expect(saved).toMatchObject({
      title: 'Finishing Wireframe',
      description: 'Home and search screens',
      priority: 'high',
      status: 'in_progress',
    });
    expect(new Date(saved.startAt).getHours()).toBe(23);
  });

  test('Edit: every attribute can be updated', async ({ page, request }) => {
    await seed(request, { title: 'Meeting with team', startAt: at(today(), 22).toISOString(), priority: 'low' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Edit "Meeting with team"' }).first().click();
    const sheet = page.getByRole('dialog', { name: 'Edit Task' });
    await expect(sheet.getByLabel('Task title')).toHaveValue('Meeting with team');
    await sheet.getByLabel('Task title').fill('Team sync');
    await sheet.getByLabel('Description').fill('Weekly sync');
    await sheet.locator('#task-start').fill('21:15');
    await sheet.getByRole('radio', { name: 'Medium' }).click();
    await sheet.getByRole('button', { name: 'Save changes' }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByTestId('task-row').filter({ hasText: 'Team sync' }).first()).toContainText('9:15 PM');

    const [saved] = await (await request.get(API)).json();
    expect(saved).toMatchObject({ title: 'Team sync', description: 'Weekly sync', priority: 'medium' });
  });

  test('Delete: swipe left on a task, then tap "Delete"', async ({ page, request }) => {
    await seed(request, { title: 'Buy a cat food', startAt: at(today(), 22).toISOString() });
    await page.goto('/');
    const row = page.getByTestId('task-row').filter({ hasText: 'Buy a cat food' }).first();
    const content = row.locator('> div');
    const box = await content.boundingBox();
    const y = box.y + 15;
    await page.mouse.move(box.x + box.width - 120, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 180, y, { steps: 5 });
    await page.mouse.move(box.x + box.width - 240, y, { steps: 5 });
    await page.mouse.up();
    const del = row.getByRole('button', { name: 'Delete', exact: true });
    await expect(del).toBeInViewport();
    await del.click();
    await expect(page.getByTestId('task-row').filter({ hasText: 'Buy a cat food' })).toHaveCount(0);
    await expect.poll(async () => (await (await request.get(API)).json()).length).toBe(0);
  });

  test('Search: by keyword in title or description, with view / edit / delete', async ({ page, request }) => {
    await seed(request, { title: 'Finishing Wireframe', startAt: at(today(), 22).toISOString() });
    await seed(request, { title: 'Meeting', description: 'finish the agenda', startAt: at(addDays(today(), 9), 10).toISOString() });
    await seed(request, { title: 'Buy a cat food', startAt: at(today(), 22).toISOString() });

    await page.goto('/');
    await page.getByRole('link', { name: 'Search for a task' }).click();
    await page.getByLabel('Search tasks').fill('finish');
    const rows = page.getByTestId('task-row');
    await expect(rows).toHaveCount(2);
    await expect(page.getByText('2 results')).toBeVisible();

    // View
    await rows.filter({ hasText: 'Meeting' }).getByRole('button', { name: /Meeting/ }).first().click();
    const details = page.getByRole('dialog', { name: 'Task Details' });
    await expect(details).toContainText('finish the agenda');
    // Edit from the details view
    await details.getByRole('button', { name: 'Edit' }).click();
    const edit = page.getByRole('dialog', { name: 'Edit Task' });
    await edit.getByLabel('Task title').fill('Meeting moved');
    await edit.getByRole('button', { name: 'Save changes' }).click();
    await expect(rows.filter({ hasText: 'Meeting moved' })).toHaveCount(1);
    // Delete from results
    await page.getByRole('button', { name: 'Delete "Finishing Wireframe"' }).click();
    await expect(rows).toHaveCount(1);
    // No match
    await page.getByLabel('Search tasks').fill('zzz');
    await expect(page.getByText('No tasks match "zzz"')).toBeVisible();
  });
});

test.describe('3.2 Home screen: weekly organisation', () => {
  test.beforeEach(async ({ page }) => boot(page));

  test('tasks are grouped into Monday–Sunday week cards with open / completed counts', async ({ page, request }) => {
    const mon = thisMonday();
    const sunday = addDays(mon, 6);
    const nextMonday = addDays(mon, 7);
    await seed(request, { title: 'Monday task', startAt: at(mon, 0, 30).toISOString(), status: 'completed' });
    await seed(request, { title: 'Sunday late', startAt: at(sunday, 23, 30).toISOString() });
    await seed(request, { title: 'Next Monday early', startAt: at(nextMonday, 0, 30).toISOString() });

    // Week cards live on the All Weeks page, reached from Home's "View All".
    await page.goto('/');
    await page.getByRole('button', { name: 'View All' }).click();
    await expect(page).toHaveURL(/\/weeks/);
    await expect(page.getByTestId('week-card')).toHaveCount(2);
    await expect(page.getByRole('heading', { name: 'All Weeks' })).toBeVisible();
    await page.goto('/weeks');
    const cards = page.getByTestId('week-card');
    await expect(cards).toHaveCount(2);

    const thisWeek = cards.nth(0);
    await expect(thisWeek).toContainText('This week');
    await expect(thisWeek.getByTestId('week-open')).toHaveText('1');
    await expect(thisWeek.getByTestId('week-completed')).toHaveText('1');

    const next = cards.nth(1);
    await expect(next.getByTestId('week-open')).toHaveText('1');
    await expect(next.getByTestId('week-completed')).toHaveText('0');

    // Week strip on Home runs Monday -> Sunday
    await page.goto('/');
    const strip = page.getByRole('button', { name: format(mon, 'EEEE d MMMM'), exact: true });
    await expect(strip).toBeVisible();
  });

  test("clicking a week's card expands it to show all tasks for that week", async ({ page, request }) => {
    const nextMonday = addDays(thisMonday(), 7);
    await seed(request, { title: 'Plan sprint', startAt: at(nextMonday, 9).toISOString() });
    await seed(request, { title: 'Retro', startAt: at(addDays(nextMonday, 4), 16).toISOString() });
    await page.goto('/weeks');
    const card = page.getByTestId('week-card').first();
    await expect(card.getByTestId('task-row')).toHaveCount(0);
    await card.getByRole('button', { expanded: false }).click();
    await expect(card.getByTestId('task-row')).toHaveCount(2);
    await expect(card).toContainText('Plan sprint');
    await expect(card).toContainText('Retro');
    await card.getByRole('button', { expanded: true }).click();
    await expect(card.getByTestId('task-row')).toHaveCount(0);
  });
});

test.describe('3.3 Task status update', () => {
  test.beforeEach(async ({ page }) => boot(page));

  test('marking a task Completed / In Progress updates the week card', async ({ page, request }) => {
    await seed(request, { title: 'Finishing Wireframe', startAt: at(today(), 22).toISOString() });
    await seed(request, { title: 'Meeting with team', startAt: at(today(), 23).toISOString() });
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Mark "Finishing Wireframe" as completed' }).first().click();
    await expect(page.getByTestId('completed-card-count')).toHaveText('01');
    await expect.poll(async () => {
      const list = await (await request.get(API)).json();
      return list.find((t) => t.title === 'Finishing Wireframe').status;
    }).toBe('completed');

    // The week card on All Weeks reflects the change
    await page.getByRole('button', { name: 'View All' }).click();
    const card = page.getByTestId('week-card').first();
    await expect(card.getByTestId('week-open')).toHaveText('1');
    await expect(card.getByTestId('week-completed')).toHaveText('1');

    // Back to In Progress from the details sheet
    await page.getByRole('button', { name: /Finishing Wireframe/ }).first().click();
    await page.getByRole('dialog').getByRole('radio', { name: 'In Progress' }).click();
    await page.keyboard.press('Escape');
    await expect(card.getByTestId('week-open')).toHaveText('2');
    await expect(card.getByTestId('week-completed')).toHaveText('0');
  });
});

test.describe('Notifications and settings', () => {
  test('an open task past its end time raises a notification', async ({ page, request }) => {
    await boot(page, { notificationsEnabled: true });
    const now = new Date();
    await seed(request, {
      title: 'Overdue report',
      startAt: addMinutes(now, -90).toISOString(),
      endAt: addMinutes(now, -30).toISOString(),
    });
    await seed(request, { title: 'Starts soon', startAt: addMinutes(now, 10).toISOString() });
    await page.goto('/');
    await expect(page.getByTestId('notif-badge')).toBeVisible();
    await page.getByRole('link', { name: /Notifications/ }).click();
    const items = page.getByTestId('notification');
    await expect(items.filter({ hasText: 'Overdue report' })).toContainText('Task time is up');
    await expect(items.filter({ hasText: 'Starts soon' })).toContainText('Starting soon');
    await items.filter({ hasText: 'Overdue report' }).getByRole('button', { name: 'Mark completed' }).click();
    await expect(items.filter({ hasText: 'Overdue report' })).toHaveCount(0);
  });

  test('header icons open Settings and Notifications; there is no bottom nav bar', async ({ page }) => {
    await boot(page);
    await page.goto('/');
    await expect(page.getByRole('navigation')).toHaveCount(0);
    // Figma Home: centred round "+" button
    const add = page.getByRole('button', { name: 'Add Task' });
    const box = await add.boundingBox();
    const vw = page.viewportSize().width;
    expect(Math.abs(box.x + box.width / 2 - vw / 2)).toBeLessThan(2);
    expect(Math.round(box.width)).toBe(76);

    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('switch', { name: /Task notifications/ }).click();
    await page.reload();
    await expect(page.getByRole('switch', { name: /Task notifications/ })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Back' }).click();
    await page.getByRole('link', { name: /Notifications/ }).click();
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Progress' })).toBeVisible();
  });
});

test.describe('Responsive layout', () => {
  for (const width of [320, 390, 768, 1280]) {
    test(`no horizontal scrolling at ${width}px`, async ({ page, request }) => {
      await boot(page);
      await seed(request, {
        title: 'A fairly long task title that should truncate nicely on narrow screens',
        startAt: at(today(), 22).toISOString(),
        priority: 'medium',
      });
      await page.setViewportSize({ width, height: 844 });
      for (const path of ['/', '/weeks', '/search', '/settings', '/notifications']) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }
});
