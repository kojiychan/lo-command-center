import { Spinner } from "@/components/ui/spinner";

export default function WebinarLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner label="Loading webinar" />
    </div>
  );
}
