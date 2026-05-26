# Multi-region overlays

Each region is a **separate cluster** (active-active). Deploy with:

```bash
kubectl --context us-east-1 apply -k infra/k8s/overlays/us-east
kubectl --context eu-west-1  apply -k infra/k8s/overlays/eu
```

## Adding a region (us-west / asia / india / middle-east)

Copy an existing overlay and change two things — the region label and the
`region-patch.yaml` nodeSelector/replicas:

| Region        | `topology.kubernetes.io/region` | Notes |
|---------------|---------------------------------|-------|
| us-east       | `us-east-1`                     | primary, highest capacity (6→150) |
| us-west       | `us-west-2`                     | active-active w/ us-east |
| eu            | `eu-west-1`                     | GDPR data residency |
| asia          | `ap-southeast-1`                | Singapore hub |
| india         | `ap-south-1`                    | Mumbai (Razorpay/INR locality) |
| middle-east   | `me-central-1`                  | UAE |

```bash
cp -r us-east us-west
# edit us-west/kustomization.yaml  -> region: us-west-2
# edit us-west/region-patch.yaml   -> nodeSelector region: us-west-2, replicas
```

Control-plane DBs (Postgres/ClickHouse) are primary in `us-east-1` with cross-region
read replicas; each edge region runs gateways + a regional Redis for session
affinity. Global routing (GeoDNS / Anycast) is in `infra/mesh/global-lb.yaml`.
