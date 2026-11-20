import { ContactImporter } from "@/components/native/ContactImporter";
import { Page, BackLink } from "@/components/ui/Page";

interface PageProps {
  searchParams: Promise<{ welcome?: string }>;
}

export default async function ImportContactsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  return (
    <Page>
      {!sp.welcome && <BackLink href="/referrals" label="My referrals" />}
      <ContactImporter welcome={Boolean(sp.welcome)} />
    </Page>
  );
}
