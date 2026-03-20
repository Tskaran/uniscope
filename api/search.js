export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { university, password } = req.body;
  const TEAM_PASSWORD = process.env.TEAM_PASSWORD || 'Team2025';
  if (!password || password !== TEAM_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  if (!university || university.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter a university name' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server not configured. Contact admin.' });
  }

  const prompt = `You are a university admissions expert specializing in Indian students going abroad. The user searched for: "${university.trim()}"

Return a comprehensive JSON object. Be thorough — list ALL scholarships and ALL loan providers including Indian banks.
Return ONLY valid JSON — no markdown fences, no explanation, no preamble.

{
  "university_name": "Full official name",
  "country": "Country",
  "city": "City",
  "type": "Public or Private or Research University",
  "established": "Year",
  "website": "https://official.edu",
  "tagline": "One sentence describing the university",

  "rankings": {
    "qs_world": "#5 or Not Ranked",
    "times_world": "#8 or Not Ranked",
    "us_news": "#12 or Not Ranked",
    "national_rank": "#2 in UK",
    "subject_strengths": ["Engineering #3 globally", "Business #10 globally"]
  },

  "intakes": {
    "available": ["September 2025", "January 2026"],
    "main_intake": "September",
    "application_open": "October 1 (for Sep intake)",
    "deadlines_by_intake": [
      { "intake": "September 2025", "deadline": "January 31 2025 (Early), May 31 2025 (Final)" },
      { "intake": "January 2026", "deadline": "September 30 2025" }
    ],
    "early_application_discount": "2000 GBP tuition discount if applied before Dec 1 or No discount"
  },

  "tuition_fees": {
    "currency": "GBP or USD or EUR or AUD or CAD",
    "undergrad_domestic": "9250 GBP/yr",
    "undergrad_international": "22000-32000 GBP/yr",
    "postgrad_domestic": "10000 GBP/yr",
    "postgrad_international": "18000-28000 GBP/yr",
    "mba": "35000 GBP total or N/A",
    "living_costs": "12000-16000 GBP/yr",
    "application_fee": "20 GBP or Free",
    "application_fee_waiver": "Waived for early applicants before Dec 1 or Waived for Indian students or No waiver available or Free — no application fee"
  },

  "admission_requirements": {
    "undergrad_gpa": "A*AA (A-levels) or 85%+ marks",
    "undergrad_indian_cgpa": "8.5+/10 CGPA or 85%+ in Class 12",
    "postgrad_gpa": "First Class or 2:1 Honours",
    "postgrad_indian_cgpa": "6.5+/10 CGPA or 65%+ aggregate",
    "backlogs_allowed": "0 active backlogs (history considered case by case) or Up to 5 total backlogs or No official policy — assessed case by case",
    "interview_required": "Yes or No or Sometimes (shortlisted only)",
    "interview_format": "Panel interview 20-30 min or Video via HireVue or Not required",
    "english_ielts": "6.5 overall, no band below 6.0",
    "ielts_waiver": "Waived for Indian students from English-medium institutions or No waiver — IELTS mandatory",
    "english_toefl": "90 iBT",
    "english_pte": "58 overall",
    "english_duolingo": "110+ or Not accepted",
    "dat": "DAT 18+ for Dentistry or Not applicable",
    "gre_gmat": "GRE 315+ or GMAT 650+ or Not required",
    "ucas_required": "Yes — apply via UCAS or No — apply directly or Not applicable",
    "ucas_code": "G100 for Computer Science or N/A",
    "work_exp_pg": "2+ years for MBA or Not required",
    "acceptance_rate": "17%",
    "application_deadline": "Jan 15 (Regular), Nov 1 (Early)"
  },

  "scholarships": [
    {
      "name": "Official scholarship name",
      "amount": "Full tuition + 18000 GBP stipend or 50% waiver or 5000 USD",
      "eligibility": "Nationality, GPA, field, year details",
      "open_to_indian_students": true,
      "renewable": true,
      "deadline": "January 31 or Rolling",
      "note": "Automatically considered or Separate application needed"
    }
  ],

  "loan_providers": [
    {
      "name": "Provider name",
      "type": "Indian Bank or International Private or Government",
      "coverage": "Up to 1.5 Cr INR or Up to 50000 USD/yr",
      "interest_rate": "9.5-11% p.a. or SOFR+2%",
      "collateral": "Required above 7.5 lakh or Not required",
      "cosigner_required": "Yes or No or Optional",
      "processing_time": "2-4 weeks",
      "notes": "Key conditions — admission letter, Indian citizen etc.",
      "applies_to_country": "Any country or UK only"
    }
  ],

  "courses": {
    "undergraduate": [
      { "name": "BSc Computer Science", "duration": "3 years", "intake": "September", "deadline": "January 31" },
      { "name": "BEng Mechanical Engineering", "duration": "4 years", "intake": "September", "deadline": "January 31" },
      { "name": "BPharm Pharmacy", "duration": "4 years", "intake": "September", "deadline": "March 31" },
      { "name": "MBBS Medicine", "duration": "5 years", "intake": "September", "deadline": "October 15 (UCAS)" },
      { "name": "BDS Dentistry", "duration": "5 years", "intake": "September", "deadline": "October 15 (UCAS)" },
      { "name": "BA Business Management", "duration": "3 years", "intake": "September/January", "deadline": "Rolling" }
    ],
    "postgraduate": [
      { "name": "MSc Data Science", "duration": "1 year", "intake": "September", "deadline": "June 30" },
      { "name": "MBA", "duration": "1-2 years", "intake": "September/January", "deadline": "May 31 / Oct 31" },
      { "name": "MSc Pharmaceutical Science", "duration": "1 year", "intake": "September", "deadline": "June 30" },
      { "name": "MSc Artificial Intelligence", "duration": "1 year", "intake": "September", "deadline": "May 31" },
      { "name": "LLM International Law", "duration": "1 year", "intake": "September", "deadline": "June 30" },
      { "name": "MSc Nursing", "duration": "1 year", "intake": "September", "deadline": "April 30" }
    ],
    "phd": [
      { "name": "PhD Computer Science", "duration": "3-4 years", "intake": "Rolling", "deadline": "Rolling" },
      { "name": "PhD Engineering", "duration": "3-4 years", "intake": "Rolling", "deadline": "Rolling" }
    ]
  },

  "popular_courses": ["MSc Data Science", "MBA", "BEng Engineering", "BPharm Pharmacy"],
  "notable_alumni": ["Full Name (Achievement)", "Full Name (Achievement)", "Full Name (Achievement)"],
  "student_population": "24000 students",
  "international_students_percent": "38% international",
  "indian_students_present": "~2000 Indian students or Yes, active Indian student society",
  "campus_size": "65 acres urban campus",
  "research_output": "Top 10 globally for research citations",
  "accreditations": ["AACSB", "EQUIS", "AMBA", "QAA"],

  "student_support": {
    "indian_student_society": "Yes or No",
    "visa_support": "Dedicated international student visa support",
    "accommodation_guaranteed": "First year guaranteed on-campus accommodation",
    "career_services": "On-campus placement, 94% graduate employment rate"
  }
}

CRITICAL RULES:
1. SCHOLARSHIPS — List ALL: Chevening, Commonwealth, GREAT, DAAD, Endeavour, university merit, departmental, sports, need-based. Minimum 6-10 scholarships. Never stop at 2-3.
2. LOANS — ALWAYS include these Indian banks: SBI Scholar Loan, HDFC Credila, Axis Bank Education Loan, Avanse Financial Services, ICICI Bank Education Loan, Canara Bank Vidya Turant, Bank of Baroda Baroda Scholar, Union Bank of India, IDFC First Bank. Plus international: Prodigy Finance, MPOWER Financing if applicable.
3. COURSES — Include all faculties: Engineering, Business, Law, Medicine, Dentistry, Pharmacy, Nursing, Arts, Sciences, Architecture. Minimum 6 UG and 6 PG.
4. BACKLOGS — State exact policy if published. If not, say "No official policy — assessed case by case."
5. IELTS WAIVER — Many UK/Australian/Irish universities waive for Indian English-medium students. State clearly.
6. UCAS — Only for UK undergraduate. PG in UK = direct application. Non-UK = Not applicable.`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: 'You are a university admissions expert for Indian students going abroad. Respond with valid JSON only — no markdown, no explanation. Be comprehensive for scholarships and Indian bank loans.'
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!groqRes.ok) {
      const e = await groqRes.json();
      return res.status(502).json({ error: `AI error: ${e?.error?.message || 'Please retry'}` });
    }

    const groqData = await groqRes.json();
    const rawText = groqData?.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse response');

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Failed to fetch data. Please try again.' });
  }
}
