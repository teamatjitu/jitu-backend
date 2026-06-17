export const betterAuth = () => ({
  api: {
    getSession: async () => ({
      user: { id: "test-user", role: "ADMIN" },
      session: { id: "test-session" },
    }),
  },
  handler: async () => new Response(null, { status: 204 }),
});
