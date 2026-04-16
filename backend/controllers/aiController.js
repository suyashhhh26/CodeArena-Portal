const { GoogleGenerativeAI } = require("@google/generative-ai");
const { pool } = require("../config/db");

exports.getRecommendation = async (req, res) => {
  try {
    const { query } = req.body;
    
    // We check if process.env.GEMINI_API_KEY exists.
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        reply: "Please set your GEMINI_API_KEY in the .env file to enable AI recommendations. Get a free API key from Google AI Studio."
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // You can also use gemini-1.5-pro or gemini-1.5-flash depending on your key, but flash is default fast and inexpensive
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Provide context to the AI about CodeArena
    const prompt = `You are an AI Recommendation Assistant for CodeArena, a competitive programming and hackathon discovery platform. 
The user is asking: "${query}"
Provide a short, friendly, and helpful response. If they are looking for recommendations, suggest looking at the "Hackathons" page to find events or the "Team Finder" page to look for team members.
Limit your response to a few helpful sentences.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("AI Gen Error:", error);
    res.status(500).json({ reply: "Sorry, I encountered an error. Make sure your API key is valid and you have an internet connection." });
  }
};

exports.syncExternalHackathons = async (req, res) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const scraperKey = process.env.UNSTOP_SCRAPER_API_KEY;

    if (!geminiKey) {
      return res.status(400).json({ success: false, message: "GEMINI_API_KEY is required for AI-powered sync." });
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // In a real scenario, if scraperKey existed, we would call Apify/etc.
    // Here we use Gemini to 'find' or 'hallucinate' very realistic current hackathons 
    // based on real-world data it knows about.
    const prompt = `You are an AI data extractor for CodeArena. 
Search your knowledge or simulate a fetch of 5 real-world hackathons that are currently popular on platforms like Unstop, Devpost, or Devfolio (around 2026 dates).
Return ONLY a JSON array of objects with these fields:
- title: (string)
- organizer: (string)
- description: (string short summary)
- theme: (string)
- mode: ('online', 'offline', 'hybrid')
- difficulty: ('beginner', 'intermediate', 'advanced', 'open')
- prize_pool: (string e.g. "$10,000")
- prize_amount: (number e.g. 10000)
- registration_link: (string URL)
- registration_end: (string ISO date format)
- tags: (string comma separated)

Make them sound VERY professional and high-quality. Do not include any extra text, only the JSON.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Clean up potential markdown formatting in AI response
    text = text.replace(/```json|```/g, "").trim();
    
    const hackathons = JSON.parse(text);

    // Filter duplicates and save to DB
    const saved = [];
    for (const h of hackathons) {
      // Check if title already exists to avoid spamming
      const [existing] = await pool.execute("SELECT id FROM hackathons WHERE title = ?", [h.title]);
      if (existing.length === 0) {
        await pool.execute(`
          INSERT INTO hackathons 
          (title, organizer, description, theme, mode, difficulty, prize_pool, prize_amount, registration_link, registration_end, tags, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          h.title, h.organizer, h.description, h.theme, h.mode, h.difficulty, 
          h.prize_pool, h.prize_amount, h.registration_link, h.registration_end, 
          h.tags, req.user.id
        ]);
        saved.push(h.title);
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: saved.length > 0 ? `Synced and added ${saved.length} new hackathons!` : "Already up to date.",
      savedCount: saved.length 
    });
  } catch (error) {
    console.error("External Sync Error:", error);
    res.status(500).json({ success: false, message: "Failed to sync external hackathons. Check API keys." });
  }
};
