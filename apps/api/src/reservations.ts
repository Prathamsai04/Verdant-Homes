import { Prisma, type ReservationStatus } from "@prisma/client";
import { prisma } from "./db.js";
import { AppError } from "./errors.js";

const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
  NEW: ["CONTACTED", "WAITLISTED", "CANCELLED", "CLOSED"],
  CONTACTED: ["CONFIRMED", "WAITLISTED", "CANCELLED", "CLOSED"],
  CONFIRMED: ["CANCELLED", "CLOSED"],
  WAITLISTED: ["CONTACTED", "CONFIRMED", "CANCELLED", "CLOSED"],
  CANCELLED: ["NEW", "CLOSED"],
  CLOSED: ["NEW"],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus) {
  return from === to || allowedTransitions[from].includes(to);
}

async function runTransition(id: string, toStatus: ReservationStatus, note: string | undefined, adminId: string) {
  return prisma.$transaction(
    async (tx) => {
      const reservation = await tx.reservation.findUnique({ where: { id } });
      if (!reservation) throw new AppError(404, "NOT_FOUND", "Reservation not found.");
      if (!canTransition(reservation.status, toStatus)) {
        throw new AppError(409, "INVALID_TRANSITION", `Cannot move ${reservation.status.toLowerCase()} enquiry to ${toStatus.toLowerCase()}.`);
      }
      if (reservation.status !== "CONFIRMED" && toStatus === "CONFIRMED") {
        const claimed = await tx.roomType.updateMany({
          where: { id: reservation.roomTypeId, active: true, availableUnits: { gt: 0 } },
          data: { availableUnits: { decrement: 1 } },
        });
        if (claimed.count !== 1) throw new AppError(409, "NO_AVAILABILITY", "No rooms remain. Waitlist this enquiry instead.");
      }
      if (reservation.status === "CONFIRMED" && toStatus !== "CONFIRMED") {
        await tx.roomType.update({ where: { id: reservation.roomTypeId }, data: { availableUnits: { increment: 1 } } });
      }
      await tx.reservation.update({
        where: { id },
        data: { status: toStatus, adminNotes: note ?? reservation.adminNotes },
      });
      if (reservation.status !== toStatus) {
        await tx.reservationStatusHistory.create({
          data: { reservationId: id, fromStatus: reservation.status, toStatus, note: note ?? null, adminId },
        });
      }
      return tx.reservation.findUniqueOrThrow({
        where: { id },
        include: { roomType: true, history: { orderBy: { createdAt: "asc" } } },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function transitionReservation(id: string, toStatus: ReservationStatus, note: string | undefined, adminId: string) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await runTransition(id, toStatus, note, adminId);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 3) throw error;
    }
  }
  throw new AppError(409, "CONCURRENT_UPDATE", "The reservation changed while it was being updated. Try again.");
}
