-- Enums
CREATE TYPE vacation_expense_category AS ENUM ('flights', 'food', 'hotel', 'miscellaneous');

-- Tables
CREATE TABLE IF NOT EXISTS "account_balance_adjustments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "amount_delta" numeric NOT NULL,
  "target_amount" numeric NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "account_balance_adjustments_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "account_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "sort_order" int4 NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "account_categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "account_categories_user_id_name_key" UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS "app_settings" (
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "app_settings_pkey" PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS "auth_credentials" (
  "user_id" uuid NOT NULL,
  "username" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "auth_credentials_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "auth_credentials_username_key" UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS "auth_refresh_tokens" (
  "token_hash" text NOT NULL,
  "user_id" uuid NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz,
  "replaced_by_token_hash" text,
  CONSTRAINT "auth_refresh_tokens_pkey" PRIMARY KEY (token_hash)
);

CREATE TABLE IF NOT EXISTS "backend_migrations" (
  "id" serial,
  "filename" text,
  "applied_at" timestamptz DEFAULT now(),
  CONSTRAINT "backend_migrations_pkey" PRIMARY KEY (id),
  CONSTRAINT "backend_migrations_filename_key" UNIQUE (filename)
);

CREATE TABLE IF NOT EXISTS "borrowed_loans" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "lender" text NOT NULL,
  "original_amount" numeric NOT NULL,
  "current_balance" numeric NOT NULL,
  "payoff_date" date NOT NULL,
  "notes" text,
  "paid_off_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "interest_rate" numeric NOT NULL DEFAULT 0,
  CONSTRAINT "borrowed_loans_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "budget_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "allocated" numeric NOT NULL DEFAULT 0,
  "spent" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "group_id" uuid,
  "is_pinned" bool NOT NULL DEFAULT false,
  "due_day_of_month" int4,
  "parent_name" text NOT NULL DEFAULT 'Other'::text,
  "icon" text NOT NULL DEFAULT 'ellipsis-horizontal'::text,
  "color" text NOT NULL DEFAULT '#1f2a3d'::text,
  "icon_color" text NOT NULL DEFAULT '#d8d8e6'::text,
  "sort_order" int4 NOT NULL DEFAULT 0,
  "is_default" bool NOT NULL DEFAULT false,
  "is_archived" bool NOT NULL DEFAULT false,
  CONSTRAINT "budget_categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "budget_categories_user_group_name_key" UNIQUE (user_id, group_id, name)
);

CREATE TABLE IF NOT EXISTS "category_groups" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "sort_order" int2 NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "category_groups_pkey" PRIMARY KEY (id),
  CONSTRAINT "category_groups_user_id_name_key" UNIQUE (user_id, name),
  CONSTRAINT "category_groups_user_id_sort_order_key" UNIQUE (user_id, sort_order)
);

CREATE TABLE IF NOT EXISTS "financial_accounts" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "name" text NOT NULL,
  "mode" text NOT NULL,
  "amount" numeric NOT NULL DEFAULT 0,
  "credit_limit" numeric,
  "payment_day_of_month" int4,
  "reminder" jsonb NOT NULL DEFAULT '{"type": "none"}'::jsonb,
  "icon_kind" text,
  "icon_label" text,
  "icon_image_url" text,
  "icon_company_query" text,
  "account_type" text NOT NULL,
  "color" text NOT NULL DEFAULT '#4C89E8'::text,
  "notes" text NOT NULL DEFAULT ''::text,
  "sort_order" int4 NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "financial_accounts_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "income_categories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "parent_name" text NOT NULL,
  "icon" text NOT NULL,
  "color" text NOT NULL,
  "icon_color" text NOT NULL,
  "sort_order" int4 NOT NULL DEFAULT 0,
  "is_default" bool NOT NULL DEFAULT false,
  "is_archived" bool NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "due_day_of_month" int4,
  CONSTRAINT "income_categories_pkey" PRIMARY KEY (id),
  CONSTRAINT "income_categories_user_id_name_key" UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS "income_entries" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "category" text NOT NULL,
  "name" text,
  "amount" numeric NOT NULL,
  "received_at" timestamptz NOT NULL,
  "account_name" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_paid" bool NOT NULL DEFAULT true,
  "income_category_id" uuid,
  "account_id" uuid,
  CONSTRAINT "income_entries_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "loans_given" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "recipient" text NOT NULL,
  "amount" numeric NOT NULL,
  "date_given" date NOT NULL,
  "expected_repayment_date" date NOT NULL,
  "repaid_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "is_vacation" bool NOT NULL DEFAULT false,
  "notes" text,
  CONSTRAINT "loans_given_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "monthly_budget_category_assignments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "month_start" date NOT NULL,
  "allocated" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "monthly_budget_category_assignments_pkey" PRIMARY KEY (id),
  CONSTRAINT "monthly_budget_category_assig_user_id_category_id_month_sta_key" UNIQUE (user_id, category_id, month_start)
);

