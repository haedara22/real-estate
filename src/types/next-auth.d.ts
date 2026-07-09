// src/types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      agencyId: string | null; // ✅ أضف هذا
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    agencyId: string | null; // ✅ أضف هذا
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    agencyId: string | null; // ✅ أضف هذا
  }
}