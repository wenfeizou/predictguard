import { SuiGraphQLClient } from "@mysten/sui/graphql";

import { predictTestnetConfig } from "@/lib/predict/config";
import {
  DEFAULT_REDEEM_EVIDENCE_DIGEST,
  fetchPredictRedeemEvidenceReadback,
  type PredictRedeemEvidenceReadback,
} from "@/lib/predict/redeemReadback";

const REDEEM_HISTORY_PAGE_SIZE = 50;
const REDEEM_HISTORY_MAX_PAGES = 4;

type GraphqlRedeemEventsResult = {
  events?: {
    pageInfo: {
      hasPreviousPage: boolean;
      startCursor?: string | null;
    };
    nodes: GraphqlRedeemEventNode[];
  };
};

type GraphqlRedeemEventNode = {
  sequenceNumber?: number;
  timestamp?: string | null;
  contents?: {
    json?: Record<string, unknown> | null;
  } | null;
  transaction?: {
    effects?: {
      digest?: string;
    } | null;
  } | null;
};

export type PredictRedeemHistoryReadback = {
  source: "sui-graphql+grpc";
  managerObjectId: string;
  fetchedAtIso: string;
  eventType: string;
  scan: {
    pageSize: number;
    maxPages: number;
    pagesRead: number;
    eventsScanned: number;
    matchingEvents: number;
    uniqueDigests: number;
    truncated: boolean;
  };
  digests: string[];
  readbacks: PredictRedeemEvidenceReadback[];
  notes: string[];
};

export async function fetchPredictRedeemHistoryReadback(
  managerObjectId: string,
): Promise<PredictRedeemHistoryReadback> {
  const eventType = `${predictTestnetConfig.packageId}::predict::PositionRedeemed`;
  const graphqlClient = new SuiGraphQLClient({
    url: "https://graphql.testnet.sui.io/graphql",
    network: "testnet",
  });
  const matchingDigests = new Set<string>();
  let before: string | undefined;
  let pagesRead = 0;
  let eventsScanned = 0;
  let matchingEvents = 0;
  let truncated = false;

  for (let page = 0; page < REDEEM_HISTORY_MAX_PAGES; page += 1) {
    const response = await graphqlClient.query<
      GraphqlRedeemEventsResult,
      { type: string; last: number; before?: string }
    >({
      query: `
        query PredictRedeemEvents($type: String!, $last: Int!, $before: String) {
          events(last: $last, before: $before, filter: { type: $type }) {
            pageInfo {
              hasPreviousPage
              startCursor
            }
            nodes {
              sequenceNumber
              timestamp
              contents {
                json
              }
              transaction {
                effects {
                  digest
                }
              }
            }
          }
        }
      `,
      variables: {
        type: eventType,
        last: REDEEM_HISTORY_PAGE_SIZE,
        before,
      },
    });

    if (response.errors?.length) {
      throw new Error(response.errors.map((error) => error.message).join("; "));
    }

    const events = response.data?.events;
    pagesRead += 1;

    if (!events) {
      break;
    }

    eventsScanned += events.nodes.length;

    for (const event of events.nodes) {
      const eventManagerId = readString(event.contents?.json?.manager_id);
      const digest = event.transaction?.effects?.digest;

      if (digest && sameObjectId(eventManagerId, managerObjectId)) {
        matchingEvents += 1;
        matchingDigests.add(digest);
      }
    }

    if (!events.pageInfo.hasPreviousPage || !events.pageInfo.startCursor) {
      break;
    }

    before = events.pageInfo.startCursor;
    truncated = page === REDEEM_HISTORY_MAX_PAGES - 1;
  }

  if (matchingDigests.size === 0) {
    matchingDigests.add(DEFAULT_REDEEM_EVIDENCE_DIGEST);
  }

  const digests = Array.from(matchingDigests);
  const readbacks = await Promise.all(
    digests.map((digest) =>
      fetchPredictRedeemEvidenceReadback(digest, {
        managerId: managerObjectId,
      }),
    ),
  );

  return {
    source: "sui-graphql+grpc",
    managerObjectId,
    fetchedAtIso: new Date().toISOString(),
    eventType,
    scan: {
      pageSize: REDEEM_HISTORY_PAGE_SIZE,
      maxPages: REDEEM_HISTORY_MAX_PAGES,
      pagesRead,
      eventsScanned,
      matchingEvents,
      uniqueDigests: digests.length,
      truncated,
    },
    digests,
    readbacks,
    notes: [
      "Discovered recent PositionRedeemed events through Sui GraphQL event pagination.",
      "Filtered events by manager_id in event JSON, then refetched matching transactions through Sui gRPC for normalized parser output.",
      truncated
        ? "The scan reached its page limit, so older redeem history may still be missing."
        : "The scan did not hit the configured page limit.",
      matchingEvents === 0
        ? "No matching GraphQL event was found in the scan window; default evidence digest was loaded as a fallback."
        : "Matching redeem events were discovered in the scan window.",
    ],
  };
}

function readString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }

  return undefined;
}

function sameObjectId(left?: string, right?: string) {
  if (!left || !right) {
    return false;
  }

  return normalizeObjectId(left) === normalizeObjectId(right);
}

function normalizeObjectId(value: string) {
  return value.startsWith("0x") ? value.slice(2).toLowerCase() : value.toLowerCase();
}
