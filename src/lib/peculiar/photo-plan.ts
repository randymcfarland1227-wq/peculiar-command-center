import type { ContentItem, MarketingBrief, PeculiarData, PhotoBrief } from "./types.ts";

type PhotoTemplate = {
  id: string;
  title: string;
  kind: "website" | "library";
  pillar: ContentItem["pillar"];
  brief: Omit<PhotoBrief, "template" | "subject" | "stage" | "assetLink" | "notes" | "shots">;
  shots: [string, string][];
};

export const PHOTO_TEMPLATES: PhotoTemplate[] = [
  {
    id: "listing",
    title: "Individual candle listing",
    kind: "website",
    pillar: "Styling",
    brief: {
      priority: "First shoot",
      placement: "Product card + individual product gallery",
      purpose:
        "Show exactly what this candle looks like, how large it is, and what the buyer receives. Make a separate set for every exact-vessel listing; use representative images only where the listing clearly says the vessel varies.",
      setup:
        "One finished, unburned candle with its final label. Soft window light from one side, cream or stone backdrop, white card opposite the window. Clean the glass and keep the camera height, distance, and light consistent across the catalog.",
      framing:
        "Shoot loose enough for square and 4:5 crops. Keep the whole vessel inside the frame, verticals straight, and the label readable. Take clean listing shots before any styled or lit shots.",
    },
    shots: [
      [
        "Front / product card",
        "Candle centered, label facing forward, full base and rim visible. Use the same angle and scale for every listing.",
      ],
      [
        "Three-quarter view",
        "Turn the candle about 45° to show depth, glass shape, and closure if included.",
      ],
      [
        "Top / wax and wick",
        "Show the actual wax surface, wick, opening, and rim. Remove the closure if present.",
      ],
      [
        "Material detail",
        "Close crop of texture, glass color, or a distinctive mark. Include any visible irregularity the buyer should understand.",
      ],
      [
        "Label / reverse + overlay reference",
        "Show the final scent label and any back or base label. Also photograph each front label straight-on, evenly lit, and sharp for the burning-photo overlays. Keep the original label artwork.",
      ],
      [
        "Scale / in hand",
        "Hands only, with the full vessel visible. Pair the image with measured dimensions in the listing.",
      ],
    ],
  },
  {
    id: "hero",
    title: "Homepage hero",
    kind: "website",
    pillar: "Styling",
    brief: {
      priority: "First shoot",
      placement: "Homepage opening image; desktop + phone",
      purpose:
        "Introduce Peculiar through a small, distinctive grouping of finished candles. Make the objects the focal point and leave room for the website headline.",
      setup:
        "Two or three finished candles of different heights. Cream or stone surface, soft side light, one restrained archival or botanical prop if useful. Keep props clear of any flame; an unlit setup works here.",
      framing:
        "Capture a wide horizontal composition and a separately composed vertical version. Leave a quiet area beside the candles for text; do not rely on one extreme crop working on every screen.",
    },
    shots: [
      [
        "Wide hero",
        "Arrange candles to one side and leave clean negative space on the other. Capture both left-space and right-space options.",
      ],
      [
        "Mobile hero",
        "Restage vertically with room above or below for the heading. Keep the most distinctive candle readable at phone size.",
      ],
    ],
  },
  {
    id: "collections",
    title: "Collection and assortment photos",
    kind: "website",
    pillar: "Vessel Sourcing",
    brief: {
      priority: "First shoot",
      placement: "Collection tiles + shop introduction",
      purpose:
        "Help shoppers understand the assortment. Photograph reclaimed and recycled collections separately if both are offered; do not mix them in a photo that represents only one collection.",
      setup:
        "A small group from the actual offered collection on the same backdrop as the listings. Show variation in silhouette and glass without crowding. Repeat this brief for each collection that needs its own tile.",
      framing:
        "Square-friendly group with clear edges and room between vessels. Photograph the full group before taking a tighter editorial crop.",
    },
    shots: [
      [
        "Collection group",
        "Three to five representative finished candles from the same collection, labels oriented consistently.",
      ],
      [
        "Assortment overview",
        "One frame showing the current range. Record which candles appear so the image can be refreshed when the assortment changes.",
      ],
    ],
  },
  {
    id: "choices",
    title: "Vessel choices and size comparison",
    kind: "website",
    pillar: "Mystery Vessel Reveals",
    brief: {
      priority: "First shoot",
      placement: "Vessel selector / builder + size guide",
      purpose:
        "Explain Clear / Color / Surprise Me and Regular / Large wherever those choices are actually offered. A mystery-vessel example shows the range, not a promise of an exact jar.",
      setup:
        "Use measured, representative vessels from the available range. Compare sizes on the same surface, at the same camera distance. Identify each vessel and its actual dimensions in your notes.",
      framing:
        "Neutral background, equal camera height. Use consistent framing for selector images and a single shared frame for size comparison.",
    },
    shots: [
      [
        "Clear and color examples",
        "Separate frames with matching crops, then a side-by-side frame. Use products that genuinely represent each option.",
      ],
      [
        "Surprise Me range",
        "Show several possible vessels together. Add a website caption explaining that examples vary.",
      ],
      [
        "Regular beside Large",
        "Photograph measured examples side by side, bases level. Record height, diameter, and actual fill for the accompanying guide.",
      ],
    ],
  },
  {
    id: "scents",
    title: "Scent portraits",
    kind: "website",
    pillar: "Scent Lab",
    brief: {
      priority: "Second pass",
      placement: "Scent pages + scent-selection cards",
      purpose:
        "Give each offered scent a recognizable image. Start with its actual labeled candle; add mood props only when they match the approved scent description.",
      setup:
        "One finished candle per offered scent. Keep a common background and light across the series. Use approved names and notes from the scent records; do not imply a prop is a physical ingredient.",
      framing:
        "One clear label-first frame and one wider atmospheric frame per scent. Leave room for the scent name in the website layout.",
    },
    shots: [
      [
        "Labeled scent portrait",
        "Final scent name facing the camera. Repeat the same camera position for every scent being offered.",
      ],
      [
        "Scent atmosphere",
        "One intentional setting that supports the scent story. The candle remains identifiable; avoid decorative clutter.",
      ],
    ],
  },
  {
    id: "packaging",
    title: "What arrives in the order",
    kind: "website",
    pillar: "Customer Unboxings",
    brief: {
      priority: "Second pass",
      placement: "Product gallery + gifting / shipping information",
      purpose:
        "Answer what is included and how the candle arrives. Use the final packing configuration; update the photos if the contents change.",
      setup:
        "An actual packed sample order, finished candle, and only the closure, wrap, cards, or extras that will be included. This is a studio demonstration, not a customer testimonial.",
      framing:
        "Overhead for contents, three-quarter angle for the packed order. Leave all included pieces visible.",
    },
    shots: [
      [
        "Contents laid out",
        "Show every included item with the candle. Exclude decorative props that could be mistaken for part of the order.",
      ],
      ["Open packed order", "Show the final wrap and protection as a buyer would first see them."],
    ],
  },
  {
    id: "story",
    title: "Reclaimed vessel: before and after",
    kind: "website",
    pillar: "Before / After",
    brief: {
      priority: "Second pass",
      placement: "About / process / reclaimed collection page",
      purpose:
        "Show a specific vessel's transformation with real evidence. Capture the before image before cleaning or pouring; use another vessel if that moment has already passed.",
      setup:
        "The same identifiable vessel at its original, prepared, and finished stages. Use the same surface, camera position, and light whenever possible. Hands only; check reflections for faces and personal details.",
      framing:
        "Match angle and scale across all three stages so the transformation reads without explanation.",
    },
    shots: [
      ["Before", "Record the actual found vessel and its distinctive marks before preparation."],
      ["Prepared", "The same vessel cleaned and ready for its next stage."],
      [
        "Finished",
        "The same vessel as a labeled candle. Keep a simple record of its source for the eventual copy.",
      ],
    ],
  },
  {
    id: "care",
    title: "One burning candle + label overlays",
    kind: "website",
    pillar: "Testing / QC",
    brief: {
      priority: "Second pass",
      placement: "Website atmosphere / care images + matching secondary product images",
      purpose:
        "Burn one designated photo candle, then use its burning master with label-overlay versions. Keep each candle's clean, unburned listing set as the record of its actual vessel. Only reuse a burning version where the vessel, wax, and wick appearance match the product shown.",
      setup:
        "Choose the single candle to burn and record its vessel ID here. Finish every unburned listing shot and label reference first. Use a clear, heat-resistant surface and consistent light, with no flammable styling near the flame. No other candles need to be burned for this plan.",
      framing:
        "Lock the camera position. Take a wider atmosphere frame and a closer flame / glass detail. Keep the original master, each label artwork file, and each finished overlay version separately so the edits are easy to trace.",
    },
    shots: [
      [
        "Unlit reference + label files",
        "Photograph the designated candle before lighting it. Collect straight-on label references and the original label artwork for the versions you need.",
      ],
      [
        "One burning master",
        "Capture a wider frame and a closer flame / glass detail from the single candle under supervision. This atmosphere image does not stand in for test results.",
      ],
      [
        "Label-overlay versions",
        "Apply the final label to copies of the master. Match perspective, curvature, light, shadows, and glass reflections. Keep the vessel and wax appearance unchanged.",
      ],
      [
        "Final overlay check",
        "Review label legibility, edges, reflection continuity, and crop at full size and phone size. Note each scent, master file, and destination in the edit notes.",
      ],
    ],
  },
  {
    id: "details",
    title: "Miscellaneous candle and material photos",
    kind: "library",
    pillar: "Styling",
    brief: {
      priority: "Second pass",
      placement: "Website section backgrounds + future social stills",
      purpose:
        "Build a flexible photo library beyond individual listings: glass textures, groupings, wax, labels, and hands. Give each image a clear subject rather than collecting unrelated pretty frames.",
      setup:
        "Use the same light and palette as the catalog, then vary camera distance. Separate candle groupings from material close-ups. Include closures only if they are part of the real product.",
      framing:
        "Capture each useful setup wide and close, horizontal and vertical. Leave negative space for future headings; also capture a clean version without text or graphics.",
    },
    shots: [
      ["Glass and light", "Close-ups of actual glass texture, color, reflections, and rims."],
      ["Wax, wick, label", "A small set of tactile, identifiable details from finished candles."],
      [
        "Loose candle groupings",
        "Pairs, trios, and a wider assortment. Record the vessels and scents shown.",
      ],
      [
        "Hands with candle",
        "Picking up, turning, and placing an unlit candle. Keep the brand anonymous in reflections too.",
      ],
    ],
  },
  {
    id: "broll",
    title: "Hands-only process B-roll",
    kind: "library",
    pillar: "Pour Process",
    brief: {
      priority: "Second pass",
      placement: "Future reels / process clips; optional website video",
      purpose:
        "Capture reusable moving footage while the real work happens. B-roll supports a story later; it does not need a posting deadline now.",
      setup:
        "A stable phone, clean lens, uncluttered work area, and the real tools/process. Frame hands and materials only. Record natural sound separately where useful; do not stage a false test or a customer moment.",
      framing:
        "Vertical clips as a starting format for social, plus selected horizontal takes if the website needs them. Hold each shot still for 5–10 seconds with a pause before and after the action. No baked-in captions or music in the master.",
    },
    shots: [
      [
        "Sourcing / preparation",
        "The find, glass being inspected, and preparation. Only film where permitted; avoid other people's faces.",
      ],
      [
        "Measuring / scent work",
        "Hands measuring, mixing, labeling trials, and making notes. Keep private formulas and personal information out of frame.",
      ],
      [
        "Pour / finish",
        "A wide process view, a close pour, and the finished surface. Film actual work rather than repeating a pour for the camera.",
      ],
      [
        "Label / pack / reveal",
        "Applying a final label, wrapping an order, opening a studio sample, and revealing the candle.",
      ],
    ],
  },
];

