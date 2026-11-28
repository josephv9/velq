<?php
declare(strict_types=1);

/**
 * Editorial and contextual linking pass. Existing headings, citations, disclosures,
 * canonical URLs and conversion markup remain intact. No global keyword injection.
 */
function velq_editorial_content_response(string $html, string $requestPath): string {
    $path = rtrim(preg_replace('~/index\\.html$~', '', $requestPath) ?? $requestPath, '/');
    if (stripos($html, '<html') === false || stripos($html, '</main>') === false) return $html;

    // Correct the legacy slash in existing internal calculator links on articles/guides only.
    if (str_starts_with($path, '/blog/') || str_starts_with($path, '/guides/')) {
        $html = str_replace(['href="/tools/protein-fiber-calculator/"', 'href="https://velqnutrition.com/tools/protein-fiber-calculator/"'],
                            ['href="/tools/protein-fiber-calculator"', 'href="https://velqnutrition.com/tools/protein-fiber-calculator"'], $html);
    }
    $sections = [
        '/blog/protein-gummies-for-adults' => ['When gummies may not be the best fit', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Do protein gummies work as a protein source?</h2><p>A gummy can contribute protein if the label establishes the amount and source in the full serving. As an illustrative example, a packet with 20 grams of protein per ten gummies supplies an average of 2 grams per piece; two pieces are not a 20-gram serving. Protein quality and the rest of your diet still matter. Compare the complete packet with a portion of food using the <a href="/blog/how-much-protein-do-you-actually-need">daily protein guide</a>, then explore other <a href="/blog/category/protein">high-protein snack formats</a>. This is label arithmetic, not evidence of a finished product's effects.</p></section>
HTML
        ],
        '/blog/protein-and-fiber-gummies-buying-guide' => ['Bring these questions with you', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Compare a packet before comparing the front label</h2><p>For a fair shopping comparison, write down the full serving, protein source, fiber type, grams of each nutrient, calories, caffeine and cost. For example, if a package costs $30 and contains ten complete servings, it costs $3 per serving; compare it with other complete servings, not individual gummies. Use the <a href="/tools/serving-comparison-calculator">serving comparison calculator</a> to evaluate documented examples and the <a href="/blog/category/functional-gummies">functional gummies guide</a> to distinguish ingredient purposes. A prelaunch specification is not a verified retail label.</p></section>
HTML
        ],
        '/blog/protein-gummies-with-fiber-comparison' => ['Sources and Our Review Limits', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">How to compare a partial pouch</h2><p>The study compares the complete manufacturer-published serving. If a label specifies ten pieces with 20 grams of protein, the average is 2 grams per piece; a half serving is approximately 10 grams if the pieces are uniform. If the piece count is not published, leave the per-piece result unknown. Use the <a href="/tools/serving-comparison-calculator">serving comparison calculator</a> and the <a href="/blog/protein-gummies-for-adults">adult protein gummy label guide</a> to understand the distinction. The arithmetic does not establish absorption, clinical effects or equivalence between protein sources.</p></section>
HTML
        ],
        '/blog/protein-and-fiber-gummies-vs-separate-supplements' => ['Your five-question checklist', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">When separate products give you more flexibility</h2><p>Imagine one routine in which a person wants a protein snack in the morning and fiber with a later meal. Separate products allow the ingredient amounts and timing to be chosen independently; a fixed combination is less flexible. Check overlapping ingredients and total caffeine when comparing formats. Read the <a href="/blog/category/functional-gummies">functional gummies guide</a> and the <a href="/blog/fiber-gummies-for-adults-guide">adult fiber gummy guide</a> before deciding which label fits your routine.</p></section>
HTML
        ],
        '/blog/best-fiber-gummies-2026' => ['Which Fiber Gummy Fits Your Use Case?', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Compare fiber gummies by cost per gram</h2><p>A low bottle price alone does not establish better value. In a hypothetical comparison, 30 servings costing $15 with 3 grams of fiber per serving equal about 17 cents per gram; 30 servings costing $18 with 5 grams each equal 12 cents per gram. Fiber type, directions and tolerance still matter, so these examples do not rank efficacy. Check the product's current label and price using the <a href="/tools/nutrition-label-value-calculator">label-value calculator</a> and compare other formats in the <a href="/blog/fiber-gummies-for-adults-guide">adult fiber gummy guide</a>. The dated shortlist is not a new product review.</p></section>
HTML
        ],
        '/blog/fiber-gummies-for-adults-guide' => ['Questions to ask before choosing', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">How to read a prebiotic fiber gummy label</h2><p>Check whether the named ingredient appears in the ingredients list and compare grams of dietary fiber per full serving, not the total weight of a fiber blend. For example, a label listing 5 grams of dietary fiber across two gummies describes 5 grams for the full serving, not 5 grams for each piece. Read the <a href="/blog/how-much-fiber-do-you-need-every-day">daily fiber intake guide</a> for dietary context and the <a href="/blog/category/fiber">fiber and gut health collection</a> for other formats. Follow the specific product directions.</p></section>
HTML
        ],
        '/blog/caffeine-gummies-vs-coffee-whats-the-difference' => ['A practical checklist', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Compare the caffeine in the amount you actually consume</h2><p>Use a simple total rather than treating a gummy or cup as a standard dose. In a hypothetical example, a beverage labeled 100 mg caffeine plus a complete gummy serving labeled 80 mg equals 180 mg from those two items. This is not a recommended intake, and a coffee-shop drink may not have a known exact amount. See our <a href="/blog/caffeine-gummies-vs-energy-drinks">caffeine gummy versus energy drink comparison</a> and the <a href="/blog/category/energy">caffeine and energy collection</a> for related label questions.</p></section>
HTML
        ],
        '/blog/caffeine-gummies-vs-energy-drinks' => ['A four-point decision checklist', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Caffeine per container versus caffeine per serving</h2><p>Some drink containers contain more than one labeled serving, and some gummy packages contain multiple pieces per serving. In an illustrative example, a container with two 80 mg servings contains 160 mg if both servings are consumed. A gummy's caffeine content must be calculated from its own label. Check sugar, other ingredients and whether you want a caffeinated product at all. Explore the <a href="/blog/caffeine-gummies-vs-coffee-whats-the-difference">coffee comparison</a> and the <a href="/blog/category/pre-workout">pre-workout snack guide</a> for food and timing considerations.</p></section>
HTML
        ],
        '/blog/how-much-protein-do-you-actually-need' => ['What does protein across a day look like?', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Turn a daily protein reference into a food plan</h2><p>Start by estimating protein from the portions you normally eat rather than assuming you need to buy a supplement. A hypothetical day with 20 grams at breakfast, 25 at lunch, 25 at dinner and 10 in a snack totals 80 grams. That number is an example of addition, not a personal target. Try the <a href="/tools/protein-fiber-calculator">protein and fiber calculator</a> for educational planning, then browse <a href="/guides/protein-and-fiber-snacks">protein and fiber snack ideas</a> for practical food choices.</p></section>
HTML
        ],
        '/blog/protein-vs-fiber-why-your-body-needs-both' => ['A quick check of your usual meals', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Build a snack with two distinct nutrients</h2><p>Try pairing a familiar protein food with a fiber-containing food, such as yogurt with oats and berries, or hummus with whole-grain crackers. Read each label or use the actual recipe to estimate both nutrients; protein grams do not count as fiber grams. The <a href="/guides/protein-and-fiber-snacks">protein and fiber snack guide</a> includes options for different settings, and the <a href="/blog/category/weight-management">everyday snack planning collection</a> focuses on flexible food choices rather than promises about body weight.</p></section>
HTML
        ],
        '/blog/simple-daily-wellness-routine-that-sticks' => ['Make habits easier to repeat', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Make a routine easy to repeat when your day changes</h2><p>Choose one default meal or snack you can prepare in advance and one backup for days away from home. A repeatable plan is more useful than a long list of habits you cannot maintain. For practical ideas, use the <a href="/guides/protein-and-fiber-snacks-for-work">work snack guide</a> and <a href="/guides/protein-and-fiber-snacks-for-travel">travel snack guide</a>. Consider your own preferences, available storage and schedule rather than expecting any one supplement to establish a wellness routine.</p></section>
HTML
        ],
        '/blog/30-grams-fiber-high-protein-diet' => ['Four swaps that keep the structure of your meals', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Check the day's fiber total without counting a blend twice</h2><p>Add the dietary fiber in each actual food portion. If a serving supplies 4 grams of fiber and you eat one and a half servings, count 6 grams. Do not add a marketed prebiotic blend weight again if it is already reflected in the dietary fiber line. Use the <a href="/tools/protein-fiber-calculator">planning calculator</a> to explore general references and the <a href="/guides/plant-based-protein-and-fiber-snacks">plant-based snack guide</a> for food options. Thirty grams is an example, not a universal target.</p></section>
HTML
        ],
        '/blog/build-muscle-without-protein-shakes' => ['When a convenience product makes sense', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Make a food-first backup for training days</h2><p>Pick a regular meal you enjoy and a practical backup for days when preparation is difficult. Compare protein foods using the portion you actually eat and their protein source; don't assume a small gummy or snack equals a full meal. The <a href="/blog/how-much-protein-do-you-actually-need">daily protein guide</a> helps put a snack into context, and the <a href="/blog/category/fitness">fitness nutrition collection</a> covers training and recovery considerations. No single food guarantees muscle growth.</p></section>
HTML
        ],
        '/blog/portion-sizes-muscle-gain-without-counting-calories' => ['Plan the moments that usually go wrong', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Use a consistent meal as a reference</h2><p>Rather than comparing different plates each day, start with a familiar meal and record what you actually ate, how it fit your appetite and how your training felt. Use the same recipe or package serving when making a comparison. The <a href="/blog/how-much-protein-do-you-actually-need">protein intake guide</a> and <a href="/guides/protein-and-fiber-snacks">snack planning guide</a> can help you compare food options. These are planning ideas, not individualized calorie or weight targets.</p></section>
HTML
        ],
        '/blog/what-to-eat-glp1-not-hungry' => ['Your next useful step', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Prepare questions for a nutrition appointment</h2><p>Bring a short record of foods you have been able to eat, symptoms you want to discuss and questions about your prescribed care plan. The related <a href="/blog/glp1-protein-snacks-without-shakes">food-based snack discussion</a> and <a href="/blog/tired-on-glp1-food-fluids-causes">fatigue discussion</a> are educational resources to use when speaking with your care team. They do not prescribe a treatment or recommend a caffeinated snack for low appetite.</p></section>
HTML
        ],
        '/blog/glp1-protein-snacks-without-shakes' => ['Build a snack rotation instead of a rulebook', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Compare snack options with your care team</h2><p>Bring the ingredient labels of foods you are considering, along with notes about the portions you can manage. See the <a href="/blog/what-to-eat-glp1-not-hungry">low-appetite meal planning discussion</a> and the <a href="/blog/category/glp-1">GLP-1 education collection</a> for related questions to discuss with your clinician. No supplement or packaged snack is recommended here as treatment.</p></section>
HTML
        ],
        '/blog/glp1-constipation-fiber' => ['A useful checklist for your appointment', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Bring the exact fiber ingredient to the discussion</h2><p>If you use a packaged fiber product, bring its name, ingredient list, serving directions and your symptom timeline to your clinician or pharmacist. For label terminology see the <a href="/blog/fiber-gummies-vs-fiber-powder">fiber format comparison</a>; for related educational topics see the <a href="/blog/category/glp-1">GLP-1 education collection</a>. These pages cannot determine the cause of your symptoms or which intervention is appropriate.</p></section>
HTML
        ],
        '/blog/maintain-muscle-glp1-low-appetite' => ['What to ask at your next review', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Keep track of the questions that matter to your care plan</h2><p>Bring questions about your eating routine, changes in strength and your ability to follow your prescribed care plan. A clinician can help you interpret these together. Read the <a href="/blog/what-to-eat-glp1-not-hungry">low-appetite discussion</a> and <a href="/blog/category/glp-1">GLP-1 education collection</a> for related information to discuss with your team, not a personal exercise or nutrition prescription.</p></section>
HTML
        ],
        '/blog/tired-on-glp1-food-fluids-causes' => ['Make the next appointment easier', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Separate a symptom record from a product decision</h2><p>Write down when fatigue occurs, what you were doing and any questions about meals, fluids or medications that you want to discuss with your clinician. The <a href="/blog/what-to-eat-glp1-not-hungry">low-appetite discussion</a> and <a href="/blog/category/glp-1">GLP-1 education collection</a> can help organize related questions. Do not use a caffeinated product as a substitute for investigating persistent symptoms with your care team.</p></section>
HTML
        ],
        '/blog/protein-gummies-vs-protein-bars' => ['How to compare price and usefulness', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Compare both options using the same purchase criteria</h2><p>For complete-serving examples and verified manufacturer data, start with the <a href="/blog/protein-gummies-with-fiber-comparison">protein gummy label comparison</a>. If you are interested in ingredients beyond protein, the <a href="/blog/category/functional-gummies">functional gummies collection</a> explains how to read the additional ingredients. Compare the actual serving rather than the shape of the snack.</p></section>
HTML
        ],
        '/blog/fiber-gummies-vs-psyllium-husk' => ['A five-point buying checklist', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Choose the next guide based on your question</h2><p>If you want to compare ready-to-eat and mixed formats, see the <a href="/blog/fiber-gummies-vs-fiber-powder">fiber powder versus gummy comparison</a>. If you are considering daily food intake rather than a supplement, begin with the <a href="/blog/how-much-fiber-do-you-need-every-day">daily fiber guide</a>. Follow the exact product directions rather than assuming equal grams have the same effects.</p></section>
HTML
        ],
        '/blog/caffeine-l-theanine-vs-caffeine' => ['What should you check on a product label?', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Put a caffeine study into label context</h2><p>A study of a specific combination does not establish the same outcome for a different commercial formula. For practical comparisons, see <a href="/blog/caffeine-gummies-vs-coffee-whats-the-difference">caffeine gummies versus coffee</a> or <a href="/blog/caffeine-gummies-vs-energy-drinks">caffeine gummies versus energy drinks</a>. Both guides explain how to compare caffeine amounts rather than relying on format alone.</p></section>
HTML
        ],
        '/blog/how-much-fiber-do-you-need-every-day' => ['Five easy ways to add more', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Explore food ideas before comparing fiber formats</h2><p>For examples of foods that combine fiber and protein, browse the <a href="/guides/protein-and-fiber-snacks">protein and fiber snack guide</a> and <a href="/guides/plant-based-protein-and-fiber-snacks">plant-based options</a>. Use your own portion sizes and labels rather than treating a sample menu as an individualized target.</p></section>
HTML
        ],
        '/blog/high-protein-high-fiber-snacks-no-refrigeration' => ['Compare price using the portion you will eat', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Match shelf-stable snacks to the setting</h2><p>The <a href="/guides/protein-and-fiber-snacks-for-travel">travel snack guide</a> covers planning away from home, while <a href="/guides/protein-and-fiber-snacks-for-work">work snack ideas</a> consider your access to storage and preparation. Use this article for food pairings and the setting-specific guides for practical packing decisions.</p></section>
HTML
        ],
        '/guides/protein-and-fiber-snacks' => ['Compare your actual portions', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">High-protein, high-fiber snack ideas to build around</h2><p>A snack can combine a protein source and a fiber-rich food. Try yogurt with oats and berries if you have refrigeration, roasted chickpeas with a portion of nuts for a shelf-stable choice, or hummus with whole-grain crackers when you can store it safely. Nutrient amounts vary by recipe and serving. Learn <a href="/blog/protein-vs-fiber-why-your-body-needs-both">why protein and fiber play different roles</a> and compare more <a href="/blog/high-protein-high-fiber-snacks-no-refrigeration">shelf-stable snack combinations</a>.</p></section>
HTML
        ],
        '/guides/protein-and-fiber-snacks-for-work' => ['Make it work in practice', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Pack a workday snack around your storage options</h2><p>If you have access to a refrigerator, keep suitable perishables chilled according to package directions. If not, choose a shelf-stable backup and plan when you can replenish it. See the <a href="/blog/high-protein-high-fiber-snacks-no-refrigeration">no-refrigeration snack examples</a> and <a href="/blog/how-much-protein-do-you-actually-need">daily protein guide</a> to compare the amount you actually eat.</p></section>
HTML
        ],
        '/guides/protein-and-fiber-snacks-for-travel' => ['Make it work in practice', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Use a separate checklist for your return trip</h2><p>Plan what you can eat before departure and what you can safely store for the rest of the journey. Check destination rules for foods you carry, and avoid relying on refrigeration you cannot confirm. For food options see the <a href="/blog/high-protein-high-fiber-snacks-no-refrigeration">shelf-stable snack article</a> and <a href="/blog/category/protein">protein snack collection</a>.</p></section>
HTML
        ],
        '/guides/protein-and-fiber-snacks-without-refrigeration' => ['Make it work in practice', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Read storage directions as well as the nutrition label</h2><p>Choose packages that explicitly allow room-temperature storage before opening. Check whether instructions change once opened, and compare the protein and fiber in your real portion. The <a href="/blog/high-protein-high-fiber-snacks-no-refrigeration">seven snack combinations article</a> provides expanded pairing ideas; the <a href="/tools/nutrition-label-value-calculator">label-value calculator</a> helps compare packaged options.</p></section>
HTML
        ],
        '/guides/plant-based-protein-and-fiber-snacks' => ['Make it work in practice', <<<'HTML'
<section id="velq-editorial-refresh" aria-labelledby="velq-editorial-heading"><h2 id="velq-editorial-heading">Compare plant-based options using real portions</h2><p>A serving of beans, soy foods, nuts or seeds differs by ingredient and preparation. Compare actual protein and fiber amounts rather than assuming all plant-based snacks supply the same amount. See the <a href="/blog/protein-vs-fiber-why-your-body-needs-both">protein and fiber explainer</a> and <a href="/blog/30-grams-fiber-high-protein-diet">daily fiber meal-planning example</a> for ideas to adapt to your preferences.</p></section>
HTML
        ],
    ];
    if (!isset($sections[$path]) || str_contains($html, 'id="velq-editorial-refresh"')) return $html;
    [$anchor, $section] = $sections[$path];

    // Insert within the existing main article, before a related heading if available.
    $pattern = '~<h2\\b[^>]*>\\s*' . preg_quote($anchor, '~') . '\\s*</h2>~i';
    $updated = preg_replace_callback($pattern, static fn(array $m): string => $section . "\n" . $m[0], $html, 1, $count);
    if ($count !== 1 || !is_string($updated)) {
        // Some legacy guides use a different heading. Prefer inside article, otherwise main.
        $updated = preg_replace_callback('~</article>~i', static fn(array $m): string => $section . "\n" . $m[0], $html, 1, $count);
        if ($count !== 1 || !is_string($updated)) {
            $updated = preg_replace_callback('~</main>~i', static fn(array $m): string => $section . "\n" . $m[0], $html, 1) ?? $html;
        }
    }
    if ($path === '/guides/protein-and-fiber-snacks') {
        $updated = velq_growth_snippet($updated,
            'High-Protein, High-Fiber Snacks: Ideas for Work and Travel | Velq',
            'Explore high-protein, high-fiber snack pairings for work, travel, plant-based routines and days without refrigeration. Compare actual serving sizes.');
    }
    return $updated;
}
