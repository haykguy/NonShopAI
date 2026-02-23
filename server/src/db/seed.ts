import { db } from './database';

export function runSeed(): void {
  const productCount = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  if (productCount > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (name, slug, key_ingredients, marketing_angle, target_audience)
    VALUES (@name, @slug, @key_ingredients, @marketing_angle, @target_audience)
  `);

  const insertStyle = db.prepare(`
    INSERT INTO video_styles (name, slug, category, description, image_prompt_style, clip_count_default)
    VALUES (@name, @slug, @category, @description, @image_prompt_style, @clip_count_default)
  `);

  const seedAll = db.transaction(() => {
    insertProduct.run({
      name: 'Cata-Kor NMN',
      slug: 'catakor-nmn',
      key_ingredients: 'NMN, Hyaluronic Acid, Biotin',
      marketing_angle: 'Restores youthful skin and cellular energy by replenishing NAD+ levels that decline after age 40. Celebrities use this to look 30 at 50.',
      target_audience: 'Women 40-65 concerned about skin aging, energy decline, and looking old',
    });

    insertProduct.run({
      name: 'Cata-Kor Ca-AKG',
      slug: 'catakor-caakg',
      key_ingredients: 'Calcium Alpha-Ketoglutarate, Vitamin C, Zinc',
      marketing_angle: 'Fuels neurons at the cellular level to eliminate brain fog. One bottle replaces $170 worth of separate supplements at $47.',
      target_audience: 'Adults 35-60 experiencing brain fog, poor focus, memory issues, cognitive decline',
    });

    insertProduct.run({
      name: 'Cata-Kor NAD+',
      slug: 'catakor-nad',
      key_ingredients: 'NAD+, Resveratrol, CoQ10',
      marketing_angle: 'Direct NAD+ supplementation for energy, longevity, and cellular repair. The molecule your body stops making enough of after 30.',
      target_audience: 'Health-conscious adults 35-70 interested in longevity, anti-aging, energy optimization',
    });

    insertStyle.run({
      name: 'Street Interview',
      slug: 'street-interview',
      category: 'top-of-funnel',
      description: 'Photorealistic person being interviewed on the street with a microphone, urban background. High credibility, journalistic feel.',
      image_prompt_style: 'Photorealistic woman/man being interviewed outdoors on city street, holding RØDE microphone, professional business attire, urban building background, natural lighting, cinematic 9:16 vertical',
      clip_count_default: 7,
    });

    insertStyle.run({
      name: 'Podium Stage',
      slug: 'podium-stage',
      category: 'top-of-funnel',
      description: 'Expert speaker at whiteboard or TED-style stage presenting to an audience. Authority and education positioning.',
      image_prompt_style: 'Photorealistic confident speaker standing at whiteboard in professional seminar room, business casual attire, audience visible in background, bright room lighting, cinematic 9:16 vertical',
      clip_count_default: 7,
    });

    insertStyle.run({
      name: 'Transformation',
      slug: 'transformation',
      category: 'top-of-funnel',
      description: 'Person talking directly to camera about their before/after results. Raw, authentic, high trust.',
      image_prompt_style: 'Photorealistic person talking directly to camera in bathroom or bedroom, casual home setting, natural authentic lighting, no makeup look, cinematic 9:16 vertical',
      clip_count_default: 6,
    });

    insertStyle.run({
      name: 'Holistic Healer',
      slug: 'holistic-healer',
      category: 'top-of-funnel',
      description: 'Wellness practitioner in a natural or clinical setting sharing health secrets. Aspirational and trustworthy.',
      image_prompt_style: 'Photorealistic wellness practitioner in bright natural clinic or nature setting, white or earth tone clothing, plants visible, soft natural lighting, cinematic 9:16 vertical',
      clip_count_default: 7,
    });

    insertStyle.run({
      name: 'Pixar AI',
      slug: 'pixar-ai',
      category: 'pixar-ai',
      description: 'Animated cartoon characters that personify health problems and supplements. Villain character represents the problem, hero character represents the solution.',
      image_prompt_style: 'Pixar-style 3D animated character, bubbly friendly design, expressive eyes, bright colors, clean background, high quality render',
      clip_count_default: 7,
    });
  });

  seedAll();
}
