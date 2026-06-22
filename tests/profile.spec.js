import { test, expect } from '@playwright/test';



test('fetch profile API works', async ({ request }) => {
  const response = await request.get(
    'http://localhost:5000/api/profile/fetch/IT23331686@my.sliit.lk'
  );

  expect(response.status()).toBe(200);
});

test('update profile works', async ({ request }) => {
  const email = 'IT23331686@my.sliit.lk';

  const response = await request.put(
    `http://127.0.0.1:5000/api/profile/update/${email}`,
    {
      data: {
        name: "Ishani Dew",
        contactNumber: "0763574366",
        department: "IT",
        dietaryPreferences: "Veg",
        allergies: "None"
      }
    }
  );

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.name).toBe("Ishani Dew");
});

test('delete profile works', async ({ request }) => {
  const email = 'yasithdeshan55@gmail.com';

  const response = await request.delete(
    `http://127.0.0.1:5000/api/profile/delete/${email}`
  );

  console.log(await response.text()); // 🔥 DEBUG LINE

  expect(response.status()).toBe(200);
});