export function createPhotoItem(templateId: string, id: string, subject = ""): ContentItem {
  const template = PHOTO_TEMPLATES.find((item) => item.id === templateId);
  if (!template) throw new Error(`Unknown photo brief: ${templateId}`);
  return {
    id,
    title: subject ? `${subject} — ${template.title}` : template.title,
    kind: template.kind,
    pillar: template.pillar,
    platform: "Website",
    status: "NOT STARTED",
    footage: "",
    caption: "",
    publishDate: "",
    result: "",
    photo: {
      ...template.brief,
      template: template.id,
      subject,
      stage: "To shoot",
      assetLink: "",
      notes: "",
      shots: template.shots.map(([label, direction], index) => ({
        id: `${template.id}-${index + 1}`,
        label,
        direction,
        done: false,
      })),
    },
  };
}

/** These briefs add intention to the existing ideas without replacing saved wording. */
export const MARKETING_BRIEFS: Record<string, MarketingBrief> = {
  ct1: {
    purpose:
      "Make the vessel's origin tangible and give shoppers a reason to care about this particular object.",
    format: "Short hands-only video",
    hook: "This candle started here.",
    cta: "Explore the reclaimed collection when it is available.",
    timing: "After a real source story and the finished candle can be shown together.",
    measure: "Collection visits and questions about the vessel.",
    sourceIds: ["photo-story", "photo-collections"],
  },
  ct2: {
    purpose: "Explain the transformation in a way someone can see immediately.",
    format: "Before / after carousel",
    hook: "One vessel, two lives.",
    cta: "Swipe to see what changed, then view the collection.",
    timing: "After the same vessel's before and finished images are ready.",
    measure: "Saves and visits to the reclaimed collection.",
    sourceIds: ["photo-story"],
  },
  ct3: {
    purpose: "Help someone decide whether a scent fits their taste without smelling it first.",
    format: "Scent portrait + notes carousel",
    hook: "Start with a place or memory from the approved scent story.",
    cta: "Read the scent description and choose your scent.",
    timing: "After the scent name, description, and offered product are final.",
    measure: "Scent-page visits and specific questions about the notes.",
    sourceIds: ["photo-scents"],
  },
  ct4: {
    purpose: "Show the care behind making a candle through one real process decision.",
    format: "Short pour-process video",
    hook: "A small detail from today's pour that changes the finished candle.",
    cta: "See the finished candle and how it is made.",
    timing: "After real process footage exists; describe trials as trials.",
    measure: "Video completion, saves, and product-page visits.",
    sourceIds: ["photo-broll"],
  },
  ct5: {
    purpose: "Build trust by explaining one real quality check in plain language.",
    format: "Detail carousel or narrated hands-only clip",
    hook: "What are we checking during a burn test?",
    cta: "Save the care guide for your next candle.",
    timing: "After a documented test and the care guidance are available.",
    measure: "Care-guide visits, saves, and useful questions.",
    sourceIds: ["photo-care", "photo-broll"],
  },
  ct6: {
    purpose: "Remove uncertainty about vessel choice before someone buys.",
    format: "Three-option comparison / reveal",
    hook: "Choose the glass, or let the vessel be the surprise.",
    cta: "Compare the options on the product page.",
    timing: "When the actual choices and ordering flow are confirmed.",
    measure: "Selector visits and fewer questions about what arrives.",
    sourceIds: ["photo-choices"],
  },
  ct7: {
    purpose: "Explain a specific reuse practice using the actual object and process.",
    format: "Evidence-led stills carousel",
    hook: "Here is what a second life looks like for this vessel.",
    cta: "Read how the reclaimed collection works.",
    timing:
      "After the process wording is confirmed; discuss returns only if the program is active.",
    measure: "Process-page visits and saves.",
    sourceIds: ["photo-story", "photo-details"],
  },
  ct8: {
    purpose: "Give followers a reason to follow the build through one useful milestone.",
    format: "Hands-only studio update",
    hook: "One thing we finished this week, and why it matters for your candle.",
    cta: "Follow for the next studio update.",
    timing: "Use a completed milestone; hide private documents and personal details.",
    measure: "Profile visits and follows from the update.",
    sourceIds: ["photo-broll"],
  },
  ct9: {
    purpose: "Help someone imagine the candle in their own space while keeping the product clear.",
    format: "Styled still or short placement video",
    hook: "A small place for something peculiar.",
    cta: "Explore the candle shown when its listing is live.",
    timing: "After the clean website photo set is complete.",
    measure: "Saves and visits to the candle shown.",
    sourceIds: ["photo-details", "photo-hero"],
  },
  ct10: {
    purpose: "Answer what arrives through an actual customer's experience, with their permission.",
    format: "Customer unboxing / repost",
    hook: "Use the customer's own reaction, with permission.",
    cta: "See what is included in an order.",
    timing:
      "After a real customer receives an order and agrees to the repost. A studio packing demo can be a separate piece now.",
    measure: "Product-page visits and questions about gifting or packaging.",
    sourceIds: ["photo-packaging"],
  },
};

