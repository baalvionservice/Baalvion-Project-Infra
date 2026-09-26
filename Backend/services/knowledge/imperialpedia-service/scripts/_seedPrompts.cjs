/* Seed starter AI-prompt roundup posts across seasons and festivals — LOCAL PREVIEW ONLY.
 * Every image slot points at /prompts/placeholder-pending.svg (a clearly-labeled "pending"
 * graphic, not a real AI output) since no real Gemini/ChatGPT example images exist yet. Replace
 * every image via the admin upload button (Imperialpedia > Prompts > edit) before anything here
 * is ever deployed — see PLACEHOLDER_IMAGE below.
 * Run from the service dir:  node scripts/_seedPrompts.cjs
 */
const db = require('../models');

const PLACEHOLDER_IMAGE = { url: '/prompts/placeholder-pending.svg', alt: 'Example image pending upload' };
const GEMINI = 'https://gemini.google.com/app';
const CHATGPT = 'https://chatgpt.com/';

const POSTS = [
    {
        slug: 'winter-wonderland-portrait-prompts',
        title: '5 Best Winter Wonderland Portrait Prompts for Gemini & ChatGPT',
        category: 'winter',
        tags: ['winter', 'snow', 'gemini', 'chatgpt', 'portrait'],
        intro: 'Snow, soft blue light, and cozy layers — these prompts are built for turning an ordinary photo into a winter-editorial portrait without making it look like a cheap filter.',
        is_trending: true,
        trending_order: 2,
        pro_tips: 'If Gemini renders snow that looks painted-on rather than physically sitting on surfaces, add "snow should sit naturally on shoulders, hair, and the ground with realistic soft shadows" — Gemini responds well to being told exactly how the effect should physically behave.',
        items: [
            {
                heading: 'Snowfall Portrait, Soft Blue Light',
                subtitle: 'A quiet, close-up shot with falling snow and cool tones.',
                prompt_text: 'Edit this photo into a winter portrait with gently falling snow around the subject. Light the scene with soft, cool blue-toned daylight, as if shot right after a snowfall under overcast sky. Add fine, out-of-focus snowflakes in the foreground for depth. Subject’s breath should be faintly visible as light mist. Grade the image with a cool, slightly desaturated winter palette — soft blues and whites, gentle contrast. Keep the subject’s facial features, hair, and expression exactly as in the original.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Cabin Fireplace Warmth',
                subtitle: 'Indoor, warm-toned counterpoint to the outdoor snow shots.',
                prompt_text: 'Recompose this into a cozy cabin interior portrait. Subject seated near a crackling fireplace, wrapped in a chunky wool blanket, soft warm firelight lighting one side of the face while the rest of the room falls into soft shadow. Background: out-of-focus wooden cabin walls, a few string lights. Grade with warm amber tones, deep soft shadows, gentle film grain. Add a subtle warm glow/flicker effect near the fire. Do not change the subject’s facial structure or proportions.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Frosted Window Reflection',
                subtitle: 'A moodier, editorial take using a frosted-glass foreground element.',
                prompt_text: 'Turn this into an editorial portrait shot through a partially frosted window. Add realistic ice-crystal frost patterns around the edges of the frame, with a clear circle wiped in the center where the subject is visible. Cool blue-white color grade outside, subject lit with soft neutral light. Add very subtle fogged-breath detail near the glass. Keep the composition tight — chest-up crop. Preserve the subject’s natural face and expression exactly.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Snowy Mountain Wide Shot',
                subtitle: 'A dramatic, wallpaper-style wide shot for a bigger, bolder result.',
                prompt_text: 'Transform this into a wide-angle portrait with the subject standing on a snowy mountain ridge, layered snow-capped peaks fading into soft blue-grey haze behind them. Overcast, diffused light — no harsh shadows. Add fine blowing snow for atmosphere. Subject dressed in winter outerwear (keep whatever they’re wearing in the original, just make it read as winter-appropriate). Grade with a cool, high-contrast landscape palette. Keep the subject in sharp focus against the softer background.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'christmas-photo-editing-prompts',
        title: '5 Best Christmas Photo Editing Prompts for Gemini',
        category: 'christmas',
        tags: ['christmas', 'holiday', 'gemini', 'festive'],
        intro: 'From cozy string-light close-ups to a full snow-globe effect — five Christmas-ready prompts for turning a regular photo into your holiday card shot.',
        is_trending: false,
        pro_tips: 'For the string-light bokeh prompts, if Gemini places the lights too evenly, add "scatter light positions unevenly, like a real string of lights hung by hand" — a perfectly even bokeh grid is the easiest tell that a background was AI-generated.',
        items: [
            {
                heading: 'String Lights Bokeh Portrait',
                subtitle: 'The classic warm, twinkly-background holiday portrait.',
                prompt_text: 'Edit this into a Christmas portrait with a background of warm, out-of-focus string lights (gold and warm white, uneven spacing like a real hung string, not a perfect grid). Subject lit with soft, warm key light from the front. Shallow depth of field so the lights render as soft round bokeh circles. Grade with warm, slightly golden tones and gentle contrast — a classic holiday-card look. Keep the subject’s face and expression exactly as in the original photo.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Christmas Tree Corner Scene',
                subtitle: 'A wider shot placing the subject beside a decorated tree.',
                prompt_text: 'Recompose this into a wider shot with the subject seated beside a decorated Christmas tree — warm white lights, red and gold ornaments, a few wrapped presents at the base. Soft ambient room lighting, warm color temperature throughout. Keep the tree slightly out of focus behind the subject so they remain the clear focal point. Grade with warm, cozy holiday tones. Do not alter the subject’s face, hair, or proportions.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Snow Globe Effect',
                subtitle: 'A playful, stylized effect — good for a fun social post rather than a formal portrait.',
                prompt_text: 'Turn this photo into a snow-globe illustration effect: place the subject inside a glass sphere with a softly blurred winter village scene behind them (small houses, warm lit windows, snow-covered rooftops), gentle snowfall inside the globe, and a subtle glass-reflection highlight along the curve of the sphere. Add a simple dark wooden base beneath the globe. Keep the subject’s face rendered naturally and realistically — only the surrounding scene should look illustrated/stylized.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Cozy Pajamas & Cocoa',
                subtitle: 'A relaxed, lifestyle-style shot for a more casual holiday post.',
                prompt_text: 'Edit this into a relaxed holiday lifestyle shot: subject in cozy plaid or knit pajamas, holding a mug of hot cocoa with visible steam, seated on a couch near a softly blurred, lightly decorated tree in the background. Warm, soft indoor lighting, slightly overcast window light mixed with warm lamp light. Natural, candid expression. Grade with warm midtones and soft contrast. Preserve the subject’s natural face and features.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'halloween-photo-editing-prompts',
        title: '5 Best Halloween Photo Editing Prompts for Gemini & ChatGPT',
        category: 'halloween',
        tags: ['halloween', 'gemini', 'chatgpt', 'costume'],
        intro: 'Five Halloween prompts that go beyond a basic filter — vampire portrait lighting, a foggy graveyard scene, and a couple of stylized options for social posts.',
        is_trending: true,
        trending_order: 3,
        pro_tips: 'For any costume/makeup prompt, describe the makeup in physical terms (contour, shading direction, where highlights sit) rather than naming a character — "sunken cheek shading and dark lip stain" edits more reliably than "make me look like a vampire."',
        items: [
            {
                heading: 'Vampire Portrait, Moody Lighting',
                subtitle: 'Dramatic single-source lighting with subtle makeup edits.',
                prompt_text: 'Edit this into a dramatic vampire-inspired portrait. Add subtle pale skin tone, defined dark contour under the cheekbones, and a deep red-stained lip. Light the scene with a single hard source from below-and-to-the-side to create dramatic upward shadows across the face. Background: near-black with a faint red rim light. Add very subtle fog at the bottom of the frame. Keep the subject’s facial structure and proportions unchanged — this should read as heavy stage makeup and lighting, not a face swap.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Foggy Graveyard Scene',
                subtitle: 'A wider, cinematic horror-movie-poster style shot.',
                prompt_text: 'Recompose this into a wide, cinematic Halloween scene: subject standing in a foggy graveyard at dusk, old stone headstones softly visible through thick ground fog, a few bare trees silhouetted against a deep purple-grey sky. Light the subject with a single cool moonlight source from above, leaving the lower half of the face in soft shadow. Grade with a desaturated, cool-toned horror-movie-poster palette. Keep the subject clearly the sharp focal point against the hazy background.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Pumpkin Patch Golden Hour',
                subtitle: 'A friendlier, non-scary Halloween option for family photos.',
                prompt_text: 'Edit this into a warm, family-friendly Halloween photo: subject standing in a pumpkin patch at golden hour, rows of orange pumpkins extending into a softly blurred background, warm low sun creating a gentle flare. Grade with warm autumn tones, soft contrast, and light haze. Add a few loose strands of hay near the subject’s feet for texture. Keep the subject’s face and expression exactly as in the original.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Neon Glow Costume Portrait',
                subtitle: 'A bold, stylized option built for Instagram/Reels thumbnails.',
                prompt_text: 'Turn this into a bold neon-lit Halloween portrait: light the subject with two colored gels — deep purple from one side, acid green from the other — creating strong dual-tone shadows across the face. Background: dark, out-of-focus with a few soft neon light streaks. Add subtle skin highlights that pick up the colored light realistically. Grade with high contrast and rich, saturated shadow tones. Keep the subject’s facial structure unchanged — only the lighting and color should shift dramatically.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'new-years-eve-glam-prompts',
        title: '5 Best New Year’s Eve Glam Prompts for Gemini',
        category: 'new-year',
        tags: ['new year', 'gemini', 'glam', 'party'],
        intro: 'Confetti, gold light, and a countdown-ready glow — five prompts for a New Year’s Eve portrait that still looks like an actual photo, not a sticker pack.',
        is_trending: false,
        pro_tips: 'Confetti and bokeh prompts tend to over-fill the frame if you don’t constrain them — add "keep confetti sparse and mostly out of focus in the background, not covering the subject" for a more natural result.',
        items: [
            {
                heading: 'Gold Confetti Countdown Portrait',
                subtitle: 'The classic NYE shot — warm gold tones and soft confetti bokeh.',
                prompt_text: 'Edit this into a New Year’s Eve portrait with soft, out-of-focus gold and white confetti falling in the background, warm bokeh city lights further behind. Light the subject with warm gold key light from the front. Keep confetti sparse and mostly out of focus, not covering the subject’s face. Grade with rich warm tones, soft glow on highlights, gentle contrast. Preserve the subject’s natural face and expression exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'City Skyline Fireworks',
                subtitle: 'A wider shot with the subject against a fireworks-lit skyline.',
                prompt_text: 'Recompose this into a wide shot: subject standing on a rooftop or balcony, city skyline behind them lit with a few soft fireworks bursts high in the sky, warm-to-cool gradient in the night sky. Light the subject with a soft rim light picking up the warm firework glow on one side, cooler ambient city light on the other. Grade with cinematic night-time contrast. Keep the subject sharp and in focus against the softer skyline.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Champagne Toast Close-Up',
                subtitle: 'A tighter, celebratory close-up shot.',
                prompt_text: 'Turn this into a close, celebratory portrait: subject holding a champagne glass slightly raised, soft warm party lighting, a few blurred string lights in the background. Add a very subtle motion-blur sparkle on the champagne bubbles. Grade with warm, glowing highlights and soft overall contrast. Keep the subject’s facial features and expression exactly as in the original photo.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Sequin & Sparkle Editorial',
                subtitle: 'A bolder, fashion-editorial take for a standout post.',
                prompt_text: 'Edit this into a fashion-editorial NYE portrait: strong single-source spotlight from above-front, deep black background, subject’s clothing rendered with a subtle sequin/sparkle texture catching the light. Add fine dust-like sparkle particles drifting in the light beam. Grade with high contrast, deep blacks, and bright controlled highlights. Do not change the subject’s facial structure — enhance lighting and texture only.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
        ],
    },
    {
        slug: 'diwali-festive-portrait-prompts',
        title: '5 Best Diwali Festive Portrait Prompts for Gemini',
        category: 'diwali',
        tags: ['diwali', 'festival', 'gemini', 'diya', 'lights'],
        intro: 'Diya light, marigold color, and warm festival glow — five prompts built specifically for Diwali portraits, from a simple diya close-up to a full rangoli courtyard scene.',
        is_trending: false,
        pro_tips: 'Diya-light prompts render best when you specify the light is "flickering and warm, uneven in intensity" — a flat, even glow is the most common giveaway that the lighting was generated rather than photographed.',
        items: [
            {
                heading: 'Diya Light Close Portrait',
                subtitle: 'A tight, warm close-up lit by a foreground diya.',
                prompt_text: 'Edit this into a close Diwali portrait lit primarily by a diya (oil lamp) held just out of frame in the foreground, its warm, flickering, uneven light illuminating the subject’s face from below-front. Background: soft, out-of-focus warm bokeh from more diyas and string lights. Grade with warm amber tones, gentle contrast, soft glow on highlights. Preserve the subject’s natural facial features and expression exactly.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Marigold & Rangoli Courtyard',
                subtitle: 'A wider, color-rich scene for a full festive setting.',
                prompt_text: 'Recompose this into a wide festive courtyard scene: subject standing near a colorful rangoli pattern on the ground, marigold garlands draped nearby, rows of diyas lining the steps behind them, warm evening light. Grade with rich, warm saturated tones — deep orange, red, and gold — while keeping skin tones natural. Keep the subject in sharp focus with the rangoli and diyas softly blurred behind them.',
                model: 'Gemini (Nano Banana)',
                gemini_url: GEMINI,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Traditional Outfit Editorial',
                subtitle: 'A cleaner, editorial-style portrait focused on outfit and fabric detail.',
                prompt_text: 'Turn this into a clean editorial portrait: soft, even studio-style key light from the front-side, warm neutral background, slightly out of focus. Emphasize fabric texture and detail if the subject is wearing traditional festive clothing — keep colors rich and true rather than oversaturated. Grade with soft warm contrast and gentle highlight glow. Do not alter the subject’s facial structure or proportions.',
                model: 'ChatGPT (GPT Image)',
                chatgpt_url: CHATGPT,
                images: [{ ...PLACEHOLDER_IMAGE }],
            },
            {
                heading: 'Diya Trail Bokeh Portrait',
                subtitle: 'A dreamy, bokeh-forward shot for a softer festival mood.',
                prompt_text: 'Edit this into a dreamy Diwali portrait with a winding trail of small diyas leading into a softly blurred background, each one rendering as warm, uneven bokeh at different distances. Light the subject with soft warm ambient light matching the diya glow. Grade with a warm, slightly hazy film look — lifted shadows, soft highlight bloom. Keep the subject’s face and expression exactly as in the original photo.',
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
    console.log(`\nDone — ${POSTS.length} roundup posts seeded (all with PLACEHOLDER images, local preview only).`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
