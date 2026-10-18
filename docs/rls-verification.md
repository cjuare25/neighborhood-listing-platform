# Properties Row-Level Security Verification

## 1. Target Table and Schema Context

The evaluated table is `public.properties`. It stores property listings and connects each listing to its creator through the `user_id` column.

The RLS schema is declared in:

`supabase/migrations/20261017170103_create_properties_rls.sql`

```sql
alter table public.properties enable row level security;

create policy "Active properties are publicly readable"
on public.properties
for select
to anon, authenticated
using (availability_status = 'Active');

create policy "Owners can view their own properties"
on public.properties
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can insert their own properties"
on public.properties
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Owners can update their own properties"
on public.properties
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Owners can delete their own properties"
on public.properties
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Administrators can view all properties"
on public.properties
for select
to authenticated
using (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
);

create policy "Administrators can update all properties"
on public.properties
for update
to authenticated
using (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
)
with check (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
);

create policy "Administrators can delete all properties"
on public.properties
for delete
to authenticated
using (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
);
```

The migration also limits table privileges:

```sql
revoke all on table public.properties from anon, authenticated;
grant select on table public.properties to anon;
grant select, insert, update, delete on table public.properties to authenticated;
```

## 2. Role Operations Matrix

| Role | Permitted operation | Enforced predicate | Denied operation | Enforced restriction |
|---|---|---|---|---|
| Anonymous user (`anon`) | `SELECT` an Active listing | `availability_status = 'Active'` | `DELETE` any listing | The `anon` role has no `DELETE` grant and no DELETE policy. |
| Resource owner | `INSERT` a listing with their own ID | `auth.uid() = user_id` in `WITH CHECK` | `INSERT` a listing for another user | The submitted `user_id` would not equal `auth.uid()`. |
| Other authenticated user | `SELECT` an Active listing | `availability_status = 'Active'` | `INSERT` a listing using the owner’s ID | The owner’s `user_id` does not equal the other user’s `auth.uid()`. |
| Administrator with custom claim | `UPDATE` any listing | `app_metadata.is_admin = 'true'` | `INSERT` a listing for an arbitrary different user | There is no administrator INSERT policy; the owner policy still requires `auth.uid() = user_id`. |

A Supabase `service_role` credential bypasses RLS and must never be placed in client code. This project uses the custom `app_metadata.is_admin = true` predicate when evaluating administrator access through RLS.

## 3. Verification Evidence and Diagnostic Payloads

### Test Setup

Two authenticated test accounts were used:

- Resource owner: `testemail@example.com`
- Other authenticated user: `testemail1@example.com`

The resource owner successfully created a property with `availability_status = 'Pending'`. Verification returned:

```text
Owner rows returned: 1
Other-user rows returned: 0
```

This shows that the owner could read the Pending property while the other authenticated user could not.

### Anonymous SELECT Test

The request included the project publishable key but intentionally omitted the `Authorization` header:

```bash
curl -i -sS "$SUPABASE_URL/rest/v1/properties?id=eq.$PROPERTY_ID" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

Raw response:

```http
HTTP/2 200
content-type: application/json; charset=utf-8
content-length: 2

[]
```

The request was allowed, but RLS filtered out the Pending property because anonymous users may only read rows where:

```sql
availability_status = 'Active'
```

### Anonymous DELETE Test

The request intentionally omitted the `Authorization` header:

```bash
curl -i -sS -X DELETE "$SUPABASE_URL/rest/v1/properties?id=eq.$PROPERTY_ID" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Prefer: return=representation"
```

Raw response:

```http
HTTP/2 401
content-type: application/json; charset=utf-8
proxy-status: PostgREST; error=42501
www-authenticate: Bearer

{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT DELETE ON public.properties TO anon;","message":"permission denied for table properties"}
```

This request was blocked because the anonymous role has neither a table-level `DELETE` grant nor a DELETE RLS policy.

### Other Authenticated User INSERT Test

The other authenticated user attempted to insert a property using the resource owner’s `user_id`.

Request payload:

```json
{
  "user_id": "<RESOURCE_OWNER_USER_ID>",
  "title": "Unauthorized Property",
  "address": "999 Blocked Street",
  "city": "Los Angeles",
  "price": 300000,
  "bedrooms": 2,
  "bathrooms": 1,
  "amenities": [],
  "availability_status": "Pending"
}
```

The request included an authenticated header belonging to the other user:

```bash
curl -i -sS -X POST "$SUPABASE_URL/rest/v1/properties" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer <OTHER_AUTHENTICATED_USER_JWT>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data "$OTHER_FORGED_PAYLOAD"
```

Raw response:

```http
HTTP/2 403
content-type: application/json; charset=utf-8
proxy-status: PostgREST; error=42501

{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"properties\""}
```

The request failed because the insert policy requires:

```sql
auth.uid() = user_id
```

The JWT identified the other authenticated user, but the payload contained the resource owner’s ID.

## 4. Empty Array Compared with 403 Forbidden

An empty array (`[]`) after a `SELECT` request means the query itself was permitted, but RLS removed every row the requester was not authorized to view. This protects record existence because the client cannot distinguish between “no matching record exists” and “a matching record exists but is hidden.”

A `403 Forbidden` response means the server explicitly rejected the attempted operation. In the other-user INSERT test, PostgreSQL evaluated the new row against the `WITH CHECK` predicate and rejected it because the submitted `user_id` did not match the authenticated user.

Therefore, `[]` represents successful execution with no visible rows, while `403` represents an explicitly prohibited operation.