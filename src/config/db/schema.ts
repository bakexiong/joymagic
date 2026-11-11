import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    country: text("country"), // User country code
    ip: text("ip"), // User IP address
    nsfwWhitelisted: boolean("nsfw_whitelisted").default(false).notNull(),
    freeImageGenerations: integer("free_image_generations")
      .default(0)
      .notNull(), // Free image generation count
    freeImageGenerationsLastReset: timestamp(
      "free_image_generations_last_reset",
    ), // Last reset date for free generations
    source: text("source"), // 注册来源，如 openapi / third_party，普通注册为空
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Search users by name in admin dashboard
    index("idx_user_name").on(table.name),
    // Order users by registration time for latest users list
    index("idx_user_created_at").on(table.createdAt),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    // Composite: Query user sessions and filter by expiration
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_session_user_expires").on(table.userId, table.expiresAt),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Query all linked accounts for a user
    index("idx_account_user_id").on(table.userId),
    // Composite: OAuth login (most critical)
    // Can also be used for: WHERE providerId = ? (left-prefix)
    index("idx_account_provider_account").on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Find verification code by identifier (e.g., find code by email)
    index("idx_verification_identifier").on(table.identifier),
  ],
);

// 配置表名称：
// - 生产环境可通过 CONFIG_TABLE_PREFIX 配置前缀，例如 foo_config
// - 非生产环境默认使用 config_test
const configTableName =
  process.env.NODE_ENV === "production"
    ? `${process.env.CONFIG_TABLE_PREFIX ?? ""}config`
    : "config_test";

export const config = pgTable(configTableName, {
  name: text("name").unique().notNull(),
  value: text("value"),
});

export const userPreference = pgTable(
  "user_preference",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(), // 配置项的键，如 'pinned_tools'
    value: text("value"), // 配置项的值，JSON 格式存储
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // 用户 ID 和配置键的组合索引，用于快速查询用户的特定配置
    index("idx_user_preference_user_key").on(table.userId, table.key),
  ],
);

export const taxonomy = pgTable(
  "taxonomy",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    slug: text("slug").unique().notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    image: text("image"),
    icon: text("icon"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    sort: integer("sort").default(0).notNull(),
  },
  (table) => [
    // Composite: Query taxonomies by type and status
    // Can also be used for: WHERE type = ? (left-prefix)
    index("idx_taxonomy_type_status").on(table.type, table.status),
  ],
);

export const post = pgTable(
  "post",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentId: text("parent_id"),
    slug: text("slug").unique().notNull(),
    type: text("type").notNull(),
    title: text("title"),
    description: text("description"),
    image: text("image"),
    content: text("content"),
    categories: text("categories"),
    tags: text("tags"),
    authorName: text("author_name"),
    authorImage: text("author_image"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    sort: integer("sort").default(0).notNull(),
  },
  (table) => [
    // Composite: Query posts by type and status
    // Can also be used for: WHERE type = ? (left-prefix)
    index("idx_post_type_status").on(table.type, table.status),
  ],
);

