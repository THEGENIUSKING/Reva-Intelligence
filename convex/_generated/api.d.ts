/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as benchmarking from "../benchmarking.js";
import type * as benchmarks from "../benchmarks.js";
import type * as crons from "../crons.js";
import type * as emailLogs from "../emailLogs.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as initiatives from "../initiatives.js";
import type * as scouting from "../scouting.js";
import type * as screening from "../screening.js";
import type * as sources from "../sources.js";
import type * as users from "../users.js";
import type * as vanta from "../vanta.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  benchmarking: typeof benchmarking;
  benchmarks: typeof benchmarks;
  crons: typeof crons;
  emailLogs: typeof emailLogs;
  files: typeof files;
  http: typeof http;
  initiatives: typeof initiatives;
  scouting: typeof scouting;
  screening: typeof screening;
  sources: typeof sources;
  users: typeof users;
  vanta: typeof vanta;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
