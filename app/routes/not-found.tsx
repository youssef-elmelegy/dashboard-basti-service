import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AlertCircle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Empty className="w-full max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </EmptyMedia>
          <EmptyTitle>Page Not Found</EmptyTitle>
          <EmptyDescription>
            The page you're looking for doesn't exist or has been moved.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to="/">
            <Button>Go Back Home</Button>
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  );
}
