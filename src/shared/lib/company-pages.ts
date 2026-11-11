import { SITE_COMPANY, SITE_URL, SUPPORT_EMAIL } from "@/config/site";

export type CompanyPage = {
  title: string;
  description: string;
  content: string;
};
const contact = `[${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL})`;
const updated = "November 11, 2026";
const identity = `**Operator:** ${SITE_COMPANY}, a United States limited liability company.\n\n**Website:** ${SITE_URL}\n\n**Contact:** ${contact}`;
const beta =
  "**Current status: public beta.** The product is being tested publicly. Paid access, subscriptions, and payment processing have not launched. Any prices displayed are planned offerings, subject to final confirmation before launch. No payment order is created by clicking a purchase button during this stage.";

const pages: Record<string, CompanyPage> = {
  about: {
    title: "About Barko Bear LLC",
    description:
      "Company, product, and public beta information for Barko Bear LLC.",
    content: `${identity}

## What we build
Barko Bear LLC develops and operates browser-based AI image and video creation software. Users can enter text prompts or upload images, choose an available workflow, and review generated or edited visual output online.

The current product includes text-to-image and image-to-image workflows, photo editing, background removal, image upscaling, and supported image-to-video and video effect workflows. Availability varies by model, testing capacity, and content policy.

## Who the product is intended for
The software is intended for individual creators, designers, small teams, and online businesses exploring visual concepts, product imagery, marketing drafts, and short video ideas.

## Development stage
${beta}

## Delivery and business model
Access and outputs are delivered digitally through this website. Future paid access is planned around software subscriptions or usage credits. Final commercial terms and payment arrangements will be announced before purchases become available. Read our [business model](/business-model) and [planned pricing](/pricing).

## Technology and responsibility
We integrate third-party AI models and infrastructure to process supported requests. Barko Bear LLC operates the application and user workflows; underlying models remain associated with their respective providers. We do not claim to own or be endorsed by those providers.

## Company and support
Barko Bear LLC is the operator of barkobear.com. Product and privacy inquiries can be sent to ${contact}.`,
  },
  "business-model": {
    title: "Product & Business Model",
    description:
      "What Barko Bear provides, how access is delivered, and the planned charging model.",
    content: `${identity}

## Product
Barko Bear provides access to online AI image and video creation and editing workflows. The service is software delivered over the internet; outputs are digital files or online previews, not physical goods.

## How it works
1. Sign in using an available account method.
2. Select a supported tool and enter a prompt or upload an image you are entitled to use.
3. Submit a request, subject to test access, capacity, and content checks.
4. Review and download available output through the application.

## Customers and use cases
The intended users are creators, designers, small businesses, and teams that need visual drafts, image edits, product concepts, or short video experiments. The service can be accessed online in supported locations. Access is subject to test capacity and the service policies.

## Revenue plan
${beta}

After paid access launches, the planned revenue model is direct payment for software subscriptions or usage credits. The service does not provide payment accounts, accept customer deposits, or transfer money for customers. Credits are intended as a software usage measure rather than transferable money.

## Delivery and support
Requests are processed digitally using application infrastructure and supported third-party model APIs. Processing time, available models, and output quality can vary. Support is provided through ${contact}.

## Policies
See the [Terms of Service](/terms-of-service), [Privacy Policy](/privacy-policy), [Refund Policy](/refund-policy), and [Acceptable Use Policy](/acceptable-use-policy).`,
  },
  contact: {
    title: "Contact Barko Bear",
    description: "Product, company, and privacy contact for Barko Bear LLC.",
    content: `${identity}

## Product support and company inquiries
For questions about the public beta, account access, software workflows, or the company operating this website, contact ${contact}.

## Privacy and content reports
Use the same address for personal data requests, copyright concerns, or reports of prohibited content. Include the relevant page or task reference and a concise description. Do not send passwords, payment credentials, or unnecessary sensitive personal documents.

## Service status
${beta}`,
  },
  "terms-of-service": {
    title: "Terms of Service",
    description: "Terms for the Barko Bear LLC AI visual creation public beta.",
    content: `**Last updated: ${updated}**

${identity}

## 1. Service and operator
These terms apply to the AI image and video creation software provided by Barko Bear LLC at barkobear.com. Accessing or using the service means agreeing to these terms and the linked usage and privacy policies.

## 2. Public beta and planned pricing
${beta}

Beta availability, usage allowances, supported models, and features may change. Displayed credits are usage accounting and do not establish a paid balance or a right to future paid access. Do not treat planned package prices or model estimates as an available paid offer.

## 3. Accounts
You must be at least 18 and legally able to use this service. Provide accurate account information and protect your credentials. Do not share accounts for abuse or circumvent usage or safety controls.

## 4. Inputs and generated output
Only upload material you own or are authorized to use. Obtain appropriate consent for identifiable people. You remain responsible for your inputs and how you use outputs. AI outputs may be inaccurate, similar to other outputs, or subject to third-party rights. Review them before publication or commercial use; no exclusivity or legal clearance is guaranteed.

## 5. Prohibited use
Do not use the service for unlawful content, sexual exploitation, non-consensual intimate imagery, identity deception, harmful impersonation, rights infringement, fraud, or attempts to bypass content controls. See our [Acceptable Use Policy](/acceptable-use-policy).

## 6. Third-party processing
Supported requests may be processed by third-party model and infrastructure providers. Their availability and technical limitations can affect service delivery. Barko Bear LLC operates this application and does not claim endorsement or ownership of the underlying third-party models.

## 7. Availability and changes
The beta is provided on an available-capacity basis. We may restrict requests, remove prohibited material, suspend abusive accounts, or change features. We do not promise uninterrupted access, a specific generation time, or a guaranteed result. Nothing in these terms removes rights that cannot be excluded under applicable law.

## 8. Privacy, future payments, and contact
The [Privacy Policy](/privacy-policy) explains data handling. Paid access will require published final terms and a functioning payment arrangement before any charge. Contact ${contact} for questions or complaints.`,
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description:
      "How Barko Bear LLC handles information used by its public beta software.",
    content: `**Last updated: ${updated}**

${identity}

## Information used by the service
We process account details such as your email and sign-in profile, prompts, uploaded images, generated outputs, task records, and technical information needed for operation, security, and support. If you use Google sign-in, the requested identity information includes email and basic profile information. Where password sign-in is used, passwords are stored in hashed form.

## Purposes
Information is used to authenticate access, process creation requests, deliver outputs, maintain usage records, prevent abuse, investigate errors, and respond to support or privacy requests.

## AI providers and infrastructure
A generation or editing request may send the necessary prompt and input files to supported third-party AI providers. Hosting, database, storage, authentication, and operational providers may also process information needed for the service. Do not upload confidential or sensitive personal information without the necessary rights and consent. Provider practices and processing locations may differ; we do not promise that all data stays within one country or that a provider never retains submitted material.

## Cookies and records
The site uses cookies or similar storage for sign-in, language preferences, and application state. Logs and task records may be retained for operational, security, support, or legal purposes. Retention depends on those purposes rather than a guaranteed universal deletion period.

## Payments
Paid checkout has not launched. This website does not currently collect card details or process purchases. Payment arrangements and related data handling will be disclosed before paid access opens.

## Your requests
Contact ${contact} to request access, correction, or deletion of your personal information, or to raise a privacy concern. We may need to verify your identity and may retain information where required for legitimate security or legal purposes. Applicable rights depend on your location and the law that applies.

## Security and changes
We use access controls and operational measures to protect the service, but no online service can promise absolute security. Updated policies will be published on this website.`,
  },
  "refund-policy": {
    title: "Refund & Payment Status",
    description:
      "Current payment status and future refund disclosures for Barko Bear LLC.",
    content: `**Last updated: ${updated}**

${identity}

## Current public beta
${beta}

There are currently no paid purchases or subscriptions offered by this website to refund. Usage allowances or beta credits do not represent a payment or cash value.

## Before paid access launches
We will publish final prices, billing intervals, renewal or cancellation terms where relevant, delivery terms, and the applicable refund process before accepting payments. No payment processor or merchant-of-record relationship is represented as active on this website at present.

## Questions or unexpected charges
If you believe a charge is connected to this website, contact ${contact} with the date and a non-sensitive transaction reference. Do not send a full card number or banking password. Statutory consumer rights remain applicable where required by law.`,
  },
  "acceptable-use-policy": {
    title: "Acceptable Use Policy",
    description: "Rules for using Barko Bear AI creation tools responsibly.",
    content: `**Last updated: ${updated}**

${identity}

## Responsible use
Use the tools only for lawful creation and editing with material you have the right to use. Obtain consent where people are identifiable and make required disclosures when publishing synthetic content.

## Prohibited content and activity
- Sexual exploitation or sexual content involving minors.
- Non-consensual intimate imagery, nudification, or sexualized manipulation of a real person.
- Adult sexual content, unlawful content, scams, or harmful impersonation.
- Misleading deepfakes, fabricated endorsements, or content intended to deceive about a person's identity or actions.
- Copyright, privacy, trademark, or other rights violations.
- Bypassing moderation, abusing accounts, disrupting infrastructure, or misusing service access.

## Enforcement and reports
Requests may be subject to automated checks and operational review. We may reject requests, restrict access, remove material, or suspend accounts where appropriate. Automated controls are not perfect; report suspected violations to ${contact} with the relevant task or page reference.`,
  },
  "content-moderation-policy": {
    title: "Content Moderation Policy",
    description:
      "How Barko Bear handles prohibited requests and content reports.",
    content: `**Last updated: ${updated}**

${identity}

## Scope
Our [Acceptable Use Policy](/acceptable-use-policy) applies to prompts, uploads, generated content, and use of the application. Prohibited material includes sexual exploitation, non-consensual intimate imagery, adult sexual content, fraud, harmful impersonation, and rights violations.

## Controls
Supported workflows may use prompt checks, provider safety controls, content checks, usage restrictions, and review of reports. Certain effects and models are not publicly available. Safety mechanisms can make mistakes and do not guarantee that every violation will be detected.

## Reporting and review
Send concerns to ${contact}. Include a task reference, page link, and the reason for the report where available. We may restrict content or accounts and review relevant records. You can use the same contact to question an action affecting your account.`,
  },
  "ai-wrapper-disclaimer": {
    title: "AI Technology Disclosure",
    description:
      "Third-party model use and application responsibilities at Barko Bear LLC.",
    content: `${identity}

## Application and underlying models
Barko Bear LLC operates the website, user interface, account workflows, and supported AI creation tools. The application integrates third-party model APIs and infrastructure. Model names identify the technology or provider used for a workflow; they do not imply that Barko Bear LLC owns that model or has a formal endorsement from its provider.

## Limitations
AI outputs may contain errors, artifacts, bias, or material resembling third-party work. Availability, supported features, and safety restrictions vary. Users must review outputs and obtain any rights needed for their use.

## Current stage
${beta}

For questions, contact ${contact}.`,
  },
  "open-source-attribution": {
    title: "Open-Source & Technology Attribution",
    description: "Acknowledgment of software used to build Barko Bear.",
    content: `${identity}

Barko Bear uses third-party open-source software, including React, Next.js, Tailwind CSS, Radix UI, and other libraries listed in its software dependencies. Those projects remain the property of their respective authors and are used under their applicable licenses. This acknowledgment does not transfer ownership or imply endorsement.

Third-party AI model names and associated rights remain with their respective providers. See our [AI Technology Disclosure](/ai-wrapper-disclaimer). Questions about attribution can be sent to ${contact}.`,
  },
};

export function getCompanyPage(
  slug: string,
  locale = "en",
): CompanyPage | undefined {
  const page = pages[slug];
  if (!page) return undefined;
  // 所有语言使用同一份经过核对的英文正文，并提示其为当前公开版本。
  if (locale.startsWith("zh")) {
    return {
      ...page,
      description: `${SITE_COMPANY} 的公司与公开测试说明（英文正文）。`,
    };
  }
  return page;
}