export const order = pgTable(
  "order",
  {
    id: text("id").primaryKey(),
    orderNo: text("order_no").unique().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userEmail: text("user_email"), // checkout user email
    status: text("status").notNull(), // created, paid, failed
    amount: integer("amount").notNull(), // checkout amount in cents
    currency: text("currency").notNull(), // checkout currency
    productId: text("product_id"),
    paymentType: text("payment_type"), // one_time, subscription
    paymentInterval: text("payment_interval"), // day, week, month, year
    paymentProvider: text("payment_provider").notNull(),
    paymentSessionId: text("payment_session_id"),
    checkoutInfo: text("checkout_info").notNull(), // checkout request info
    checkoutResult: text("checkout_result"), // checkout result
    paymentResult: text("payment_result"), // payment result
    discountCode: text("discount_code"), // discount code
    discountAmount: integer("discount_amount"), // discount amount in cents
    discountCurrency: text("discount_currency"), // discount currency
    paymentEmail: text("payment_email"), // actual payment email
    paymentAmount: integer("payment_amount"), // actual payment amount
    paymentCurrency: text("payment_currency"), // actual payment currency
    paidAt: timestamp("paid_at"), // paid at
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    description: text("description"), // order description
    productName: text("product_name"), // product name
    subscriptionId: text("subscription_id"), // provider subscription id
    subscriptionResult: text("subscription_result"), // provider subscription result
    checkoutUrl: text("checkout_url"), // checkout url
    callbackUrl: text("callback_url"), // callback url, after handle callback
    creditsAmount: integer("credits_amount"), // credits amount
    creditsValidDays: integer("credits_valid_days"), // credits validity days
    planName: text("plan_name"), // subscription plan name
    paymentProductId: text("payment_product_id"), // payment product id
    invoiceId: text("invoice_id"),
    invoiceUrl: text("invoice_url"),
    subscriptionNo: text("subscription_no"), // order subscription no
    transactionId: text("transaction_id"), // payment transaction id
    paymentUserName: text("payment_user_name"), // payment user name
    paymentUserId: text("payment_user_id"), // payment user id
    affiliateProfileId: text("affiliate_profile_id"),
    affiliateReferralId: text("affiliate_referral_id"),
    affiliateReferralVisitId: text("affiliate_referral_visit_id"),
    affiliateCode: text("affiliate_code"),
    affiliateDiscountCode: text("affiliate_discount_code"),
    // UTM tracking fields
    utmSource: text("utm_source"), // UTM source (e.g., youtube, google)
    utmMedium: text("utm_medium"), // UTM medium (e.g., kol, ads)
    utmCampaign: text("utm_campaign"), // UTM campaign (e.g., 2026_kol_launch)
    utmContent: text("utm_content"), // UTM content (e.g., ceci__missxia__video1)
    utmTerm: text("utm_term"), // UTM term (e.g., ai_image)
  },
  (table) => [
    // Composite: Query user orders by status (most common)
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_order_user_status_payment_type").on(
      table.userId,
      table.status,
      table.paymentType,
    ),
    // Composite: Prevent duplicate payments
    // Can also be used for: WHERE transactionId = ? (left-prefix)
    index("idx_order_transaction_provider").on(
      table.transactionId,
      table.paymentProvider,
    ),
    // Order orders by creation time for listing
    index("idx_order_created_at").on(table.createdAt),
    // UTM tracking indexes for analytics
    index("idx_order_utm_campaign").on(table.utmCampaign),
    index("idx_order_utm_source").on(table.utmSource),
    index("idx_order_utm_campaign_created").on(
      table.utmCampaign,
      table.createdAt,
    ),
    index("idx_order_affiliate_profile_created").on(
      table.affiliateProfileId,
      table.createdAt,
    ),
  ],
);

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    subscriptionNo: text("subscription_no").unique().notNull(), // subscription no
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userEmail: text("user_email"), // subscription user email
    status: text("status").notNull(), // subscription status
    paymentProvider: text("payment_provider").notNull(),
    subscriptionId: text("subscription_id").notNull(), // provider subscription id
    subscriptionResult: text("subscription_result"), // provider subscription result
    productId: text("product_id"), // product id
    description: text("description"), // subscription description
    amount: integer("amount"), // subscription amount
    currency: text("currency"), // subscription currency
    interval: text("interval"), // subscription interval, day, week, month, year
    intervalCount: integer("interval_count"), // subscription interval count
    trialPeriodDays: integer("trial_period_days"), // subscription trial period days
    currentPeriodStart: timestamp("current_period_start"), // subscription current period start
    currentPeriodEnd: timestamp("current_period_end"), // subscription current period end
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    planName: text("plan_name"),
    billingUrl: text("billing_url"),
    productName: text("product_name"), // subscription product name
    creditsAmount: integer("credits_amount"), // subscription credits amount
    creditsValidDays: integer("credits_valid_days"), // subscription credits valid days
    paymentProductId: text("payment_product_id"), // subscription payment product id
    paymentUserId: text("payment_user_id"), // subscription payment user id
    affiliateProfileId: text("affiliate_profile_id"),
    affiliateReferralId: text("affiliate_referral_id"),
    affiliateCode: text("affiliate_code"),
    affiliateDiscountCode: text("affiliate_discount_code"),
    canceledAt: timestamp("canceled_at"), // subscription canceled apply at
    canceledEndAt: timestamp("canceled_end_at"), // subscription canceled end at
    canceledReason: text("canceled_reason"), // subscription canceled reason
    canceledReasonType: text("canceled_reason_type"), // subscription canceled reason type
  },
  (table) => [
    // Composite: Query user's subscriptions by status (most common)
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_subscription_user_status_interval").on(
      table.userId,
      table.status,
      table.interval,
    ),
    // Composite: Prevent duplicate subscriptions
    // Can also be used for: WHERE paymentProvider = ? (left-prefix)
    index("idx_subscription_provider_id").on(
      table.subscriptionId,
      table.paymentProvider,
    ),
    // Order subscriptions by creation time for listing
    index("idx_subscription_created_at").on(table.createdAt),
    index("idx_subscription_affiliate_profile_created").on(
      table.affiliateProfileId,
      table.createdAt,
    ),
  ],
);

