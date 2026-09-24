/* Second autumn roundup — distinct concepts from autumn-golden-hour-aesthetic-prompts.cjs
 * (that one is portrait-only golden-hour; this one covers flat lays, landscapes, motion,
 * and a painterly art-style edit so the /prompts/category/autumn page has real variety).
 * LOCAL PREVIEW ONLY — placeholder images, replace via admin before deploy.
 * Run from the service dir:  node scripts/_seedPromptsAutumn2.cjs
 */
const db = require('../models');

const PLACEHOLDER_IMAGE = { url: '/prompts/placeholder-pending.svg', alt: 'Example image pending upload' };
const GEMINI = 'https://gemini.google.com/app';
const CHATGPT = 'https://chatgpt.com/';

const POSTS = [
  {
    slug: 'autumn-ai-art-prompts-beyond-portraits',
    title: '8 Autumn AI Art Prompts That Aren’t Just Another Portrait',
    category: 'autumn',
    tags: ['autumn', 'fall', 'ai art', 'gemini', 'flat lay', 'landscape'],
    intro: 'Most "autumn AI prompt" lists are the same golden-hour headshot recycled eight times. These eight are built around a different job each: a flat lay, a moving subject, a landscape with no person in it at all, a painterly art style, and a couple of edits most people never think to try on a phone photo. Every prompt is written for Gemini’s image editor and tested against ChatGPT’s image tool too — where one model handles it noticeably better, that’s called out.',
    is_trending: true,
    trending_order: 2,
    pro_tips: 'Three things that matter more than the wording of the prompt itself:\n\n1. Source resolution: feed these a photo that’s at least 1200px on the short side. Both models upsample soft or compressed source photos into visibly blurry edits — the model can’t invent detail that wasn’t there, especially on hair and fabric texture.\n\n2. Busy backgrounds fight the model: if your source photo has a cluttered background (other people, signage, a messy room), say "replace the background entirely" explicitly — otherwise both models tend to blend the new scene through gaps in the old one instead of fully replacing it.\n\n3. Flat lays and landscapes (prompts 2, 4, and 6 below) don’t need a source photo of a person at all — a blank prompt or a photo of a plain surface works as the starting point. Portrait edits (1, 3, 5, 7, 8) do need a clear, front-lit source photo of the subject to hold onto their likeness.\n\nIf a result comes back over-sharpened or with visible haloing around the subject’s edges, add "no sharpening halos, natural lens softness at the edge of focus" — this is the single most common artifact on both models when the prompt asks for a strong background blur.',
    items: [
      {
        heading: 'Pumpkin Spice Flat Lay (No Portrait Needed)',
        subtitle: 'A top-down product-style shot built from a plain surface photo — works even without a photo of a person.',
        prompt_text: 'Generate a top-down flat lay photograph on a rustic dark wood table: a ceramic mug of pumpkin spice latte with visible foam and a light dusting of cinnamon, surrounded by three small sugar pumpkins, a loose cluster of dried maple and oak leaves, a cinnamon stick, and a folded cream-colored knit scarf in one corner. Light from a single soft window source at a 45-degree angle so there’s a soft, long shadow from each object — no harsh flash, no overhead studio light. Color grade: warm, slightly muted, film-photo contrast rather than punchy digital contrast. Leave one quiet negative-space corner of the frame empty for text overlay.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        chatgpt_url: CHATGPT,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Foggy Orchard Morning Portrait',
        subtitle: 'Low-contrast, diffused light instead of the usual golden-hour glow — reads as quieter and more editorial.',
        prompt_text: 'Recompose this photo into a quiet, overcast morning in an apple orchard. Rows of leaning apple trees, most leaves turned yellow and rust, recede into a soft ground-level fog that fades the furthest trees to near-white. Light is flat and diffused, like an overcast sky — no strong shadows, no warm sun flare. Skin tones stay neutral and slightly cool rather than orange-graded. Add faint visible breath-fog near the subject’s mouth if the temperature reads as cold. Grade with low contrast, slightly lifted blacks, and a hint of desaturation — this should feel closer to a Sofia Coppola film still than a warm autumn postcard. Do not alter the subject’s facial structure or add a smile if the original doesn’t have one.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Leaf-Toss Motion Blur',
        subtitle: 'A genuinely moving subject — most "autumn portrait" prompts freeze everything, this one is built around motion.',
        prompt_text: 'Edit this into an action shot: the subject mid-motion throwing a handful of dry maple leaves into the air above their head, leaves caught mid-fall around them with light directional motion blur on the leaves only — the subject’s face and torso stay sharp and in focus. Background: a blurred row of trees in fall color, shallow depth of field. Light: warm backlight so the falling leaves are semi-translucent and catch the light at their edges. Grade warm but not orange-heavy — amber highlights, natural midtones. If the source photo shows the subject standing still, reposition their arms into a natural throwing motion (one arm raised, fingers open) rather than leaving them static.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        chatgpt_url: CHATGPT,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Misty Mountain Foliage (No Person)',
        subtitle: 'A pure landscape generation for anyone who wants an autumn wallpaper, not another selfie edit.',
        prompt_text: 'Generate a wide landscape photograph: a valley of mixed forest at peak fall color — red maple, gold birch, and dark green pine mixed together — seen from an elevated viewpoint, with thin bands of low morning mist sitting in the valley folds between ridgelines. A single winding dirt road or river is visible cutting through the lower third of the frame for scale. Sky: pale overcast white-grey, no dramatic clouds, so the foliage color stays the brightest element in the frame. Light is flat and even, no sun flare. Grade like a large-format landscape photograph — high detail in the foliage texture, natural (not oversaturated) color, gentle contrast.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Fireplace Cabin Portrait',
        subtitle: 'Mixed warm-and-cool indoor lighting — a genuinely different light setup from anything shot outdoors.',
        prompt_text: 'Recompose this into an indoor cabin scene: subject seated on a worn leather or wool-blanket-covered armchair beside a stone fireplace with a low, glowing fire (not a large roaring flame). Key light on the subject comes from the firelight — warm orange-red, low and flickering-soft, hitting one side of the face and body. Fill light is cooler, as if from a window just out of frame, on the shadow side. Background: softly blurred exposed wood beams and a stack of firewood. Grade with deep, warm shadows and a slight amber cast to the highlights, but keep the cool fill visible enough that the shot doesn’t turn monochrome-orange. Add subtle visible firelight flicker as soft warm highlights on the nearest side of the subject’s face. Preserve the subject’s features exactly.',
        model: 'ChatGPT (GPT Image)',
        chatgpt_url: CHATGPT,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Corn Maze Aerial (No Person)',
        subtitle: 'A drone-style top-down landscape — a completely different camera angle from every ground-level prompt on this page.',
        prompt_text: 'Generate a top-down aerial photograph of a large corn maze cut into a golden autumn field, the maze pattern clearly readable from directly overhead, bordered by a strip of orange-leaved trees along one edge and a small red barn with a gravel parking area in one corner of the frame. Light: mid-afternoon sun, hard enough to cast small, sharp shadows from the corn rows so the maze pattern reads with real depth, not flat. Color: warm gold corn against the cooler green tree line for contrast. Add a couple of small figures walking the maze paths for scale, rendered small and indistinct — they are not the subject of the shot.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Watercolor Autumn Portrait (Art Style, Not Photo)',
        subtitle: 'A genuine style transfer — the one prompt here that should NOT come back looking like a photograph.',
        prompt_text: 'Transform this photo into a loose watercolor painting, not a photo-real edit. Keep the subject’s likeness, pose, and general proportions recognizable, but render everything with visible watercolor texture: soft bleeding edges where colors meet, uneven pigment pooling in the shadow areas, visible paper grain, and loose, gestural brushwork in the hair and clothing rather than sharp photographic detail. Background: an abstract wash of autumn colors — burnt orange, ochre, and deep red bleeding into each other with no hard edges, suggesting trees without literally painting them. Leave small areas of the "paper" showing through as un-painted white space, especially at the edges of the frame. This should look like it belongs in a gallery, not a camera roll — if the output still looks like a photo with a filter over it, it has failed.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        chatgpt_url: CHATGPT,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
      {
        heading: 'Rainy Dusk Umbrella Portrait',
        subtitle: 'Wet-weather autumn instead of the usual dry, sunny version — a mood most prompt lists skip entirely.',
        prompt_text: 'Edit this into a rainy dusk street scene: subject holding a plain black or dark umbrella, standing on a wet pavement lined with a row of trees dropping yellow leaves that are sticking to the wet ground around their feet. Light: blue-hour dusk ambient light mixed with the warm glow of one or two streetlamps just entering frame, reflected in wet pavement and puddles. Add fine, visible rain — not a downpour, a light steady drizzle — and a subtle wet sheen on the subject’s coat shoulders. Grade with a teal-blue ambient base and warm amber highlights only where the streetlamp light hits, for genuine color contrast rather than a single warm wash over everything. Keep the subject’s face clearly lit and sharp under the umbrella’s edge — don’t let the umbrella shadow obscure it.',
        model: 'Gemini (Nano Banana)',
        gemini_url: GEMINI,
        images: [{ ...PLACEHOLDER_IMAGE }],
      },
    ],
  },
];

async function main() {
  for (const post of POSTS) {
    const [row, created] = await db.Prompt.findOrCreate({
      where: { slug: post.slug },
      defaults: post,
    });
    if (!created) {
      await row.update(post);
      console.log(`Updated: ${post.slug}`);
    } else {
      console.log(`Created: ${post.slug}`);
    }
  }
  console.log(`\nDone — ${POSTS.length} autumn roundup post seeded (placeholder images, local preview only).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
