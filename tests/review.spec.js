import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:5000/api/reviews';

const testVendorId = "69d9c4104f086ddc6904c132";
const testUserEmail = "IT23331686@my.sliit.lk";

let createdReviewId ="69ea2aff234e4f53f4647f46";

test.describe('Review API Tests (Fixed)', () => {

  // ================= CREATE =================
  test('Add Review', async ({ request }) => {

    const response = await request.post(`${baseURL}/add`, {
      data: {
        userEmail: "ishinidewmini713@gmail.com",
        userName: "Ishini Dewmini",
        vendorId: "65f1a2b3c4d5e6f7a8b9c0d1",
        mealName: "Grilled Chicken Wrap",
        rating: 4,
        comment: "Testing from Playwright"
      }
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    console.log("CREATE RESPONSE:", body);

    expect(body).toHaveProperty("_id");

    createdReviewId = body._id; // ✅ IMPORTANT FIX
  });

  
  // ================= GET VENDOR =================
  test('Get Vendor Reviews', async ({ request }) => {

    const response = await request.get(`${baseURL}/vendor/${testVendorId}`);

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(Array.isArray(body)).toBeTruthy();
  });

  // ================= GET ALL =================
  test('Get All Reviews', async ({ request }) => {

    const response = await request.get(`${baseURL}/all`);

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(Array.isArray(body)).toBeTruthy();
  });

  // ================= GET USER =================
  test('Get User Reviews', async ({ request }) => {

    const response = await request.get(`${baseURL}/user/${testUserEmail}`);

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(Array.isArray(body)).toBeTruthy();
  });

    // ================= UPDATE =================
  test('Update Review', async ({ request }) => {

    expect(createdReviewId).not.toBeNull();

    const response = await request.put(
      `${baseURL}/update/${createdReviewId}`,
      {
        data: {
          comment: "Updated from Playwright test",
          rating: 5
        }
      }
    );

    console.log("UPDATE STATUS:", response.status());
    console.log("UPDATE BODY:", await response.text());

    expect(response.ok()).toBeTruthy();

    const body = await response.json();

    expect(body.comment).toBe("Updated from Playwright test");
    expect(body.rating).toBe(5);
  });

});