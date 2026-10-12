# Builds seed/osm-clubs-uae.json from Overpass downloads (v-<emirate>.json venues, p-<emirate>.json suburbs). OpenStreetMap data, ODbL.
import json, math, re, collections, os, sys
EMIRATES = [  # file, city, emirate, lat, lon, radius_km
  ('dubai','Dubai','Dubai',25.2048,55.2708,45),
  ('abudhabi','Abu Dhabi','Abu Dhabi',24.4539,54.3773,32),
  ('alain','Al Ain','Abu Dhabi',24.2075,55.7447,14),
  ('sharjah','Sharjah','Sharjah',25.3463,55.4209,16),
  ('ajman','Ajman','Ajman',25.4052,55.5136,8),
  ('rak','Ras Al Khaimah','Ras Al Khaimah',25.7895,55.9432,18),
]
def hav(a,b,c,d):
    p=math.pi/180
    x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 12742*math.asin(math.sqrt(x))
def en(t,k='name'):
    n=(t.get('%s:en'%k) or t.get(k) or '').strip()
    return n if re.search(r'[A-Za-z]',n) and not re.search(r'[\u0600-\u06FF]',n) else ''
def tidy(a):
    if not a: return a
    a=re.sub(r'^JLT cluster .*','Jumeirah Lakes Towers (JLT)',a)
    a=re.sub(r'\s+\d+$','',a)
    a=re.sub(r'\s*\(.*?\)$','',a) if 'JLT' not in a else a
    return a.strip() or None
src=sys.argv[1] if len(sys.argv)>1 else '.'
rows={}
for f,city,emirate,clat,clon,rad in EMIRATES:
    pv=os.path.join(src,f'v-{f}.json'); pp=os.path.join(src,f'p-{f}.json')
    if not os.path.exists(pv): continue
    places=[(en(e['tags']),e['lat'],e['lon']) for e in (json.load(open(pp))['elements'] if os.path.exists(pp) else []) if 'lat' in e and en(e['tags'])]
    for e in json.load(open(pv))['elements']:
        t=e.get('tags',{}); name=en(t)
        if not name or t.get('amenity') not in ('nightclub','bar','pub'): continue
        lat=e.get('lat') or (e.get('center') or {}).get('lat'); lon=e.get('lon') or (e.get('center') or {}).get('lon')
        if lat is None or hav(lat,lon,clat,clon)>rad: continue
        area=en({'name':t.get('addr:suburb') or t.get('addr:neighbourhood') or ''})
        if not area and places:
            best=min(((hav(lat,lon,la,lo),n) for n,la,lo in places),default=None)
            if best and best[0]<=2.5: area=best[1]
        addr=', '.join(x for x in [t.get('addr:housenumber'),t.get('addr:street'),area,t.get('addr:city')] if x) or None
        key=(re.sub(r'[^a-z0-9]','',name.lower()),city,round(lat,3),round(lon,3))
        rows[key]={'osm':f"{e['type'][0]}{e['id']}",'name':name,'type':t['amenity'],'city':city,'state':emirate,'area':tidy(area),'address':addr,
          'lat':round(lat,6),'lon':round(lon,6),'website':t.get('website') or t.get('contact:website'),'phone':t.get('phone') or t.get('contact:phone'),'hours':t.get('opening_hours')}
out=list(rows.values())
json.dump(out,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','seed','osm-clubs-uae.json'),'w'),ensure_ascii=False,indent=0)
print(len(out), collections.Counter((r['state'],r['city']) for r in out))
print('with area',sum(1 for r in out if r['area']),'website',sum(1 for r in out if r['website']),'hours',sum(1 for r in out if r['hours']))
print(collections.Counter(r['area'] for r in out if r['city']=='Dubai').most_common(15))
