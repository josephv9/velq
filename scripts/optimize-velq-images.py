#!/usr/bin/env python3
"""Create responsive, visually lossless-enough WebP derivatives of approved Velq imagery.
Keep original JPEG assets for fallback and non-web uses. No external requests.
"""
from PIL import Image, ImageOps
from pathlib import Path
import json

SOURCE={
    'velq-strawberry-gummies-hero-20261015-v3':'assets/velq-strawberry-gummies-hero-20261015-v3.jpeg',
    'velq-gummies-packshot-20261015-v2':'assets/velq-gummies-packshot-20261015-v2.jpeg',
}
widths=(480,800,1200)
stats=[]
for name,source in SOURCE.items():
    source=Path(source)
    assert source.is_file(),f'Missing original: {source}'
    original_bytes=source.stat().st_size
    with Image.open(source) as img:
        img=ImageOps.exif_transpose(img)
        img.load()
        if img.mode!='RGB': img=img.convert('RGB')
        original_dims=img.size
        for w in widths:
            if w>img.width:
                # Never upsample. Existing largest original may have width <1200.
                continue
            h=round(img.height*w/img.width)
            resized=img.resize((w,h),Image.Resampling.LANCZOS)
            out=Path('assets') / (name+f'-{w}.webp')
            resized.save(out,format='WEBP',quality=78,method=6)
            with Image.open(out) as chk:
                chk.verify()
            size=out.stat().st_size
            assert size<original_bytes, f'Not smaller than original JPEG: {out} {size}/{original_bytes}'
            stats.append(dict(file=str(out),bytes=size,original_bytes=original_bytes,width=w,height=h,savings_percent=round(100*(1-size/original_bytes),1)))
    print('ORIGINAL',json.dumps(dict(source=str(source),size=original_bytes,dimensions=original_dims)))
for row in stats:
    print('WEBP',json.dumps(row))
assert len(stats)>=4,'Responsive variants unexpectedly missing'
