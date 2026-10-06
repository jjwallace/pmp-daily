import type { CaseStudy, Question } from '../types';

export const CASES: CaseStudy[] = [
  {
    id: 'case-clinic',
    title: 'Clinic scheduling app',
    scenario:
      'You lead a hybrid project to build a patient scheduling app for a regional clinic network. The mobile app is built in two-week sprints; integration with the hospital\'s legacy records system follows a predictive plan with a fixed go-live date set by a regulator. The clinic directors (12 sites) were not involved in early design. After sprint 3, two directors say the booking flow "doesn\'t fit how our front desks work."',
    graphic: {
      kind: 'bars', title: 'Velocity (story points)', labels: ['S1', 'S2', 'S3'], values: [18, 24, 26], unit: 'pts',
    },
  },
  {
    id: 'case-plant',
    title: 'Solar plant construction',
    scenario:
      'You manage a predictive project to build a 20 MW solar plant. BAC is $8M. At month 6 of 12, the cost report shows EV = $3.2M, AC = $3.6M, PV = $4.0M. A new national rule requires panel recycling plans, and a key supplier is located in a region facing export restrictions.',
    graphic: {
      kind: 'table', title: 'Month 6 status ($M)',
      headers: ['Metric', 'Value'],
      rows: [['BAC', 8.0], ['PV', 4.0], ['EV', 3.2], ['AC', 3.6]],
    },
  },
  {
    id: 'case-bank',
    title: 'Bank onboarding redesign',
    scenario:
      'An agile team of 8 is redesigning digital onboarding for a bank. The product owner is shared with another product and often unavailable. Compliance requires that every release pass a know-your-customer (KYC) review. Work items are flowing slowly and customers are abandoning onboarding at the identity verification step.',
    graphic: {
      kind: 'kanban', title: 'Onboarding team board',
      columns: [
        { id: 'backlog', name: 'Ready', cards: 9 },
        { id: 'dev', name: 'In Dev', wip: 4, cards: 4 },
        { id: 'kyc', name: 'KYC Review', wip: 2, cards: 7 },
        { id: 'release', name: 'Release', cards: 0 },
      ],
    },
  },
  {
    id: 'case-erp',
    title: 'ERP rollout',
    scenario:
      'Your company is replacing its finance system with a cloud ERP across 4 countries. The vendor is on a time-and-materials contract with a not-to-exceed cap. The finance staff are anxious: the new system automates reconciliations they do by hand. The sponsor wants all countries live in one big-bang cutover in 9 months.',
  },
  {
    id: 'case-game',
    title: 'Mobile game launch',
    scenario:
      'You support a distributed agile team (Lisbon, Austin, Manila) building a mobile game. Release is in 6 sprints. The art lead in Manila is the only one who knows the asset pipeline. Daily standups are at 9am Austin time, which is 10pm in Manila. Engagement scores from the Manila team dropped sharply this quarter.',
    graphic: {
      kind: 'burndown', title: 'Release burndown (points)', days: 6, total: 180,
      actual: [180, 150, 125, 110, null, null, null], unit: 'pts',
    },
  },
  {
    id: 'case-gov',
    title: 'Government permit portal',
    scenario:
      'A city government hires your firm under a firm fixed-price contract to deliver an online permit portal. Midway, the city council passes an accessibility ordinance requiring WCAG 2.2 AA for all public sites. The city\'s project liaison asks your developers directly to "just add a few accessibility fixes" without any paperwork.',
  },
];

