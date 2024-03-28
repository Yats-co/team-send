import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type RowSelectionState } from "@tanstack/react-table";

import type {
  MemberBaseContact,
  MemberBaseNewContact,
} from "@/server/api/routers/contact";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractInitials(text: string, numInitials = 2): string {
  if (!text) {
    return "";
  }

  const words = text.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0]!.slice(0, numInitials).toUpperCase();
  }

  return words
    .slice(0, numInitials)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export function getInitialSelectedMembers(groupMembers: MemberBaseContact[]) {
  return Object.fromEntries(
    groupMembers?.map((member) => {
      const isSelected =
        member.isRecipient &&
        (!!member.contact?.phone || !!member.contact?.email);

      return [member.id, isSelected];
    }) ?? [],
  ) as RowSelectionState;
}

export const createContact = (
  newMember?: MemberBaseNewContact,
): MemberBaseNewContact => ({
  contact: {
    name: newMember?.contact.name ?? "",
    email: newMember?.contact.email ?? "",
    phone: newMember?.contact.phone ?? "",
    notes: newMember?.contact.notes ?? "",
  },
  memberNotes: newMember?.memberNotes ?? "",
  isRecipient: newMember?.isRecipient ?? true,
});

export function formatRelativeDateAndTime(
  dateInput: string | Date | undefined,
): { date: string; time: string } | undefined {
  if (!dateInput) {
    return undefined;
  }

  const now = new Date();
  const date = new Date(dateInput);

  const diff = now.getTime() - date.getTime();

  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  let currentDate: string;
  if (diffDays === 0) {
    currentDate = "Today";
  } else if (diffDays === 1) {
    currentDate = "Yesterday";
  } else if (diffDays < 7) {
    currentDate = date.toLocaleDateString("en-US", { weekday: "long" });
  } else {
    currentDate =
      date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) + " at";
  }

  const time = date.toLocaleTimeString([], {
    hour12: false,
    hour: "numeric",
    minute: "2-digit",
  });

  return { date: currentDate, time };
}

export function formatShortRelativeDate(dateInput: string | Date): string {
  const today = new Date();
  const date = new Date(dateInput);

  let formattedDate: string;
  const oneDay = 24 * 60 * 60 * 1000;
  const daysDifference = Math.floor(
    (today.getTime() - date.getTime()) / oneDay,
  );

  if (daysDifference < 1 && today.getDate() === date.getDate()) {
    formattedDate = date.toLocaleTimeString([], {
      hour12: false,
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (daysDifference < 7 && today.getDay() !== date.getDay()) {
    formattedDate = date.toLocaleDateString([], { weekday: "long" });
  } else {
    formattedDate = date.toLocaleDateString([], {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return formattedDate;
}