export const credit = pgTable(
  "credit",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // user id
    userEmail: text("user_email"), // user email
    orderNo: text("order_no"), // payment order no
    subscriptionNo: text("subscription_no"), // subscription no
    transactionNo: text("transaction_no").unique().notNull(), // transaction no
    transactionType: text("transaction_type").notNull(), // transaction type, grant / consume
    transactionScene: text("transaction_scene"), // transaction scene, payment / subscription / gift / award
    credits: integer("credits").notNull(), // credits amount, n or -n
    remainingCredits: integer("remaining_credits").notNull().default(0), // remaining credits amount
    description: text("description"), // transaction description
    expiresAt: timestamp("expires_at"), // transaction expires at
    status: text("status").notNull(), // transaction status
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    consumedDetail: text("consumed_detail"), // consumed detail
    metadata: text("metadata"), // transaction metadata
  },
  (table) => [
    // Critical composite index for credit consumption (FIFO queue)
    // Query: WHERE userId = ? AND transactionType = 'grant' AND status = 'active'
    //        AND remainingCredits > 0 ORDER BY expiresAt
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_credit_consume_fifo").on(
      table.userId,
      table.status,
      table.transactionType,
      table.remainingCredits,
      table.expiresAt,
    ),
    // Query credits by order number
    index("idx_credit_order_no").on(table.orderNo),
    // Query credits by subscription number
    index("idx_credit_subscription_no").on(table.subscriptionNo),
  ],
);

export const apikey = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Composite: Query user's API keys by status
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_apikey_user_status").on(table.userId, table.status),
    // Composite: Validate active API key (most common for auth)
    // Can also be used for: WHERE key = ? (left-prefix)
    index("idx_apikey_key_status").on(table.key, table.status),
  ],
);

export const iapGooglePurchase = pgTable(
  "iap_google_purchase",
  {
    id: text("id").primaryKey(),
    serverOrderNo: text("server_order_no").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    platform: text("platform").default("google").notNull(),
    packageName: text("package_name").notNull(),
    productId: text("product_id").notNull(),
    productType: text("product_type").notNull(),
    purchaseToken: text("purchase_token").notNull(),
    orderId: text("order_id"),
    purchaseState: text("purchase_state").notNull(),
    verifyStatus: text("verify_status").notNull(),
    entitlementCode: text("entitlement_code").notNull(),
    entitlementStatus: text("entitlement_status").notNull(),
    acknowledgementState: integer("acknowledgement_state").default(0).notNull(),
    purchaseTime: timestamp("purchase_time"),
    startAt: timestamp("start_at"),
    expireAt: timestamp("expire_at"),
    lastVerifiedAt: timestamp("last_verified_at").defaultNow().notNull(),
    lastNotificationType: text("last_notification_type"),
    lastNotificationAt: timestamp("last_notification_at"),
    restoreTaskId: text("restore_task_id"),
    linkedOrderNo: text("linked_order_no"),
    linkedSubscriptionNo: text("linked_subscription_no"),
    clientTraceId: text("client_trace_id"),
    idempotencyKey: text("idempotency_key"),
    googlePayload: text("google_payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    uniqueIndex("uq_iap_google_purchase_server_order_no").on(
      table.serverOrderNo,
    ),
    uniqueIndex("uq_iap_google_purchase_token").on(table.purchaseToken),
    index("idx_iap_google_purchase_user_status").on(
      table.userId,
      table.entitlementStatus,
      table.expireAt,
    ),
    index("idx_iap_google_purchase_user_product").on(
      table.userId,
      table.productId,
      table.createdAt,
    ),
    index("idx_iap_google_purchase_order_id").on(table.orderId),
  ],
);

export const iapGoogleEvent = pgTable(
  "iap_google_event",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    notificationType: text("notification_type"),
    purchaseToken: text("purchase_token"),
    packageName: text("package_name"),
    productId: text("product_id"),
    processStatus: text("process_status").notNull(),
    payload: text("payload").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_iap_google_event_type_created").on(
      table.eventType,
      table.createdAt,
    ),
    index("idx_iap_google_event_token_created").on(
      table.purchaseToken,
      table.createdAt,
    ),
  ],
);

// RBAC Tables
export const role = pgTable(
  "role",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(), // admin, editor, viewer
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    sort: integer("sort").default(0).notNull(),
  },
  (table) => [
    // Query active roles
    index("idx_role_status").on(table.status),
  ],
);

export const permission = pgTable(
  "permission",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(), // admin.users.read, admin.posts.write
    resource: text("resource").notNull(), // users, posts, categories
    action: text("action").notNull(), // read, write, delete
    title: text("title").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Composite: Query permissions by resource and action
    // Can also be used for: WHERE resource = ? (left-prefix)
    index("idx_permission_resource_action").on(table.resource, table.action),
  ],
);

export const rolePermission = pgTable(
  "role_permission",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permission.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Composite: Query permissions for a role
    // Can also be used for: WHERE roleId = ? (left-prefix)
    index("idx_role_permission_role_permission").on(
      table.roleId,
      table.permissionId,
    ),
  ],
);

