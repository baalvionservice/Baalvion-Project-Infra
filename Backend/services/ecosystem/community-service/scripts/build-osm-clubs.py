import json, math, re, collections
CITIES = [  # name, state, lat, lon, radius_km
 ('Mumbai','Maharashtra',19.0760,72.8777,26),('Thane','Maharashtra',19.2183,72.9781,9),('Navi Mumbai','Maharashtra',19.0330,73.0297,14),
 ('Pune','Maharashtra',18.5204,73.8567,22),
 ('Delhi','Delhi (NCT)',28.6139,77.2090,32),('Gurugram','Haryana',28.4595,77.0266,14),('Noida','Uttar Pradesh',28.5355,77.3910,13),
 ('Bengaluru','Karnataka',12.9716,77.5946,28),
]
def hav(a,b,c,d):
    R=6371; p=math.pi/180
    x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*R*math.asin(math.sqrt(x))
def city_of(lat,lon,tags):
    best=None
    for n,s,la,lo,r in CITIES:
        d=hav(lat,lon,la,lo)
        if d<=r and (best is None or d<best[0]): best=(d,n,s)
    return best
places=[]
for f in ['mumbai','pune','delhi','bengaluru']:
    for e in json.load(open(f'p-{f}.json'))['elements']:
        places.append((e['tags']['name'],e['lat'],e['lon']))
def area_of(lat,lon):
    best=None
    for n,la,lo in places:
        d=hav(lat,lon,la,lo)
        if d<=2.0 and (best is None or d<best[0]): best=(d,n)
    return best[1] if best else None
rows={}
for f in ['mumbai','pune','delhi','bengaluru']:
    for e in json.load(open(f'v-{f}.json'))['elements']:
        t=e.get('tags',{}); name=(t.get('name') or '').strip()
        if not name: continue
        lat=e.get('lat') or (e.get('center') or {}).get('lat'); lon=e.get('lon') or (e.get('center') or {}).get('lon')
        if lat is None: continue
        c=city_of(lat,lon,t)
        if not c: continue
        _,city,state=c
        addr=', '.join(x for x in [t.get('addr:housenumber'),t.get('addr:street'),t.get('addr:suburb'),t.get('addr:city')] if x) or None
        area=t.get('addr:suburb') or area_of(lat,lon)
        key=(re.sub(r'[^a-z0-9]','',name.lower()),city,round(lat,3),round(lon,3))
        rows[key]={'osm':f"{e['type'][0]}{e['id']}",'name':name,'type':t['amenity'],'city':city,'state':state,'area':area,'address':addr,
          'lat':round(lat,6),'lon':round(lon,6),'website':t.get('website') or t.get('contact:website'),'phone':t.get('phone') or t.get('contact:phone'),'hours':t.get('opening_hours')}
out=list(rows.values())
json.dump(out,open('osm-clubs.json','w'),ensure_ascii=False,indent=0)
print(len(out)); print(collections.Counter((r['state'],r['city']) for r in out))
print('with area',sum(1 for r in out if r['area']),'with website',sum(1 for r in out if r['website']),'with hours',sum(1 for r in out if r['hours']))
print(collections.Counter(r['area'] for r in out if r['city']=='Mumbai').most_common(12))
