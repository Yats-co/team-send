import CreateGroupAddMembers from "@/components/create-group/CreateGroupAddMembers";
import CreateGroupAddMembersHeader from "@/components/create-group/CreateGroupAddMembersHeader";
import CreateGroupRecents from "@/components/create-group/CreateGroupRecents";
import {
  ICreateGroupSchema,
  createGroupSchema,
} from "@/components/create-group/createGroupSchema";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { GroupLayout } from "@/layouts/GroupLayout";
import createUser from "@/lib/createUser";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export default function GroupMembers() {
  const group = api.group.getGroupData.useQuery();

  const form = useForm<ICreateGroupSchema>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "Blue Ballers",
      description: "",
      avatar: "",
      users: [createUser()],
      recentsSearch: "",
    },
  });

  const onSubmit = (data: ICreateGroupSchema) => {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  };

  if (!group.data) {
    return null;
  }

  return (
    <GroupLayout groupData={group.data}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-3"
        >
          <CreateGroupAddMembersHeader title="Edit Members" />
          <div className="flex flex-col gap-3">
            <CreateGroupAddMembers form={form} />
            <CreateGroupRecents form={form} />
          </div>
        </form>
      </Form>
    </GroupLayout>
  );
}