export const userRole = pgTable(
  "user_role",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => role.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    // Composite: Query user's active roles (most critical for auth)
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_user_role_user_expires").on(table.userId, table.expiresAt),
  ],
);

export const aiTask = pgTable(
  "ai_task",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    prompt: text("prompt").notNull(),
    options: text("options"),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
    taskId: text("task_id"), // provider task id
    taskInfo: text("task_info"), // provider task info
    taskResult: text("task_result"), // provider task result
    costCredits: integer("cost_credits").notNull().default(0),
    scene: text("scene").notNull().default(""),
    creditId: text("credit_id"), // credit consumption record id
    deviceType: text("device_type"), // 设备类型: 'mobile' | 'pc'
    userAgent: text("user_agent"), // 完整的 User-Agent 字符串
  },
  (table) => [
    // Composite: Query user's AI tasks by status
    // Can also be used for: WHERE userId = ? (left-prefix)
    index("idx_ai_task_user_media_type").on(table.userId, table.mediaType),
    // Composite: Query user's AI tasks by media type and provider
    // Can also be used for: WHERE mediaType = ? AND provider = ? (left-prefix)
    index("idx_ai_task_media_type_status").on(table.mediaType, table.status),
  ],
);

export const r2UploadTask = pgTable(
  "r2_upload_task",
  {
    id: text("id").primaryKey(),
    aiTaskId: text("ai_task_id").references(() => aiTask.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    sourceUrl: text("source_url"),
    sourceUrls: text("source_urls").notNull(),
    workbenchCreationId: text("workbench_creation_id").references(
      () => workbenchCreation.id,
      { onDelete: "set null" },
    ),
    workbenchCreationIds: text("workbench_creation_ids"),
    resultUrl: text("result_url"),
    resultUrls: text("result_urls"),
    payload: text("payload"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    lockedAt: timestamp("locked_at"),
    lockedBy: text("locked_by"),
    nextRunAt: timestamp("next_run_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_r2_upload_task_status_next_run").on(
      table.status,
      table.nextRunAt,
    ),
    index("idx_r2_upload_task_ai_task").on(table.aiTaskId),
    index("idx_r2_upload_task_workbench_creation").on(
      table.workbenchCreationId,
    ),
    uniqueIndex("uq_r2_upload_task_ai_source").on(
      table.aiTaskId,
      table.sourceUrl,
    ),
  ],
);

export const aiCharacter = pgTable(
  "ai_character",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    dna: text("dna").notNull(),
    extraDescription: text("extra_description"),
    imageUrl: text("image_url"),
    providerTaskId: text("provider_task_id"),
    aspectRatio: text("aspect_ratio").notNull(),
    resolution: text("resolution").notNull(),
    errorMessage: text("error_message"),
    currentVersion: integer("current_version").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("idx_ai_character_user_created_at").on(table.userId, table.createdAt),
    index("idx_ai_character_user_status").on(table.userId, table.status),
  ],
);

export const aiCharacterHistory = pgTable(
  "ai_character_history",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => aiCharacter.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    action: text("action").notNull(),
    snapshot: text("snapshot").notNull(),
    changes: text("changes"),
    rollbackFromVersion: integer("rollback_from_version"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_ai_character_history_character_version").on(
      table.characterId,
      table.version,
    ),
    index("idx_ai_character_history_user_created").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const aiCharacterPerspective = pgTable(
  "ai_character_perspective",
  {
    id: text("id").primaryKey(),
    characterId: text("character_id")
      .notNull()
      .references(() => aiCharacter.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    imageUrl: text("image_url"),
    providerTaskId: text("provider_task_id"),
    horizontalAngle: integer("horizontal_angle").notNull(),
    verticalAngle: integer("vertical_angle").notNull(),
    distance: real("distance").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("idx_ai_character_perspective_character_created").on(
      table.characterId,
      table.createdAt,
    ),
    index("idx_ai_character_perspective_provider_task").on(
      table.providerTaskId,
    ),
  ],
);

export const promptEnhanceLog = pgTable(
  "prompt_enhance_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("manual"),
    mode: text("mode").notNull().default("image"),
    scene: text("scene").notNull().default(""),
    originalPrompt: text("original_prompt").notNull(),
    optimizedPrompt: text("optimized_prompt").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_prompt_enhance_log_user_created").on(
      table.userId,
      table.createdAt,
    ),
    index("idx_prompt_enhance_log_source_created").on(
      table.source,
      table.createdAt,
    ),
  ],
);

export const chat = pgTable(
  "chat",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    model: text("model").notNull(),
    provider: text("provider").notNull(),
    title: text("title").notNull().default(""),
    parts: text("parts").notNull(),
    metadata: text("metadata"),
    content: text("content"),
  },
  (table) => [index("idx_chat_user_status").on(table.userId, table.status)],
);

