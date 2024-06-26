import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { Fragment } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { parsePhoneNumber } from "libphonenumber-js";
import { useRouter } from "next/router";
import { TRPCClientError } from "@trpc/client";

import { genSSRHelpers } from "@/server/helpers/genSSRHelpers";
import { getServerAuthSession } from "@/server/auth";
import { capitalize, getInitialSelectedMembersSnapshot } from "@/lib/utils";
import type { MemberSnapshotWithContact } from "@/server/api/routers/member";
import { api } from "@/utils/api";
import useDataTable from "@/hooks/useDataTable";

import { renderErrorComponent } from "@/components/error/renderErrorComponent";
import PageLayout from "@/layouts/PageLayout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import GroupMembersTable from "@/components/group/GroupMembersTable";
import {
  DataTableColumnHeader,
  DataTableRowActions,
} from "@/components/ui/data-table";
import { HoverableCell } from "@/components/ui/hover-card";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

export default function MessageDetails({
  messageId,
  groupId,
}: MessageDetailsProps) {
  const { data, error } = api.message.getMessageById.useQuery({ messageId });

  const router = useRouter();
  const { mutate: deleteMessage } = api.message.delete.useMutation({
    onSuccess: async () => {
      await router.push(`/group/${groupId}/history`);

      toast({
        title: "Message deleted",
        description: `Message ${messageId} has been deleted`,
      });
    },
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors?.content;
      toast({
        title: "Message deletion failed",
        description:
          errorMessage?.[0] ??
          error.message ??
          "An error occurred while deleting the message",
        variant: "destructive",
      });
    },
  });
  const handleDeleteMessage = () => deleteMessage({ messageId });

  const columns = getGroupMembersColumns(handleDeleteMessage);
  const { table } = useDataTable({
    columns,
    data: data?.recipients ?? [],
    getRowId: (row: MemberSnapshotWithContact) => row.id,
    options: {
      rowSelection: {
        initial: getInitialSelectedMembersSnapshot(data?.recipients ?? []),
      },
    },
  });

  if (!data) return renderErrorComponent(error);

  return (
    <PageLayout
      title={`Message ${data?.id}`}
      description={
        <div className="flex items-center gap-3">
          <div>Current Status: {capitalize(data?.status)}</div>
          <Separator orientation="vertical" className="h-5" />
          <div>Current Type: {capitalize(data?.type)}</div>
        </div>
      }
      rightSidebar={
        data.status !== "sent" ? (
          <Link
            href={`/group/${groupId}/message/${messageId}/edit`}
            className="block"
          >
            <Button variant={"secondary"}>Edit</Button>
          </Link>
        ) : null
      }
    >
      <div className="flex w-full flex-col gap-8">
        <div className="space-y-1">
          <div className="font-semibold">Sent by</div>
          <div className="text-sm">{data.sentBy.name}</div>
        </div>
        <div className="space-y-1">
          <div className="font-semibold">Send Time</div>
          <div className="text-sm">
            {new Date(data.sendAt).toLocaleString()}
          </div>
        </div>
        <div className="border-b dark:border-stone-500 dark:border-opacity-20" />
        <div className="space-y-1">
          <div className="text-lg font-semibold">Content</div>
          <div className="text-sm">{data.content}</div>
        </div>
        <div className="border-b dark:border-stone-500 dark:border-opacity-20 " />
        <div className="space-y-1">
          <div className="font-semibold ">Recurring</div>
          <div className="flex items-center space-x-4 text-sm ">
            <div>{data.isRecurring ? "Yes" : "No"}</div>
            {data.isRecurring && data.recurringPeriod && data.recurringNum && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <div>
                  Every {data.recurringNum} {data.recurringPeriod}
                  {data.recurringNum > 1 ? "s" : ""}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-semibold">Reminders</div>
          <div className="flex items-center space-x-4 text-sm ">
            <div>{data.isReminders ? "Yes" : "No"}</div>
            {data.reminders &&
              data.isReminders &&
              data.reminders?.map((reminder, index) => (
                <Fragment key={index}>
                  <Separator orientation="vertical" className="h-5" />
                  <div>
                    {reminder.num} {reminder.period}
                  </div>
                </Fragment>
              ))}
          </div>
        </div>
        <div>
          <div className="font-semibold">Scheduled</div>
          <div className="flex items-center space-x-4 text-sm ">
            <div className="text-sm">{data.isScheduled ? "Yes" : "No"}</div>
            {data.scheduledDate && data.scheduledDate && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <div>{new Date(data.scheduledDate).toLocaleString()}</div>
              </>
            )}
          </div>
        </div>
        <div className="border-b dark:border-stone-500 dark:border-opacity-20 " />
        <div>
          <div className="font-semibold">Message Recipients</div>
          <div className="text-sm ">{data.recipients.length} recipients</div>
        </div>
        <GroupMembersTable
          table={table}
          placeholder="Search recipients"
          columns={columns}
        />
      </div>
    </PageLayout>
  );
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ messageId: string; groupId: string }>,
) => {
  const session = await getServerAuthSession(context);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const messageId = context.params?.messageId;
  const groupId = context.params?.groupId;

  if (typeof messageId !== "string" || typeof groupId !== "string") {
    throw new TRPCClientError("Invalid slug");
  }

  const helpers = genSSRHelpers(session);
  await helpers.message.getMessageById.prefetch({ messageId });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      messageId,
      groupId,
    },
  };
};

type MessageDetailsProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>;

const getGroupMembersColumns = (
  handleDeleteMessage: () => void,
): ColumnDef<MemberSnapshotWithContact>[] => [
  {
    id: "select",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={true}
          className="pointer-events-none cursor-none"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
  },
  {
    accessorKey: "member.contact.name",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "member.contact.email",
    id: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "member.contact.phone",
    id: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => {
      const phoneString = row.original.member.contact?.phone;
      if (!phoneString) return null;

      const phone = parsePhoneNumber(phoneString);
      return phone ? phone.formatNational() : phoneString;
    },
  },
  {
    accessorKey: "memberNotes",
    id: "notes",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" className="flex-1" />
    ),
    cell: ({ row }) => <HoverableCell value={row.original.memberNotes} />,
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <DataTableRowActions>
        <DropdownMenuItem
          onClick={async () => {
            await navigator.clipboard.writeText(row.getValue<string>("id"));

            toast({
              title: "Copied member ID",
              description: `Member ID ${row.getValue<string>("id")} has been copied to your clipboard`,
            });
          }}
          className="w-48"
        >
          Copy member ID
          {/* <DropdownMenuShortcut>⌘C</DropdownMenuShortcut> */}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Link href={`/contact/${row.original.member.contact.id}`}>
          <DropdownMenuItem>View contact details</DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={handleDeleteMessage}>
          Remove from group
          {/* <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut> */}
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
];
