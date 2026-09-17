// Reference content for the "Operating System" tab. Static reference text.
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
          questions: [
            "If your work made no money and carried no title, what would you still want it to accomplish?",
            "What problem do you find yourself returning to, unprompted, across different roles and decades?",
            "Whose life is measurably different because you exist in it?",
            "What would you want said about you by someone who worked with you 15 years ago?",
          ],
          record: "One sentence, plainly worded. Below it, 3–4 bullet points of evidence from your actual life that make the sentence credible. Date every revision — the drift between versions is data.",
        },
        {
          n: 2,
          title: "Values in Action",
          why: "A list of abstract nouns changes nothing. Values only earn their keep when they can resolve a hard trade-off, which means each one needs a stated cost.",
          questions: [
            "Name a time you paid a real price — money, status, a relationship — to hold a line. What were you protecting?",
            "Which of your stated values has your calendar contradicted in the last 90 days?",
            "When two of your values collide (loyalty vs. honesty, ambition vs. presence), which reliably wins?",
            "What behaviour in others makes you lose respect instantly? Your values are usually the inverse.",
          ],
          record: "5–7 values maximum. For each: a one-line definition in your own words, the behaviour that proves it, and the trade-off you accept to keep it.",
        },
        {
          n: 3,
          title: "Signature Strengths",
          why: "Most people underweight what comes easily to them because it feels unremarkable. That blind spot is where your leverage is hiding.",
          questions: [
            "What do people consistently ask you for help with, even outside your job description?",
            "What can you do well while tired, distracted, or under-prepared?",
            "Which of your strengths becomes a liability when overused?",
            "What have you gotten better at in the last three years without deliberately trying?",
          ],
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
          why: "This replaces Interests, What I Enjoy, and What I Don't Enjoy. Sources and drains are only meaningful side by side — the ratio between them predicts burnout far earlier than workload does.",
          questions: [
            "What activity makes you lose track of time, and what is the underlying mechanic of it (solving? building? persuading? teaching?)",
            "Which recurring commitment do you feel relief about when it's cancelled?",
            "What drains you that you've convinced yourself you should enjoy?",
            "What did you love at 12 that you've quietly abandoned?",
            "Which drains are structural (fixable by design) versus inherent (the price of the work)?",
          ],
          record: "Two columns — Sources and Drains. Tag each drain as eliminate, delegate, redesign, or accept. Untagged drains are just complaints.",
        },
        {
          n: 5,
          title: "Impact & Contribution",
          why: "This is your missing category, and it's the one that most reliably makes decisions easier. It replaces “personal brand” with something you can act on: the specific difference you want to make in specific people.",
          questions: [
            "Who are the three groups of people you most want to be useful to, and why those three?",
            "What do you want someone to walk away with after an hour with you?",
            "Where does your contribution currently stop short of what you're capable of?",
            "What legacy would still matter to you if nobody ever attributed it to you?",
          ],
          record: "Your 3 audiences, the contribution you're making to each, and an honest gap assessment per audience.",
        },
        {
          n: 6,
          title: "How I Want to Be Experienced",
          why: "Your renamed Personal Brand. Reputation isn't something you declare — it's the residue of repeated behaviour. The value is in comparing the intended experience to the actual one.",
          questions: [
            "What three words would you want a colleague to use about you when you're not in the room?",
            "What three words would they actually use today?",
            "What specific behaviour creates the gap between those two sets?",
            "Where are you performing a version of yourself that costs you energy to maintain?",
          ],
          record: "Intended words, observed words (gather real feedback at least yearly), the gap, and one behavioural commitment to close it.",
        },
        {
          n: 7,
          title: "Direction & Horizons",
          why: "Purpose without a horizon becomes philosophy. This is where identity converts into goals — and it's the section that connects this framework to the rest of your app.",
          questions: [
            "Describe an ordinary Wednesday three years from now, in detail. What's different?",
            "What are you currently optimising for that you'll regret optimising for?",
            "What would you attempt if you knew the reputational risk was survivable?",
            "Which door is quietly closing, and does that bother you?",
          ],
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
          why: "Your Growth Areas category, deliberately narrowed. A list of twelve weaknesses is a list of zero improvements. Two at a time is the honest capacity.",
          questions: [
            "What feedback have you received more than once and dismissed both times?",
            "Which skill gap will most constrain the 3-year picture you just wrote?",
            "What are you avoiding because you'd be bad at it initially?",
            "Which growth area is genuinely worth fixing, and which should you just design around?",
          ],
          record: "Maximum two active edges. Each with: the specific behaviour to change, how you'll know it worked, and a review date. Everything else goes to a parked list.",
        },
        {
          n: 9,
          title: "Operating Principles",
          why: "The output layer. Once identity is defined, it should compress into rules that let you decide fast without re-litigating your values every time. This is what makes the whole system practical rather than reflective.",
          questions: [
            "What decision do you keep remaking? What rule would end it permanently?",
            "What do you always say yes to and regret?",
            "What are your non-negotiables — the ones you'd hold even at real cost?",
          ],
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
