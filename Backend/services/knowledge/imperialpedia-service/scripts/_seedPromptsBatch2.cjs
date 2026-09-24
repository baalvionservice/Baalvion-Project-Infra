/* Batch 2: demographic/occasion/theme prompt categories (Men, Women, Couples, Birthday,
 * Cars & Bikes, Cinematic) — rounds out _seedPrompts.cjs (seasons + festivals) to match
 * AuraPrompt.in's category spread. LOCAL PREVIEW ONLY — see _seedPrompts.cjs header for the
 * placeholder-image policy; every image here is the same "pending" graphic, not a real output.
 * Run from the service dir:  node scripts/_seedPromptsBatch2.cjs
 */
const db = require('../models');

const PLACEHOLDER_IMAGE = { url: '/prompts/placeholder-pending.svg', alt: 'Example image pending upload' };
const GEMINI = 'https://gemini.google.com/app';
const CHATGPT = 'https://chatgpt.com/';

const POSTS = [
    {
        slug: 'cinematic-portrait-prompts-for-men',
        title: '5 Best Cinematic Portrait Prompts for Men on Gemini',
        category: 'men',
        tags: ['men', 'gemini', 'cinematic', 'portrait'],
        intro: 'Five lighting- and grade-first prompts built for a men’s portrait that looks like a still from a film, not a filter. Each one focuses on light direction and color grade rather than changing the face.',
        is_trending: true,
        trending_order: 4,
        pro_tips: 'If the result looks too smooth or plastic, add "preserve natural skin texture, do not smooth skin" — Gemini defaults toward beautification unless told otherwise.',
        items: [
            {
                heading: 'Old Money Editorial Portrait',
                subtitle: 'Muted tones and a single hard key light for a quiet-luxury look.',
                prompt_text: 'Edit this into an "old money" editorial portrait. Light with a single hard key light from a 45-degree angle, soft fill on the shadow side. Background: a blurred, neutral interior — dark wood or muted stone tones. Grade with desaturated, warm-neutral color — no heavy orange, just clean warm-grey tones and deep, controlled shadows. Keep clothing colors muted (navy, cream, charcoal) if adjustable. Preserve the subject’s natural skin texture and facial structure exactly — do not smooth or reshape.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Urban Night Street Portrait',
                subtitle: 'Mixed color-temperature city lighting for a moodier result.',
                prompt_text: 'Recompose this into a night-time urban portrait. Background: a softly blurred city street with mixed light sources — warm sodium streetlights and cooler shop-window light. Light the subject with a cool key light from one side and a warm rim light from a streetlamp behind them. Add light atmospheric haze for depth. Grade with high contrast, deep blacks, and controlled highlight bloom around light sources. Keep the subject’s face sharp and unaltered.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Monochrome Studio Portrait',
                subtitle: 'A classic black-and-white studio treatment focused on contrast and shape.',
                prompt_text: 'Turn this into a black-and-white studio portrait. Light with a large soft key light from the front-side and a subtle rim light to separate the subject from the background. Background: seamless mid-grey, softly lit. Convert to monochrome with rich, full-range tonal contrast — deep blacks, clean whites, detailed midtones. Do not crush shadows or blow out highlights. Preserve all facial detail and natural texture.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Rooftop Golden Hour',
                subtitle: 'A wider, aspirational outdoor shot with warm backlight.',
                prompt_text: 'Edit this into a wide rooftop portrait at golden hour. Subject standing near a railing, city skyline softly blurred behind them, warm low sun creating backlight and a gentle flare. Grade with warm highlights, natural midtones, and soft contrast — avoid oversaturating the sky. Add light atmospheric haze between the subject and the skyline for depth. Keep the subject in sharp focus with natural, unaltered facial features.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'aesthetic-portrait-prompts-for-women',
        title: '5 Best Aesthetic Portrait Prompts for Women on Gemini',
        category: 'women',
        tags: ['women', 'gemini', 'aesthetic', 'portrait'],
        intro: 'Five prompts focused on soft, flattering light and color — built for a polished portrait that still looks like a real photo of the subject, not a different face.',
        is_trending: false,
        pro_tips: 'For soft-light prompts, name the light source shape ("large soft window light" or "large diffused softbox") rather than just "soft light" — Gemini renders more consistent, realistic falloff when the source is described physically.',
        items: [
            {
                heading: 'Soft Window Light Portrait',
                subtitle: 'A natural-light, editorial-clean close-up.',
                prompt_text: 'Edit this into a soft, natural-light portrait. Light the subject with large, diffused window light from one side — soft shadow falloff, no harsh edges. Background: a softly blurred neutral room, warm cream or beige tones. Grade with soft, warm-neutral tones and gentle contrast — a clean, editorial look. Preserve the subject’s natural skin texture, facial structure, and expression exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Golden Hour Backlit Portrait',
                subtitle: 'Warm rim light and gentle flare for an outdoor, dreamy feel.',
                prompt_text: 'Recompose this into a golden-hour backlit portrait. Position the sun low and behind the subject, creating warm rim light on hair and shoulders and a soft, warm lens flare. Add a gentle warm fill on the face so features stay clearly visible. Background: softly blurred greenery or open field. Grade with warm highlights, soft glow, and gentle contrast. Keep the subject’s face natural and unaltered.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Studio Beauty Close-Up',
                subtitle: 'A clean, even-lit close crop for a polished beauty-editorial look.',
                prompt_text: 'Turn this into a clean studio beauty portrait. Light with a large soft beauty-dish-style key light straight on, subtle fill to keep shadows soft and open. Background: seamless soft grey or pastel, evenly lit. Grade with clean, true-to-life color and gentle, even contrast. Keep all natural skin texture, freckles, and facial structure exactly as in the original — no smoothing or reshaping.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Pastel Editorial Portrait',
                subtitle: 'A softer, color-forward option for a more stylized post.',
                prompt_text: 'Edit this into a soft pastel-toned editorial portrait. Background: a softly blurred pastel color (blush pink, lavender, or soft sage — pick whichever complements the subject’s existing clothing). Light with soft, even front light. Grade with a gentle pastel color palette, lifted shadows, and soft, airy contrast. Do not alter the subject’s facial structure or proportions.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'couple-photo-editing-prompts',
        title: '5 Best Couple Photo Editing Prompts for Gemini & ChatGPT',
        category: 'couples',
        tags: ['couples', 'gemini', 'chatgpt', 'romantic'],
        intro: 'Five prompts for editing a couple’s photo into something more cinematic — built around light and setting rather than changing how either person looks.',
        is_trending: false,
        pro_tips: 'When editing a two-person photo, explicitly say "preserve both subjects’ faces and proportions exactly" — without it, Gemini occasionally over-edits whichever face is smaller/further from camera.',
        items: [
            {
                heading: 'Golden Hour Beach Walk',
                subtitle: 'A warm, wide shot with the couple walking along the shoreline.',
                prompt_text: 'Edit this into a golden-hour beach portrait of the couple walking hand-in-hand along the shoreline, gentle waves and wet sand reflecting the warm sky. Sun low on the horizon, creating a soft flare and warm rim light on both subjects. Grade with warm, soft contrast and a light film-like glow. Preserve both subjects’ faces, proportions, and expressions exactly as in the original.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'City Lights Embrace',
                subtitle: 'A moodier, night-time urban portrait.',
                prompt_text: 'Recompose this into a night-time city portrait of the couple, softly blurred bokeh city lights filling the background. Light both subjects with a warm key light, cooler ambient light from the city behind them. Add gentle atmospheric haze for depth. Grade with rich contrast and warm-cool color balance. Keep both faces sharp, natural, and unaltered.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Rainy Umbrella Portrait',
                subtitle: 'A softer, cinematic mood using rain and reflection.',
                prompt_text: 'Turn this into a cinematic rainy-day portrait: the couple sharing an umbrella on a softly lit city street, wet pavement reflecting warm streetlight below. Add fine, realistic rain streaks in the air. Grade with cool-toned ambient light balanced against warm reflected highlights on the ground. Preserve both subjects’ facial features and expressions exactly.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Garden Golden Light Close-Up',
                subtitle: 'A tighter, softer close-up for a more intimate feel.',
                prompt_text: 'Edit this into a close, intimate portrait of the couple in a softly blurred garden setting, warm dappled light filtering through leaves above. Shallow depth of field so the background dissolves into soft green-and-gold bokeh. Grade with warm, gentle contrast and a soft film-like glow. Keep both subjects’ faces and proportions exactly as in the original photo.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'birthday-photo-editing-prompts',
        title: '5 Best Birthday Photo Editing Prompts for Gemini',
        category: 'birthday',
        tags: ['birthday', 'gemini', 'celebration'],
        intro: 'Five prompts for turning a regular photo into a birthday-ready shot — balloon bokeh, candlelight, confetti, and a couple of bolder options.',
        is_trending: false,
        pro_tips: 'Balloon and confetti prompts look most realistic when you specify a limited color palette (2-3 colors) — asking for "colorful balloons" with no constraint tends to produce an oversaturated, cluttered result.',
        items: [
            {
                heading: 'Balloon Bokeh Portrait',
                subtitle: 'Soft, out-of-focus balloons for a classic birthday-card feel.',
                prompt_text: 'Edit this into a birthday portrait with soft, out-of-focus balloons in two or three complementary colors filling the background. Light the subject with warm, even front light. Shallow depth of field so balloons render as soft round bokeh shapes rather than sharp objects. Grade with warm, cheerful tones and gentle contrast. Preserve the subject’s natural face and expression exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Candlelit Cake Close-Up',
                subtitle: 'A warm, single-source lighting shot built around candle glow.',
                prompt_text: 'Recompose this into a close birthday portrait lit primarily by candlelight from a cake held just below frame, warm flickering light illuminating the subject’s face from below-front. Background: soft, dark, out-of-focus. Grade with warm amber tones and gentle glow on highlights. Keep the subject’s facial features and expression exactly as in the original.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Confetti Toss Action Shot',
                subtitle: 'A livelier, mid-motion celebratory shot.',
                prompt_text: 'Turn this into a joyful, mid-action birthday shot: add sparse, softly-out-of-focus confetti in the air around the subject, as if just tossed, in two complementary colors. Light with bright, even, slightly warm light. Grade with punchy but natural contrast and warm tones. Do not alter the subject’s facial structure — enhance the scene around them only.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'String Lights Party Backdrop',
                subtitle: 'A cozier, evening-party version with warm bokeh lights.',
                prompt_text: 'Edit this into an evening birthday portrait with warm string lights softly blurred in the background, a few pastel balloons visible but out of focus. Light the subject with warm, soft key light. Grade with warm, cozy tones and gentle contrast, similar to a golden-hour indoor party. Preserve the subject’s natural face and expression exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'car-and-bike-photo-editing-prompts',
        title: '5 Best Car & Bike Photo Editing Prompts for Gemini',
        category: 'cars-bikes',
        tags: ['cars', 'bikes', 'gemini', 'automotive'],
        intro: 'Five prompts for giving a car or bike photo a cleaner, more dramatic look — studio-style, sunset backdrops, and a wet-road cinematic option.',
        is_trending: false,
        pro_tips: 'Automotive edits go wrong fastest around reflections — add "keep reflections on paint and glass physically accurate to the new lighting" so Gemini doesn’t leave old-lighting reflections on a repainted scene.',
        items: [
            {
                heading: 'Studio Product-Style Shot',
                subtitle: 'A clean, seamless-background treatment for a showroom look.',
                prompt_text: 'Edit this into a clean studio-style automotive shot. Replace the background with a seamless, softly gradient-lit grey backdrop, subtle reflection of the vehicle on a glossy studio floor. Light with large, even soft light from front-and-above, controlled specular highlights along the body panels. Grade with clean, true-to-life color and crisp, even contrast. Keep the vehicle’s shape, badges, and proportions exactly as in the original.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Golden Hour Open Road',
                subtitle: 'A warm, cinematic outdoor shot for a more dynamic feel.',
                prompt_text: 'Recompose this into a golden-hour shot on an open road, warm low sun behind the vehicle creating a strong flare and warm rim light along the body. Background: softly blurred road and landscape. Grade with warm highlights, natural contrast, and light atmospheric haze. Keep reflections on paint and glass physically accurate to the new lighting direction.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Wet Night Street Scene',
                subtitle: 'A moody, cinematic night shot using wet-road reflections.',
                prompt_text: 'Turn this into a moody night shot: vehicle on a wet city street, streetlights and neon signage softly blurred behind it, reflected in the wet pavement below. Light the vehicle with a mix of warm streetlight and cool ambient light — resulting reflections should be accurate to these new light sources. Grade with high contrast, deep blacks, and controlled highlight bloom.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Mountain Backdrop Wide Shot',
                subtitle: 'A dramatic, wallpaper-style wide landscape shot.',
                prompt_text: 'Edit this into a wide landscape shot: vehicle parked on a scenic mountain road, layered peaks fading into soft haze behind it, overcast diffused daylight. Grade with a natural, slightly desaturated landscape palette and even contrast. Keep the vehicle sharp and in focus against the softer background, proportions and details unchanged.',
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
    console.log(`\nDone — ${POSTS.length} more roundup posts seeded (all with PLACEHOLDER images, local preview only).`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
