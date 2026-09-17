// Reference content for the "Operating System" tab. Static reference text.
// Each section is distilled to a single essential question.
window.OS_CONTENT = {
  title: "The Personal Operating System",
  layers: [
    {
      title: "Layer 1 — Core Identity",
      cadence: "review annually",
      sections: [
        {
          n: 1,
          title: "Purpose Statement",
          why: "Purpose is the only thing that stays stable when your job, city, or circumstances change. Without it, every career decision restarts from zero.",
          question: "If money and titles didn't exist, what would you still want your work to accomplish?",
          record: "One sentence, plainly worded. Below it, 3–4 bullet points of evidence from your actual life that make the sentence credible. Date every revision — the drift between versions is data.",
        },
        {
          n: 2,
          title: "Values in Action",
          why: "A list of abstract nouns changes nothing. Values only earn their keep when they can resolve a hard trade-off, which means each one needs a stated cost.",
          question: "What have you paid a real price to protect — and would again?",
          record: "5–7 values maximum. For each: a one-line definition in your own words, the behaviour that proves it, and the trade-off you accept to keep it.",
        },
        {
          n: 3,
          title: "Signature Strengths",
          why: "Most people underweight what comes easily to them because it feels unremarkable. That blind spot is where your leverage is hiding.",
          question: "What do people consistently come to you for, even outside your job description?",
          record: "4–6 strengths, each with a concrete example and a note on its overuse failure mode.",
        },
      ],
    },
    {
      title: "Layer 2 — Energy and Direction",
      cadence: "review quarterly",
      sections: [
        {
          n: 4,
          title: "Energy Audit",
          why: "Sources and drains are only meaningful side by side — the ratio between them predicts burnout far earlier than workload does.",
          question: "What reliably gives you energy, and what reliably drains it?",
          record: "Two columns — Sources and Drains. Tag each drain as eliminate, delegate, redesign, or accept. Untagged drains are just complaints.",
        },
        {
          n: 5,
          title: "Impact & Contribution",
          why: "This replaces “personal brand” with something you can act on: the specific difference you want to make in specific people.",
          question: "Who do you most want to be useful to, and what do they get from you?",
          record: "Your 3 audiences, the contribution you're making to each, and an honest gap assessment per audience.",
        },
        {
          n: 6,
          title: "How I Want to Be Experienced",
          why: "Reputation isn't something you declare — it's the residue of repeated behaviour. The value is in comparing the intended experience to the actual one.",
          question: "What three words would you want people to use about you when you're not in the room?",
          record: "Intended words, observed words (gather real feedback at least yearly), the gap, and one behavioural commitment to close it.",
        },
        {
          n: 7,
          title: "Direction & Horizons",
          why: "Purpose without a horizon becomes philosophy. This is where identity converts into goals — and it's the section that connects this framework to the rest of your app.",
          question: "Describe an ordinary Wednesday three years from now — what's different?",
          record: "A 10-year direction (broad, one paragraph), a 3-year picture (specific and sensory), and 1-year priorities across career, relationships, health, and finances. Every goal elsewhere in your app should trace back to a line here.",
        },
      ],
    },
    {
      title: "Layer 3 — Execution",
      cadence: "review monthly",
      sections: [
        {
          n: 8,
          title: "Growth Edges",
          why: "A list of twelve weaknesses is a list of zero improvements. Two at a time is the honest capacity.",
          question: "What single change would most unlock the next three years?",
          record: "Maximum two active edges. Each with: the specific behaviour to change, how you'll know it worked, and a review date. Everything else goes to a parked list.",
        },
        {
          n: 9,
          title: "Operating Principles",
          why: "Once identity is defined, it should compress into rules that let you decide fast without re-litigating your values every time. This is what makes the whole system practical rather than reflective.",
          question: "What are your “I do / I don't” rules for deciding fast?",
          record: "5–10 short rules in “I do / I don't” form. Examples of the shape: I don't take meetings before 9am. I say no to anything I can't be excellent at. Review after any decision you regret.",
        },
      ],
    },
  ],
  review: {
    title: "Review rhythm",
    rows: [
      { cadence: "Monthly", sections: "8, 9", trigger: "Did my behaviour match my principles?" },
      { cadence: "Quarterly", sections: "4, 5, 6, 7", trigger: "Where did my energy and calendar diverge from my direction?" },
      { cadence: "Annually", sections: "1, 2, 3", trigger: "Has who I am actually changed, or just what I'm doing?" },
      { cadence: "Event-driven", sections: "Any", trigger: "Job change, loss, major decision, or a regret worth examining" },
    ],
  },
  logic: "Layer 1 rarely changes and anchors everything. Layer 2 sets direction. Layer 3 governs daily behaviour. When something feels off in your life, diagnose upward — misalignment at the execution layer is almost always a symptom of an unresolved question a layer above.",
};