export const chatMessage = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    chatId: text("chat_id")
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    role: text("role").notNull(),
    parts: text("parts").notNull(),
    metadata: text("metadata"),
    model: text("model").notNull(),
    provider: text("provider").notNull(),
  },
  (table) => [
    index("idx_chat_message_chat_id").on(table.chatId, table.status),
    index("idx_chat_message_user_id").on(table.userId, table.status),
  ],
);

export const ipBlacklist = pgTable(
  "ip_blacklist",
  {
    id: text("id").primaryKey(),
    ip: text("ip").notNull().unique(), // IP 地址
    reason: text("reason"), // 封禁原因
    status: text("status").notNull().default("active"), // active, inactive
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    createdBy: text("created_by"), // 创建者用户 ID
  },
  (table) => [
    // 查询活跃的黑名单 IP
    index("idx_ip_blacklist_ip_status").on(table.ip, table.status),
    // 按创建时间排序
    index("idx_ip_blacklist_created_at").on(table.createdAt),
  ],
);

export const utmTracking = pgTable(
  "utm_tracking",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // 用户 ID（可选，游客为 null）
    sessionId: text("session_id"), // 会话 ID
    utmSource: text("utm_source"), // UTM 来源
    utmMedium: text("utm_medium"), // UTM 媒介
    utmCampaign: text("utm_campaign"), // UTM 活动
    utmContent: text("utm_content"), // UTM 内容
    utmTerm: text("utm_term"), // UTM 关键词
    referrer: text("referrer"), // 来源页面
    landingPage: text("landing_page"), // 落地页
    userAgent: text("user_agent"), // 用户代理
    ip: text("ip"), // IP 地址
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // 查询用户的 UTM 历史
    index("idx_utm_tracking_user_id").on(table.userId),
    // 查询特定 campaign 的访问记录
    index("idx_utm_tracking_campaign").on(table.utmCampaign),
    // 按时间范围查询
    index("idx_utm_tracking_created_at").on(table.createdAt),
    // 查询会话的 UTM 记录
    index("idx_utm_tracking_session_id").on(table.sessionId),
    // 复合索引：按 campaign 和时间查询
    index("idx_utm_tracking_campaign_created").on(
      table.utmCampaign,
      table.createdAt,
    ),
  ],
);

export const affiliateApplication = pgTable(
  "affiliate_application",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"), // pending, approved, rejected, canceled
    desiredTier: text("desired_tier").notNull().default("standard"), // standard, kol
    paypalEmail: text("paypal_email"),
    socialAccount: text("social_account"),
    socialPlatform: text("social_platform"),
    channelSummary: text("channel_summary"),
    applicationNote: text("application_note"),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at"),
    rejectReason: text("reject_reason"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_affiliate_application_user_status").on(
      table.userId,
      table.status,
    ),
    index("idx_affiliate_application_status_created").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const affiliateProfile = pgTable(
  "affiliate_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    applicationId: text("application_id").references(
      () => affiliateApplication.id,
      {
        onDelete: "set null",
      },
    ),
    code: text("code").notNull().unique(),
    discountCode: text("discount_code").unique(),
    discountEnabled: boolean("discount_enabled").notNull().default(true),
    discountExpiresAt: timestamp("discount_expires_at"),
    customDiscountRateBps: integer("custom_discount_rate_bps"),
    status: text("status").notNull().default("active"), // active, suspended, blacklisted, closed
    tier: text("tier").notNull().default("standard"), // standard, kol
    paypalEmail: text("paypal_email"),
    socialAccount: text("social_account"),
    socialPlatform: text("social_platform"),
    channelSummary: text("channel_summary"),
    profileNote: text("profile_note"),
    customFirstOrderRateBps: integer("custom_first_order_rate_bps"),
    customRenewalRateBps: integer("custom_renewal_rate_bps"),
    pendingCommissionCents: integer("pending_commission_cents")
      .notNull()
      .default(0),
    availableCommissionCents: integer("available_commission_cents")
      .notNull()
      .default(0),
    paidCommissionCents: integer("paid_commission_cents").notNull().default(0),
    referredUsersCount: integer("referred_users_count").notNull().default(0),
    convertedOrdersCount: integer("converted_orders_count")
      .notNull()
      .default(0),
    lastReferredAt: timestamp("last_referred_at"),
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    suspendedAt: timestamp("suspended_at"),
    blacklistedAt: timestamp("blacklisted_at"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("idx_affiliate_profile_status_tier").on(table.status, table.tier),
    index("idx_affiliate_profile_code_status").on(table.code, table.status),
    index("idx_affiliate_profile_available_commission").on(
      table.availableCommissionCents,
      table.status,
    ),
  ],
);