CREATE TABLE IF NOT EXISTS "monthly_budget_targets" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "month_start" date NOT NULL,
  "total_budget" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "monthly_budget_targets_pkey" PRIMARY KEY (id),
  CONSTRAINT "monthly_budget_targets_user_id_month_start_key" UNIQUE (user_id, month_start)
);

CREATE TABLE IF NOT EXISTS "notes" (
  "id" int8 NOT NULL,
  "title" text NOT NULL,
  CONSTRAINT "notes_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "push_notification_tokens" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "platform" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "push_notification_tokens_pkey" PRIMARY KEY (id),
  CONSTRAINT "push_notification_tokens_token_key" UNIQUE (token)
);

CREATE TABLE IF NOT EXISTS "revolut_import_states" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "state" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "revolut_import_states_pkey" PRIMARY KEY (id),
  CONSTRAINT "revolut_import_states_user_id_key" UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "provider" text NOT NULL,
  "category" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active'::text,
  "cadence" text NOT NULL DEFAULT 'monthly'::text,
  "price_cents" int4 NOT NULL,
  "next_renewal_date" date NOT NULL,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "amount" numeric NOT NULL,
  "note" text,
  "transaction_date" date NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "is_paid" bool NOT NULL DEFAULT true,
  "counts_toward_bills" bool NOT NULL DEFAULT false,
  "account_id" uuid,
  CONSTRAINT "transactions_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid NOT NULL,
  "email" text NOT NULL,
  "display_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "monthly_income" numeric NOT NULL DEFAULT 0,
  CONSTRAINT "users_pkey" PRIMARY KEY (id),
  CONSTRAINT "users_email_key" UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS "vacation_expenses" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "vacation_id" uuid NOT NULL,
  "category" vacation_expense_category NOT NULL,
  "amount" int8 NOT NULL DEFAULT 0,
  "description" text,
  "date" date NOT NULL DEFAULT CURRENT_DATE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "vacation_expenses_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "vacation_funds" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "target_amount" int8 NOT NULL DEFAULT 0,
  "current_amount" int8 NOT NULL DEFAULT 0,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "duration_days" int4,
  CONSTRAINT "vacation_funds_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "url" text NOT NULL,
  "price" numeric,
  "image_url" text NOT NULL DEFAULT ''::text,
  "category" text NOT NULL DEFAULT ''::text,
  "saved_amount" numeric NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "priority" text NOT NULL DEFAULT 'Medium'::text,
  "normalized_url" text NOT NULL DEFAULT ''::text,
  "metadata_status" text NOT NULL DEFAULT 'unknown'::text,
  "metadata_last_checked_at" timestamptz,
  "metadata_last_success_at" timestamptz,
  "status" text NOT NULL DEFAULT 'active'::text,
  "purchased_at" timestamptz,
  "purchased_amount" numeric,
  "notes" text,
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS "wishlist_price_snapshots" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "wishlist_item_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "price" numeric NOT NULL,
  "captured_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "wishlist_price_snapshots_pkey" PRIMARY KEY (id)
);

