export const AuthGuard = jest.fn(() => true);

export const Roles = (..._roles: string[]) => {
  return () => undefined;
};
