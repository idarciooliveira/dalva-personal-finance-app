/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as dashboard from "../dashboard.js";
import type * as debtPayments from "../debtPayments.js";
import type * as debts from "../debts.js";
import type * as goalContributions from "../goalContributions.js";
import type * as http from "../http.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as transactions from "../transactions.js";
import type * as transfers from "../transfers.js";
import type * as userProfiles from "../userProfiles.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  auth: typeof auth;
  categories: typeof categories;
  dashboard: typeof dashboard;
  debtPayments: typeof debtPayments;
  debts: typeof debts;
  goalContributions: typeof goalContributions;
  http: typeof http;
  savingsGoals: typeof savingsGoals;
  transactions: typeof transactions;
  transfers: typeof transfers;
  userProfiles: typeof userProfiles;
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

export declare const components: {};
