import type { ReminderTemplateKey } from "@/domain/reminders";

export const WEBINAR_TEMPLATE_IDS = ["fthb", "investor", "self_employed"] as const;

export type WebinarTemplateId = (typeof WEBINAR_TEMPLATE_IDS)[number];

export type WebinarTemplateReminder = {
  templateKey: ReminderTemplateKey;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
};

export type WebinarTemplateConfig = {
  id: WebinarTemplateId;
  name: string;
  shortDescription: string;
  targetAudience: string;
  recommendedTitle: string;
  recommendedDescription: string;
  defaultHeadline: string;
  defaultSubheadline: string;
  defaultHeroBullets: string[];
  defaultAgenda: string[];
  defaultAgendaBodies: string[];
  defaultPresenterSectionPrompt: string;
  defaultCTA: string;
  defaultReminderEmailSubject: string;
  defaultReminderEmailBody: string;
  defaultReminderSms: string;
  defaultNoShowFollowUp: string;
  defaultAttendedFollowUp: string;
  defaultFaqs: Array<{
    question: string;
    answer: string;
  }>;
  reminders: WebinarTemplateReminder[];
};

const sharedConfirmationBody = `Hi {{first_name}},

You're registered for "{{title}}" with {{host}}.

We'll send a few short reminders so you don't miss it. Bring your questions and anything you're unsure about.

Join link: {{join_link}}

— {{host}}`;

