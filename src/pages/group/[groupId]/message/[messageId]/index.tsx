import type { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { Fragment } from "react";
import Link from "next/link";

import PageLayout from "@/layouts/PageLayout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getGroupMembersColumns } from "@/components/group/group-members-table/groupMembersColumns";
import GroupMembersTable from "@/components/group/group-members-table/GroupMembersTable";

import {
  formatRelativeDateAndTime,
  formatShortRelativeDate,
} from "@/lib/dateHelpers";
import { api } from "@/utils/api";
import { type Contact } from "@/server/api/routers/contact";
import useDataTable from "@/hooks/useDataTable";
import { generateServerSideHelpers } from "@/server/helpers/generateServerSideHelpers";

export default function MessageDetails({
  messageId,
  groupId,
}: MessageDetailsProps) {
  const { data } = api.message.getMessageById.useQuery({ messageId });

  const messageDate = formatRelativeDateAndTime(data?.sentAt);

  const { table } = useDataTable({
    columns: getGroupMembersColumns(),
    data: data?.recipients ?? [],
    getRowId: (row: Contact) => row.id,
    includeRowSelection: false,
  });

  if (!data) {
    return <div>404</div>;
  }

  return (
    <PageLayout
      title={`Message ${data.id}`}
      description={`Last edited ${formatShortRelativeDate(data.updatedAt)}`}
      rightSidebar={
        <Link
          href={`/group/${groupId}/message/${messageId}/edit`}
          className="block"
        >
          <Button variant={"secondary"}>Edit</Button>
        </Link>
      }
    >
      <div className="flex w-full flex-col gap-8">
        <div className="space-y-1">
          <div className="font-semibold">Sent by</div>
          <div className="text-sm">{data.sentBy.name}</div>
        </div>
        <div className="space-y-1">
          <div className="font-semibold">Created</div>
          {messageDate && (
            <div className="text-sm">
              {messageDate.date} at {messageDate.time}
            </div>
          )}
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
            <Separator orientation="vertical" className="h-5" />
            {data.isRecurring && data.recurringPeriod && data.recurringNum && (
              <div>
                Every {data.recurringNum} {data.recurringPeriod}
                {data.recurringNum > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="font-semibold">Reminders</div>
          <div className="flex items-center space-x-4 text-sm ">
            <div>{data.isReminders ? "Yes" : "No"}</div>
            <Separator orientation="vertical" className="h-5" />
            {data.reminders &&
              data.isReminders &&
              data.reminders?.map((reminder, index) => (
                <Fragment key={index}>
                  <div>
                    {reminder.num} {reminder.period}
                  </div>
                  {data.reminders && index < data.reminders.length - 1 && (
                    <Separator orientation="vertical" className="h-5" />
                  )}
                </Fragment>
              ))}
          </div>
        </div>
        <div>
          <div className="font-semibold">Scheduled</div>
          <div className="flex items-center space-x-4 text-sm ">
            <div className="text-sm">{data.isScheduled ? "Yes" : "No"}</div>
            <Separator orientation="vertical" className="h-5" />
            {data.scheduledDate && data.scheduledDate && (
              <div>{new Date(data.scheduledDate).toLocaleString()}</div>
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
          isLoading={!data.recipients}
          placeholder="Search recipients"
        />
      </div>
    </PageLayout>
  );
}

export const getStaticProps = async (
  context: GetStaticPropsContext<{ messageId: string; groupId: string }>,
) => {
  const helpers = generateServerSideHelpers();

  const messageId = context.params?.messageId;
  const groupId = context.params?.groupId;

  if (typeof messageId !== "string") {
    throw new Error("Invalid slug");
  }

  await helpers.message.getMessageById.prefetch({ messageId });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      messageId,
      groupId,
    },
  };
};

export const getStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

type MessageDetailsProps = InferGetStaticPropsType<typeof getStaticProps>;
