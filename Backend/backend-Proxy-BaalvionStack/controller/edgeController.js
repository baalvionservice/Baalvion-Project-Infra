'use strict';

/**
 * Edge-network control plane (mounted under /v1/admin, platform-admin only).
 * Manages PoP/edge regions + health, ASN intelligence, and dedicated owned-IP
 * pools/allocations. Allocation writes the per-org IP set to Redis that the Go
 * gateway's `dedicated` provider consumes to bind egress source addresses.
 */

const edge = require('../service/edgeRegionService');
const asn = require('../service/asnIntelService');
const pools = require('../service/dedicatedPoolService');
const { sendSuccess } = require('../utils/response');

const wrap = (h) => async (req, res, next) => {
  try { await h(req, res, next); } catch (err) { next(err); }
};

const actor = (req) => (req.auth && (req.auth.userId || req.auth.sub)) || null;

module.exports = {
  // ─── Edge regions / PoPs ─────────────────────────────────────────────────
  listRegions: wrap(async (req, res) => sendSuccess(req, res, await edge.listRegions())),
  upsertRegion: wrap(async (req, res) => sendSuccess(req, res, await edge.upsertRegion(req.body), 201)),
  regionHealth: wrap(async (req, res) => sendSuccess(req, res, await edge.recordHealth(req.params.code, req.body), 201)),
  pickRegion: wrap(async (req, res) =>
    sendSuccess(req, res, { region: edge.pickRegion(req.query.country, await edge.listRegions()) })),

  // ─── ASN intelligence ────────────────────────────────────────────────────
  listAsn: wrap(async (req, res) => sendSuccess(req, res, await asn.list(req.query))),
  getAsn: wrap(async (req, res) => sendSuccess(req, res, await asn.get(Number(req.params.asn)))),
  upsertAsn: wrap(async (req, res) => sendSuccess(req, res, await asn.upsert(Number(req.body.asn), req.body), 201)),
  refreshAsn: wrap(async (req, res) => sendSuccess(req, res, await asn.refresh())),

  // ─── Dedicated / owned-IP pools ──────────────────────────────────────────
  listPools: wrap(async (req, res) => sendSuccess(req, res, await pools.listPools())),
  createPool: wrap(async (req, res) => sendSuccess(req, res, await pools.createPool(req.body), 201)),
  addIPs: wrap(async (req, res) =>
    sendSuccess(req, res, await pools.addIPs(req.params.id, req.body.ips || [], req.body), 201)),
  allocate: wrap(async (req, res) =>
    sendSuccess(req, res, await pools.allocate({ ...req.body, actorId: actor(req) }), 201)),
  deallocate: wrap(async (req, res) =>
    sendSuccess(req, res, await pools.deallocate({ ...req.body, actorId: actor(req) }))),
  orgPool: wrap(async (req, res) => sendSuccess(req, res, await pools.orgPool(req.params.orgId))),
};
