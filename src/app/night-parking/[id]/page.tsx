import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { Button } from "@/components/ui/button";
import { SessionActions } from "@/components/session-actions";
import { PaymentStatusWithButton } from "@/components/payment-status-with-button";
import { getDictionary, resolveLanguage } from "@/lib/i18n";

type Params = {
  id: string;
};

async function getNightSession(id: string) {
  const client = await clientPromise;
  const db = client.db();

  let objectId: ObjectId | null = null;
  try {
    objectId = new ObjectId(id);
  } catch {
    objectId = null;
  }

  const query = objectId ? { _id: objectId } : { _id: id };
  const session = await db.collection("night_sessions").findOne(query);

  if (!session) {
    return null;
  }

  return {
    ...session,
    _id: session._id.toString(),
  };
}

export default async function NightParkingDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const session = await getNightSession(id);

  if (!session) {
    notFound();
  }

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value ?? "guest";
  const language = resolveLanguage(cookieStore.get("lang")?.value);
  const dict = getDictionary(language);
  const canManage = role === "super-admin";

  const timestamp = new Date(session.timestamp);
  const createdAt = session.createdAt ? new Date(session.createdAt) : null;

  return (
    <div className="bg-muted/20 px-4 py-6 sm:py-10">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Night Parking Session
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {session.vehicleNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Session Details
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/parking-sessions">Back to Sessions</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">Vehicle Information</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {session.vehicleNumber}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Night Parking Rate
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">Payment Status</p>
            <div className="mt-2">
              <PaymentStatusWithButton
                sessionType="night"
                sessionId={session._id}
                totalAmount={session.price ?? 0}
                paidAmount={session.paidAmount ?? 0}
                paid={session.paid ?? false}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total: AED {session.price?.toFixed(2) ?? "0.00"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-2xs uppercase text-muted-foreground">Session Information</p>
          <div className="mt-3 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-foreground/70">
                Timestamp
              </p>
              <p className="text-base font-semibold text-foreground">
                {timestamp.toLocaleString()}
              </p>
            </div>
            {createdAt && (
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground/70">
                  Recorded At
                </p>
                <p className="text-base font-semibold text-foreground">
                  {createdAt.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">Price</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              AED {session.price?.toFixed(2) ?? "0.00"}
            </p>
            <p className="text-xs text-muted-foreground">
              Night parking rate
            </p>
          </div>

          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground">Payment</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              AED {(session.paidAmount ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              Remaining: AED {((session.price ?? 0) - (session.paidAmount ?? 0)).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-background p-5 shadow-sm">
          <p className="text-2xs uppercase text-muted-foreground">Additional Information</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created By:</span>
              <span className="font-medium text-foreground">
                {session.createdBy ?? "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-medium text-foreground">
                AED {session.price?.toFixed(2) ?? "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid Amount:</span>
              <span className="font-medium text-foreground">
                AED {(session.paidAmount ?? 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining:</span>
              <span className="font-medium text-foreground">
                AED {((session.price ?? 0) - (session.paidAmount ?? 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="rounded-xl border bg-background p-4 shadow-sm">
            <p className="text-2xs uppercase text-muted-foreground mb-3">Actions</p>
            <div className="flex items-center gap-2">
              <SessionActions
                sessionType="night"
                sessionId={session._id}
                totalAmount={session.price ?? 0}
                paidAmount={session.paidAmount ?? 0}
                canManage={canManage}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

