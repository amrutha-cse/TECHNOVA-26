const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("TECHNOVA '26 backend is running!");
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATABASE() AS databaseName");

    res.json({
      message: "Database connected successfully!",
      database: rows[0].databaseName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed." });
  }
});

// Register a participant
app.post("/api/register", async (req, res) => {
  const {
    full_name,
    mobile,
    email,
    college_name,
    branch,
    event_name,
    team_name,
    transaction_id,
  } = req.body;

  if (
    !full_name?.trim() ||
    !mobile?.trim() ||
    !email?.trim() ||
    !college_name?.trim() ||
    !branch?.trim() ||
    !event_name?.trim() ||
    !transaction_id?.trim()
  ) {
    return res.status(400).json({
      message: "Please fill in all required fields.",
    });
  }

  const allowedBranches = ["CSE", "AIDS", "ECE", "EEE"];
  const allowedEvents = [
    "CodeSprint",
    "WebCraft",
    "TechTalk",
    "BrainByte",
    "InnovateX",
  ];

  if (!allowedBranches.includes(branch) || !allowedEvents.includes(event_name)) {
    return res.status(400).json({
      message: "Please select a valid branch and event.",
    });
  }

  if (event_name === "InnovateX" && !team_name?.trim()) {
    return res.status(400).json({
      message: "Team name is required for InnovateX.",
    });
  }

  let conn;

  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    let role = null;
    let cleanedTeamName = null;

    if (event_name === "InnovateX") {
      cleanedTeamName = team_name.trim().replace(/\s+/g, " ");
      const normalizedName = cleanedTeamName.toLowerCase();

      // Lock the team row when it exists to protect the member limit.
      const [existingTeams] = await conn.query(
        "SELECT id, team_name FROM teams WHERE normalized_name = ? FOR UPDATE",
        [normalizedName]
      );

      let teamId;

      if (existingTeams.length === 0) {
        const [teamResult] = await conn.query(
          "INSERT INTO teams (team_name, normalized_name) VALUES (?, ?)",
          [cleanedTeamName, normalizedName]
        );

        teamId = teamResult.insertId;
        role = "Leader";
      } else {
        teamId = existingTeams[0].id;

        const [countRows] = await conn.query(
          "SELECT COUNT(*) AS memberCount FROM registrations WHERE event_name = 'InnovateX' AND LOWER(TRIM(team_name)) = ?",
          [normalizedName]
        );

        if (countRows[0].memberCount >= 4) {
          await conn.rollback();

          return res.status(400).json({
            message: "This team already has four participants.",
          });
        }

        role = "Member";
      }
    }

    const registrationId =
      "TN26-" + Date.now().toString().slice(-8) +
      Math.floor(100 + Math.random() * 900);

    await conn.query(
      `INSERT INTO registrations
       (registration_id, full_name, mobile, email, college_name, branch,
        event_name, team_name, transaction_id, team_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registrationId,
        full_name.trim(),
        mobile.trim(),
        email.trim(),
        college_name.trim(),
        branch,
        event_name,
        cleanedTeamName,
        transaction_id.trim(),
        role,
      ]
    );

    await conn.commit();

    res.status(201).json({
      message: "Registration successful!",
      registrationId,
      eventName: event_name,
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }

    console.error("Registration error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A team with this name already exists. Please try again.",
      });
    }

    res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// View registrations (used by the local participants dashboard)
app.get("/api/registrations", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT registration_id, full_name, mobile, email, college_name,
              branch, event_name, team_name, team_role, registered_at
       FROM registrations
       ORDER BY registered_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("Fetch registrations error:", error);
    res.status(500).json({
      message: "Unable to retrieve registrations.",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`TECHNOVA server running at http://localhost:${PORT}`);
});