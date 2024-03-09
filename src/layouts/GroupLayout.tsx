import type { IGroupPreview } from "@/server/api/routers/group";
import { SidebarNav } from "@/components/Group/SidebarNav";
import { useRouter } from "next/router";
import PageLayout from "./PageLayout";

const getSidebarNavItems = (groupId: string) => [
  {
    title: "Send",
    href: `/group/${groupId}`,
  },
  {
    title: "Members",
    href: `/group/${groupId}/member`,
  },
  {
    title: "History",
    href: `/group/${groupId}/history`,
  },
  {
    title: "Settings",
    href: `/group/${groupId}/settings`,
  },
];

interface GroupLayoutProps {
  children: React.ReactNode;
  groupData: IGroupPreview;
}

export function GroupLayout({ children, groupData }: GroupLayoutProps) {
  const router = useRouter();
  const sidebarNavItems = getSidebarNavItems(router.query.groupId as string);

  return (
    <PageLayout title={groupData.name} description={groupData.description}>
      <aside className="-ml-4 lg:w-1/5">
        <SidebarNav items={sidebarNavItems} />
      </aside>
      <div className="flex-1">{children}</div>
    </PageLayout>
  );
}
