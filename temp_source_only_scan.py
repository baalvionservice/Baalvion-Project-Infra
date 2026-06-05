import os
root='.'
ignore_dirs={'.git','.turbo','node_modules','.vs','backups','coverage','dist','build','out','.next'}
ignore_ext={'.pack','.pack.gz','.jar','.class','.png','.jpg','.jpeg','.gif','.svg','.ico','.pdf','.woff','.woff2','.ttf','.eot','.log','.lock'}
results=[]
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
    for f in filenames:
        path=os.path.join(dirpath,f)
        if os.path.splitext(f)[1].lower() in ignore_ext:
            continue
        rel=path.replace('\\','/')
        if any(seg in ignore_dirs for seg in rel.split('/')):
            continue
        try:
            size=os.path.getsize(path)
            with open(path,'r',encoding='utf-8',errors='ignore') as fh:
                lines=sum(1 for _ in fh)
            if lines>200 and size>5000:
                results.append((size,lines,path))
        except Exception:
            pass
results.sort(key=lambda x:(x[0],x[1]), reverse=True)
for size, lines, path in results[:40]:
    print(f'{size:>12} bytes | {lines:>6} lines | {path}')
