const User = require("../models/User");
const Food = require("../models/FoodManagement/Food");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function geminiGenerateWithRetry(question) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("no-gemini-key");

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are UniEats assistant. Answer concisely.\nUser: ${question}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 500,
    },
  };

  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.candidates?.length) {
          const parts = data.candidates[0].content?.parts;
          if (parts?.length) {
            return parts.map((p) => p.text).join(" ").trim();
          }
        }
        return null;
      }

      const txt = await resp.text();
      console.error("Gemini error:", resp.status, txt);

      // Retry on transient server errors / rate limits
      if (resp.status === 503 || resp.status === 429 || resp.status >= 500) {
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        console.warn(`Gemini transient error (${resp.status}). retrying in ${backoff}ms (attempt ${attempt})`);
        await delay(backoff);
        continue;
      }

      // Non-retryable error: break and let fallback handle it
      break;
    } catch (err) {
      console.error("Gemini fetch failed:", err);
      // network error - retry
      if (attempt < maxAttempts) {
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        await delay(backoff);
        continue;
      }
      throw err;
    }
  }

  throw new Error("gemini-unavailable");
}

const answerUnknown = () => ({
  answer:
    "Sorry — I couldn't understand that. Try: 'How many active vendors?', 'List vendors', or 'What foods does <vendor name> have?'.",
});

exports.handleQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ message: "question is required" });
    }

    const q = question.trim().toLowerCase();

    // 1) How many active vendors
    if (/(how many|number of|count).*vendors/.test(q) || /active vendors/.test(q)) {
      const count = await User.countDocuments({ role: "vendor", status: "active" });
      return res.json({ answer: `There are ${count} active vendors on UniEats.` });
    }

    // 2) List vendors
    if (/^list .*vendors|show .*vendors|vendors list|list vendors/.test(q)) {
      const vendors = await User.find({ role: "vendor", status: "active" })
        .limit(10)
        .select("vendorName name");

      const names = vendors.map((v) => v.vendorName || v.name).filter(Boolean);
      return res.json({
        answer: `Active vendors: ${names.join(", ") || "(none)"}.`,
        data: names,
      });
    }

    // 3) Foods for a specific vendor
    const foodsMatch =
      q.match(/what(?:\s+foods?)?(?: does| do)?\s+(.+?)\s+(?:have|serve|offer)\??$/i) ||
      q.match(/foods (?:of|for)\s+(.+)$/i) ||
      q.match(/menu of\s+(.+)$/i);

    if (foodsMatch) {
      const vendorName = (foodsMatch[1] || "").trim();
      if (!vendorName) return res.json(answerUnknown());

      const regex = new RegExp(
        vendorName.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"),
        "i"
      );

      const vendor = await User.findOne({
        role: "vendor",
        $or: [{ vendorName: regex }, { name: regex }],
      });

      if (!vendor) {
        return res.json({
          answer: `I couldn't find a vendor matching '${vendorName}'.`,
        });
      }

      const foods = await Food.find({
        vendorId: vendor._id,
        isAvailable: true,
      })
        .limit(50)
        .select("name price");

      if (!foods.length) {
        return res.json({
          answer: `${vendor.vendorName || vendor.name} currently has no available foods listed.`,
        });
      }

      const list = foods.map((f) => `${f.name} (Rs.${f.price})`).join(", ");

      return res.json({
        answer: `Foods from ${vendor.vendorName || vendor.name}: ${list}`,
      });
    }

    // Try Gemini with retries/backoff, fall through to OpenAI if unavailable
    if (process.env.GEMINI_API_KEY) {
      try {
        const reply = await geminiGenerateWithRetry(question);
        if (reply) return res.json({ answer: reply });
        // if no reply, continue to fallback
        console.warn("Gemini returned no reply, falling back to other providers");
      } catch (err) {
        console.warn("Gemini unavailable or failed after retries:", err.message || err);
        // continue to OPENAI fallback
      }
    }

    // =========================
    // OPENAI FALLBACK
    // =========================
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    if (OPENAI_KEY) {
      try {
        const prompt = `You are UniEats assistant. Answer concisely.\nUser: ${question}`;

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "You are UniEats assistant." },
              { role: "user", content: prompt },
            ],
            max_tokens: 400,
            temperature: 0.2,
          }),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          console.error("OpenAI error:", resp.status, txt);
          return res.json({
            answer: "Sorry, the assistant service returned an error.",
          });
        }

        const data = await resp.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();

        return res.json({
          answer: reply || "Sorry, no answer from assistant.",
        });
      } catch (err) {
        console.error("OpenAI failed:", err);
        return res.json({
          answer: "Sorry, the assistant is temporarily unavailable.",
        });
      }
    }

    return res.json(answerUnknown());
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.health = (req, res) => {
  return res.json({
    status: "ok",
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  });
};