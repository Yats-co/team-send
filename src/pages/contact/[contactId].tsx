import Link from "next/link";
import { Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TRPCClientError } from "@trpc/client";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";

import { getServerAuthSession } from "@/server/auth";
import { api } from "@/utils/api";
import { genSSRHelpers } from "@/server/helpers/genSSRHelpers";
import { extractInitials } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageLayout from "@/layouts/PageLayout";
import { Separator } from "@/components/ui/separator";
import { Form } from "@/components/ui/form";
import { FormInput, FormTextarea } from "@/components/ui/form-inputs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { renderErrorComponent } from "@/components/error/renderErrorComponent";

const contactBaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().max(5280).optional(),
});
type ContactBaseWithId = z.infer<typeof contactBaseSchema>;

export default function Contact({ contactId }: ContactProps) {
  const { data, error } = api.contact.getContactById.useQuery({ contactId });

  const form = useForm<ContactBaseWithId>({
    resolver: zodResolver(contactBaseSchema),
    defaultValues: {
      id: contactId,
      name: data?.name,
      email: data?.email ?? "",
      phone: data?.phone ?? "",
      notes: data?.notes ?? "",
    },
  });

  const { mutate } = api.contact.update.useMutation({
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors?.content;
      toast({
        title: "Contact Update Failed",
        description:
          errorMessage?.[0] ??
          error.message ??
          "An error occurred while updating the contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!data) return renderErrorComponent(error);

  return (
    <PageLayout title={data?.name} description={`Contact ID: ${contactId}`}>
      <div className="flex-1">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => mutate(data))}
            className="flex w-full flex-col gap-8"
          >
            <h2 className="text-lg font-semibold">Edit Details</h2>
            <FormInput
              label="Name"
              name="name"
              placeholder="Name"
              control={form.control}
            />
            <FormInput
              label="Email"
              name="email"
              placeholder="Email"
              type="email"
              control={form.control}
            />
            <FormInput
              label="Phone"
              name="phone"
              placeholder="Phone"
              type="tel"
              control={form.control}
            />
            <FormTextarea
              label="Notes"
              name="notes"
              placeholder="Notes"
              control={form.control}
            />
            {form.formState.isDirty && (
              <Button type="submit" disabled={!form.formState.isValid}>
                Save Changes
              </Button>
            )}
          </form>
        </Form>
      </div>
      <div className="border-b lg:hidden dark:border-stone-500 dark:border-opacity-20" />
      {data.members?.length > 0 && (
        <div className="lg:w-1/3">
          <div className="font-semibold">Groups</div>
          <div className="space-y-2">
            {data.members.map(({ id, group, memberNotes }, i) => {
              return (
                <Fragment key={id}>
                  <Link
                    href={`/group/${group?.id}`}
                    className="flex items-center gap-3 rounded-md p-2"
                  >
                    <Avatar>
                      <AvatarImage
                        src={group.image ?? undefined}
                        alt={group.name}
                      />
                      <AvatarFallback>
                        {extractInitials(group.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">{group.name}</h4>
                      <div className="text-xs">
                        {group.members.length} members
                      </div>
                      {!!memberNotes && (
                        <p className="text-xs text-stone-500">
                          <span className="pr-1 font-semibold">Notes:</span>
                          {memberNotes}
                        </p>
                      )}
                      {/* {!!memberNotes ? (
                      <HoverCard>
                      <HoverCardTrigger className="flex gap-1 text-xs text-stone-500"> */}
                      {/* </HoverCardTrigger>
                          <HoverCardContent className="text-xs">
                            {memberNotes}
                          </HoverCardContent>
                        </HoverCard>
                      ) : null} */}
                    </div>
                  </Link>
                  {i !== data.members.length - 1 && <Separator />}
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ contactId: string }>,
) => {
  const contactId = context.params?.contactId;
  if (typeof contactId !== "string") {
    throw new TRPCClientError("Invalid slug");
  }

  const session = await getServerAuthSession(context);
  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const helpers = genSSRHelpers(session);
  await helpers.contact.getContactById.prefetch({ contactId });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      contactId,
    },
  };
};

type ContactProps = InferGetServerSidePropsType<typeof getServerSideProps>;
