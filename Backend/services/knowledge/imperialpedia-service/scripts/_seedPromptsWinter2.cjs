/* Second winter AI-prompt roundup post — LOCAL PREVIEW ONLY.
 * Adds lifestyle/companion/still-life winter scenes to complement the existing
 * winter-wonderland-portrait-prompts post (which is all outdoor/portrait). Every image slot
 * points at /prompts/placeholder-pending.svg since no real Gemini/ChatGPT example images exist
 * yet — replace via the admin upload button (Imperialpedia > Prompts > edit) before deploy.
 * Run from the service dir:  node scripts/_seedPromptsWinter2.cjs
 */
const db = require('../models');

const PLACEHOLDER_IMAGE = { url: '/prompts/placeholder-pending.svg', alt: 'Example image pending upload' };
const GEMINI = 'https://gemini.google.com/app';
const CHATGPT = 'https://chatgpt.com/';

const POSTS = [
    {
        slug: 'cozy-winter-lifestyle-photo-prompts',
        title: '5 Best Cozy Winter Lifestyle Photo Prompts for Gemini & ChatGPT',
        category: 'winter',
        tags: ['winter', 'cozy', 'gemini', 'chatgpt', 'lifestyle'],
        intro: 'Not every winter shot needs snow underfoot — these five lean into knitwear, candlelight, and companionable warmth for a softer, indoor-adjacent take on the season.',
        is_trending: false,
        pro_tips: 'For any flat-lay prompt, tell the model the light source and its direction explicitly ("soft window light from the upper left") — without it, Gemini tends to default to flat, shadowless studio lighting that reads as obviously synthetic.',
        items: [
            {
                heading: 'Golden-Hour Scarf Walk',
                subtitle: 'A warm-toned outdoor portrait that trades snow-blue for late-afternoon gold.',
                prompt_text: 'Edit this into a golden-hour winter portrait: subject mid-stride on a quiet street, wrapped in a chunky knit scarf, low warm sun casting long soft shadows and a gentle backlit rim on the hair. Background: softly blurred bare winter trees and warm-lit windows. Grade with warm amber highlights against cool shadow tones for contrast. Keep the subject’s face, hair, and proportions exactly as in the original.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Cocoa & Companion by the Fire',
                subtitle: 'A relaxed indoor scene built around a pet and a warm drink.',
                prompt_text: 'Recompose this into a relaxed evening scene: subject seated on a worn leather or linen sofa, a mug of cocoa with visible steam in hand, a dog or cat curled up beside them, firelight flickering warm and uneven from off-frame. Soft ambient room light mixed with the firelight’s warm cast. Natural, unposed expression. Preserve the subject’s natural face and features exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Knit & Candle Flat Lay',
                subtitle: 'A styled overhead still life — no subject, just texture and mood.',
                prompt_text: 'Turn this into an overhead flat-lay composition: a folded chunky-knit sweater, a lit taper candle, a ceramic mug, and a few pine sprigs arranged on a raw wood or linen surface. Light from soft window light entering from the upper left, casting long soft shadows across the frame. Grade with muted, warm-neutral tones — no oversaturation. Keep textures (knit fibers, wax drips, wood grain) crisp and tactile.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Snowy Trail Walk with a Dog',
                subtitle: 'An outdoor companion shot for a livelier, movement-driven result.',
                prompt_text: 'Edit this into a wide outdoor shot of the subject walking a leashed dog along a snow-dusted trail, both mid-motion, breath faintly visible in the cold air. Overcast, evenly diffused daylight — no harsh shadows. Background: bare trees and a light snow dusting fading into soft haze. Grade with a cool, slightly desaturated winter palette. Keep the subject in sharp focus with the background softly blurred.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'New Year’s Eve Red Coat Portrait',
                subtitle: 'A bolder color pop for an end-of-year post.',
                prompt_text: 'Recompose this into an evening portrait: subject in a deep red winter coat standing against a softly blurred city street with warm bokeh lights (string lights or distant storefronts). Cool blue ambient twilight balanced against the warm bokeh for contrast. Add very fine, out-of-focus snowflakes in the foreground for depth. Grade with rich, slightly moody contrast — deep reds and cool blues. Preserve the subject’s natural face and expression exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
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
    console.log(`\nDone — ${POSTS.length} roundup post(s) seeded (all with PLACEHOLDER images, local preview only).`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
