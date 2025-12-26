import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export default function CustomCreationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Custom Creations</h1>
        <p className="text-muted-foreground">
          Manage your custom cake creations
        </p>
      </div>

      <div className="flex-1">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No custom creations yet</EmptyTitle>
            <EmptyDescription>
              Create your first custom cake creation to get started
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  );
}
