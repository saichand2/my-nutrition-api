import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/nutrition", async (req, res) => {
  const { meal } = req.body;
  if (!meal) return res.status(400).json({ error: "Meal is required" });

  try {
    const prompt = `You are a nutritionist. Analyze the following meal and provide the total calories, protein (g), carbs (g), and fat (g). 
If the meal has more than one food item, provide nutrition for each item separately as well as the total.

Meal: ${meal}

Respond strictly in JSON format like this:

{
  "total": {"calories": 600, "protein": 35, "carbs": 70, "fat": 20},
  "items": [
    {"name": "200g chicken", "calories": 400, "protein": 30, "carbs": 0, "fat": 10},
    {"name": "2 rotis", "calories": 200, "protein": 5, "carbs": 30, "fat": 2}
  ]
}`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawContent = response.data.choices[0].message.content;

    // Safe JSON parsing
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/); // match first { ... } block
    if (!jsonMatch) {
      console.error("AI response could not be parsed as JSON:", rawContent);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const nutritionData = JSON.parse(jsonMatch[0]);
    res.json(nutritionData);
  } catch (err) {
    console.error("Error fetching nutrition info:", err);
    res.status(500).json({ error: "Failed to fetch nutrition info" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