export const WEBINAR_TEMPLATES: Record<WebinarTemplateId, WebinarTemplateConfig> = {
  fthb: {
    id: "fthb",
    name: "First-Time Homebuyer",
    shortDescription: "A clear education-first webinar for buyers who are early in the process.",
    targetAudience: "Renters, first-time buyers, and buyers unsure where to start",
    recommendedTitle: "First-Time Homebuyer Workshop",
    recommendedDescription:
      "A practical session covering affordability, loan options, down payment assistance, and how to get pre-approved with confidence.",
    defaultHeadline: "Learn How to Buy Your First Home With Less Money Out of Pocket",
    defaultSubheadline:
      "Understand loan options, down payment assistance, and the pre-approval steps that help first-time buyers move forward with less confusion.",
    defaultHeroBullets: [
      "How much money you actually need to buy",
      "Loan options for first-time buyers",
      "Down payment assistance basics",
      "Common mistakes that delay approval",
      "How to know what you can afford",
    ],
    defaultAgenda: [
      "Renting vs buying",
      "What lenders look at",
      "Down payment and closing cost options",
      "The pre-approval process",
      "How to make a strong offer",
      "Live Q&A",
    ],
    defaultAgendaBodies: [
      "Clear, practical guidance you can use after the session.",
      "Clear, practical guidance you can use after the session.",
      "Clear, practical guidance you can use after the session.",
      "Clear, practical guidance you can use after the session.",
      "Clear, practical guidance you can use after the session.",
      "Clear, practical guidance you can use after the session.",
    ],
    defaultPresenterSectionPrompt:
      "Introduce your experience helping first-time buyers understand affordability, assistance programs, and pre-approval.",
    defaultCTA: "Reserve My Spot",
    defaultReminderEmailSubject: "You're in — first-time homebuyer webinar details inside",
    defaultReminderEmailBody: sharedConfirmationBody,
    defaultReminderSms:
      "{{first_name}}, you're registered for \"{{title}}\". Save your seat here: {{join_link}}",
    defaultNoShowFollowUp:
      "Sorry we missed you. Want a quick one-on-one homebuyer plan instead? Reply YES and {{host}} will send times.",
    defaultAttendedFollowUp:
      "Thanks for joining. Want your personalized homebuying game plan? Reply BOOK and {{host}} will send times.",
    defaultFaqs: [
      {
        question: "Is this webinar really free?",
        answer: "Yes. It's free to attend, and the goal is to give you clarity on programs and next steps.",
      },
      {
        question: "Will there be a replay?",
        answer: "Often yes. If a replay is available, we'll email it after the webinar.",
      },
      {
        question: "Is this only for first-time buyers?",
        answer:
          "It's built for first-time buyers, but anyone who wants to understand the buying process can join.",
      },
      {
        question: "Do I need to be ready to buy now?",
        answer: "No. This is designed to help you plan, whether you're months away or actively searching.",
      },
      {
        question: "Will you cover down payment assistance?",
        answer:
          "Yes. We'll cover how assistance programs typically work, eligibility basics, and common pitfalls.",
      },
    ],
    reminders: [
      {
        templateKey: "confirmation",
        emailSubject: "You're in — first-time homebuyer webinar details inside",
        emailBody: sharedConfirmationBody,
        smsBody: "{{first_name}}, you're registered for \"{{title}}\". Join: {{join_link}}",
      },
      {
        templateKey: "attended_cta",
        emailSubject: "Ready for your personalized homebuying game plan?",
        emailBody:
          "Hi {{first_name}},\n\nThanks for attending \"{{title}}\". If you want a personalized plan for your price range, down payment options, and next steps, book a quick call here: {{book_call_link}}\n\n— {{host}}",
        smsBody:
          "Thanks for joining, {{first_name}}. Want your personalized homebuying plan? Reply BOOK and {{host}} will send times.",
      },
      {
        templateKey: "no_show_one_on_one",
        emailSubject: "Missed the webinar? Let's make a quick plan",
        emailBody:
          "Hi {{first_name}},\n\nSorry we missed you at \"{{title}}\". If buying your first home is still on your mind, we can cover your questions in a short one-on-one call.\n\nGrab a time here: {{book_call_link}}\n\n— {{host}}",
        smsBody:
          "Sorry we missed you, {{first_name}}. Want a quick 1:1 first-home plan? Reply YES and {{host}} will send times.",
      },
    ],
  },
  investor: {
    id: "investor",
    name: "Investor",
    shortDescription: "A financing-focused webinar for buyers evaluating rental or investment property.",
    targetAudience: "Aspiring investors, repeat buyers, and buyers interested in rental income",
    recommendedTitle: "Investment Property Financing Workshop",
    recommendedDescription:
      "A practical session on investor loan options, down payment expectations, rental income, DSCR basics, and deal analysis.",
    defaultHeadline: "Learn How to Buy Your First or Next Investment Property",
    defaultSubheadline:
      "See how rental property financing works, what lenders look for, and how to evaluate a deal before you buy.",
    defaultHeroBullets: [
      "How rental property financing works",
      "DSCR and conventional investor loan options",
      "How lenders evaluate rental income",
      "Down payment expectations",
      "How to analyze a deal before buying",
    ],
    defaultAgenda: [
      "Investment property loan options",
      "Cash flow vs appreciation",
      "DSCR loan basics",
      "How to use projected rental income",
      "Common investor mistakes",
      "Live Q&A",
    ],
    defaultAgendaBodies: [
      "Compare conventional, DSCR, and other financing paths for rental property purchases.",
      "Understand how income, expenses, and long-term upside shape an investment strategy.",
      "Learn how debt-service coverage works and when it can help investors qualify.",
      "See how expected rent may support the loan scenario before you buy.",
      "Avoid financing surprises that can slow down or weaken a deal.",
      "Ask questions about your investment goals and get answers from a mortgage expert.",
    ],
    defaultPresenterSectionPrompt:
      "Introduce your experience helping buyers evaluate investor financing, rental income, and loan strategy.",
    defaultCTA: "Save My Seat",
    defaultReminderEmailSubject: "You're in — investment property webinar details",
    defaultReminderEmailBody: sharedConfirmationBody,
    defaultReminderSms:
      "{{first_name}}, you're registered for \"{{title}}\". Join: {{join_link}}",
    defaultNoShowFollowUp:
      "Sorry we missed you. Want to talk through an investment property scenario one-on-one? Reply YES and {{host}} will send times.",
    defaultAttendedFollowUp:
      "Thanks for joining. Want to review a deal or investor loan options? Reply BOOK and {{host}} will send times.",
    defaultFaqs: [
      {
        question: "Is this webinar really free?",
        answer: "Yes. It's free to attend and focused on helping you understand investor financing options.",
      },
      {
        question: "Will there be a replay?",
        answer: "Often yes. If a replay is available, we'll email it after the webinar.",
      },
      {
        question: "Do I need a property picked out already?",
        answer:
          "No. You can attend while you're still learning how to evaluate deals and financing options.",
      },
      {
        question: "Will you cover DSCR loans?",
        answer:
          "Yes. The agenda includes DSCR basics and how lenders may evaluate projected rental income.",
      },
      {
        question: "Is this for new or experienced investors?",
        answer:
          "It's useful for aspiring investors and repeat buyers who want a clearer financing plan.",
      },
    ],
    reminders: [
      {
        templateKey: "confirmation",
        emailSubject: "You're in — investment property webinar details",
        emailBody: sharedConfirmationBody,
        smsBody: "{{first_name}}, you're registered for \"{{title}}\". Join: {{join_link}}",
      },
      {
        templateKey: "attended_cta",
        emailSubject: "Want to review your investment property plan?",
        emailBody:
          "Hi {{first_name}},\n\nThanks for attending \"{{title}}\". If you want to review investor financing options, down payment expectations, or a deal scenario, book a quick call here: {{book_call_link}}\n\n— {{host}}",
        smsBody:
          "{{first_name}}, want to review investor loan options or a deal scenario? Reply BOOK and {{host}} will send times.",
      },
      {
        templateKey: "no_show_one_on_one",
        emailSubject: "Missed the investor webinar? We can still review your plan",
        emailBody:
          "Hi {{first_name}},\n\nSorry we missed you at \"{{title}}\". If you are looking at rental income or investment property financing, we can cover the key points one-on-one.\n\nGrab a time here: {{book_call_link}}\n\n— {{host}}",
        smsBody:
          "{{first_name}}, missed the investor webinar? Want a quick 1:1 on financing options? Reply YES.",
      },
    ],
  },
  self_employed: {
    id: "self_employed",
    name: "Self-Employed",
    shortDescription: "A qualification-focused webinar for borrowers with business or variable income.",
    targetAudience: "Business owners, 1099 workers, freelancers, realtors, and contractors",
    recommendedTitle: "Self-Employed Mortgage Workshop",
    recommendedDescription:
      "A practical session on tax returns, bank statement options, documentation, and avoiding late-stage mortgage denials.",
    defaultHeadline: "Learn How Self-Employed Buyers Can Qualify for a Mortgage",
    defaultSubheadline:
      "Understand how lenders calculate self-employed income, what documents matter, and which loan options may fit your situation.",
    defaultHeroBullets: [
      "Why tax write-offs can make qualifying harder",
      "Bank statement loan options",
      "How lenders calculate self-employed income",
      "What documents you may need",
      "How to avoid getting denied late in the process",
    ],
    defaultAgenda: [
      "Why self-employed loans are different",
      "Tax return vs bank statement qualifying",
      "Common documentation issues",
      "Non-QM loan options",
      "How to prepare before applying",
      "Live Q&A",
    ],
    defaultAgendaBodies: [
      "Understand how lenders view business owners and why qualifying is different.",
      "Learn which program may help you qualify for a larger mortgage.",
      "Avoid delays by knowing exactly what underwriters look for.",
      "Explore alternatives when conventional financing isn't the best fit.",
      "Get organized before you apply to improve your approval odds.",
      "Ask questions about your situation and get answers from a mortgage expert.",
    ],
    defaultPresenterSectionPrompt:
      "Introduce your experience helping self-employed borrowers understand income documentation and loan options.",
    defaultCTA: "Claim My Spot",
    defaultReminderEmailSubject: "You're in — self-employed mortgage webinar details",
    defaultReminderEmailBody: sharedConfirmationBody,
    defaultReminderSms:
      "{{first_name}}, you're registered for \"{{title}}\". Join: {{join_link}}",
    defaultNoShowFollowUp:
      "Sorry we missed you. Want to review your self-employed mortgage options one-on-one? Reply YES and {{host}} will send times.",
    defaultAttendedFollowUp:
      "Thanks for joining. Want to review your income/documentation options? Reply BOOK and {{host}} will send times.",
    defaultFaqs: [
      {
        question: "Is this webinar really free?",
        answer: "Yes. It's free to attend and focused on helping self-employed buyers understand qualifying.",
      },
      {
        question: "Will there be a replay?",
        answer: "Often yes. If a replay is available, we'll email it after the webinar.",
      },
      {
        question: "Do I need tax returns ready?",
        answer:
          "No. We'll explain common documentation paths so you can understand what may be needed.",
      },
      {
        question: "Will you cover bank statement loans?",
        answer:
          "Yes. The agenda includes tax return vs bank statement qualifying and other Non-QM options.",
      },
      {
        question: "Is this only for business owners?",
        answer:
          "No. It's also useful for 1099 workers, freelancers, contractors, and other variable-income borrowers.",
      },
    ],
    reminders: [
      {
        templateKey: "confirmation",
        emailSubject: "You're in — self-employed mortgage webinar details",
        emailBody: sharedConfirmationBody,
        smsBody: "{{first_name}}, you're registered for \"{{title}}\". Join: {{join_link}}",
      },
      {
        templateKey: "attended_cta",
        emailSubject: "Want to review your self-employed mortgage options?",
        emailBody:
          "Hi {{first_name}},\n\nThanks for attending \"{{title}}\". If you want to review tax return, bank statement, or Non-QM options for your situation, book a quick call here: {{book_call_link}}\n\n— {{host}}",
        smsBody:
          "{{first_name}}, want to review self-employed mortgage options? Reply BOOK and {{host}} will send times.",
      },
      {
        templateKey: "no_show_one_on_one",
        emailSubject: "Missed the webinar? We can still review your options",
        emailBody:
          "Hi {{first_name}},\n\nSorry we missed you at \"{{title}}\". If self-employed qualifying is still on your mind, we can review your questions one-on-one.\n\nGrab a time here: {{book_call_link}}\n\n— {{host}}",
        smsBody:
          "{{first_name}}, missed the self-employed webinar? Want a quick 1:1 on qualifying options? Reply YES.",
      },
    ],
  },
};

export const WEBINAR_TEMPLATE_LIST = WEBINAR_TEMPLATE_IDS.map((id) => WEBINAR_TEMPLATES[id]);

export function getWebinarTemplate(id: WebinarTemplateId) {
  return WEBINAR_TEMPLATES[id];
}
