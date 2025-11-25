export type DemoUser = {
  email: string;
  password: string;
  role: "admin" | "super-admin";
};

export const demoUsers: DemoUser[] = [
  {
    email: "admin@parking.dev",
    password: "admin123",
    role: "admin",
  },
  {
    email: "super@parking.dev",
    password: "super123",
    role: "super-admin",
  },
];

