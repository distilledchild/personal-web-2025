The "Update" button in the Blog post detail popup should only be visible to logged-in admin users.

**Problem:**
The "Update" button in the blog post detail modal was visible regardless of whether a user was logged in or if they possessed admin privileges. This allowed unauthorized users to see (though not necessarily use) functionality meant only for administrators.

**Solution:**
I modified the `Tech` component in `App.tsx` to conditionally render the "Update" button. The button will now only appear if a user is logged in (`user` object exists) AND if they are authorized (`isAuthorized` is true).

**Specifically, the following change was made:**

*   **Conditional Rendering for the "Update" Button:**
    The `button` element for "Update" within the post detail modal (when `!isEditMode`) was wrapped with a conditional check:
    ```typescript
    {/* Update button */}
    {(user && isAuthorized) && (
        <button
          onClick={handleEdit}
          className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-700 transition-colors"
        >
          Update
        </button>
    )}
    ```
    *   `user`: This state variable in the `Tech` component indicates if any user is currently logged in.
    *   `isAuthorized`: This state variable in the `Tech` component reflects whether the logged-in user has administrative or editing privileges, typically fetched from the backend API (`/api/member/role/:email`).

**Impact:**
This ensures that the "Update" button is only displayed to users who have both logged in and been confirmed as authorized (e.g., as an administrator). This enhances the security and user experience by preventing unauthorized access to administrative functionalities.