export const affiliateReferralVisit = pgTable(
  "affiliate_referral_visit",
  {
    id: text("id").primaryKey(),
    affiliateProfileId: text("affiliate_profile_id")
      .notNull()
      .references(() => affiliateProfile.id, { onDelete: "cascade" }),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    affiliateCode: text("affiliate_code").notNull(),
    visitorUserId: text("visitor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sessionId: text("session_id"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    isUnique: boolean("is_unique").notNull().default(true),
    isValid: boolean("is_valid").notNull().default(true),
    invalidReason: text("invalid_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_affiliate_referral_visit_affiliate_created").on(
      table.affiliateProfileId,
      table.createdAt,
    ),
    index("idx_affiliate_referral_visit_session_created").on(
      table.sessionId,
      table.createdAt,
    ),
    index("idx_affiliate_referral_visit_ip_created").on(
      table.ip,
      table.createdAt,
    ),
  ],
);

export const affiliateReferral = pgTable(
  "affiliate_referral",
  {
    id: text("id").primaryKey(),
    affiliateProfileId: text("affiliate_profile_id")
      .notNull()
      .references(() => affiliateProfile.id, { onDelete: "cascade" }),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referredUserId: text("referred_user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    firstVisitId: text("first_visit_id").references(
      () => affiliateReferralVisit.id,
      {
        onDelete: "set null",
      },
    ),
    lastVisitId: text("last_visit_id").references(
      () => affiliateReferralVisit.id,
      {
        onDelete: "set null",
      },
    ),
    attributionModel: text("attribution_model")
      .notNull()
      .default("first_touch"),
    status: text("status").notNull().default("pending"), // pending, converted, rejected, expired
    cookieExpiresAt: timestamp("cookie_expires_at"),
    firstVisitedAt: timestamp("first_visited_at"),
    lastVisitedAt: timestamp("last_visited_at"),
    convertedAt: timestamp("converted_at"),
    firstOrderId: text("first_order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    firstSubscriptionId: text("first_subscription_id").references(
      () => subscription.id,
      { onDelete: "set null" },
    ),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_affiliate_referral_affiliate_status").on(
      table.affiliateProfileId,
      table.status,
    ),
    index("idx_affiliate_referral_referred_status").on(
      table.referredUserId,
      table.status,
    ),
  ],
);

export const affiliateCommission = pgTable(
  "affiliate_commission",
  {
    id: text("id").primaryKey(),
    affiliateProfileId: text("affiliate_profile_id")
      .notNull()
      .references(() => affiliateProfile.id, { onDelete: "cascade" }),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referredUserId: text("referred_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    referralId: text("referral_id").references(() => affiliateReferral.id, {
      onDelete: "set null",
    }),
    sourceOrderId: text("source_order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    sourceSubscriptionId: text("source_subscription_id").references(
      () => subscription.id,
      { onDelete: "set null" },
    ),
    payoutId: text("payout_id"),
    commissionType: text("commission_type").notNull(), // first_order, renewal, manual_adjustment, reversal
    sourceType: text("source_type").notNull(), // order, subscription, manual
    status: text("status").notNull().default("pending"), // pending, available, locked, payout_requested, paid, rejected, reversed
    baseAmountCents: integer("base_amount_cents").notNull().default(0),
    commissionRateBps: integer("commission_rate_bps").notNull(),
    commissionAmountCents: integer("commission_amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    occurredAt: timestamp("occurred_at").notNull(),
    availableAt: timestamp("available_at"),
    settledAt: timestamp("settled_at"),
    description: text("description"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_affiliate_commission_affiliate_status").on(
      table.affiliateProfileId,
      table.status,
    ),
    index("idx_affiliate_commission_affiliate_occurred").on(
      table.affiliateUserId,
      table.occurredAt,
    ),
    index("idx_affiliate_commission_order_type").on(
      table.sourceOrderId,
      table.commissionType,
    ),
    index("idx_affiliate_commission_subscription_type").on(
      table.sourceSubscriptionId,
      table.commissionType,
    ),
    index("idx_affiliate_commission_payout_status").on(
      table.payoutId,
      table.status,
    ),
  ],
);