-- Foreign Keys
ALTER TABLE "account_balance_adjustments" ADD CONSTRAINT "account_balance_adjustments_account_id_fkey" FOREIGN KEY (account_id) REFERENCES financial_accounts(id) ON DELETE CASCADE;
ALTER TABLE "account_balance_adjustments" ADD CONSTRAINT "account_balance_adjustments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "account_categories" ADD CONSTRAINT "account_categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_replaced_by_token_hash_fkey" FOREIGN KEY (replaced_by_token_hash) REFERENCES auth_refresh_tokens(token_hash) ON DELETE SET NULL;
ALTER TABLE "auth_refresh_tokens" ADD CONSTRAINT "auth_refresh_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "borrowed_loans" ADD CONSTRAINT "borrowed_loans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_group_id_fkey" FOREIGN KEY (group_id) REFERENCES category_groups(id) ON DELETE RESTRICT;
ALTER TABLE "budget_categories" ADD CONSTRAINT "budget_categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "category_groups" ADD CONSTRAINT "category_groups_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_category_id_fkey" FOREIGN KEY (category_id) REFERENCES account_categories(id) ON DELETE RESTRICT;
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_account_id_fkey" FOREIGN KEY (account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_income_category_id_fkey" FOREIGN KEY (income_category_id) REFERENCES income_categories(id) ON DELETE SET NULL;
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "loans_given" ADD CONSTRAINT "loans_given_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "monthly_budget_category_assignments" ADD CONSTRAINT "monthly_budget_category_assignments_category_id_fkey" FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE;
ALTER TABLE "monthly_budget_category_assignments" ADD CONSTRAINT "monthly_budget_category_assignments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "monthly_budget_targets" ADD CONSTRAINT "monthly_budget_targets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "push_notification_tokens" ADD CONSTRAINT "push_notification_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "revolut_import_states" ADD CONSTRAINT "revolut_import_states_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES financial_accounts(id) ON DELETE SET NULL;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES budget_categories(id) ON DELETE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "vacation_expenses" ADD CONSTRAINT "vacation_expenses_vacation_id_fkey" FOREIGN KEY (vacation_id) REFERENCES vacation_funds(id) ON DELETE CASCADE;
ALTER TABLE "vacation_funds" ADD CONSTRAINT "vacation_funds_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "wishlist_price_snapshots" ADD CONSTRAINT "wishlist_price_snapshots_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE "wishlist_price_snapshots" ADD CONSTRAINT "wishlist_price_snapshots_wishlist_item_id_fkey" FOREIGN KEY (wishlist_item_id) REFERENCES wishlist_items(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_account_balance_adjustments_account_created_at ON public.account_balance_adjustments USING btree (account_id, created_at DESC);
CREATE INDEX idx_account_categories_user_sort ON public.account_categories USING btree (user_id, sort_order, created_at);
CREATE INDEX idx_auth_credentials_username ON public.auth_credentials USING btree (username);
CREATE UNIQUE INDEX idx_auth_credentials_username_unique ON public.auth_credentials USING btree (lower(username));
CREATE INDEX idx_auth_refresh_tokens_expires_at ON public.auth_refresh_tokens USING btree (expires_at);
CREATE INDEX idx_auth_refresh_tokens_user_id ON public.auth_refresh_tokens USING btree (user_id);
CREATE INDEX idx_borrowed_loans_user_id ON public.borrowed_loans USING btree (user_id);
CREATE INDEX idx_borrowed_loans_user_paid_off_payoff ON public.borrowed_loans USING btree (user_id, paid_off_at, payoff_date);
CREATE INDEX idx_budget_categories_user_id ON public.budget_categories USING btree (user_id);
CREATE INDEX idx_budget_categories_user_sort ON public.budget_categories USING btree (user_id, sort_order, created_at);
CREATE INDEX idx_budget_categories_user_group ON public.budget_categories USING btree (user_id, group_id);
CREATE INDEX idx_category_groups_user_order ON public.category_groups USING btree (user_id, sort_order);
CREATE INDEX idx_financial_accounts_user_category_sort ON public.financial_accounts USING btree (user_id, category_id, sort_order, created_at);
CREATE INDEX idx_income_categories_user_sort ON public.income_categories USING btree (user_id, sort_order, created_at);
CREATE INDEX idx_income_entries_user_received_at ON public.income_entries USING btree (user_id, received_at DESC);
CREATE INDEX idx_income_entries_income_category_id ON public.income_entries USING btree (income_category_id);
CREATE INDEX idx_loans_given_user_repaid_expected ON public.loans_given USING btree (user_id, repaid_at, expected_repayment_date);
CREATE INDEX idx_loans_given_user_id ON public.loans_given USING btree (user_id);
CREATE INDEX idx_monthly_budget_category_assignments_user_month ON public.monthly_budget_category_assignments USING btree (user_id, month_start);
CREATE INDEX idx_push_notification_tokens_user_id ON public.push_notification_tokens USING btree (user_id);
CREATE INDEX idx_push_notification_tokens_user_updated_at ON public.push_notification_tokens USING btree (user_id, updated_at DESC);
CREATE INDEX idx_revolut_import_states_user_id ON public.revolut_import_states USING btree (user_id);
CREATE INDEX idx_subscriptions_user_next_renewal ON public.subscriptions USING btree (user_id, next_renewal_date);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions USING btree (user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);
CREATE INDEX idx_transactions_transaction_date ON public.transactions USING btree (transaction_date DESC);
CREATE INDEX idx_wishlist_items_user_id ON public.wishlist_items USING btree (user_id);
CREATE INDEX idx_wishlist_items_user_status ON public.wishlist_items USING btree (user_id, status);
CREATE INDEX idx_wishlist_items_user_normalized_url ON public.wishlist_items USING btree (user_id, normalized_url);
CREATE INDEX idx_wishlist_price_snapshots_user_id ON public.wishlist_price_snapshots USING btree (user_id);
CREATE INDEX idx_wishlist_price_snapshots_item_id ON public.wishlist_price_snapshots USING btree (wishlist_item_id, captured_at DESC);