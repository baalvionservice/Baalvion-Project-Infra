"""Rebuild the trimmed Font Awesome icon font.

The site ships assets/vendor/fa/css/fa-subset.css and webfonts/subset/ (about 30 KB) instead of the full
Font Awesome (about 250 KB). Run this after using a NEW icon class (fa-something) anywhere in the views, then commit the
regenerated files. Icons named in views, helpers, controllers and assets/js are picked up automatically.
"""
import re,glob,os,sys
from fontTools import subset
from fontTools.ttLib import TTFont
# Run from anywhere; needs `pip install fonttools brotli`.
root=os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
os.chdir(root)
src=''
for pat in ['application/views/*.php','application/views/includes/*.php','application/views/tools/*.php','application/controllers/*.php','application/helpers/*.php','assets/js/*.js']:
    for f in glob.glob(pat):
        src+=open(f,errors='ignore').read()
used=set(re.findall(r'\bfa-([a-z0-9-]+)',src))
# style/utility classes are never icons
util={'solid','regular','brands','classic','sharp','lg','xs','sm','1x','2x','3x','4x','5x','fw','spin','pulse','beat','bounce','fade','flip','shake','spin-pulse','spin-reverse','stack','rotate-90','rotate-180','rotate-270','rotate-by','border','pull-left','pull-right','li','ul','inverse','layers','swap-opacity','beat-fade','xl','2xs','6x','7x','8x','9x','10x','flip-horizontal','flip-vertical','flip-both','stack-1x','stack-2x','sr-only','fw','lg'}
css=open('assets/vendor/fa/css/all.min.css').read()
codes={}
icon_rule=re.compile(r'((?:\.fa-[a-z0-9-]+:before,?)+)\{content:"(\\[0-9a-f]+)"\}')
def repl(m):
    names=re.findall(r'\.fa-([a-z0-9-]+):before',m.group(1))
    cp=int(m.group(2)[1:],16)
    for n in names: codes[n]=cp
    sel=[n for n in names if n in used and n not in util]
    if not sel: return ''
    return ','.join('.fa-%s:before'%n for n in sel)+'{content:"%s"}'%m.group(2)
out=icon_rule.sub(repl,css)
cps=sorted({codes[n] for n in used if n in codes and n not in util})
print('used names',len(used),'resolved',len(cps),'unknown',sorted(n for n in used if n not in codes and n not in util)[:40])
out=out.replace('../webfonts/','../webfonts/subset/')
out=re.sub(r',url\([^)]*\.ttf\)\s*format\("truetype"\)','',out)
os.makedirs('assets/vendor/fa/webfonts/subset',exist_ok=True)
for name in ['fa-solid-900','fa-regular-400','fa-brands-400','fa-v4compatibility']:
    f='assets/vendor/fa/webfonts/%s.woff2'%name
    opts=subset.Options(); opts.flavor='woff2'; opts.layout_features=['*']; opts.notdef_outline=True
    dest='assets/vendor/fa/webfonts/subset/%s.woff2'%name
    try:
        font=subset.load_font(f,opts)
        sub=subset.Subsetter(opts); sub.populate(unicodes=cps); sub.subset(font)
        subset.save_font(font,dest,opts)
    except Exception as e:
        import shutil; shutil.copy(f,dest); print('  (kept original for',name,':',type(e).__name__,')')
    print(name, os.path.getsize(f)//1024,'KB ->',os.path.getsize('assets/vendor/fa/webfonts/subset/%s.woff2'%name)//1024,'KB')
open('assets/vendor/fa/css/fa-subset.css','w').write(out)
print('css', len(css)//1024,'KB ->', len(out)//1024,'KB')