export const CASE_QUESTIONS: Question[] = [
  // ── Clinic ──
  {
    id: 'cs-clinic-1', caseId: 'case-clinic', domain: 'people', task: 4, approach: 'hybrid', difficulty: 2, type: 'single',
    stem: 'What should you do FIRST about the directors\' feedback?',
    options: [
      'Ask the team to redesign the flow immediately',
      'Analyze the directors as stakeholders and engage them, e.g., with a front-desk observation session and sprint review invites',
      'Tell the directors the design is already approved',
      'Escalate to the regulator',
    ],
    answer: 1,
    explanation: 'The directors were missed in stakeholder analysis. Engage them directly to understand their workflow before changing the backlog.',
  },
  {
    id: 'cs-clinic-2', caseId: 'case-clinic', domain: 'process', task: 8, approach: 'hybrid', difficulty: 2, type: 'single',
    stem: 'Using the velocity chart, about how many points of remaining app work can the team complete in the next 4 sprints before integration testing must start?',
    options: ['About 100 points', 'About 72 points', 'About 140 points', 'About 26 points'],
    answer: 0,
    explanation: 'Recent velocity is stabilizing around 24–26. 4 × ~25 ≈ 100 points. Using the average of all three sprints (≈22.7) would give ~91, so ~100 is the best estimate given the trend.',
  },
  {
    id: 'cs-clinic-3', caseId: 'case-clinic', domain: 'business', task: 3, approach: 'hybrid', difficulty: 3, type: 'single',
    stem: 'The directors\' requested changes would alter the data fields sent to the legacy records system, which is under predictive change control. What is the BEST approach?',
    options: [
      'Change the app backlog only; integration will adapt',
      'Add app changes to the backlog, and raise a formal change request for the integration interface with impact analysis on the regulatory go-live',
      'Reject the directors\' changes because of the fixed date',
      'Delay the go-live without telling the regulator',
    ],
    answer: 1,
    explanation: 'In a hybrid setting, each part follows its own change mechanism. The backlog handles app changes; the baselined integration needs formal change control.',
  },
  // ── Solar plant ──
  {
    id: 'cs-plant-1', caseId: 'case-plant', domain: 'process', task: 6, approach: 'predictive', difficulty: 2, type: 'single',
    stem: 'What are the CPI and SPI at month 6?',
    options: ['CPI 0.89, SPI 0.80', 'CPI 0.80, SPI 0.89', 'CPI 1.13, SPI 1.25', 'CPI 0.90, SPI 0.90'],
    answer: 0,
    explanation: 'CPI = EV/AC = 3.2/3.6 ≈ 0.89. SPI = EV/PV = 3.2/4.0 = 0.80. Over budget and behind schedule.',
  },
  {
    id: 'cs-plant-2', caseId: 'case-plant', domain: 'process', task: 6, approach: 'predictive', difficulty: 3, type: 'single',
    stem: 'If current cost performance continues, what is the estimate at completion (EAC)?',
    options: ['About $9.0M', 'About $8.4M', 'About $10.0M', 'About $7.2M'],
    answer: 0,
    explanation: 'EAC = BAC/CPI = 8.0/0.889 ≈ $9.0M, about $1M over budget.',
  },
  {
    id: 'cs-plant-3', caseId: 'case-plant', domain: 'business', task: 8, approach: 'predictive', difficulty: 2, type: 'multi',
    stem: 'Which TWO actions BEST address the external environment changes described?',
    options: [
      'Assess the recycling rule\'s impact on scope and cost, and raise a change request',
      'Add the supplier export risk to the risk register and plan responses, e.g., alternative sourcing',
      'Wait until the plant is finished to deal with recycling',
      'Ask the supplier to ignore export rules',
      'Reduce the plant to 15 MW without approval',
    ],
    answer: [0, 1],
    explanation: 'Survey and assess external changes, take scope impacts through change control, and treat supply threats as risks with planned responses.',
  },
  // ── Bank ──
  {
    id: 'cs-bank-1', caseId: 'case-bank', domain: 'process', task: 9, approach: 'agile', difficulty: 2, type: 'hotspot',
    stem: 'Tap the column that is constraining the team\'s flow.',
    graphic: {
      kind: 'kanban', title: 'Onboarding team board',
      columns: [
        { id: 'backlog', name: 'Ready', cards: 9 },
        { id: 'dev', name: 'In Dev', wip: 4, cards: 4 },
        { id: 'kyc', name: 'KYC Review', wip: 2, cards: 7 },
        { id: 'release', name: 'Release', cards: 0 },
      ],
    },
    answer: 'kyc',
    explanation: 'KYC Review holds 7 items against a WIP limit of 2 and nothing reaches Release. That is the constraint.',
  },
  {
    id: 'cs-bank-2', caseId: 'case-bank', domain: 'business', task: 2, approach: 'agile', difficulty: 3, type: 'single',
    stem: 'What is the BEST way to keep KYC compliance while improving flow?',
    options: [
      'Skip KYC review for small changes',
      'Involve compliance earlier: add KYC criteria to the Definition of Done and have a compliance reviewer pair with the team during development',
      'Batch all items into a quarterly KYC review',
      'Raise the KYC WIP limit to 10',
    ],
    answer: 1,
    explanation: 'Shifting compliance left keeps the requirement while removing a late-stage queue. Raising WIP limits hides the problem.',
  },
  {
    id: 'cs-bank-3', caseId: 'case-bank', domain: 'people', task: 4, approach: 'agile', difficulty: 2, type: 'single',
    stem: 'The product owner\'s low availability is delaying decisions. What should the project manager do?',
    options: [
      'Make product decisions themselves',
      'Discuss the impact with the product owner and their manager, and agree on dedicated availability or a delegated proxy with clear decision rights',
      'Let developers decide priorities',
      'Pause the team until the product owner is free',
    ],
    answer: 1,
    explanation: 'Product owner availability is critical. Make the impact visible and agree on a solution, such as dedicated time or an empowered proxy.',
  },
  // ── ERP ──
  {
    id: 'cs-erp-1', caseId: 'case-erp', domain: 'business', task: 7, approach: 'hybrid', difficulty: 2, type: 'single',
    stem: 'How should you address the finance staff\'s anxiety?',
    options: [
      'Tell them automation is not their concern',
      'Assess the change impact, plan change management with HR (communication, reskilling, champions), and involve them in testing',
      'Delay communication until go-live',
      'Exclude finance staff from the project',
    ],
    answer: 1,
    explanation: 'Supporting organizational change means assessing the people impact and planning communication, training, and involvement.',
  },
  {
    id: 'cs-erp-2', caseId: 'case-erp', domain: 'process', task: 1, approach: 'hybrid', difficulty: 3, type: 'single',
    stem: 'What delivery strategy should you recommend to the sponsor?',
    options: [
      'Big-bang cutover in all 4 countries as requested',
      'A phased rollout starting with a pilot country, using lessons to reduce risk for later countries',
      'Let each country pick a different ERP',
      'Delay the project a year',
    ],
    answer: 1,
    explanation: 'Recommending an execution strategy based on complexity and risk is a Process task. A pilot and phased rollout reduces risk and delivers value incrementally.',
  },
  {
    id: 'cs-erp-3', caseId: 'case-erp', domain: 'process', task: 5, approach: 'hybrid', difficulty: 2, type: 'single',
    stem: 'Vendor hours are trending to exceed the not-to-exceed cap by month 7. What should you do?',
    options: [
      'Let the vendor continue and pay the overage',
      'Review vendor performance and burn rate, then negotiate scope priorities or a contract change before the cap is reached',
      'Stop paying the vendor',
      'Hide the trend from the sponsor',
    ],
    answer: 1,
    explanation: 'Managing suppliers and contracts proactively, before the cap is hit, keeps options open and avoids disputes.',
  },
  // ── Game ──
  {
    id: 'cs-game-1', caseId: 'case-game', domain: 'process', task: 9, approach: 'agile', difficulty: 2, type: 'hotspot',
    stem: 'Tap the sprint where burn slowed the most.',
    graphic: {
      kind: 'burndown', title: 'Release burndown (points)', days: 6, total: 180,
      actual: [180, 150, 125, 110, null, null, null], unit: 'pts',
    },
    answer: 'd3',
    explanation: 'Burn per sprint: 30, 25, then only 15 in sprint 3. The slowdown is at point 3.',
  },
  {
    id: 'cs-game-2', caseId: 'case-game', domain: 'people', task: 7, approach: 'agile', difficulty: 2, type: 'single',
    stem: 'What should you do about the asset pipeline knowledge?',
    options: [
      'Nothing; the art lead is reliable',
      'Set up pairing and recorded walkthroughs so at least two more people can run the pipeline',
      'Ask the art lead to write a 100-page manual alone',
      'Replace the pipeline',
    ],
    answer: 1,
    explanation: 'A single point of knowledge is a risk. Pairing transfers tacit knowledge, and recordings capture explicit knowledge.',
  },
  {
    id: 'cs-game-3', caseId: 'case-game', domain: 'people', task: 3, approach: 'agile', difficulty: 3, type: 'single',
    stem: 'What is the MOST likely contributor to the Manila team\'s drop in engagement, and the best fix?',
    options: [
      'Low salaries; ask HR for raises',
      'Meeting times that always burden Manila; rotate standup times or use async standups so the burden is shared',
      'Lack of skills; send them to training',
      'Too many sprints; make sprints longer',
    ],
    answer: 1,
    explanation: 'Fairness across time zones matters. Rotating meeting times or using async updates shows respect for all locations.',
  },
  // ── Gov ──
  {
    id: 'cs-gov-1', caseId: 'case-gov', domain: 'business', task: 3, approach: 'predictive', difficulty: 2, type: 'single',
    stem: 'How should you respond to the liaison\'s request?',
    options: [
      'Let the developers make the fixes to keep the client happy',
      'Explain the change process, document the request, and analyze the impact of the ordinance on scope, cost, and schedule',
      'Refuse to discuss accessibility',
      'Make the fixes and bill later without agreement',
    ],
    answer: 1,
    explanation: 'Under a fixed-price contract, scope changes must go through formal change control. Informal additions are scope creep and erode margin.',
  },
  {
    id: 'cs-gov-2', caseId: 'case-gov', domain: 'business', task: 2, approach: 'predictive', difficulty: 3, type: 'single',
    stem: 'The ordinance applies to all public sites by law. How should this be classified and handled?',
    options: [
      'As an optional enhancement',
      'As a regulatory compliance requirement; assess the compliance gap and handle the contract impact through a formal change (contract modification)',
      'As a defect your firm must fix for free',
      'As a risk to accept',
    ],
    answer: 1,
    explanation: 'It is a new regulatory requirement imposed after contract award. It is mandatory, but it changes contracted scope, so a contract change is appropriate.',
  },
  {
    id: 'cs-gov-3', caseId: 'case-gov', domain: 'process', task: 5, approach: 'predictive', difficulty: 2, type: 'single',
    stem: 'Who has the authority to approve changes to the contract on the buyer\'s side?',
    options: ['The procurement administrator/contracting officer named in the contract', 'The project liaison', 'Your developers', 'The city\'s end users'],
    answer: 0,
    explanation: 'Only the authorized contracting authority can modify the contract. A liaison\'s informal request does not change contractual obligations.',
  },
];
