/**
 * AutoFix Polyglot — Discovery contracts (L4 / L5)
 * Source of truth: schemas/discovery-message.schema.json
 *                 schemas/discover-request.schema.json
 *                 schemas/discover-response.schema.json
 */

export interface DiscoveryMessage {
  urls: string[];
  discovered_at: string; // ISO-8601
}

export interface DiscoverRequest {
  urls?: string[];
  /** Single-URL convenience field accepted by the current healer. */
  url?: string;
}

export interface DiscoverResponse {
  enqueued: number;
}
