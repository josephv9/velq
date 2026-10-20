#!/usr/bin/env python3
"""Render exact, clearly fictional calculator illustrations as SVG and PNG.

The numbers reproduce the worked examples already published in the calculators.
No product facts, nutrition recommendations, prices or source dates are inferred.
Requires matplotlib only when rebuilding the committed visual assets.
"""
from pathlib import Path
import re
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'discovery'
OUT.mkdir(parents=True, exist_ok=True)
CREAM, INK, MUTED, RED, GREEN = '#fffcec', '#253a2e', '#536256', '#aa3830', '#2d6048'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'svg.fonttype': 'none'})


def canvas(title, subtitle):
    fig = plt.figure(figsize=(12, 6.75), dpi=100, facecolor=CREAM)
    ax = fig.add_axes([0, 0, 1, 1], xlim=(0, 1200), ylim=(675, 0))
    ax.axis('off')
    text(ax, 54, 48, 'VELQ  /  LABEL READING', 15, RED, 'bold')
    text(ax, 54, 109, title, 31, INK, 'bold')
    text(ax, 54, 153, subtitle, 17, MUTED)
    return fig, ax


def text(ax, x, y, value, size, color=INK, weight='normal', align='left'):
    ax.text(x, y, value, fontsize=size, color=color, weight=weight,
            ha=align, va='center', parse_math=False)


def row(ax, y, label, first, second, result, result_label):
    ax.add_patch(FancyBboxPatch((54, y), 1092, 126, boxstyle='round,pad=0,rounding_size=18',
                              facecolor='#ffffff', edgecolor='#dedfcc', linewidth=1.3))
    text(ax, 78, y + 29, label, 13, MUTED, 'bold')
    text(ax, 235, y + 78, first, 28, INK, 'bold', 'center')
    text(ax, 429, y + 78, '÷', 31, MUTED, align='center')
    text(ax, 610, y + 78, second, 25, INK, 'bold', 'center')
    text(ax, 797, y + 78, '=', 29, MUTED, align='center')
    text(ax, 970, y + 66, result, 31, GREEN, 'bold', 'center')
    text(ax, 970, y + 103, result_label, 13, MUTED, align='center')


def save(fig, stem, description):
    # Stable SVG IDs and no timestamp make subsequent rebuilds deterministic.
    with matplotlib.rc_context({'svg.hashsalt': stem}):
        fig.savefig(OUT / (stem + '.svg'), format='svg', facecolor=CREAM,
                    metadata={'Date': None, 'Title': description,
                              'Description': 'Hypothetical example; all arithmetic is also available as HTML on the calculator page.'})
    svg_path = OUT / (stem + '.svg')
    svg = re.sub(r'width="[^"]+" height="[^"]+"', 'width="1200" height="675"', svg_path.read_text(), count=1)
    svg_path.write_text('\n'.join(line.rstrip() for line in svg.splitlines()) + '\n')
    fig.savefig(OUT / (stem + '.png'), dpi=100, facecolor=CREAM,
                metadata={'Title': description, 'Description': 'Fictional arithmetic example, not an actual product label or recommendation.'})
    plt.close(fig)


def main():
    fig, ax = canvas('A serving is not always one gummy.',
                     'Use the complete labeled serving before comparing individual pieces.')
    for x, value in [(235, 'FIBER PER SERVING'), (610, 'GUMMIES PER SERVING'), (970, 'FIBER PER GUMMY')]:
        text(ax, x, 208, value, 13, MUTED, 'bold', 'center')
    row(ax, 236, 'FICTIONAL GUMMY A', '5 g fiber', '2 gummies', '2.5 g', 'in one gummy')
    row(ax, 380, 'FICTIONAL GUMMY B', '6 g fiber', '3 gummies', '2 g', 'in one gummy')
    text(ax, 54, 551, 'B has more per full serving. A has more per gummy in this example.', 16, INK)
    text(ax, 54, 600, 'Hypothetical values · assumes nutrients are evenly distributed across pieces.', 13, MUTED)
    text(ax, 54, 631, 'Label arithmetic, not a recommended dose or a product ranking.', 13, MUTED)
    text(ax, 1146, 631, 'velqnutrition.com', 12, RED, align='right')
    save(fig, 'gummy-serving-label-guide', 'Compare fiber per labeled serving with fiber per gummy')

    fig, ax = canvas('Compare the serving behind the price.',
                     'Divide the whole-package price by its number of complete labeled servings.')
    for x, value in [(235, 'PACKAGE PRICE'), (610, 'LABELED SERVINGS'), (970, 'COST PER SERVING')]:
        text(ax, x, 208, value, 13, MUTED, 'bold', 'center')
    row(ax, 236, 'FICTIONAL PRODUCT A', '$24', '12 servings', '$2', 'per complete serving')
    row(ax, 380, 'FICTIONAL PRODUCT B', '$30', '30 servings', '$1', 'per complete serving')
    text(ax, 54, 548, 'A: 10 g protein + 5 g fiber per serving. B: 8 g protein + 4 g fiber.', 16, INK)
    text(ax, 54, 581, 'Per 10 g protein or 5 g fiber: A costs $2; B costs $1.25.', 16, GREEN, 'bold')
    text(ax, 54, 630, 'Fictional prices in USD · standardized cost is not a dose or a quality rating.', 13, MUTED)
    text(ax, 1146, 630, 'velqnutrition.com', 12, RED, align='right')
    save(fig, 'nutrition-label-value-guide', 'Compare hypothetical package prices per labeled serving')


if __name__ == '__main__':
    main()
