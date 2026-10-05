/**
 * Plain how-to steps for fields that are errands, keyed by task id, then step id.
 * Reference text, not saved answers: every load copies the current version onto the
 * matching fields. Checked against Maryland, IRS, and Baltimore County sources, October 2026.
 */
export const GUIDES: Record<string, Record<string, string[]>> = {
  "co-setup": {
    c1: [
      "Search the name you want at businessexpress.maryland.gov to make sure no one has it.",
      "Pick a registered agent. You can be your own, but that puts your home address on the public record. A registered-agent service (about $50–150 a year) keeps it private.",
      "File Articles of Organization online at Maryland Business Express. The state fee is $100 plus a card fee; expediting costs extra.",
      "Save the approved Articles as a PDF. The bank will ask for them.",
      "Write a one-page operating agreement from a free template. It isn't filed anywhere, but banks sometimes ask for it.",
      "Heads-up: Maryland charges $300 a year for the LLC's annual report (Form 1), due April 15. Your first is due April 15, 2027.",
    ],
    c6: [
      "After the LLC is approved, go to irs.gov and search “Apply for an EIN online.” It's free. Skip any site that charges.",
      "It's open Monday–Friday, 7 a.m.–10 p.m. Eastern, and takes about 15 minutes.",
      "Choose Limited Liability Company with 1 member, and use the LLC name exactly as filed.",
      "You get the number right away. Download the confirmation letter (CP 575) before you close the page.",
    ],
    c7: [
      "Pick a bank with no monthly fee: a local credit union or an online business account.",
      "Have ready: the approved Articles, the EIN letter, and your ID. Keep the operating agreement handy in case they ask.",
      "Open the account in the LLC's name, not yours.",
      "From then on, run every business purchase and sale through it. Mixing personal money in weakens the LLC's protection.",
    ],
  },
  "co-legal": {
    c10: [
      "Do this after you have the EIN.",
      "Register free at Maryland Business Express (or the Comptroller's Combined Registration Application at interactive.marylandtaxes.gov) and choose Sales and Use Tax.",
      "Approval takes a few business days. Write the account number here.",
      "Charge 6% on sales to Maryland buyers. Orders shipped out of state don't get Maryland tax.",
      "File a return on the schedule they assign, even when you sold nothing.",
    ],
    c11: [
      "Towson is in Baltimore County. Its zoning allows a home occupation as long as there's no sign or display outside, no employees except family who live there, and only household equipment.",
      "The rules also bar selling to customers at the house. Candles made at home and shipped out are fine; skip doorstep pickups.",
      "I found no home-business permit to apply for. To be certain, ask Baltimore County Zoning Review in Towson.",
      "No trader's license is needed: Maryland exempts makers selling what they make.",
      "Renting? Check the lease for a no-business clause.",
    ],
  },
  "co-insurance": {
    c12: [
      "Maryland doesn't require it, but candles are a fire risk, so get it before the first sale.",
      "Ask for general liability that includes products liability, usually $1 million per claim.",
      "Maker programs are the cheapest start. ACT Insurance's yearly maker plan runs about $515 for $2 million; other quotes run about $450–1,500 a year.",
      "Markets and shops often ask for a certificate of insurance. These policies include one.",
      "Write the carrier and yearly cost here.",
    ],
    c13: [
      "Homeowners and renters policies usually exclude business activity. Ask whether yours does.",
      "If it does, the product liability policy (or a home-business add-on) covers the gap.",
      "With no employees, you don't need workers' comp or unemployment insurance.",
      "Write “covered by the product policy” or what you added.",
    ],
    s16: [
      "Tell the insurer exactly what you do: candles made at home, sold online and at markets.",
      "Make sure the policy covers products you sell and doesn't exclude fire.",
      "Mention the wood wicks and reclaimed jars, and ask whether they change anything.",
    ],
  },
  "co-name": {
    c5: [
      "Go to tmsearch.uspto.gov.",
      "Search “Peculiar” and close spellings. Filter to Class 004 (candles), then 003 (home fragrance) and 021 (jars).",
      "Only Live marks matter. Note any that sell candles or home fragrance.",
      "Check whether Peculiar Pumpkin has registered.",
      "Write what you found here. Filing ($350) can wait.",
    ],
  },
};
