provider "google" {
  project = var.project_id
  region  = "europe-west3" # Zurich Cluster
}

module "sovereign_cluster" {
  source = "./modules/gke-sovereign"
  
  cluster_name    = "baalvion-zurich-01"
  node_count      = 48
  machine_type    = "n2d-standard-16"
  enable_spiffe   = true
  enable_shielded_nodes = true
}

module "vault_federation" {
  source = "./modules/vault-cluster"
  
  replication_regions = ["us-east1", "asia-southeast1"]
  seal_type          = "gcpckms"
}

resource "google_pubsub_topic" "event_mesh" {
  name = "baalvion.global.event_mesh"
  
  labels = {
    integrity = "sovereign"
    domain    = "trade"
  }
}