export function marketingFor(item: ContentItem): MarketingBrief {
  return (
    item.marketing ??
    MARKETING_BRIEFS[item.id] ?? {
      purpose: "",
      format: "",
      hook: "",
      cta: "",
      timing: "After the website photo set is ready.",
      measure: "",
      sourceIds: [],
    }
  );
}

export function contentKind(item: ContentItem) {
  return item.kind ?? "social";
}

/** Append once through appliedUpdates. Never replace existing records or repopulate deleted old ideas. */
export function addPhotoPlan(data: PeculiarData): PeculiarData {
  const ids = new Set(data.content.map((item) => item.id));
  const additions = PHOTO_TEMPLATES.filter((template) => !ids.has(`photo-${template.id}`)).map(
    (template) => createPhotoItem(template.id, `photo-${template.id}`),
  );
  return { ...data, content: [...data.content, ...additions] };
}

export function photoCounts(items: ContentItem[]) {
  const photos = items.filter((item) => item.photo);
  return {
    total: photos.length,
    firstShoot: photos.filter((item) => item.photo?.priority === "First shoot").length,
    ready: photos.filter((item) => item.photo?.stage === "Ready" || item.photo?.stage === "Placed")
      .length,
    placed: photos.filter((item) => item.photo?.stage === "Placed").length,
  };
}