export const affiliatePayout = pgTable(
  "affiliate_payout",
  {
    id: text("id").primaryKey(),
    payoutNo: text("payout_no").notNull().unique(),
    affiliateProfileId: text("affiliate_profile_id")
      .notNull()
      .references(() => affiliateProfile.id, { onDelete: "cascade" }),
    affiliateUserId: text("affiliate_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("requested"), // requested, approved, paid, rejected, canceled
    requestedAmountCents: integer("requested_amount_cents").notNull(),
    approvedAmountCents: integer("approved_amount_cents"),
    paidAmountCents: integer("paid_amount_cents"),
    currency: text("currency").notNull().default("USD"),
    paypalEmail: text("paypal_email"),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"),
    paidAt: timestamp("paid_at"),
    reviewedBy: text("reviewed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    rejectReason: text("reject_reason"),
    paymentReference: text("payment_reference"),
    note: text("note"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_affiliate_payout_affiliate_status").on(
      table.affiliateProfileId,
      table.status,
    ),
    index("idx_affiliate_payout_requested_at").on(table.requestedAt),
    index("idx_affiliate_payout_status_requested").on(
      table.status,
      table.requestedAt,
    ),
  ],
);

export const affiliateProgram = pgTable(
  "affiliate_program",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique().default("default"),
    status: text("status").notNull().default("active"), // active, draft, archived
    defaultFirstOrderRateBps: integer("default_first_order_rate_bps")
      .notNull()
      .default(1500),
    defaultRenewalRateBps: integer("default_renewal_rate_bps")
      .notNull()
      .default(800),
    defaultDiscountRateBps: integer("default_discount_rate_bps")
      .notNull()
      .default(1000),
    minimumPayoutAmountCents: integer("minimum_payout_amount_cents")
      .notNull()
      .default(4000),
    cookieTtlDays: integer("cookie_ttl_days").notNull().default(7),
    commissionConfirmDays: integer("commission_confirm_days")
      .notNull()
      .default(3),
    antiFraudWindowMinutes: integer("anti_fraud_window_minutes")
      .notNull()
      .default(60),
    maxClicksPerIp: integer("max_clicks_per_ip").notNull().default(3),
    agreementText: text("agreement_text"),
    metadata: text("metadata"),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("idx_affiliate_program_status").on(table.status)],
);

export const workbenchUpload = pgTable(
  "workbench_upload",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    sceneId: text("scene_id"),
    sceneLabel: text("scene_label"),
    modelUrl: text("model_url"),
    modelLabel: text("model_label"),
    filename: text("filename").notNull(),
    storageKey: text("storage_key"),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    keywordText: text("keyword_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_workbench_upload_user_created").on(
      table.userId,
      table.createdAt,
    ),
    index("idx_workbench_upload_user_type_created").on(
      table.userId,
      table.mediaType,
      table.createdAt,
    ),
    index("idx_workbench_upload_user_scene_created").on(
      table.userId,
      table.sceneId,
      table.createdAt,
    ),
    index("idx_workbench_upload_user_model_created").on(
      table.userId,
      table.modelUrl,
      table.createdAt,
    ),
  ],
);

export const workbenchCreation = pgTable(
  "workbench_creation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    sceneId: text("scene_id"),
    sceneLabel: text("scene_label"),
    modelUrl: text("model_url"),
    modelLabel: text("model_label"),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    prompt: text("prompt"),
    params: text("params"),
    aspectRatio: text("aspect_ratio"),
    keywordText: text("keyword_text"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_workbench_creation_user_created").on(
      table.userId,
      table.createdAt,
    ),
    index("idx_workbench_creation_user_type_created").on(
      table.userId,
      table.mediaType,
      table.createdAt,
    ),
    index("idx_workbench_creation_user_scene_created").on(
      table.userId,
      table.sceneId,
      table.createdAt,
    ),
    index("idx_workbench_creation_user_model_created").on(
      table.userId,
      table.modelUrl,
      table.createdAt,
    ),
  ],
);

export const workbenchCollection = pgTable(
  "workbench_collection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_workbench_collection_user_created").on(
      table.userId,
      table.createdAt,
    ),
    index("idx_workbench_collection_user_updated").on(
      table.userId,
      table.updatedAt,
    ),
  ],
);

export const workbenchCollectionCreation = pgTable(
  "workbench_collection_creation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    collectionId: text("collection_id")
      .notNull()
      .references(() => workbenchCollection.id, { onDelete: "cascade" }),
    creationId: text("creation_id")
      .notNull()
      .references(() => workbenchCreation.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_workbench_collection_creation_user_collection").on(
      table.userId,
      table.collectionId,
    ),
    index("idx_workbench_collection_creation_user_creation").on(
      table.userId,
      table.creationId,
    ),
    uniqueIndex("uq_workbench_collection_creation_pair").on(
      table.collectionId,
      table.creationId,
    ),
  ],
);

export const workbenchCanvasProject = pgTable(
  "workbench_canvas_project",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    mode: text("mode").default("canvas").notNull(),
    status: text("status").default("draft").notNull(),
    coverUrl: text("cover_url"),
    entrySceneId: text("entry_scene_id"),
    entryModelUrl: text("entry_model_url"),
    lastOpenedAt: timestamp("last_opened_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_workbench_canvas_project_user_created").on(
      table.userId,
      table.createdAt,
    ),
    index("idx_workbench_canvas_project_user_updated").on(
      table.userId,
      table.updatedAt,
    ),
    index("idx_workbench_canvas_project_user_last_opened").on(
      table.userId,
      table.lastOpenedAt,
    ),
  ],
);

