export default async function handler(req, res) {
  // CORS headers (allow browser to call this endpoint)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { university, password } = req.body;

  // Password check — reads from Vercel environment variable
  const TEAM_PASSWORD = process.env.TEAM_PASSWORD || 'uniscope2025';
  if (!password || password !== TEAM_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!university || university.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter a university name' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server not configured. Contact admin.' });
  }

  const prompt = `You are a university information expert. The user searched for: "${university.trim()}"

Return a comprehensive JSON object with accurate, specific data about this university.
If exact figures are unavailable, provide realistic estimates based on the university's type, country, and reputation.
Return ONLY valid JSON — no markdown fences, no explanation, no preamble.

{
  "university_name": "Full official name of the university",
  "country": "Country name",
  "city": "City name",
  "type": "Public or Private or Research University",
  "established": "Year as string e.g. 1851",
  "website": "https://official-website.edu",
  "tagline": "One sentence describing the university's key distinction or reputation",
  "rankings": {
    "qs_world": "e.g. #5 or Not Ranked",
    "times_world": "e.g. #8 or Not Ranked",
    "us_news": "e.g. #12 or Not Ranked",
    "national_rank": "e.g. #2 in UK or #1 in Canada",
    "subject_strengths": ["e.g. Engineering #3 globally", "Business #10 globally", "Medicine #5 in UK"]
  },
  "tuition_fees": {
    "currency": "USD or GBP or EUR or AUD or CAD or INR etc.",
    "undergrad_domestic": "e.g. $12,000/yr or Free (EU students) or £9,250/yr",
    "undergrad_international": "e.g. $45,000/yr or £28,000–38,000/yr",
    "postgrad_domestic": "e.g. $15,000/yr or £10,000/yr",
    "postgrad_international": "e.g. $38,000/yr or £22,000–32,000/yr",
    "mba": "e.g. $65,000 total program or N/A",
    "living_costs": "e.g. $18,000–22,000/yr or £14,000–18,000/yr"
  },
  "admission_requirements": {
    "undergrad_gpa": "e.g. 3.8+ GPA or A*AA (A-levels) or 90%+ marks",
    "postgrad_gpa": "e.g. 3.5+ GPA or First Class / 2:1 Honours degree",
    "english_ielts": "e.g. 6.5 overall, no band below 6.0",
    "english_toefl": "e.g. 90 iBT or 100 iBT",
    "gre_gmat": "e.g. GRE 315+ or GMAT 650+ or Not required",
    "work_exp_pg": "e.g. 2+ years for MBA or Not required for taught Masters",
    "acceptance_rate": "e.g. 17% or Highly competitive",
    "application_deadline": "e.g. Jan 15 (Regular Decision), Nov 1 (Early Action)"
  },
  "scholarships": [
    {
      "name": "Official scholarship name",
      "amount": "e.g. Full tuition + £18,000 living stipend/yr or 50% tuition waiver",
      "eligibility": "Who qualifies — nationality, GPA, field of study etc.",
      "renewable": true
    },
    {
      "name": "Second scholarship name",
      "amount": "e.g. $10,000–25,000/yr merit award",
      "eligibility": "Academic excellence, typically top 10% of applicants",
      "renewable": false
    }
  ],
  "loan_providers": [
    {
      "name": "Loan provider or program name",
      "type": "Government or Private or University or Bank",
      "coverage": "e.g. Up to $20,500/yr or Full tuition + living",
      "interest": "e.g. 4.5%–7.0% or Prime + 1%",
      "notes": "Key eligibility — citizenship, enrollment, cosigner requirements etc."
    }
  ],
  "popular_courses": [
    "Computer Science (BSc/MSc)",
    "Business Administration (MBA)",
    "Electrical Engineering (BEng)",
    "Data Science (MSc)",
    "Law (LLB/LLM)",
    "Medicine (MBBS/MD)"
  ],
  "notable_alumni": [
    "Full Name (Achievement/Role)",
    "Full Name (Achievement/Role)",
    "Full Name (Achievement/Role)"
  ],
  "student_population": "e.g. 24,000 students (18,000 UG, 6,000 PG)",
  "campus_size": "e.g. 65 acres urban campus or Sprawling 1,500 acre campus",
  "research_output": "e.g. Top 10 globally for research citations, £600M annual research income",
  "accreditations": ["AACSB", "EQUIS", "AMBA", "QAA"]
}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2500,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errData = await geminiRes.json();
      console.error('Gemini API error:', errData);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up any accidental markdown fences
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response as JSON');

    const uniData = JSON.parse(jsonMatch[0]);
    return res.status(200).json(uniData);

  } catch (err) {
    console.error('Search handler error:', err.message);
    return res.status(500).json({
      error: 'Failed to fetch university data. Please try again in a moment.'
    });
  }
}
