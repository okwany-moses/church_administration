# Security Specification: VYIN Matrix Firestore Rules (ABAC)

This security specification details the Attribute-Based Access Control (ABAC) invariants and security tests for the Visionary Young Innovators Network (VYIN) blog and user registry database.

## 1. Data Invariants

1.  **User Profiles (`/users/{userId}`)**:
    *   **Instantiation Integrity**: A user profile's document ID must match the creator's authenticated email or UID (`request.auth.uid == userId`).
    *   **Self-Assigned Role Prevention**: A standard registrant cannot elevate their own role to `admin` or `author` on write. Only existing admins or verified secure pathways can modify authorization states.
    *   **PII Isolation**: Users (including members) can only view their own user profile document containing PII (e.g. Email / Full name parameters). Admins have global query access.

2.  **Blog Posts (`/posts/{postId}`)**:
    *   **Identity Pinning**: A blog post's `author.id` field must strictly match the creator's authenticated UID (`request.auth.uid`).
    *   **Authorization Level**: Only authenticated users with `author` or `admin` status (stored in their User database profile) can create or update posts.
    *   **Roster Purges**: Only the original author of a blog post or a system administrator has delete permissions.
    *   **Field Immutability**: Critical metadata like `publishedAt`, `id`, and the original author's UID cannot be modified after initial write.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent bypass vectors that our `firestore.rules` will strictly prevent:

### Payload 1: Spurious User Privilege Escalation
*   **Path**: `/users/malicious-uid`
*   **Action**: Create / Update
*   **Payload**: `{ "id": "malicious-uid", "email": "attacker@hack.com", "fullName": "Attacker", "role": "admin" }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Standard registrants cannot arbitrarily write or elevate roles.

### Payload 2: Hostile ID Hijacking
*   **Path**: `/users/victim-uid`
*   **Action**: Write
*   **Actor**: `attacker-uid`
*   **Payload**: `{ "id": "victim-uid", "email": "victim@domain.com", "fullName": "Victim User", "role": "member" }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Writing to a path other than own UID is blocked.

### Payload 3: Spoofed Article Representation
*   **Path**: `/posts/random-post-id`
*   **Action**: Create
*   **Actor**: `attacker-uid`
*   **Payload**: `{ "id": "random-post-id", "title": "Injected Article", "author": { "id": "victim-uid", "fullName": "Victim Author" }, ... }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Author ID parameter must match authentication token UID.

### Payload 4: Unprivileged Article Write
*   **Path**: `/posts/new-post`
*   **Action**: Create
*   **Actor**: `member-uid` (Role: Member)
*   **Payload**: `{ "id": "new-post", "title": "Bypassing Privilege", ... }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Standard members lack author/admin privileges to create articles.

### Payload 5: Metadata Temporal Poisoning
*   **Path**: `/posts/existing-post`
*   **Action**: Update
*   **Payload**: `{ "publishedAt": "2020-01-01T00:00:00Z" }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Creation date is immutable.

### Payload 6: Shadow Key Drift Injection
*   **Path**: `/posts/existing-post`
*   **Action**: Update
*   **Payload**: `{ "ghost_flag_is_validated": true }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Strict keys checked via `affectedKeys().hasOnly()`.

### Payload 7: Relational Author Manipulation
*   **Path**: `/posts/existing-post`
*   **Action**: Update
*   **Actor**: `another-author-uid`
*   **Payload**: `{ "author": { "id": "another-author-uid" } }`
*   **Expected Outcome**: `PERMISSION_DENIED` - Changing author fields is forbidden.

### Payload 8: Path Character Buffer Overflow
*   **Path**: `/posts/JUNK_CHARACTERS_BUFFER_1.5KB_LENGTH`
*   **Action**: Get / Create
*   **Expected Outcome**: `PERMISSION_DENIED` - Document IDs must adhere to standard size limits (< 128 characters) and match the `isValidId` string expression.

### Payload 9: Rogue Admin Override
*   **Path**: `/posts/existing-post`
*   **Action**: Delete
*   **Actor**: `unauthorized-member-uid`
*   **Expected Outcome**: `PERMISSION_DENIED` - Access disallowed for unprivileged non-authors.

### Payload 10: Anonymous Write Leak
*   **Path**: `/posts/new-post`
*   **Actor**: Unauthenticated User
*   **Action**: Create
*   **Expected Outcome**: `PERMISSION_DENIED` - Sessions must be authenticated.

### Payload 11: PII Bulk Retrieval Attempt
*   **Path**: `/users`
*   **Action**: List (blanket query)
*   **Actor**: `member-uid`
*   **Expected Outcome**: `PERMISSION_DENIED` - Direct non-restricted listing of user profiles containing PII is completely locked.

### Payload 12: Terminal State Tampering
*   **Path**: `/posts/finalized-post`
*   **Action**: Update
*   **Payload**: `{ "title": "Modifying published history" }`
*   **Constraint**: If post is marked under strict frozen category or locked system metadata.
*   **Expected Outcome**: `PERMISSION_DENIED` - Modifying locked records is forbidden.

---

## 3. The Test Runner Template

Integration checks execute on simulated or client-side mock configurations under:
`firestore.rules.test.ts`
Using `firebase/rules-unit-testing` or visual local simulations.