export const workbenchCanvasSnapshot = pgTable(
  "workbench_canvas_snapshot",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => workbenchCanvasProject.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    version: integer("version").default(1).notNull(),
    graphJson: text("graph_json").notNull(),
    metaJson: text("meta_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_workbench_canvas_snapshot_project").on(table.projectId),
    index("idx_workbench_canvas_snapshot_user_project").on(
      table.userId,
      table.projectId,
    ),
  ],
);

export const workbenchCanvasProjectCreation = pgTable(
  "workbench_canvas_project_creation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => workbenchCanvasProject.id, { onDelete: "cascade" }),
    creationId: text("creation_id")
      .notNull()
      .references(() => workbenchCreation.id, { onDelete: "cascade" }),
    sourceNodeId: text("source_node_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_workbench_canvas_project_creation_user_project").on(
      table.userId,
      table.projectId,
    ),
    index("idx_workbench_canvas_project_creation_user_creation").on(
      table.userId,
      table.creationId,
    ),
    uniqueIndex("uq_workbench_canvas_project_creation_pair").on(
      table.projectId,
      table.creationId,
    ),
  ],
);

export const workbenchCanvasChatThread = pgTable(
  "workbench_canvas_chat_thread",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => workbenchCanvasProject.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    resourceId: text("resource_id").notNull(),
    status: text("status").notNull().default("active"),
    title: text("title").notNull().default(""),
    lastMessageAt: timestamp("last_message_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_canvas_chat_thread_user_project").on(
      table.userId,
      table.projectId,
    ),
    index("idx_canvas_chat_thread_user_last_message").on(
      table.userId,
      table.lastMessageAt,
    ),
  ],
);

export const workbenchCanvasChatMessage = pgTable(
  "workbench_canvas_chat_message",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => workbenchCanvasProject.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => workbenchCanvasChatThread.id, { onDelete: "cascade" }),
    clientMessageId: text("client_message_id"),
    role: text("role").notNull(),
    status: text("status").notNull().default("completed"),
    content: text("content").notNull(),
    partsJson: text("parts_json").notNull(),
    attachmentsJson: text("attachments_json"),
    mentionedReferencesJson: text("mentioned_references_json"),
    operationsJson: text("operations_json"),
    billingJson: text("billing_json"),
    generationJson: text("generation_json"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_canvas_chat_message_thread_created").on(
      table.threadId,
      table.createdAt,
    ),
    index("idx_canvas_chat_message_project_created").on(
      table.projectId,
      table.createdAt,
    ),
    index("idx_canvas_chat_message_user_project").on(
      table.userId,
      table.projectId,
    ),
    uniqueIndex("uq_canvas_chat_message_thread_client").on(
      table.threadId,
      table.clientMessageId,
    ),
  ],
);

export const workbenchCanvasChatMessageAttachment = pgTable(
  "workbench_canvas_chat_message_attachment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => workbenchCanvasProject.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => workbenchCanvasChatThread.id, { onDelete: "cascade" }),
    messageId: text("message_id")
      .notNull()
      .references(() => workbenchCanvasChatMessage.id, { onDelete: "cascade" }),
    assetId: text("asset_id")
      .notNull()
      .references(() => workbenchCreation.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("image"),
    orderIndex: integer("order_index").default(0).notNull(),
    source: text("source").notNull().default("upload"),
    nodeId: text("node_id"),
    label: text("label"),
    metadataJson: text("metadata_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_canvas_chat_attachment_message_order").on(
      table.messageId,
      table.orderIndex,
    ),
    index("idx_canvas_chat_attachment_project_asset").on(
      table.projectId,
      table.assetId,
    ),
  ],
);

export const workbenchCanvasChatMessageReference = pgTable(
  "workbench_canvas_chat_message_reference",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => workbenchCanvasProject.id, { onDelete: "cascade" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => workbenchCanvasChatThread.id, { onDelete: "cascade" }),
    messageId: text("message_id")
      .notNull()
      .references(() => workbenchCanvasChatMessage.id, { onDelete: "cascade" }),
    mentionText: text("mention_text").notNull(),
    mentionKey: text("mention_key").notNull(),
    targetType: text("target_type").notNull(),
    targetNodeId: text("target_node_id"),
    targetAssetId: text("target_asset_id").references(
      () => workbenchCreation.id,
      { onDelete: "cascade" },
    ),
    relation: text("relation").notNull().default("reference"),
    resolveStatus: text("resolve_status").notNull().default("resolved"),
    resolveStrategy: text("resolve_strategy"),
    startOffset: integer("start_offset"),
    endOffset: integer("end_offset"),
    snapshotJson: text("snapshot_json"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_canvas_chat_reference_message").on(table.messageId),
    index("idx_canvas_chat_reference_project_target").on(
      table.projectId,
      table.targetType,
    ),
  ],
);
