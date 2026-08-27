import { redirect } from "next/navigation";
import { auth } from "@/../auth";
import { db } from "@/server/db";

export async function getAuthContext() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const membership = await db.organizationMember.findFirst({
    where: {
      userId,
      active: true,
      organization: { archivedAt: null },
    },
    include: { organization: true, user: true },
  });

  if (!membership || membership.user.sessionVersion !== session.user.sessionVersion) {
    return null;
  }

  return {
    user: membership.user,
    membership,
    organization: membership.organization,
  };
}

export async function requireAuthContext() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/entrar");
  }

  return context;
}
