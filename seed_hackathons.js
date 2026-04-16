require('dotenv').config();
const { pool } = require('./backend/config/db');

async function populate() {
  const hackathons = [
    {
      title: "Google Girl Hackathon 2026",
      organizer: "Google India",
      description: "A program for women students in India to showcase their coding skills and solve real-world problems.",
      theme: "Diversity & Innovation",
      mode: "hybrid",
      difficulty: "beginner",
      prize_pool: "Internship Opportunities & Swag",
      prize_amount: 0,
      registration_link: "https://buildyourfuture.withgoogle.com/programs/girl-hackathon",
      registration_end: "2026-06-15 23:59:59",
      tags: "Google, WomenTech, Coding"
    },
    {
      title: "NASA Space Apps Challenge 2026",
      organizer: "NASA",
      description: "NASA is inviting coders, scientists, designers, and storytellers to use NASA open data to solve challenges on Earth and in space.",
      theme: "Space & Data",
      mode: "online",
      difficulty: "open",
      prize_pool: "Global Recognition & NASA Visit",
      prize_amount: 0,
      registration_link: "https://www.spaceappschallenge.org/",
      registration_end: "2026-10-01 23:59:59",
      tags: "NASA, Space, Data Science"
    },
    {
      title: "Smart India Hackathon (SIH) 2026",
      organizer: "Government of India",
      description: "World's biggest open innovation model to provide students with a platform to solve some of the pressing problems we face in our daily lives.",
      theme: "National Progress",
      mode: "offline",
      difficulty: "intermediate",
      prize_pool: "₹1,00,00,000 Total",
      prize_amount: 10000000,
      registration_link: "https://www.sih.gov.in/",
      registration_end: "2026-08-30 23:59:59",
      tags: "GovTech, India, Hardware"
    },
    {
      title: "Chainlink Constellation 2026",
      organizer: "Chainlink Labs",
      description: "Build the next generation of hybrid smart contracts using Chainlink's decentralized oracle network.",
      theme: "Web3 & Blockchain",
      mode: "online",
      difficulty: "advanced",
      prize_pool: "$500,000",
      prize_amount: 40000000,
      registration_link: "https://chain.link/hackathon",
      registration_end: "2026-11-15 23:59:59",
      tags: "Web3, Blockchain, DeFi"
    },
    {
      title: "HackMIT 2026",
      organizer: "MIT",
      description: "MIT's premier undergraduate hackathon, bringing together 1000+ students to hack on innovative projects.",
      theme: "General Innovation",
      mode: "offline",
      difficulty: "open",
      prize_pool: "$25,000",
      prize_amount: 2000000,
      registration_link: "https://hackmit.org/",
      registration_end: "2026-09-10 23:59:59",
      tags: "MIT, Student, Premier"
    }
  ];

  try {
    for (const h of hackathons) {
      const [existing] = await pool.execute("SELECT id FROM hackathons WHERE title = ?", [h.title]);
      if (existing.length === 0) {
        await pool.execute(`
          INSERT INTO hackathons 
          (title, organizer, description, theme, mode, difficulty, prize_pool, prize_amount, registration_link, registration_end, tags, featured)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          h.title, h.organizer, h.description, h.theme, h.mode, h.difficulty, 
          h.prize_pool, h.prize_amount, h.registration_link, h.registration_end, 
          h.tags, true
        ]);
        console.log(`Added: ${h.title}`);
      } else {
        console.log(`Skipped (Exists): ${h.title}`);
      }
    }
    console.log("\n✅ Platform populated with fresh opportunities!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

populate();
